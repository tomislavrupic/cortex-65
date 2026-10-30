import assert from 'node:assert/strict';
import {choosePitch,pitchFrequency,stereoPair} from './pitch-choice.mjs';
import {projectAnatomicalPoint} from './projection.mjs';
import {frequencyForRegion,SCALES} from './tuning.mjs';
const rng=seed=>()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
for(let g=0;g<16;g++){const p={root:55,scale:'minor',tuningMode:'locked',detune:0,variation:0,octaves:0};const c=choosePitch(g,p,rng(65),.5);assert.equal(pitchFrequency(g,c,p),frequencyForRegion(g,p));}
for(const scale of Object.keys(SCALES)){const p={root:55,scale,tuningMode:'locked',detune:0,variation:1,octaves:3};const ra=rng(65),rb=rng(65),seen=new Set();for(let i=0;i<100;i++){const a=choosePitch(i%16,p,ra,.6),b=choosePitch(i%16,p,rb,.6);assert.deepEqual(a,b);const f=pitchFrequency(i%16,a,p),semitones=12*Math.log2(f/55);assert.ok(SCALES[scale].includes(Math.round(semitones)%12));assert.ok(f>=55&&f<=55*16);seen.add(Math.round(semitones));}assert.ok(seen.size>=8);}
const freeParams={root:98,tuningMode:'free',variation:1,octaves:3,detune:100};const freeRandom=rng(79),freeValues=[];for(let i=0;i<100;i++){const c=choosePitch(i%16,freeParams,freeRandom,.5),f=pitchFrequency(i%16,c,freeParams);assert.ok(Number.isFinite(f)&&f>15&&f<10000);freeValues.push(f);}assert.ok(new Set(freeValues).size>90);
const low=choosePitch(0,{variation:1,octaves:0,scale:'minor'},()=>.4,0),high=choosePitch(0,{variation:1,octaves:0,scale:'minor'},()=>.4,1);assert.ok(high.noteIndex>low.noteIndex);
for(const difference of[2,8,50]){const pair=stereoPair(110,difference);assert.equal(pair.left,110);assert.equal(pair.right-pair.left,difference);}
const a=[.4,.2,.3],base={yaw:.3,pitch:.2,aspect:1.5,scale:.8};const p0=projectAnatomicalPoint(a,{...base,hemisphereSign:1,spread:0}),p1=projectAnatomicalPoint(a,{...base,hemisphereSign:1,spread:1});assert.ok(p1.x>p0.x);assert.deepEqual(a,[.4,.2,.3]);const neg=projectAnatomicalPoint([-.4,.2,.3],{...base,hemisphereSign:-1,spread:1});assert.ok(neg.x<0);
console.log(JSON.stringify({ok:true,legacyExact:true,scaleLockedVariety:true,continuousFreeVariety:true,seedReproducible:true,coherenceBias:true,stereoDifferences:[2,8,50],spreadBeforeRotation:true,sourceCoordinatesUnchanged:true},null,2));
