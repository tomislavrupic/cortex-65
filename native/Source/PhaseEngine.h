#pragma once
#include <array>
#include <cmath>
#include <cstdint>
#include <algorithm>
namespace cortex {
constexpr int nodes=65536, rings=2048, ringSize=32, groups=16;
constexpr float pi=3.14159265358979323846f, tau=2*pi;
struct Config { float coupling=2.4f, noise=.16f, drift=.25f; int network=0, winding=0; };
struct Projection { std::array<float,groups> amplitude{}, phase{}; float global=0, local=0; };
class PhaseEngine {
public:
 std::array<float,nodes> phases{}, next{}, frequencies{},kickAt{};
 std::array<float,16> kickTarget{},kickStrength{};
 uint32_t random=0x65c0ffee;
 float uniform() { random^=random<<13;random^=random>>17;random^=random<<5;return float(random>>8)/16777216.f; }
 PhaseEngine(){reset();}
 void clearPending(){kickAt.fill(-1);}
 float scheduleRegion(int node,float strength,float attack,const float* xyz){int group=node/4096;float maxDistance=.000001f;for(int i=group*4096;i<(group+1)*4096;++i){float dx=xyz[i*3]-xyz[node*3],dy=xyz[i*3+1]-xyz[node*3+1],dz=xyz[i*3+2]-xyz[node*3+2];maxDistance=std::max(maxDistance,std::sqrt(dx*dx+dy*dy+dz*dz));}kickTarget[group]=std::fmod(phases[node]+pi*.5f,tau);kickStrength[group]=strength;for(int i=group*4096;i<(group+1)*4096;++i){float dx=xyz[i*3]-xyz[node*3],dy=xyz[i*3+1]-xyz[node*3+1],dz=xyz[i*3+2]-xyz[node*3+2];kickAt[i]=attack*std::sqrt(dx*dx+dy*dy+dz*dz)/maxDistance;}return maxDistance;}
 void applyPending(float dt){for(int i=0;i<nodes;++i)if(kickAt[i]>=0){kickAt[i]-=dt;if(kickAt[i]<=0){float phase=std::fmod(phases[i]+kickStrength[i/4096]*std::remainder(kickTarget[i/4096]-phases[i],tau),tau);phases[i]=phase<0?phase+tau:phase;kickAt[i]=-1;}}}
 void reset(){ clearPending();random=0x65c0ffee; for(int i=0;i<nodes;++i){phases[i]=tau*uniform();frequencies[i]=2*uniform()-1;} }
 void excite(int group,float strength=1.f){group=std::clamp(group,0,groups-1);strength=std::clamp(strength,0.f,1.f);float target=phases[group*4096];for(int i=group*4096;i<(group+1)*4096;++i){float delta=std::remainder(target+.2f*(uniform()-.5f)-phases[i],tau);float phase=std::fmod(phases[i]+strength*delta,tau);phases[i]=phase<0?phase+tau:phase;}}
 Projection project(int winding)const{
  Projection p;double gx=0,gy=0;
  for(int ring=0;ring<rings;++ring){float x=0,y=0;for(int j=0;j<ringSize;++j){float phase=phases[ring*ringSize+j];gx+=std::cos(phase);gy+=std::sin(phase);float a=phase-winding*tau*j/ringSize;x+=std::cos(a);y+=std::sin(a);}x/=ringSize;y/=ringSize;p.local+=std::hypot(x,y)/rings;int g=ring/128;p.amplitude[g]+=x/128;p.phase[g]+=y/128;}
  for(int g=0;g<groups;++g){float x=p.amplitude[g],y=p.phase[g];p.amplitude[g]=std::min(1.f,std::hypot(x,y));p.phase[g]=std::atan2(y,x);}p.global=std::min(1.f,float(std::hypot(gx,gy)/nodes));p.local=std::min(1.f,p.local);return p;
 }
 void step(const Config& c,float dt=.025f){
  applyPending(dt);
  std::array<float,groups> rx{},ry{};float gx=0,gy=0;
  for(int i=0;i<nodes;++i){float x=std::cos(phases[i]),y=std::sin(phases[i]);rx[i/4096]+=x/4096;ry[i/4096]+=y/4096;gx+=x/nodes;gy+=y/nodes;}
  const float noise=c.noise*std::sqrt(dt)*1.73205f;
  for(int i=0;i<nodes;++i){int ring=i&~31,j=i&31,g=i/4096;float a=phases[i];float local=.5f*(std::sin(phases[ring+((j+31)&31)]-a)+std::sin(phases[ring+((j+1)&31)]-a));float mx=rx[g],my=ry[g];
   if(c.network==1){mx=gx;my=gy;}else if(c.network==2){int partner=g^8;mx=.55f*rx[g]-.45f*rx[partner];my=.55f*ry[g]-.45f*ry[partner];}
   float between=my*std::cos(a)-mx*std::sin(a);float v=a+dt*(.65f+c.drift*frequencies[i]+c.coupling*(.6f*local+.4f*between))+noise*(2*uniform()-1);v=std::fmod(v,tau);if(v<0)v+=tau;next[i]=v;
  }phases.swap(next);
 }
};
}
