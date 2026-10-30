#pragma once
#include <array>
#include <algorithm>
#include <cmath>
namespace cortex {
// Analytic headphone cues, not a measured HRTF. Fixed storage and 32-sample control rate.
class HeadOrbit {
 std::array<float,512> history{};int head=0,ticks=0;double sampleRate=48000,angle=0;float direction=1,lowCoefficient=.23f;bool initialized=false;
 std::array<float,6> current{},increment{};float filteredL=0,filteredR=0;
 float read(float delay)const{int whole=int(delay);float fraction=delay-whole;return history[(head-whole)&511]*(1-fraction)+history[(head-whole-1)&511]*fraction;}
public:
 struct Stereo{float left=0,right=0;};
 void clear(){history.fill(0);head=0;filteredL=filteredR=0;}
 void reset(double sr,int region){clear();sampleRate=sr;angle=1.5707963267948966+6.283185307179586*region/16.;direction=region%2?-1.f:1.f;lowCoefficient=1-std::exp(float(-6.283185307179586*2000/sr));ticks=0;initialized=false;}
 Stereo process(float input,float rate,float depth){
  if(ticks==0){depth=std::clamp(depth,0.f,1.f);float side=float(std::sin(angle)),rear=std::max(0.f,float(-std::cos(angle))),p=side*depth,maxDelay=float(std::min(510.,sampleRate*.00065));std::array<float,6> target{{std::max(0.f,p)*maxDelay,std::max(0.f,-p)*maxDelay,std::sqrt(.5f*(1-.8f*p)),std::sqrt(.5f*(1+.8f*p)),1-depth*std::clamp(std::max(0.f,side)+.8f*rear,0.f,1.f)*(1-lowCoefficient),1-depth*std::clamp(std::max(0.f,-side)+.8f*rear,0.f,1.f)*(1-lowCoefficient)}};if(!initialized){current=target;initialized=true;}for(int i=0;i<6;++i)increment[i]=(target[i]-current[i])/32;angle+=direction*6.283185307179586*std::clamp(rate,0.f,.5f)*32/sampleRate;if(angle>6.283185307179586)angle-=6.283185307179586;if(angle<0)angle+=6.283185307179586;ticks=32;}
  for(int i=0;i<6;++i)current[i]+=increment[i];--ticks;history[head]=input;float l=read(current[0]),r=read(current[1]);filteredL+=current[4]*(l-filteredL);filteredR+=current[5]*(r-filteredR);head=(head+1)&511;return {filteredL*current[2],filteredR*current[3]};
 }
};
}
