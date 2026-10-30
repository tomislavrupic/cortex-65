#pragma once
#include "Tuning.h"
#include <cstdint>
namespace cortex {
inline float pitchRandom(uint32_t& state){state^=state<<13;state^=state>>17;state^=state<<5;return float(state>>8)/16777216.f;}
struct PitchChoice {int degree=0,octave=0;float freeSemitones=0;bool legacy=true;};
inline PitchChoice choosePitch(int region,int scale,float variation,int octaves,float coherence,uint32_t& random){
 variation=std::clamp(variation,0.f,1.f);octaves=std::clamp(octaves,0,3);int count=scale==2?2:7;int index=region%(count*3);PitchChoice result;result.degree=index%count;result.octave=index/count;result.freeSemitones=12.f*(region*2.8f/15.f+.045f*std::sin(region*1.7f));result.legacy=variation==0&&octaves==0;if(result.legacy)return result;
 float chance=pitchRandom(random),note=pitchRandom(random),octave=pitchRandom(random),free=pitchRandom(random);if(chance<variation)result.degree=std::min(count-1,int(std::clamp(.75f*note+.25f*std::clamp(coherence,0.f,1.f),0.f,.99999f)*count));int extra=octaves>0?std::min(octaves,int(octave*(octaves+1))):0;if(octaves>0)result.octave=extra;result.freeSemitones+=variation*(2*free-1)*6+12*extra;return result;
}
inline float pitchRatio(const PitchChoice& choice,int region,int mode,int scale,float detune){if(choice.legacy)return voiceRatio(region,mode,scale,detune);constexpr int minor[]={0,2,3,5,7,8,10},major[]={0,2,4,5,7,9,11},fifths[]={0,7};int count=scale==2?2:7;const int* notes=scale==2?fifths:scale==1?major:minor;float semitones=mode==1?choice.freeSemitones:float(notes[choice.degree%count]+12*choice.octave);float cents=((region*7%16)/7.5f-1)*std::clamp(detune,0.f,100.f);return std::pow(2.f,(semitones+cents/100)/12);}
struct CarrierPair{double left,right;};
inline CarrierPair carrierPair(double base,double difference){return {base,base+std::clamp(difference,2.,50.)};}
inline float spreadX(float x,int hemisphere,float amount){return x+(hemisphere==0?.45f:-.45f)*std::clamp(amount,0.f,1.f);}
}
