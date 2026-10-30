#pragma once
#include <algorithm>
#include <cstdint>
namespace cortex {
// Independent deterministic stream for timing and region selection.
class PulseClock {
 uint32_t random=0x65abc123;float remaining=0;bool enabled=false;
 float uniform(){random^=random<<13;random^=random>>17;random^=random<<5;return float(random>>8)/16777216.f;}
public:
 int nodeForRegion(int region){return std::clamp(region,0,15)*4096+std::min(4095,int(uniform()*4096));}
 void reset(){random=0x65abc123;remaining=0;enabled=false;}
 int step(bool on,float rate,float jitter,float dt=.025f){
  rate=std::clamp(rate,.25f,12.f);jitter=std::clamp(jitter,0.f,1.f);
  if(!on){enabled=false;remaining=0;return -1;}
  if(!enabled){enabled=true;remaining=1/rate;}
  remaining=std::min(remaining,(1+jitter)/rate);remaining-=dt;
  if(remaining>0)return -1;
  int region=std::min(15,int(uniform()*16));
  // At 100% jitter the interval ranges from 0.25x to 1.75x the mean.
  remaining+=std::max(.025f,(1+.75f*jitter*(2*uniform()-1))/rate);return region;
 }
};
}
