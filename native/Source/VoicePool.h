#pragma once
#include "Envelope.h"
#include "PitchVariation.h"
#include "HeadOrbit.h"
#include <array>
#include <algorithm>
#include <cstdint>
namespace cortex {
struct VoiceSlot {
 int region=-1,pendingRegion=-1,pendingNote=-1;float pendingStrength=0;
 bool fading=false,retiring=false,fresh=true;float mix=0,gain=0,left=.7071068f,right=.7071068f,ratio=1,targetRatio=1;double phase=0,rightPhase=0;uint64_t order=0;
 PitchChoice pitch;HeadOrbit orbit;
 Envelope envelope;
};
class VoicePool {
 uint64_t serial=0;
 void activate(VoiceSlot& slot,int region,float strength,int note){slot={};slot.region=region;slot.order=++serial;if(strength>0)slot.envelope.trigger(strength,note);}
public:
 std::array<VoiceSlot,16> slots{};int limit=8;
 void reset(int cap){for(auto& slot:slots)slot={};limit=cap;serial=0;}
 void setLimit(int cap){cap=std::clamp(cap,1,16);if(cap<limit)for(int i=cap;i<16;++i)if(slots[i].region>=0){slots[i].retiring=true;slots[i].fading=true;slots[i].pendingRegion=-1;}if(cap>limit)for(int i=0;i<cap;++i)if(slots[i].retiring){slots[i].retiring=false;slots[i].fading=false;}limit=cap;}
 int count()const{int count=0;for(const auto& slot:slots)count+=slot.region>=0;return count;}
 bool contains(int region)const{for(const auto& slot:slots)if(slot.region==region||slot.pendingRegion==region)return true;return false;}
 void request(int region,float strength,int note,float bed){
  int chosen=-1;for(int i=0;i<limit;++i)if(slots[i].pendingRegion==region){slots[i].pendingStrength=strength;slots[i].pendingNote=note;return;}
  for(int i=0;i<limit;++i)if(slots[i].region==region){chosen=i;break;}
  if(chosen<0)for(int i=0;i<limit;++i)if(slots[i].region<0){activate(slots[i],region,strength,note);return;}
  if(chosen<0){float quietest=1e30f;bool available=false;for(int i=0;i<limit;++i)available|=slots[i].pendingRegion<0;for(int i=0;i<limit;++i){const auto& v=slots[i];if(available&&v.pendingRegion>=0)continue;float level=std::max(bed,v.envelope.value)*v.gain*v.mix;if(level<quietest||(level==quietest&&(chosen<0||v.order<slots[chosen].order))){quietest=level;chosen=i;}}}
  auto& v=slots[chosen];v.pendingRegion=region;v.pendingStrength=strength;v.pendingNote=note;v.fading=true;v.retiring=false;
 }
 void ensureBed(){for(int i=0;i<limit;++i)if(slots[i].region<0){int region=i*16/limit;for(int n=0;n<16&&contains(region);++n)region=(region+1)%16;activate(slots[i],region,0,-1);}}
 void stop(float release){for(auto& slot:slots){slot.pendingRegion=-1;slot.envelope.stop(release);if(slot.fading)slot.retiring=true;}}
 void advance(VoiceSlot& v,float dt){if(v.region<0)return;if(v.fading){v.mix=std::max(0.f,v.mix-dt/.005f);if(v.mix<=0){if(v.pendingRegion>=0&&!v.retiring){int region=v.pendingRegion,note=v.pendingNote;float strength=v.pendingStrength;activate(v,region,strength,note);}else v={};}}else v.mix=std::min(1.f,v.mix+dt/.005f);}
};
}
