#pragma once
#include "Excitation.h"
#include "PulseClock.h"
#include <numeric>
namespace cortex {
// Separate seeded pattern stream keeps burst size independent of pulse-clock jitter.
class PulsePattern {
 uint32_t random=0x65a37c91;int mode=0;
 float uniform(){random^=random<<13;random^=random>>17;random^=random<<5;return float(random>>8)/16777216.f;}
 int node(int region){return region*4096+std::min(4095,int(uniform()*4096));}
public:
 bool changeMode(int next,Excitation& waves,PulseClock& clock){next=std::clamp(next,0,2);if(next==mode)return false;mode=next;waves.clear();clock.reset();return true;}
 void trigger(int selected,int region,float strength,float attack,Excitation& waves){
  region=std::clamp(region,0,15);strength=std::clamp(strength,0.f,1.f);
  if(selected==1){std::array<int,16> order{};std::iota(order.begin(),order.end(),0);for(int i=15;i>0;--i)std::swap(order[i],order[std::min(i,int(uniform()*(i+1)))]);int count=14+std::min(2,int(uniform()*3));for(int i=0;i<count;++i){int g=order[i],source=node(g);float amount=strength*(.75f+.25f*uniform()),delay=uniform()*.65f*std::clamp(attack,.03f,2.f);waves.seed(g,amount,source,-1,true,delay);}}
  else if(selected==2)waves.seed(region,strength*(.25f+.45f*uniform()),node(region),-1,true);
  else waves.seed(region,strength,node(region));
 }
};
}
