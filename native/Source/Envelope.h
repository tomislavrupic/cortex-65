#pragma once
#include <algorithm>
namespace cortex {
inline float audibleAttack(float propagationAttack){return std::clamp(.005f+.04f*propagationAttack,.004f,.085f);}
inline float envelopeBeforeRelease(float time,float attack,float decay,float sustain){if(time<0)return 0;float a=audibleAttack(attack);if(time<a)return time/a;if(time<a+decay)return 1-(1-sustain)*(time-a)/decay;return sustain;}
inline float visualEnvelope(float age,float arrival,float attack,float decay,float sustain,float release,bool held,float releaseAt){float time=age-arrival;if(time<0)return 0;float value=envelopeBeforeRelease(time,attack,decay,sustain);float start=held?releaseAt:audibleAttack(attack)+decay+.15f+arrival;if(start<0||age<start)return value;float releaseValue=held?envelopeBeforeRelease(start-arrival,attack,decay,sustain):sustain;float tail=std::max(0.f,1-(age-start)/release);return releaseValue*tail*tail;}
struct Envelope {
 float age=0,value=0,releaseAge=-1,releaseValue=0,peak=0,forcedRelease=-1;int note=-1;bool active=false;
 void trigger(float strength,int heldNote){age=0;releaseAge=-1;forcedRelease=-1;peak=strength;note=heldNote;active=true;}
 void stop(float release){forcedRelease=release;if(active&&releaseAge<0){releaseAge=0;releaseValue=value;age=0;}if(release<=0){active=false;value=0;}}
 float step(float dt,float attack,float decay,float sustain,float release,bool held){if(!active)return 0;if(forcedRelease>0)release=forcedRelease;if(note>=0&&!held&&releaseAge<0){releaseAge=0;releaseValue=value;}float target;
  if(releaseAge>=0){releaseAge+=dt;float tail=std::max(0.f,1-releaseAge/release);target=releaseValue*tail*tail;if(releaseAge>=release)active=false;}
  else{age+=dt;target=peak*visualEnvelope(age,0,attack,decay,sustain,release,note>=0,-1);if(note<0&&age>audibleAttack(attack)+decay+.15f+release)active=false;}
  value+=std::min(1.f,dt/.002f)*(target-value);if(!active&&value<.000001f)value=0;return value;
 }
};
}
