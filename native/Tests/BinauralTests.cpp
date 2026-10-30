#include "PitchVariation.h"
#include <stdexcept>
#include <iostream>
#include <cmath>
void require(bool ok,const char* message){if(!ok)throw std::runtime_error(message);}
int main(){
 uint32_t random=65;for(int scale=0;scale<3;++scale)for(int region=0;region<16;++region){auto choice=cortex::choosePitch(region,scale,0,0,.5f,random);for(int mode=0;mode<2;++mode)require(cortex::pitchRatio(choice,region,mode,scale,0)==cortex::voiceRatio(region,mode,scale,0),"zero variation/octaves preserves legacy");}
 for(int scale=0;scale<3;++scale)for(int i=0;i<500;++i){auto choice=cortex::choosePitch(i%16,scale,1,3,.8f,random);require(choice.octave>=0&&choice.octave<=3,"bounded octave selection");float semi=12*std::log2(cortex::pitchRatio(choice,i%16,0,scale,0));int pitchClass=int(std::round(semi))%12;require(std::abs(semi-std::round(semi))<.0002,"scale quantization");const int minor[]={0,2,3,5,7,8,10},major[]={0,2,4,5,7,9,11};bool matches=false;if(scale==2)matches=pitchClass==0||pitchClass==7;else for(int n:scale==0?minor:major)matches|=pitchClass==n;require(matches,"pitch remains in selected scale");}
 bool varied=false;auto first=cortex::choosePitch(0,0,1,2,0,random);for(int i=0;i<100;++i){auto next=cortex::choosePitch(0,0,1,2,1,random);varied|=next.degree!=first.degree||next.octave!=first.octave;}require(varied,"repeated excitation varies notes/octaves");
 for(int region=0;region<16;++region)for(int i=0;i<100;++i){auto c=cortex::choosePitch(region,0,1,3,.5f,random);float legacy=12*std::log2(cortex::voiceRatio(region,1,0,0));require(c.freeSemitones>=legacy-6.001f&&c.freeSemitones<=legacy+42.001f,"free pitch excursion bounded");}
 uint32_t lowSeed=123,highSeed=123;double low=0,high=0;for(int i=0;i<1000;++i){low+=cortex::choosePitch(0,0,1,0,0,lowSeed).degree;high+=cortex::choosePitch(0,0,1,0,1,highSeed).degree;}require(high>low,"coherence biases available note choices");
 for(float delta:{2.f,8.f,50.f}){auto pair=cortex::carrierPair(110,delta);require(pair.left==110&&pair.right-pair.left==delta,"exact matched carrier difference");}
 require(cortex::spreadX(.3f,0,1)>.3f&&cortex::spreadX(-.3f,1,1)<-.3f,"hemispheres move outward");require(cortex::spreadX(.3f,0,0)==.3f,"zero spread preserves anatomy");std::cout<<"PASS exact2/8/50Hz pairs, legacyzero, scale/free variation bounds, octave range, stored choice and outward spread\n";
}
