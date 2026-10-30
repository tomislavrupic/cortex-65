import {ENVELOPE_DEFAULTS,normalizeEnvelope,envelopeLevel,arrivalDelay} from './envelope.mjs';
export const NODE_COUNT=65536, RING_SIZE=32, RING_COUNT=2048, GROUP_COUNT=16;
const TAU=Math.PI*2;
export class CortexEngine {
 constructor(seed=65){this.seed=seed;this.patternSeed=(seed^0x61c88647)|0;this.patternSerial=0;this.lastPattern=null;this.phase=new Float32Array(NODE_COUNT);this.next=new Float32Array(NODE_COUNT);this.omega=new Float32Array(NODE_COUNT);this.ringCoherence=new Float32Array(RING_COUNT);this.params={coupling:2.4,noise:.16,drift:.5,mode:'islands',projection:0,pulseEnabled:false,pulseMode:'regional',pulseRate:2,pulseJitter:.30,pulseStrength:.65,...ENVELOPE_DEFAULTS};this.time=0;this.steps=0;this.nextPulseAt=Infinity;this.eventSerial=0;this.events=[];this.cascadeSerial=0;this.pending=[];this.activation=new Float32Array(16);this.activationStrength=new Float32Array(16);this.activationTime=new Float64Array(16).fill(-Infinity);this.activationEnvelope=Array.from({length:16},()=>({...ENVELOPE_DEFAULTS}));this.kickAt=new Float64Array(NODE_COUNT).fill(Infinity);this.kickStrength=new Float32Array(NODE_COUNT);this.positions=null;this.regionSeeds=new Int32Array(16);for(let g=0;g<16;g++)this.regionSeeds[g]=g*4096+2048;for(let i=0;i<NODE_COUNT;i++){this.phase[i]=this.random()*TAU;this.omega[i]=(this.random()-.5)*1.8;}this.measure();}
 random(){let s=this.seed|0;s^=s<<13;s^=s>>>17;s^=s<<5;this.seed=s;return(s>>>0)/4294967296;}
 set(params){const wasEnabled=this.params.pulseEnabled,previousPulseMode=this.params.pulseMode;Object.assign(this.params,params);Object.assign(this.params,normalizeEnvelope(this.params));this.params.pulseRate=Math.max(.25,Math.min(12,this.params.pulseRate));this.params.pulseJitter=Math.max(0,Math.min(1,this.params.pulseJitter));this.params.pulseStrength=Math.max(0,Math.min(1,this.params.pulseStrength));if(!['regional','brainstorm','rain'].includes(this.params.pulseMode))this.params.pulseMode='regional';const modeChanged=this.params.pulseMode!==previousPulseMode;if(modeChanged){this.clearActivity();this.events=[];this.lastPattern=null;}if(!this.params.pulseEnabled)this.nextPulseAt=Infinity;else if(!wasEnabled||params.pulseRate!==undefined||modeChanged)this.nextPulseAt=this.time+this.pulseInterval();}
 pulseInterval(){return (1+(2*this.random()-1)*this.params.pulseJitter*.9)/this.params.pulseRate;}
 drainEvents(){const events=this.events;this.events=[];return events;}
 excite(group,strength=this.params.pulseStrength,source='manual',eventTime=this.time,nodeIndex=null,waveOptions={}){
  const wave={id:++this.cascadeSerial,visited:0,...waveOptions};this.pending=this.pending.filter(event=>event.wave.id>this.cascadeSerial-64);
  group=Math.max(0,Math.min(15,Math.floor(group)));if(nodeIndex===null||Math.floor(nodeIndex/4096)!==group)nodeIndex=group*4096+Math.floor(this.random()*4096);
  this.triggerRegion({group,nodeIndex,strength:Math.max(0,Math.min(1,strength)),source,time:eventTime,wave,hop:0,parent:null});
 }
 triggerRegion(event){
  const {group,strength,time,wave,hop}=event;
  if((wave.directOnly?strength<=0:strength<.12)||(wave.visited&(1<<group)))return;
  wave.visited|=1<<group;
  if((hop>0||wave.directOnly)&&time-this.activationTime[group]<.28)return;
  const nodeIndex=event.nodeIndex??this.regionSeeds[group],envelope=normalizeEnvelope(this.params),seedPosition=this.positions?Array.from(this.positions.subarray(nodeIndex*3,nodeIndex*3+3)):[(nodeIndex%4096)/4095,0,0];let radius=0;
  for(let i=group*4096;i<(group+1)*4096;i++){const distance=this.positions?Math.hypot(this.positions[i*3]-seedPosition[0],this.positions[i*3+1]-seedPosition[1],this.positions[i*3+2]-seedPosition[2]):Math.abs(i-nodeIndex)/4095;radius=Math.max(radius,distance);}
  for(let i=group*4096;i<(group+1)*4096;i++){const distance=this.positions?Math.hypot(this.positions[i*3]-seedPosition[0],this.positions[i*3+1]-seedPosition[1],this.positions[i*3+2]-seedPosition[2]):Math.abs(i-nodeIndex)/4095;this.kickAt[i]=time+arrivalDelay(distance,radius,envelope.attack);this.kickStrength[i]=strength;}
  this.applyNodeKick(nodeIndex);this.activationEnvelope[group]=envelope;
  this.activationTime[group]=time;this.activationStrength[group]=strength;
  this.events.push({serial:++this.eventSerial,group,strength,source:event.source,time,cascade:wave.id,hop,parent:event.parent,nodeIndex,seedPosition,radius,envelope,patternId:wave.patternId??null,pulseMode:wave.pulseMode??'regional',directOnly:!!wave.directOnly});
  const k=Math.max(0,this.params.coupling);if(k===0||wave.directOnly)return;
  const delay=envelope.attack,gain=Math.max(.4,Math.min(.9,.48+.08*k)),side=group&8,local=group&7;
  let links=this.params.mode==='global'?[[((group+1)%16),1,1],[((group+15)%16),1,1],[((group+4)%16),1.45,.8]]:[[side|((local+1)%8),1,1],[side|((local+7)%8),1,1]];
  if(this.params.mode==='modular')links.push([group^8,1.65,.8]);
  for(const [next,lag,attenuation] of links){const energy=strength*gain*attenuation;if(energy>=.12&&!(wave.visited&(1<<next)))this.queueEvent({group:next,strength:energy,time:time+delay*lag,source:'propagation',wave,hop:hop+1,parent:group});}
 }
 patternRandom(){let s=this.patternSeed|0;s^=s<<13;s^=s>>>17;s^=s<<5;this.patternSeed=s;return(s>>>0)/4294967296;}
 queueEvent(event){if(this.pending.length>=1024)this.pending.shift();this.pending.push(event);}
 schedulePulse(time){
  const patternId=++this.patternSerial,mode=this.params.pulseMode;
  if(mode==='regional'){this.lastPattern={id:patternId,mode,time,targetRegions:1};this.excite(Math.floor(this.random()*16),this.params.pulseStrength,'pulse',time,null,{patternId,pulseMode:mode});return;}
  const wave={id:++this.cascadeSerial,visited:0,directOnly:true,patternId,pulseMode:mode};this.pending=this.pending.filter(event=>event.wave.id>this.cascadeSerial-64);
  if(mode==='rain'){const group=Math.floor(this.patternRandom()*16),nodeIndex=group*4096+Math.floor(this.patternRandom()*4096),strength=this.params.pulseStrength*(.25+.45*this.patternRandom());this.lastPattern={id:patternId,mode,time,targetRegions:1};this.queueEvent({group,nodeIndex,strength,time,source:'rain',wave,hop:0,parent:null});return;}
  const regions=Array.from({length:16},(_,i)=>i);for(let i=15;i>0;i--){const j=Math.floor(this.patternRandom()*(i+1));[regions[i],regions[j]]=[regions[j],regions[i]];}const count=14+Math.floor(this.patternRandom()*3);this.lastPattern={id:patternId,mode,time,targetRegions:count};
  for(let i=0;i<count;i++){const group=regions[i],nodeIndex=group*4096+Math.floor(this.patternRandom()*4096),strength=this.params.pulseStrength*(.75+.25*this.patternRandom()),arrival=time+this.patternRandom()*.65*this.params.attack;this.queueEvent({group,nodeIndex,strength,time:arrival,source:'brainstorm',wave,hop:0,parent:null});}
 }
 setGeometry(positions){if(!(positions instanceof Float32Array)||positions.length!==NODE_COUNT*3)throw new Error('Geometry must contain all 65,536 XYZ positions');this.positions=positions;for(let g=0;g<16;g++){const center=[0,0,0];for(let i=g*4096;i<(g+1)*4096;i++)for(let a=0;a<3;a++)center[a]+=positions[i*3+a]/4096;let nearest=Infinity;for(let i=g*4096;i<(g+1)*4096;i++){const d=(positions[i*3]-center[0])**2+(positions[i*3+1]-center[1])**2+(positions[i*3+2]-center[2])**2;if(d<nearest){nearest=d;this.regionSeeds[g]=i;}}}}
 applyNodeKick(index){this.phase[index]=(this.phase[index]+this.kickStrength[index]*(1.6+this.random()*1.6))%TAU;this.kickStrength[index]=0;this.kickAt[index]=Infinity;}
 applyDueKicks(time){for(let i=0;i<NODE_COUNT;i++)if(this.kickStrength[i]>0&&this.kickAt[i]<=time)this.applyNodeKick(i);}
 clearActivity(){this.pending=[];this.kickAt.fill(Infinity);this.kickStrength.fill(0);this.activation.fill(0);this.activationStrength.fill(0);this.activationTime.fill(-Infinity);}
 advanceEvents(targetTime){
  // Both random seeds and delayed joins use simulation time, so pause freezes them.
  while(true){let first=-1,next=Infinity;for(let i=0;i<this.pending.length;i++)if(this.pending[i].time<next){first=i;next=this.pending[i].time;}
   const pulseAt=this.params.pulseEnabled?this.nextPulseAt:Infinity;
   if(Math.min(next,pulseAt)>targetTime)break;
   if(pulseAt<=next){this.schedulePulse(pulseAt);this.nextPulseAt+=this.pulseInterval();}
   else this.triggerRegion(this.pending.splice(first,1)[0]);
  }
 }
 step(dt=1/30){this.advanceEvents(this.time+dt);this.applyDueKicks(this.time+dt);const p=this.phase,n=this.next,{coupling:k,noise,drift,mode}=this.params;let sx=0,sy=0;const gx=new Float64Array(16),gy=new Float64Array(16);for(let i=0;i<NODE_COUNT;i++){const c=Math.cos(p[i]),s=Math.sin(p[i]);sx+=c;sy+=s;gx[i>>12]+=c;gy[i>>12]+=s;}sx/=NODE_COUNT;sy/=NODE_COUNT;for(let g=0;g<16;g++){gx[g]/=4096;gy[g]/=4096;}
 const noiseScale=noise*Math.sqrt(dt)*1.732;for(let i=0;i<NODE_COUNT;i++){const a=p[i],r=i&31,b=i-r,g=i>>12;let force=.5*(Math.sin(p[b+((r+31)&31)]-a)+Math.sin(p[b+((r+1)&31)]-a));if(mode==='global')force=.4*force+.6*(sy*Math.cos(a)-sx*Math.sin(a));if(mode==='modular'){const other=g^8;force=.55*force+.7*(gy[g]*Math.cos(a)-gx[g]*Math.sin(a))-.35*(gy[other]*Math.cos(a)-gx[other]*Math.sin(a));}let v=a+dt*(.65+drift*this.omega[i]+k*force)+noiseScale*(2*this.random()-1);n[i]=((v%TAU)+TAU)%TAU;}this.phase=n;this.next=p;this.time+=dt;this.steps++;return this.measure();}
 measure(){for(let g=0;g<16;g++){const age=this.time-this.activationTime[g];this.activation[g]=Number.isFinite(age)&&age>=0?this.activationStrength[g]*envelopeLevel(age,this.activationEnvelope[g]):0;}const p=this.phase,m=Number(this.params.projection);let globalX=0,globalY=0,local=0;const voices=new Float32Array(48);for(let ring=0;ring<RING_COUNT;ring++){let x=0,y=0;for(let j=0;j<32;j++){const a=p[ring*32+j];globalX+=Math.cos(a);globalY+=Math.sin(a);x+=Math.cos(a-m*TAU*j/32);y+=Math.sin(a-m*TAU*j/32);}x/=32;y/=32;const r=Math.hypot(x,y);this.ringCoherence[ring]=r;local+=r;const g=ring>>7;voices[g*3]+=r/128;voices[g*3+1]+=x/128;voices[g*3+2]+=y/128;}this.stats={nodes:NODE_COUNT,rings:RING_COUNT,steps:this.steps,time:this.time,global:Math.hypot(globalX,globalY)/NODE_COUNT,local:local/RING_COUNT,projection:m,pulseEnabled:this.params.pulseEnabled,pulseMode:this.params.pulseMode,patternSerial:this.patternSerial,lastPattern:this.lastPattern,pulseRate:this.params.pulseRate,eventSerial:this.eventSerial,activeRegions:Array.from(this.activation).filter(a=>a>.01).length,pendingJoins:this.pending.length,envelope:normalizeEnvelope(this.params),nextPulseAt:Number.isFinite(this.nextPulseAt)?this.nextPulseAt:null};this.voices=voices;return this.stats;}
}
