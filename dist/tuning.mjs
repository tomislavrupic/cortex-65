export const SCALES={minor:[0,2,3,5,7,8,10],major:[0,2,4,5,7,9,11],fifths:[0,7]};
export function detuneCents(group,amount=0){return Math.max(0,Math.min(100,Number(amount)||0))*((group*7%16)/7.5-1);}
export function frequencyForRegion(group,{root=55,scale='minor',tuningMode='locked',detune=0}={}){
 const notes=SCALES[scale]||SCALES.minor,degree=group%(notes.length*3);
 const semitones=tuningMode==='free'?12*(group*2.8/15+.045*Math.sin(group*1.7)):notes[degree%notes.length]+12*Math.floor(degree/notes.length);
 return root*Math.pow(2,semitones/12+detuneCents(group,detune)/1200);
}
