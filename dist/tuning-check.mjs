import assert from 'node:assert/strict';
import {SCALES,frequencyForRegion,detuneCents} from './tuning.mjs';
const root=55;
for(const scale of Object.keys(SCALES))for(let group=0;group<16;group++){
 const locked=frequencyForRegion(group,{root,scale}),semitones=12*Math.log2(locked/root);assert.ok(Math.abs(semitones-Math.round(semitones))<1e-10);assert.ok(SCALES[scale].includes(Math.round(semitones)%12));assert.ok(locked>=root&&locked<root*8);
 for(const detune of[0,25,100]){const f=frequencyForRegion(group,{root,scale,detune});assert.ok(Number.isFinite(f)&&f>0);const cents=1200*Math.log2(f/locked);assert.ok(Math.abs(cents)<=detune+1e-8);assert.ok(Math.abs(cents-detuneCents(group,detune))<1e-8);assert.equal(f,frequencyForRegion(group,{root,scale,detune}));}
}
const free=Array.from({length:16},(_,g)=>frequencyForRegion(g,{root,tuningMode:'free'}));assert.equal(free[0],root);assert.ok(free.slice(1).every(f=>Math.abs(12*Math.log2(f/root)-Math.round(12*Math.log2(f/root)))>.0001));assert.ok(free.every(f=>Number.isFinite(f)&&f>0));
console.log(JSON.stringify({ok:true,scaleGridExactAtZero:true,scales:Object.keys(SCALES),continuousFree:true,stableDetune:true,maxDetuneCents:100,all16RegionsInAudibleRange:true},null,2));
