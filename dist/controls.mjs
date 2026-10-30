const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export const SLIDERS={
 orbitRate:{min:.01,max:.5,curve:'log'},orbitDepth:{min:0,max:1,curve:'linear'},
 coupling:{min:0,max:8,curve:'zeroLog'},noise:{min:0,max:2,curve:'zeroLog'},drift:{min:0,max:2,curve:'zeroLog'},
 pulseRate:{min:.25,max:12,curve:'log'},output:{min:0,max:1,curve:'power'},
 attack:{min:.03,max:2,curve:'log'},decay:{min:.03,max:4,curve:'log'},sustain:{min:0,max:1,curve:'linear'},release:{min:.03,max:5,curve:'log'},
 pulseJitter:{min:0,max:1,curve:'linear'},pulseStrength:{min:0,max:1,curve:'linear'},tone:{min:0,max:1,curve:'linear'},space:{min:0,max:1,curve:'linear'},detune:{min:0,max:100,curve:'linear'},difference:{min:2,max:50,curve:'log'},spread:{min:0,max:1,curve:'linear'},variation:{min:0,max:1,curve:'linear'},reverb:{min:0,max:1,curve:'linear'},reverbSize:{min:0,max:1,curve:'linear'}
};
export function sliderToValue(name,position){const s=SLIDERS[name],x=clamp(Number(position)||0,0,1);if(!s)throw new Error('Unknown slider '+name);if(x===0)return s.min;if(x===1)return s.max;if(s.curve==='log')return s.min*Math.pow(s.max/s.min,x);if(s.curve==='zeroLog')return s.max*Math.expm1(x*Math.log(101))/100;if(s.curve==='power')return x*x;return s.min+(s.max-s.min)*x;}
export function valueToSlider(name,value){const s=SLIDERS[name];if(!s)throw new Error('Unknown slider '+name);const v=clamp(Number(value)||0,s.min,s.max);if(s.curve==='log')return Math.log(v/s.min)/Math.log(s.max/s.min);if(s.curve==='zeroLog')return Math.log1p(v/s.max*100)/Math.log(101);if(s.curve==='power')return Math.sqrt(v);return(v-s.min)/(s.max-s.min);}
