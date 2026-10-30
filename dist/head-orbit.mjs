// Analytic headphone cues, not a measured HRTF. One fixed history per voice.
export class HeadOrbit {
 constructor(sampleRate){this.sampleRate=sampleRate;this.maxDelay=sampleRate*.00065;this.history=new Float32Array(Math.ceil(this.maxDelay)+4);this.reset(0);}
 clear(){this.history.fill(0);this.index=0;this.filterL=0;this.filterR=0;this.left=0;this.right=0;}
 reset(group){this.clear();this.angle=Math.PI/2+Math.PI*2*group/16;this.direction=group%2?-1:1;this.countdown=0;this.setPose(this.angle,.7,true);}
 setPose(angle,depth,immediate=false){
  this.angle=angle;this.side=Math.sin(angle)*depth;const rear=(1-Math.cos(angle))*.5*depth,side=this.side;
  this.tDelayL=Math.max(0,side)*this.maxDelay;this.tDelayR=Math.max(0,-side)*this.maxDelay;
  this.tGainL=Math.sqrt((1-side*.85)*.5);this.tGainR=Math.sqrt((1+side*.85)*.5);
  this.tCoeffL=1-Math.exp(-Math.PI*2*(18000/(1+3*Math.max(0,side)+2*rear))/this.sampleRate);
  this.tCoeffR=1-Math.exp(-Math.PI*2*(18000/(1+3*Math.max(0,-side)+2*rear))/this.sampleRate);
  if(immediate){this.delayL=this.tDelayL;this.delayR=this.tDelayR;this.gainL=this.tGainL;this.gainR=this.tGainR;this.coeffL=this.tCoeffL;this.coeffR=this.tCoeffR;}
 }
 read(delay){let position=this.index-delay;if(position<0)position+=this.history.length;if(position>=this.history.length)position=0;const a=Math.floor(position),fraction=position-a;return this.history[a]*(1-fraction)+this.history[(a+1)%this.history.length]*fraction;}
 process(input,rate,depth){
  this.angle+=this.direction*Math.PI*2*rate/this.sampleRate;if(this.angle>Math.PI*2)this.angle-=Math.PI*2;else if(this.angle<-Math.PI*2)this.angle+=Math.PI*2;
  if(this.countdown--<=0){this.setPose(this.angle,depth);this.countdown=31;}
  this.delayL+=(this.tDelayL-this.delayL)*.03;this.delayR+=(this.tDelayR-this.delayR)*.03;this.gainL+=(this.tGainL-this.gainL)*.03;this.gainR+=(this.tGainR-this.gainR)*.03;this.coeffL+=(this.tCoeffL-this.coeffL)*.03;this.coeffR+=(this.tCoeffR-this.coeffR)*.03;
  this.history[this.index]=input;this.filterL+=(this.read(this.delayL)-this.filterL)*this.coeffL;this.filterR+=(this.read(this.delayR)-this.filterR)*this.coeffR;this.left=this.filterL*this.gainL;this.right=this.filterR*this.gainR;this.index=(this.index+1)%this.history.length;
 }
}
