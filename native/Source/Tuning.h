#pragma once
#include <algorithm>
#include <cmath>
namespace cortex {
inline float voiceRatio(int voice,int mode,int scale,float detune){
 voice=std::clamp(voice,0,15);float semitones;
 if(mode==1)semitones=12.f*(voice*2.8f/15.f+.045f*std::sin(voice*1.7f));
 else{constexpr int minor[]={0,2,3,5,7,8,10},major[]={0,2,4,5,7,9,11},fifths[]={0,7};int count=scale==2?2:7;const int* notes=scale==2?fifths:scale==1?major:minor;int index=voice%(count*3);semitones=float(notes[index%count]+12*(index/count));}
 float offset=((voice*7%16)/7.5f-1)*std::clamp(detune,0.f,100.f);
 return std::pow(2.f,(semitones+offset/100.f)/12.f);
}
}
