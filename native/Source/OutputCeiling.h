#pragma once
#include <cmath>
namespace cortex {
// No gain linkage between ears; exact linear path below the 0.85 knee.
inline float outputCeiling(float value){float magnitude=std::abs(value);if(magnitude<=.85f)return value;return std::copysign(.85f+.15f*std::tanh((magnitude-.85f)/.15f),value);}
}
