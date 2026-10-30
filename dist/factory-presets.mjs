import {parseUserPreset} from './user-presets.mjs';
export const FACTORY_PRESETS=Object.freeze([
 {id:'orbital-rain',name:'Orbital Rain',family:'RAIN + BURSTS',description:'Scattered minor-key droplets, long tails and a slow headphone orbit.'},
 {id:'cortical-thunder',name:'Cortical Thunder',family:'RAIN + BURSTS',description:'Broad Brainstorm bursts across both hemispheres, with a wide, resonant tail.'},
 {id:'deep-current',name:'Deep Current',family:'AMBIENT',description:'A continuous low fifths bed, slow regional swells and almost still orbital motion.'},
 {id:'glass-canopy',name:'Glass Canopy',family:'AMBIENT',description:'Sparse high-register rain in C major, suspended in a large reverberant space.'},
 {id:'slow-bloom',name:'Slow Bloom',family:'AMBIENT',description:'Warm C-major waves spread slowly through the field and fade into long tails.'},
 {id:'d-major-drift',name:'D Major Drift',family:'ORIGINAL',description:'The original bright D-major patch. Pulses are off; click a region to play.'}
].map(Object.freeze));
export async function readFactoryPreset(id,fetchFile=fetch){
 const entry=FACTORY_PRESETS.find(p=>p.id===id);if(!entry)throw new Error('Unknown factory preset.');
 const response=await fetchFile('./presets/'+entry.id+'.json',{cache:'no-cache'});if(!response.ok)throw new Error('Factory preset could not be loaded. Try again.');
 const preset=parseUserPreset(await response.text());if(preset.name!==entry.name)throw new Error('Factory preset name does not match the bank.');return preset;
}
// A later personal-file recall wins over an earlier, slower network recall.
export function createPresetRecallGate(){let generation=0;return async(read,apply)=>{const request=++generation;try{const value=await read();if(request!==generation)return false;apply(value);return true;}catch(error){if(request!==generation)return false;throw error;}};}
