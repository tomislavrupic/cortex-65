const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export const ENVELOPE_DEFAULTS={attack:.38,decay:.22,sustain:.25,release:.4};
export const ONE_SHOT_HOLD=.15;
export function normalizeEnvelope(p={}){return{attack:clamp(Number(p.attack??.38),.03,2),decay:clamp(Number(p.decay??.22),.03,4),sustain:clamp(Number(p.sustain??.25),0,1),release:clamp(Number(p.release??.4),.03,5)};}
export function audibleAttack(p){return clamp(.005+.04*p.attack,.004,.085);}
export function envelopeDuration(p){return audibleAttack(p)+p.decay+ONE_SHOT_HOLD+p.release;}
export function envelopeLevel(age,p){if(!Number.isFinite(age)||age<0)return 0;const a=audibleAttack(p);if(age<a)return age/a;age-=a;if(age<p.decay)return 1-(1-p.sustain)*(age/p.decay);age-=p.decay;if(age<ONE_SHOT_HOLD)return p.sustain;age-=ONE_SHOT_HOLD;if(age<p.release)return p.sustain*Math.pow(1-age/p.release,2);return 0;}
export function arrivalDelay(distance,radius,attack){return Math.max(0,Math.min(1,distance/Math.max(radius,1e-9)))*attack;}
