#pragma once
#include "PluginProcessor.h"
class CortexEditor final:public juce::AudioProcessorEditor,private juce::Timer{
public:
 explicit CortexEditor(CortexProcessor&);~CortexEditor()override;
 void paint(juce::Graphics&)override;void resized()override;
 void mouseDown(const juce::MouseEvent&)override;void mouseDrag(const juce::MouseEvent&)override;void mouseUp(const juce::MouseEvent&)override;
private:
 struct RackPanel final:juce::Component{CortexEditor& owner;explicit RackPanel(CortexEditor& o):owner(o){}void paint(juce::Graphics& g)override{owner.paintRack(g);}};
 struct MintLook final:juce::LookAndFeel_V4{void drawLinearSlider(juce::Graphics&,int,int,int,int,float,float,float,const juce::Slider::SliderStyle,juce::Slider&)override;};
 void choosePreset(bool saving);
 juce::TextButton saveUser{"SAVE PRESET"},loadUser{"LOAD PRESET"};juce::TextEditor presetName;juce::Label presetStatus;std::unique_ptr<juce::FileChooser> presetChooser;bool closing=false;
 void paintRack(juce::Graphics&);void renderBrain();
 juce::Image brainImage;void timerCallback()override;void projectPoints();void exciteAt(juce::Point<float>);
 CortexProcessor& processor;MintLook look;RackPanel rackPanel{*this};juce::Viewport rackViewport;
 juce::TextButton randomAdvanced{"RANDOMIZE DRIFT / PROJECTION"},preset{"LOAD D MAJOR DRIFT"};
 juce::TextButton headOrbit{"HEAD ORBIT / OFF"};
 juce::TextButton binaural{"BINAURAL / OFF"};
 juce::TextButton field{"PAUSE FIELD"},pulses{"PULSES / OFF"},excite{"EXCITE REGION"},stop{"STOP"},advanced{"ADVANCED +"},drone{"CONTINUOUS BED"};
 juce::ComboBox network,projection,tuning,scale,voices,pulseMode;
 std::array<juce::Slider,23> sliders; // coupling/noise/rate/jitter/strength/root/detune/tone/space/output/drift
 std::array<juce::Label,23> labels;
 std::vector<std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment>> sliderAttachments;
 std::vector<std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment>> buttonAttachments;
 std::vector<std::unique_ptr<juce::AudioProcessorValueTreeState::ComboBoxAttachment>> comboAttachments;
 std::array<float,CortexProcessor::visualCount> phases{};
 struct Point{float x,y,z,nx,ny,nz;};std::array<Point,CortexProcessor::visualCount> points{};
 struct ScreenPoint{float x,y,z,light;};std::array<ScreenPoint,CortexProcessor::visualCount> projected{};
 std::array<int,CortexProcessor::visualCount> drawOrder{};
 std::array<float,16> flashes{};std::array<uint32_t,16> seenVisualPulses{};
 juce::Rectangle<float> brain;juce::Point<float> dragStart;float displaySpread=0;float yaw=0,pitch=.18f,dragYaw=0,dragPitch=.18f;int selected=0;bool advancedOpen=false,dragged=false;
};
