import assert from 'node:assert/strict';
import {CortexEngine} from './engine.mjs';
const report=[];
for(const mode of ['islands','modular','global']){
 const e=new CortexEngine(65);e.set({mode});assert.equal(e.activation.reduce((a,b)=>a+b,0),0);e.excite(3,.65);const seed=e.drainEvents();assert.equal(seed.length,1);assert.equal(seed[0].group,3);assert.equal(seed[0].hop,0);
 e.advanceEvents(.1);assert.equal(e.drainEvents().length,0);e.time=.1;e.measure();assert.ok(e.activation[3]>.01);assert.equal(Array.from(e.activation).filter(v=>v>.001).length,1);
 e.advanceEvents(.4);const joins=e.drainEvents();assert.ok(joins.length>=2);assert.deepEqual(joins.map(x=>x.group).sort((a,b)=>a-b),[2,4]);assert.ok(joins.every(x=>x.time>seed[0].time));
 e.advanceEvents(12);const all=[...seed,...joins,...e.drainEvents()];assert.equal(new Set(all.map(x=>x.group)).size,all.length);assert.ok(all.every(x=>x.group>=0&&x.group<16));if(mode==='islands')assert.ok(all.every(x=>x.group<8));assert.equal(e.pending.length,0);e.time=12;e.measure();assert.ok(e.activation.every(v=>v<1e-6));report.push({mode,visited:all.length,lastJoin:all.at(-1).time,fadeComplete:true});
}
const p=new CortexEngine(88);p.set({pulseEnabled:true,pulseRate:2,pulseJitter:0});p.advanceEvents(2);const pulseSeeds=p.drainEvents().filter(e=>e.source==='pulse');assert.deepEqual(pulseSeeds.map(e=>e.time),[.5,1,1.5,2]);
const a=new CortexEngine(88),b=new CortexEngine(88);for(const e of[a,b]){e.set({pulseEnabled:true,pulseRate:12,pulseJitter:1,mode:'global',coupling:8});e.advanceEvents(20);}assert.deepEqual(a.drainEvents(),b.drainEvents());assert.ok(new Set(a.pending.map(e=>e.wave.id)).size<=64);assert.ok(a.pending.length<64*16*3);
a.time=20;a.set({pulseEnabled:false});const phases=a.phase.slice();a.clearActivity();assert.deepEqual(a.phase,phases);assert.equal(a.pending.length,0);a.advanceEvents(30);assert.equal(a.drainEvents().length,0);assert.ok(a.activation.every(v=>v===0));
const off=new CortexEngine(4);off.excite(0,.65);off.drainEvents();const before=off.phase.slice();off.set({pulseEnabled:false});assert.deepEqual(off.phase,before);assert.ok(off.pending.length>0);off.advanceEvents(12);assert.equal(off.pending.length,0);
console.log(JSON.stringify({ok:true,defaultSilent:true,delayedJoins:true,finiteVisitedWaves:report,seededJitter:true,regularPulseTimes:[.5,1,1.5,2],maxWaveIds:64,pauseClearsWavesPreservesPhase:true},null,2));
