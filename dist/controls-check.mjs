import assert from 'node:assert/strict';
import {SLIDERS,sliderToValue,valueToSlider} from './controls.mjs';
for(const [name,spec] of Object.entries(SLIDERS)){
 assert.ok(Math.abs(sliderToValue(name,0)-spec.min)<1e-10);assert.ok(Math.abs(sliderToValue(name,1)-spec.max)<1e-10);
 let previous=-Infinity;for(let i=0;i<=1000;i++){const position=i/1000,value=sliderToValue(name,position);assert.ok(Number.isFinite(value)&&value>=previous);assert.ok(Math.abs(valueToSlider(name,value)-position)<1e-10);previous=value;}
}
assert.equal(sliderToValue('output',.5),.25);assert.ok(Math.abs(sliderToValue('pulseRate',.5)-Math.sqrt(.25*12))<1e-10);assert.ok(sliderToValue('coupling',.5)<1);assert.equal(sliderToValue('pulseJitter',.5),.5);assert.equal(sliderToValue('detune',.5),50);
console.log(JSON.stringify({ok:true,mappedControls:Object.keys(SLIDERS),endpoints:true,monotonic:true,roundTrips:Object.keys(SLIDERS).length*1001,positiveTimesLogarithmic:true,outputSquaredAmplitude:true,percentAndCentsLinear:true},null,2));
