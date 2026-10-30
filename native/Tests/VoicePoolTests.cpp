#include "VoicePool.h"
#include <iostream>
#include <cmath>
#include <stdexcept>
void require(bool value,const char* message){if(!value)throw std::runtime_error(message);}
void advance(cortex::VoicePool& pool,int samples){for(int n=0;n<samples;++n)for(auto& v:pool.slots){float old=v.mix;pool.advance(v,1.f/48000);require(std::abs(v.mix-old)<=1.f/240+.00001f,"5 ms transition slope");}}
int main(){
 cortex::VoicePool pool;pool.reset(4);for(int g=0;g<4;++g)pool.request(g,1,-1,0);advance(pool,240);for(int i=0;i<4;++i){pool.slots[i].gain=1;pool.slots[i].envelope.value=i==2?.01f:.5f;}
 pool.request(15,1,-1,0);require(pool.slots[2].pendingRegion==15&&pool.slots[2].region==2,"quietest is faded before reassignment");advance(pool,120);require(pool.slots[2].region==2,"old voice retained during fade");advance(pool,121);require(pool.slots[2].region==15,"replacement starts after fade");
 for(int cap:{4,8,16}){pool.reset(cap);uint32_t visited=0;for(int g=0;g<16;++g){pool.request(g,.8f,-1,0);advance(pool,250);for(auto& v:pool.slots)if(v.region>=0)visited|=1u<<v.region;require(pool.count()<=cap,"voice cap bounds");}require(visited==0xffff,"every region remains eligible");}
 pool.reset(16);pool.ensureBed();require(pool.count()==16,"bed shares full pool");advance(pool,240);pool.setLimit(4);advance(pool,241);require(pool.count()==4,"cap reduction settles within 5 ms");pool.request(13,1,60,1);advance(pool,241);require(pool.contains(13)&&pool.count()==4,"bed is stealable by any region");
 pool.stop(.04f);for(auto& v:pool.slots)require(v.pendingRegion==-1,"stop cancels pending starts");std::cout<<"PASS caps4/8/16, all16regions eligible, quietest5mssteal/retrigger transition, cap reduction, shared bed and pending cancellation\n";
}
