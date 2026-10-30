import {frequencyForRegion} from './tuning.mjs';
import {choosePitch,pitchFrequency} from './pitch-choice.mjs';
import {HeadOrbit} from './head-orbit.mjs';
import {StereoReverb} from './reverb.mjs';
import {ENVELOPE_DEFAULTS,normalizeEnvelope,envelopeLevel,envelopeDuration} from './envelope.mjs';
class CortexProcessor extends AudioWorkletProcessor {
 constructor(){
  super();Object.assign(this,ENVELOPE_DEFAULTS);this.target=new Float64Array(16);this.coherence=new Float64Array(16);this.pan=new Float64Array(16);this.regionPans=Float32Array.from({length:16},(_,g)=>g<8?.5:-.5);this.frequencies=new Float64Array(16);
  this.master=0;this.output=.38;this.reverb=.18;this.reverbSize=.75;this.reverbNetwork=new StereoReverb(sampleRate);this.reverbNetwork.setParameters(this.reverb,this.reverbSize);this.tone=.48;this.space=.6;this.root=55;this.scale='minor';this.tuningMode='locked';this.detune=0;this.active=false;this.droneEnabled=false;this.droneMix=0;this.voiceLimit=8;this.binaural=false;this.renderBinaural=false;this.orbitEnabled=false;this.renderOrbit=false;this.orbitRate=.07;this.orbitDepth=.7;this.orbitRateSmooth=.07;this.orbitDepthSmooth=.7;this.difference=8;this.differenceSmooth=8;this.spread=0;this.variation=.5;this.octaves=2;this.pitchSeed=65001;this.modeGain=1;this.modeTransition=null;this.pitchSmooth=1-Math.exp(-1/(sampleRate*.02));this.noiseSeed=65;this.steals=0;this.samplesRendered=0;this.statCountdown=0;this.isDormant=false;this.delay=new Float32Array(Math.ceil(sampleRate*.47));this.di=0;this.stealSamples=Math.max(1,Math.round(sampleRate*.005));
  this.slots=Array.from({length:16},()=>({active:false,orbit:new HeadOrbit(sampleRate),group:0,phase:0,rightPhase:0,frequency:55,targetFrequency:55,choice:{legacy:true},age:Infinity,strength:0,settings:{...ENVELOPE_DEFAULTS},duration:0,amp:0,gain:0,left:Math.SQRT1_2,right:Math.SQRT1_2,targetLeft:Math.SQRT1_2,targetRight:Math.SQRT1_2,fadeRemaining:0,fadeTotal:this.stealSamples,pending:null}));this.refreshFrequencies();
  this.port.onmessage=e=>{const d=e.data;
   if(d.type==='state'){for(let g=0;g<16;g++){this.coherence[g]=Math.max(0,Math.min(1,d.voices[g*3]));this.target[g]=.08+.92*d.voices[g*3];this.pan[g]=Math.max(-1,Math.min(1,d.voices[g*3+2]*2+this.regionPans[g]*.65));}}
   if(d.type==='pulse')this.trigger(d.event);
   if(d.type==='params'){
    const oldLimit=this.voiceLimit;Object.assign(this,d.value);this.reverbNetwork.setParameters(this.reverb,this.reverbSize);this.voiceLimit=[4,8,16].includes(Number(this.voiceLimit))?Number(this.voiceLimit):8;this.difference=Math.max(2,Math.min(50,Number(this.difference)||8));this.spread=Math.max(0,Math.min(1,Number(this.spread)||0));this.octaves=Math.max(0,Math.min(3,Math.round(Number(this.octaves)||0)));this.orbitEnabled=!!this.orbitEnabled;if(this.orbitEnabled)this.binaural=false;this.orbitRate=Math.max(.01,Math.min(.5,Number(this.orbitRate)||.07));this.orbitDepth=Math.max(0,Math.min(1,Number(this.orbitDepth)||0));if(this.binaural!==this.renderBinaural||this.orbitEnabled!==this.renderOrbit)this.modeTransition='out';this.refreshFrequencies();if(this.active)this.isDormant=false;
    if(this.voiceLimit<oldLimit)for(let i=this.voiceLimit;i<16;i++)if(this.slots[i].active){this.slots[i].fadeRemaining=this.stealSamples;this.slots[i].pending=null;}
    if(this.droneEnabled&&this.active)this.fillBed();
   }
  };
 }
 refreshFrequencies(){for(let g=0;g<16;g++)this.frequencies[g]=frequencyForRegion(g,this);for(const slot of this.slots||[])if(slot.active)slot.targetFrequency=this.safeFrequency(pitchFrequency(slot.group,slot.choice,this));}
 outputHeadroom(x){const a=Math.abs(x);return a<=.85?x:Math.sign(x)*(.85+.15*Math.tanh((a-.85)/.15));}
 safeFrequency(f){return Math.max(15,Math.min(sampleRate*.45-50,Number.isFinite(f)?f:55));}
 randomPitch(){let seed=this.pitchSeed|0;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;this.pitchSeed=seed;return(seed>>>0)/4294967296;}
 activeVoiceCount(){let count=0;for(const s of this.slots)if(s.active)count++;return count;}
 startVoice(slot,event){slot.active=true;slot.group=event.group;slot.orbit.reset(event.group);slot.phase=0;slot.rightPhase=0;slot.choice=event.choice||{legacy:true};slot.frequency=this.safeFrequency(pitchFrequency(slot.group,slot.choice,this));slot.targetFrequency=slot.frequency;slot.age=event.bed?Infinity:0;slot.strength=event.bed?0:event.strength;slot.settings=normalizeEnvelope(event.envelope||this);slot.duration=envelopeDuration(slot.settings);slot.amp=0;slot.gain=0;slot.left=Math.sqrt((1-this.pan[slot.group]*this.space)*.5);slot.right=Math.sqrt((1+this.pan[slot.group]*this.space)*.5);slot.targetLeft=slot.left;slot.targetRight=slot.right;slot.fadeRemaining=0;slot.pending=null;}
 fillBed(){for(let i=0;i<this.voiceLimit;i++)if(!this.slots[i].active)this.startVoice(this.slots[i],{group:Math.floor(i*16/this.voiceLimit),bed:true});}
 trigger(event){
  if(!Number.isInteger(event.group)||event.group<0||event.group>=16)return;event={...event,choice:choosePitch(event.group,this,()=>this.randomPitch(),this.coherence[event.group])};let slot=null;
  for(let i=0;i<this.voiceLimit;i++)if(this.slots[i].active&&this.slots[i].group===event.group){slot=this.slots[i];break;}
  if(!slot)for(let i=0;i<this.voiceLimit;i++)if(!this.slots[i].active){slot=this.slots[i];break;}
  if(!slot){for(let i=0;i<this.voiceLimit;i++)if(!this.slots[i].pending&&(!slot||this.slots[i].gain<slot.gain))slot=this.slots[i];if(!slot){slot=this.slots[0];for(let i=1;i<this.voiceLimit;i++)if(this.slots[i].gain<slot.gain)slot=this.slots[i];}}
  if(!slot.active){this.startVoice(slot,event);return;}
  // Bounded handoff: old waveform fades to zero before the new attack starts.
  // No extra temporary oscillator is created during a steal or retrigger.
  slot.pending={group:event.group,strength:event.strength,envelope:event.envelope,choice:event.choice};if(slot.fadeRemaining===0)slot.fadeRemaining=this.stealSamples;this.steals++;
 }
 process(inputs,outputs){
  const output=outputs[0],l=output[0],r=output[1]||l;l.fill(0);if(r!==l)r.fill(0);const frames=l.length,secondsPerSample=1/sampleRate;this.orbitRateSmooth+=(this.orbitRate-this.orbitRateSmooth)*(1-Math.exp(-frames/(sampleRate*.04)));this.orbitDepthSmooth+=(this.orbitDepth-this.orbitDepthSmooth)*(1-Math.exp(-frames/(sampleRate*.04)));this.differenceSmooth+=(this.difference-this.differenceSmooth)*(1-Math.exp(-frames/(sampleRate*.02)));
  if(!this.active&&this.master<.00001){if(!this.isDormant){for(const s of this.slots){s.active=false;s.pending=null;s.fadeRemaining=0;s.orbit.clear();}this.delay.fill(0);this.reverbNetwork.clear();this.droneMix=0;this.isDormant=true;}this.reportStats(frames);return true;}
  this.droneMix+=((this.droneEnabled?1:0)-this.droneMix)*Math.min(1,frames*.0004);if(this.droneEnabled&&this.active)this.fillBed();
  for(let v=0;v<16;v++){
   const slot=this.slots[v];if(!slot.active)continue;const pan=this.pan[slot.group]*Math.min(1,this.space+this.spread);slot.targetLeft=Math.sqrt((1-pan)*.5);slot.targetRight=Math.sqrt((1+pan)*.5);
   for(let i=0;i<frames;i++){
    if(!slot.active)break;
    const g=slot.group,env=envelopeLevel(slot.age,slot.settings)*slot.strength;slot.age+=secondsPerSample;
    if(env===0&&slot.age>=slot.duration&&this.droneMix<.00001&&slot.fadeRemaining===0){slot.active=false;break;}
    slot.amp+=(this.target[g]-slot.amp)*.00008;slot.frequency+=(slot.targetFrequency-slot.frequency)*this.pitchSmooth;slot.phase+=slot.frequency/sampleRate;if(slot.phase>=1)slot.phase-=Math.floor(slot.phase);
    const ph=slot.phase*Math.PI*2;slot.gain=env*(.55+.45*slot.amp)+slot.amp*.2*this.droneMix;const fade=slot.fadeRemaining>0?slot.fadeRemaining/slot.fadeTotal:1;
    if(this.renderBinaural){
     slot.rightPhase+=(slot.frequency+this.differenceSmooth)/sampleRate;if(slot.rightPhase>=1)slot.rightPhase-=Math.floor(slot.rightPhase);
     const gain=(env*.52*(.55+.45*slot.amp)+slot.amp*.105*this.droneMix)*fade*Math.SQRT1_2;
     l[i]+=Math.sin(ph)*gain;r[i]+=Math.sin(slot.rightPhase*Math.PI*2)*gain;
    }else{
     let carrier=Math.sin(ph);if(this.tone>.00001){if(slot.frequency*2<sampleRate*.45)carrier+=this.tone*.27*Math.sin(ph*2);if(slot.frequency*3<sampleRate*.45)carrier+=this.tone*.11*Math.sin(ph*3);}let hit=env*carrier*.52*(.55+.45*slot.amp);
     if(this.tuningMode==='free'&&env>.00001){this.noiseSeed^=this.noiseSeed<<13;this.noiseSeed^=this.noiseSeed>>>17;this.noiseSeed^=this.noiseSeed<<5;hit+=env*((this.noiseSeed>>>0)/2147483648-1)*.10*Math.sqrt(env);}
     const signal=(carrier*slot.amp*.105*this.droneMix+hit)*fade;slot.left+=(slot.targetLeft-slot.left)*.002;slot.right+=(slot.targetRight-slot.right)*.002;if(this.renderOrbit){slot.orbit.process(signal,this.orbitRateSmooth,this.orbitDepthSmooth);l[i]+=slot.orbit.left;r[i]+=slot.orbit.right;}else{l[i]+=signal*slot.left;r[i]+=signal*slot.right;}
    }
    if(slot.fadeRemaining>0&&--slot.fadeRemaining===0){const pending=slot.pending;slot.active=false;slot.pending=null;if(pending&&v<this.voiceLimit)this.startVoice(slot,pending);}
   }
  }
  for(let i=0;i<frames;i++){
   this.master+=((this.active?this.output:0)-this.master)*.001;if(this.modeTransition==='out')this.modeGain=Math.max(0,this.modeGain-1/this.stealSamples);else if(this.modeTransition==='in'){this.modeGain=Math.min(1,this.modeGain+1/this.stealSamples);if(this.modeGain===1)this.modeTransition=null;}const gain=this.master*this.modeGain;
   if(this.renderBinaural){this.reverbNetwork.process(l[i],r[i]);const a=this.reverbNetwork.left*gain*.25,b=this.reverbNetwork.right*gain*.25;l[i]=this.outputHeadroom(a);r[i]=this.outputHeadroom(b);}else if(this.renderOrbit){this.reverbNetwork.process(l[i],r[i]);l[i]=Math.tanh(this.reverbNetwork.left*gain);r[i]=Math.tanh(this.reverbNetwork.right*gain);}else{const delayed=this.delay[this.di],a=l[i],b=r[i];this.delay[this.di]=(a+b)*.32+delayed*.34;this.di=(this.di+1)%this.delay.length;this.reverbNetwork.process(a+delayed*this.space*.5,b+delayed*this.space*.6);l[i]=Math.tanh(this.reverbNetwork.left*gain);r[i]=Math.tanh(this.reverbNetwork.right*gain);}
  }
  if(this.modeTransition==='out'&&this.modeGain===0){this.renderBinaural=this.binaural;this.renderOrbit=this.orbitEnabled;this.modeTransition='in';this.delay.fill(0);this.reverbNetwork.clear();for(const slot of this.slots){slot.rightPhase=slot.phase;slot.orbit.clear();}}this.reportStats(frames);return true;
 }
 reportStats(frames){this.samplesRendered+=frames;this.statCountdown-=frames;if(this.statCountdown<=0){this.statCountdown=sampleRate*.5;this.port.postMessage?.({type:'voiceStats',limit:this.voiceLimit,active:this.activeVoiceCount(),steals:this.steals,slots:16,regions:16,sampleRate,binaural:this.renderBinaural,difference:this.differenceSmooth,spread:this.spread,pairBudget:this.binaural,orbitEnabled:this.renderOrbit,orbitRate:this.orbitRateSmooth,orbitDepth:this.orbitDepthSmooth,reverb:this.reverb,reverbSize:this.reverbSize,reverbTailActive:!this.reverbNetwork.idle,frequencies:this.slots.filter(s=>s.active).map(s=>({region:s.group,left:s.frequency,right:this.renderBinaural?s.frequency+this.differenceSmooth:s.frequency,choice:s.choice}))});}}
}
registerProcessor('cortex-voices',CortexProcessor);
