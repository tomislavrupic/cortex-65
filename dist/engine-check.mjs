import assert from 'node:assert/strict';
import {CortexEngine,NODE_COUNT,RING_SIZE,RING_COUNT} from './engine.mjs';
const a=new CortexEngine(65),b=new CortexEngine(65);
assert.equal(a.phase.length,65536);assert.equal(a.ringCoherence.length,2048);a.step();b.step();assert.deepEqual(a.phase,b.phase);
for(let n=0;n<25;n++)a.step(.04);for(const p of a.phase)assert.ok(Number.isFinite(p)&&p>=0&&p<Math.PI*2);
for(let i=0;i<NODE_COUNT;i++)a.phase[i]=(i%RING_SIZE)*2*Math.PI/RING_SIZE;a.set({projection:1});a.measure();assert.ok(a.stats.local>.9999);a.set({projection:0});a.measure();assert.ok(a.stats.local<1e-6);a.set({projection:-1});a.measure();assert.ok(a.stats.local<1e-6);
for(let i=0;i<NODE_COUNT;i++)a.phase[i]=((32-i%RING_SIZE)%32)*2*Math.PI/RING_SIZE;a.set({projection:-1});a.measure();assert.ok(a.stats.local>.9999);
const before=a.phase.slice();a.set({mode:'modular',projection:0});assert.deepEqual(a.phase,before);a.excite(3);const seedEvent=a.drainEvents().at(-1);for(let i=0;i<NODE_COUNT;i++){if(i!==seedEvent.nodeIndex)assert.equal(a.phase[i],before[i]);else assert.notEqual(a.phase[i],before[i]);}a.applyDueKicks(a.time+a.params.attack+1e-8);for(let i=0;i<NODE_COUNT;i++){if((i>>12)!==3)assert.equal(a.phase[i],before[i]);else assert.notEqual(a.phase[i],before[i]);}
const sync=new CortexEngine(71);sync.set({mode:'global',coupling:8,noise:0,drift:0});const initial=sync.stats.global;for(let n=0;n<400;n++)sync.step(.05);assert.ok(sync.stats.global>.98);assert.ok(sync.stats.global>initial);assert.equal(sync.stats.nodes,65536);assert.equal(RING_COUNT*RING_SIZE,NODE_COUNT);
console.log(JSON.stringify({ok:true,nodes:NODE_COUNT,rings:RING_COUNT,deterministic:true,finite:true,windingProjection:true,localizedExcitation:true,parameterStatePreservation:true,initialGlobal:initial,finalGlobal:sync.stats.global},null,2));
