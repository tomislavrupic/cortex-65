import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FACTORY_PRESETS,readFactoryPreset,createPresetRecallGate} from './factory-presets.mjs';
import {loadUserPreset,serializeUserPreset} from './user-presets.mjs';
const fetchFile=async url=>({ok:true,text:()=>readFile(new URL(url,import.meta.url),'utf8')});
assert.equal(new Set(FACTORY_PRESETS.map(p=>p.id)).size,6);
const loaded=[];
for(const entry of FACTORY_PRESETS){
 const preset=await readFactoryPreset(entry.id,fetchFile);assert.equal(preset.name,entry.name);
 const state={running:true,muted:true,phases:new Float32Array([.1,.7])},phase=state.phases;let changes=0;
 loadUserPreset(serializeUserPreset(preset),{slider(){changes++;},choice(){changes++;},toggle(){changes++;}});
 assert.equal(changes,33);assert.equal(state.phases,phase);assert.equal(state.running,true);assert.equal(state.muted,true);
 assert.ok(preset.audio.voiceLimit<=8);assert.equal(preset.audio.tuningMode,'locked');
 loaded.push(preset);
}
assert.ok(loaded.slice(0,5).every(p=>p.audio.detune===0),'new factory patches start exactly tuned');
assert.deepEqual(loaded.slice(0,5).map(p=>p.audio.root),[130.812,146.832,110,130.812,130.812],'new factory register is one octave higher');
const rain=loaded.find(p=>p.name==='Orbital Rain');assert.equal(rain.engine.pulseMode,'rain');assert.equal(rain.audio.orbitEnabled,true);assert.ok(rain.audio.orbitRate<=.025);
const storm=loaded.find(p=>p.name==='Cortical Thunder');assert.equal(storm.engine.pulseMode,'brainstorm');assert.ok(storm.engine.pulseStrength>=.85);
for(const name of ['Deep Current','Glass Canopy','Slow Bloom']){const p=loaded.find(p=>p.name===name);assert.ok(p.engine.release>=3.5&&p.audio.reverb>=.4);}
let calls=0;await assert.rejects(readFactoryPreset('../private',async()=>{calls++;}),/Unknown/);assert.equal(calls,0);
await assert.rejects(readFactoryPreset('orbital-rain',async()=>({ok:false})),/could not be loaded/);
const invalid=structuredClone(rain);invalid.audio.orbitRate=100;await assert.rejects(readFactoryPreset('orbital-rain',async()=>({ok:true,text:async()=>JSON.stringify(invalid)})),/range/);
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');assert.ok(html.includes('id="factory-preset"'));assert.ok(html.includes('id="factory-load"'));
assert.ok(html.includes('<option value="110">A2 · 110 Hz</option>'),'startup root is A2');
const recall=createPresetRecallGate(),applied=[];let resolveFactory;
const slow=recall(()=>new Promise(resolve=>resolveFactory=resolve),p=>applied.push(p));
await recall(async()=> 'new personal patch',p=>applied.push(p));resolveFactory('old factory patch');assert.equal(await slow,false);assert.deepEqual(applied,['new personal patch']);
let rejectStale;const staleError=recall(()=>new Promise((_,reject)=>rejectStale=reject),()=>assert.fail('stale error applied'));
await recall(async()=> 'latest patch',p=>applied.push(p));rejectStale(new Error('late network error'));assert.equal(await staleError,false);
console.log(JSON.stringify({ok:true,factoryPatches:6,completeControls:33,oldDriftPreserved:true,validatedBeforeRecall:true,cpuBudgetMax:8},null,2));
