import {SCALES,detuneCents,frequencyForRegion} from './tuning.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function choosePitch(group,p={},random=Math.random,coherence=0){
 const variation=clamp(Number(p.variation??.5),0,1),octaves=Math.round(clamp(Number(p.octaves??2),0,3)),notes=SCALES[p.scale]||SCALES.minor,degree=group%(notes.length*3),legacyOctave=Math.floor(degree/notes.length);
 if(variation===0&&octaves===0)return{legacy:true,noteIndex:degree%notes.length,octave:legacyOctave,freeSemitones:0};
 let noteIndex=degree%notes.length;if(random()<variation)noteIndex=Math.floor(clamp(.75*random()+.25*clamp(coherence,0,1),0,.999999)*notes.length);
 const octave=octaves>0?Math.min(octaves,Math.floor(random()*(octaves+1))):legacyOctave;
 const freeSemitones=12*(group*2.8/15+.045*Math.sin(group*1.7))+variation*(2*random()-1)*6+(octaves>0?12*octave:0);
 return{legacy:false,noteIndex,octave,freeSemitones};
}
export function pitchFrequency(group,choice,p={}){
 if(choice.legacy)return frequencyForRegion(group,p);
 const notes=SCALES[p.scale]||SCALES.minor,semitones=p.tuningMode==='free'?choice.freeSemitones:notes[choice.noteIndex%notes.length]+12*choice.octave;
 return (Number(p.root)||55)*Math.pow(2,semitones/12+detuneCents(group,p.detune||0)/1200);
}
export function stereoPair(base,difference){return{left:base,right:base+clamp(Number(difference)||8,2,50)};}
