#pragma once
#include <array>
#include <algorithm>
#include <cstdint>
namespace cortex {
struct ExcitationWave {bool active=false,directOnly=false;uint16_t visited=0;int sourceNode=-1,sourceRegion=0,note=-1;std::array<float,16> due{},strength{};};
class Excitation {
 std::array<ExcitationWave,64> waves{};std::array<float,16> refractory{};size_t next=0;
public:
 std::array<int,16> firedNode{},firedNote{};
 void clear(){for(auto& w:waves)w.active=false;refractory.fill(0);next=0;}
 size_t pendingCount()const{size_t count=0;for(const auto& w:waves)if(w.active)++count;return count;}
 void seed(int region,float strength,int node=-1,int note=-1,bool directOnly=false,float delay=0){auto& w=waves[next++%waves.size()];w={};w.active=true;w.directOnly=directOnly;w.sourceNode=node;w.sourceRegion=region;w.note=note;w.due.fill(10000);w.strength.fill(0);w.due[std::clamp(region,0,15)]=std::max(0.f,delay);w.strength[std::clamp(region,0,15)]=std::clamp(strength,0.f,1.f);}
 std::array<float,16> step(float dt,int topology,float coupling,float attack=.38f){
  std::array<float,16> fired{};firedNode.fill(-1);firedNote.fill(-1);for(auto& r:refractory)r=std::max(0.f,r-dt);
  float delay=std::clamp(attack,.03f,2.f),attenuation=std::clamp(.48f+.08f*coupling,.4f,.9f);
  for(auto& w:waves){if(!w.active)continue;for(int i=0;i<16;++i)if(w.due[i]<9999)w.due[i]-=dt;
   for(int g=0;g<16;++g){if(w.due[g]>0||(w.visited&(1u<<g)))continue;w.visited|=uint16_t(1u<<g);float strength=w.strength[g];w.due[g]=10000;if(strength<=0||(!w.directOnly&&strength<.12f))continue;
    if(refractory[g]<=0){if(strength>=fired[g]){fired[g]=strength;firedNode[g]=g==w.sourceRegion?w.sourceNode:-1;firedNote[g]=w.note;}refractory[g]=.28f;}
    if(w.directOnly||coupling<=0)continue;
    auto schedule=[&](int region,float time,float amount){if(w.visited&(1u<<region))return;if(amount<.12f)return;if(time<w.due[region]){w.due[region]=time;w.strength[region]=amount;}};
    if(topology==1){schedule((g+1)%16,delay,strength*attenuation);schedule((g+15)%16,delay,strength*attenuation);schedule((g+4)%16,delay*1.45f,strength*attenuation*.8f);}else{int base=g&8;schedule(base+((g+1)&7),delay,strength*attenuation);schedule(base+((g+7)&7),delay,strength*attenuation);if(topology==2)schedule(g^8,delay*1.65f,strength*attenuation*.8f);}
   }
   bool pending=false;for(int g=0;g<16;++g)if(w.due[g]<9999&&!(w.visited&(1u<<g)))pending=true;w.active=pending;
  }return fired;
 }
};
}
