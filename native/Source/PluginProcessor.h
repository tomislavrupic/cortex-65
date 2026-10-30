#pragma once
#include <juce_audio_utils/juce_audio_utils.h>
#include "PhaseEngine.h"
#include "PulseClock.h"
#include "Excitation.h"
#include "Tuning.h"
#include "Envelope.h"
#include "VoicePool.h"
#include "StereoTail.h"
#include <mutex>
static_assert(std::atomic<uint64_t>::is_always_lock_free,"MIDI held-note atomics must be lock free");
static_assert(std::atomic<float>::is_always_lock_free,"Audio parameter atomics must be lock free");
class CortexProcessor final : public juce::AudioProcessor, private juce::Thread {
public:
 CortexProcessor(); ~CortexProcessor() override;
 juce::AudioProcessorValueTreeState state;
 std::array<std::atomic<float>,16> amplitudes{}, regionPhase{};
 std::atomic<uint64_t> simulationSteps{0},oscillatorEvaluations{0};
 std::atomic<int> activeVoices{0};std::atomic<uint32_t> renderedRegions{0};
 std::atomic<float> global{0},local{0},tickMs{0},meter{0};
 std::atomic<int> excitation{-1},excitationNote{-1};
 std::array<int,16> centroidNode{};
 std::array<std::atomic<int>,16> eventSource{},eventNote{};
 std::array<std::atomic<float>,16> eventAge{},eventRadius{},eventReleaseAt{};
 std::array<std::atomic<uint64_t>,2> heldMask{};
 void seedNode(int node,int note=-1){excitationNote.store(note);excitation.store(juce::jlimit(0,65535,node));}
 bool noteHeld(int note)const{return note>=0&&note<128&&(heldMask[note/64].load()&(uint64_t(1)<<(note%64)))!=0;}
 std::array<std::atomic<uint32_t>,16> pulseCounters{},pulseEpoch{};
 std::atomic<uint32_t> activityEpoch{1};
 std::array<std::atomic<float>,16> eventStrength{},activity{};
 std::atomic<bool> resetActivity{false},stopAudio{false};
 void stopEverything(){activityEpoch.fetch_add(1);resetActivity.store(true);stopAudio.store(true);excitation.store(-1);}
 static constexpr int visualCount=65536;
 std::array<float,visualCount> visualPhases{};
 std::mutex visualMutex;
 void copyVisual(std::array<float,visualCount>& out){std::lock_guard<std::mutex> lock(visualMutex);out=visualPhases;}
 void prepareToPlay(double,int) override;
 void releaseResources() override{}
 void processBlock(juce::AudioBuffer<float>&,juce::MidiBuffer&) override;
 bool isBusesLayoutSupported(const BusesLayout&)const override;
 juce::AudioProcessorEditor* createEditor()override;
 bool hasEditor()const override{return true;}
 const juce::String getName()const override{return "CORTEX 65";}
 bool acceptsMidi()const override{return true;} bool producesMidi()const override{return false;} bool isMidiEffect()const override{return false;}
 double getTailLengthSeconds()const override{return 62.;}
 juce::String exportUserPreset(const juce::String& name)const;
 bool importUserPreset(const juce::String& json,juce::String& name,juce::String& error);
 bool saveUserPresetFile(const juce::File&,const juce::String& name,juce::String& error)const;
 bool loadUserPresetFile(const juce::File&,juce::String& name,juce::String& error);
 void loadDMajorDrift();void randomizeAdvanced(uint32_t seed);
 int getNumPrograms()override{return 2;}int getCurrentProgram()override{return currentProgram.load();}void setCurrentProgram(int i)override{currentProgram.store(i==1?1:0);if(i==1)loadDMajorDrift();}const juce::String getProgramName(int i)override{return i==1?"D Major Drift":"Current settings";}void changeProgramName(int,const juce::String&)override{}
 void getStateInformation(juce::MemoryBlock&)override; void setStateInformation(const void*,int)override;
 float param(const char* id)const{return state.getRawParameterValue(id)->load();}
private:
 static juce::AudioProcessorValueTreeState::ParameterLayout layout();
 void run()override;
 std::unique_ptr<cortex::PhaseEngine> engine;
 std::array<double,16> voicePhase{};
 std::array<float,16> gains{}, leftPan{}, rightPan{};
 std::array<std::atomic<float>*,28> audioParameters{};
 uint32_t randomPitch=0x65b1a234;float binauralMix=0,differenceHz=8;
 juce::SmoothedValue<float> binauralRamp,differenceRamp,orbitRamp,orbitRateRamp,orbitDepthRamp;
 bool orbitWasEnabled=false,fieldWasRunning=true;int orbitClearSamples=0;
 void advanceOrbitClear(int samples){if(orbitClearSamples>0){orbitClearSamples-=samples;if(orbitClearSamples<=0)for(auto& v:voicePool.slots)v.orbit.clear();}}
 cortex::VoicePool voicePool;
 cortex::StereoTail reverb;std::atomic<int> currentProgram{0};
 std::array<cortex::Envelope,16> envelopes{};
 std::vector<float> anatomyPositions;
 std::array<float,16> ratios{};
 std::array<uint32_t,16> seenPulses{};
 std::array<float,16> pulseEnvelope{}, pulseTargets{};
 bool pulsesWereEnabled=false;
 std::array<bool,128> held{};
 int midiRoot=48,lastRootParam=48;bool midiUsed=false;
 double sampleRate=48000;
 float envelope=0,volume=.3f,tone=.5f,space=.6f,rootHz=130.8128f;
};
