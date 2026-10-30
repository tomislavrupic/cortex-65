#include <AudioToolbox/AudioToolbox.h>
#include <CoreFoundation/CoreFoundation.h>
#include <cmath>
#include <cstring>
#include <iostream>
#include <thread>
#include <chrono>
int main(int argc, char **argv) {
  if (argc != 2)
    return 1;
  auto url = CFURLCreateFromFileSystemRepresentation(
      nullptr, (const UInt8 *)argv[1], std::strlen(argv[1]), true);
  auto bundle = CFBundleCreate(nullptr, url);
  CFRelease(url);
  if (!bundle || !CFBundleLoadExecutable(bundle))
    return 1;
  auto factory =
      (AudioComponentFactoryFunction)CFBundleGetFunctionPointerForName(
          bundle, CFSTR("CORTEX_65AUFactory"));
  if (!factory)
    return 1;
  AudioComponentDescription d{'aumu', 'Cx65', 'Pxrc', 0, 0};
  auto component = AudioComponentRegister(
      &d, CFSTR("Pixel Records: CORTEX 65 local test"), 256, factory);
  if (!component) {
    std::cout << "SKIP: AU binary and factory load; AudioComponentRegister "
                 "unavailable in this session\n";
    CFRelease(bundle);
    return 77;
  }
  AudioUnit unit = nullptr;
  if (AudioComponentInstanceNew(component, &unit))
    return 1;
  AudioStreamBasicDescription format{};
  format.mSampleRate = 48000;
  format.mFormatID = kAudioFormatLinearPCM;
  format.mFormatFlags =
      kAudioFormatFlagsNativeFloatPacked | kAudioFormatFlagIsNonInterleaved;
  format.mBytesPerPacket = format.mBytesPerFrame = 4;
  format.mFramesPerPacket = 1;
  format.mChannelsPerFrame = 2;
  format.mBitsPerChannel = 32;
  if (AudioUnitSetProperty(unit, kAudioUnitProperty_StreamFormat,
                           kAudioUnitScope_Output, 0, &format,
                           sizeof(format)) ||
      AudioUnitInitialize(unit))
    return 1;
  MusicDeviceMIDIEvent(unit, 0x90, 60, 100, 0);
  struct Buffers {
    UInt32 count;
    AudioBuffer data[2];
  } buffers{};
  float left[256]{}, right[256]{};
  buffers.count = 2;
  buffers.data[0] = {1, sizeof(left), left};
  buffers.data[1] = {1, sizeof(right), right};
  double energy = 0;
  for (int block = 0; block < 188; block++) {
    std::this_thread::sleep_for(std::chrono::milliseconds(5));
    AudioTimeStamp stamp{};
    stamp.mSampleTime = block * 256;
    stamp.mFlags = kAudioTimeStampSampleTimeValid;
    AudioUnitRenderActionFlags flags = 0;
    if (AudioUnitRender(unit, &flags, &stamp, 0, 256,
                        (AudioBufferList *)&buffers))
      return 1;
    for (int i = 0; i < 256; i++) {
      if (!std::isfinite(left[i]) || !std::isfinite(right[i]))
        return 1;
      energy += left[i] * left[i] + right[i] * right[i];
    }
  }
  AudioUnitUninitialize(unit);
  AudioComponentInstanceDispose(unit);
  CFRelease(bundle);
  if (energy < .01)
    return 1;
  std::cout << "PASS: AU factory, instantiate and stereo MIDI render\n";
  return 0;
}
