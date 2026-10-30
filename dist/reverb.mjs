// Two independent, preallocated mono comb reverberators with two short all-pass diffusers.
// Feedback stays below one; the worklet handles final output headroom independently per ear.
class MonoReverb {
 constructor(sampleRate,offset=0){this.lines=[1116,1188,1277,1356].map(n=>new Float32Array(Math.max(2,Math.round((n+offset)*sampleRate/44100))));this.indices=new Int32Array(4);this.lowpass=new Float64Array(4);this.diffusers=[225,556].map(n=>new Float32Array(Math.max(2,Math.round((n+offset)*sampleRate/44100))));this.diffIndices=new Int32Array(2);}
 process(input,feedback){let sum=0;for(let n=0;n<4;n++){const line=this.lines[n],index=this.indices[n],delayed=line[index];this.lowpass[n]=delayed*.76+this.lowpass[n]*.24;line[index]=(1-feedback)*input+feedback*this.lowpass[n];this.indices[n]=(index+1)%line.length;sum+=delayed*.25;}for(let n=0;n<2;n++){const line=this.diffusers[n],index=this.diffIndices[n],delayed=line[index];const output=delayed-.5*sum;line[index]=sum+.5*output;this.diffIndices[n]=(index+1)%line.length;sum=output;}return sum;}
 clear(){for(const line of this.lines)line.fill(0);for(const line of this.diffusers)line.fill(0);this.indices.fill(0);this.diffIndices.fill(0);this.lowpass.fill(0);}
}
export class StereoReverb {
 constructor(sampleRate){this.sampleRate=sampleRate;this.channels=[new MonoReverb(sampleRate),new MonoReverb(sampleRate,23)];this.wet=0;this.wetTarget=0;this.size=.75;this.sizeTarget=.75;this.smoothing=1-Math.exp(-1/(sampleRate*.025));this.left=0;this.right=0;this.idle=true;this.quiet=0;this.quietThreshold=Math.ceil(sampleRate*.12);this.dryCleared=true;}
 setParameters(wet,size){this.wetTarget=Math.max(0,Math.min(1,Number(wet)||0));this.sizeTarget=Math.max(0,Math.min(1,Number(size)||0));}
 process(left,right){this.wet+=(this.wetTarget-this.wet)*this.smoothing;this.size+=(this.sizeTarget-this.size)*this.smoothing;
  if(this.wetTarget===0&&this.wet<1e-7){if(!this.dryCleared)this.clear();this.dryCleared=true;this.wet=0;this.left=left;this.right=right;return;}
  this.dryCleared=false;if(Math.abs(left)+Math.abs(right)>1e-12){this.idle=false;this.quiet=0;}
  if(this.idle){this.left=left*(1-this.wet);this.right=right*(1-this.wet);return;}
  const feedback=.68+.29*this.size,wetLeft=this.channels[0].process(left,feedback),wetRight=this.channels[1].process(right,feedback);this.left=left*(1-this.wet)+wetLeft*this.wet*6;this.right=right*(1-this.wet)+wetRight*this.wet*6;
  if(Math.abs(left)+Math.abs(right)+Math.abs(wetLeft)+Math.abs(wetRight)<1e-12){if(++this.quiet>this.quietThreshold)this.clear();}else this.quiet=0;
 }
 clear(){for(const channel of this.channels)channel.clear();this.left=0;this.right=0;this.idle=true;this.quiet=0;this.dryCleared=true;}
}
