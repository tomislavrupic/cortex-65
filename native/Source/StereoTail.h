#pragma once
#include <juce_audio_basics/juce_audio_basics.h>
namespace cortex {
// Independent mono networks: neither ear ever enters the other ear's delay storage.
class StereoTail {
 juce::Reverb left,right;juce::SmoothedValue<float> wet,gate;double rate=48000;int remaining=0;bool clearing=false,muted=false;float lastSize=-1;
public:
 void prepare(double sr,float amount,float size){rate=sr;left.setSampleRate(sr);right.setSampleRate(sr);left.reset();right.reset();remaining=0;clearing=false;muted=false;wet.reset(sr,.025);gate.reset(sr,.04);wet.setCurrentAndTargetValue(amount);gate.setCurrentAndTargetValue(1);lastSize=-1;settings(amount,size);}
 void settings(float amount,float size){wet.setTargetValue(juce::jlimit(0.f,1.f,amount));size=juce::jlimit(0.f,1.f,size);if(size!=lastSize){juce::Reverb::Parameters p;p.roomSize=size;p.damping=.55f;p.wetLevel=1.f/3;p.dryLevel=0;p.width=1;p.freezeMode=0;left.setParameters(p);right.setParameters(p);lastSize=size;}}
 void resume(){if(muted||clearing){left.reset();right.reset();remaining=0;clearing=false;muted=false;gate.setTargetValue(1);}}
 void stop(){if(!clearing&&!muted){clearing=true;gate.setTargetValue(0);}}
 bool active()const{return remaining>0||clearing;}
 void process(float& l,float& r){float amount=wet.getNextValue(),gain=gate.getNextValue();if(muted){l=r=0;return;}if(clearing&&!gate.isSmoothing()){left.reset();right.reset();remaining=0;clearing=false;muted=true;l=r=0;return;}if(amount==0&&!wet.isSmoothing()){if(remaining){left.reset();right.reset();remaining=0;}l*=gain;r*=gain;return;}float dryL=l,dryR=r;if(std::abs(l)>1e-9f||std::abs(r)>1e-9f)remaining=int(rate*30);if(remaining>0){left.processMono(&l,1);right.processMono(&r,1);--remaining;}else l=r=0;l=((1-.35f*amount)*dryL+.35f*amount*l)*gain;r=((1-.35f*amount)*dryR+.35f*amount*r)*gain;}
};
}
