# CORTEX / 65 — native 0.3.0

Apple Silicon AU instrument and standalone application. The field starts running but silent. Click a cortex point, use **EXCITE**, or send MIDI to seed a traveling musical wave. Held MIDI controls root and Sustain; note-off enters Release. **PULSES** adds repeating external seeds. **PAUSE FIELD** freezes phase evolution and fades sound; **STOP** clears pending activity and releases sound. **CONTINUOUS BED** is an explicit optional layer.

## Sound and performance

- **65,536 explicit phase states**, arranged in 2,048 local rings of 32, with Islands, Global or signed Modular coupling. All 65,536 source-derived anatomical points are rendered. Phase coherence modulates sound; musical excitation and ADSR are a separate declared layer.
- **Regional** pulses propagate between linked regions. **Brainstorm** directly stimulates 14–16 distinct regions across both hemispheres, staggered within .65 × Attack. **Brain Rain** directly stimulates one random point per drop at reduced strength. Storm and Rain do not create secondary regional cascades. Rate is .25–12 events/second; Jitter adjusts timing.
- **Attack** controls within-region node-arrival duration and propagation delay. Nodes receive actual delayed phase kicks based on straight-line anatomical distance. Decay, Sustain and Release shape sound. This is artistic Euclidean propagation, not neural conduction.
- **Scale Lock** offers natural minor, major and open fifths; **Free** offers continuous unquantized pitches. Root, Detune, Note Variation and Octave Range shape each excitation. Variation 0 / Octaves 0 retains regional fixed pitches.
- **4 / 8 / 16 voices**, default 8. All regions remain eligible. Quietest stealing and retriggers use a 5 ms fade; Continuous Bed shares the budget. Silent voices skip synthesis. The cap does not reduce the phase-state or display work.
- **Binaural** sends the same chosen note/envelope to separate ears, with right frequency = left frequency + Difference (2–50 Hz). It uses the louder 1/8 paired normalization, with independent final soft ceilings above amplitude .85. The limit counts pairs. Difference deliberately follows scale locking. Tone and Space are normal-mode controls.
- **Head Orbit** is an alternative headphone mode. Each sounding voice has its own angular offset and alternating direction. Fractional interaural delay up to .65 ms, level differences, and simple far-ear/rear filtering provide analytic spatial cues. Rate is .01–.5 Hz (default .07); Depth is 0–1 (default .7). It is not a measured or personalized HRTF. Orbit and Binaural beat mode are mutually exclusive; Orbit takes precedence if host automation supplies conflicting settings. No additional voices are created.
- **Reverb Amount / Size** use independent mono delay networks, after spatialization and before master Level. Natural releases leave tails. Pause/STOP fades and clears the effect. No delay signal crosses between ears. Size describes decay character, not an exact duration.
- **Hemisphere Spread** separates the displayed geometry before rotation and widens normal-mode audio. Drag to rotate; picking follows projected positions. Spread does not replace Head Orbit Depth or alter strict Binaural channel routing.

## Presets

The compact preset row provides a name field and asynchronous **SAVE PRESET / LOAD PRESET** file dialogs. Files contain 33 musical controls in the shared version-1 `cortex65-preset` JSON format. Field run/pause, phases, pending events and effect buffers are not stored. Native exports root in Hz; browser roots import to the nearest MIDI note from 24 to 84. Complete older 30-control presets receive Orbit defaults off / .07 / .7. A partial Orbit triplet rejects. Complete canonical factory files without the format marker remain supported.

Malformed, missing, wrong-type, nonfinite, out-of-range or oversized files (over 256 KiB) reject before any control changes. Unknown fields are cleanly ignored. Valid imports preserve field transport and current phases. File dialogs cancel safely on editor closure.

Advanced provides **LOAD D MAJOR DRIFT**, also host program 1, and **RANDOMIZE DRIFT / PROJECTION**. Randomization changes only those two controls. Factory recall preserves field transport and phases while applying the patch's explicit Pulses/Bed settings. DAW session-state recall remains available; older sessions default the appended Orbit controls safely. There are 34 AU parameters, with Orbit's three parameters appended after the earlier parameter order.

## Build from source

From the repository root, initialize the pinned JUCE submodule for a Git checkout (source archives may already contain it):

```sh
git submodule update --init --recursive
cmake -S native -B native/build -DCMAKE_BUILD_TYPE=Release -DCMAKE_OSX_DEPLOYMENT_TARGET=12.0 -DCMAKE_OSX_ARCHITECTURES=arm64
cmake --build native/build --config Release -j 2
ctest --test-dir native/build --output-on-failure
```

JUCE defaults to `third_party/JUCE`; an existing installation can be selected with `-DJUCE_PATH=/absolute/path/to/JUCE`. Minimum deployment target is macOS 12, arm64. Products:

- `native/build/Cortex65_artefacts/Release/AU/CORTEX 65.component`
- `native/build/Cortex65_artefacts/Release/Standalone/CORTEX 65.app`

Bundle ID is `com.pixelrecords.cortex65`; AU identity is `aumu / Cx65 / Pxrc`. Local builds sign ad hoc and never automatically install. The recommended public 0.3.0 distribution is separately Developer ID signed, Apple notarized and stapled; see `../dist/releases/0.3.0-notarized.json`. Ad-hoc local signing is not notarization. See the repository license and third-party notices before redistribution.

## Verification and limits

Eight test targets cover phase dynamics, finite propagation, voice limits, tuning, actual binaural audio, reverb, preset files/interoperability, Head Orbit timing/direction and sample-rate stress, processor state/MIDI, and compiled AU factory rendering. Audio callback allocation checks are included. AU registration needs macOS AudioComponent service access; restrictive sandboxes may skip the wrapper check. Native OS file-dialog interaction is not automated; the same file operations and validation methods are exercised by tests.

The simulation and pulse clock run on a wall-clock worker. Use real-time recording/bounce: accelerated offline bounce is not supported accurately. There is no host-tempo synchronization. Controls persist; exact stochastic performances do not. The host tail hint is 62 seconds, while repeated pulses or Continuous Bed can continue indefinitely. Physical headphone listening, individual spatial perception and user DAW acceptance are separate from automated checks.

Anatomy comes from the licensed BodyParts3D source-derived samples; provenance and adaptation records are in `Assets/ATTRIBUTION.md` and `Assets/provenance.json`, and copied into built bundles. This is a musical oscillator instrument, not a biological simulation or clinical reconstruction. Historical local evidence files are development artifacts and are not required for public source builds.

Release packaging checks the actual Mach-O deployment target with `vtool -show-build`; the CMake cache alone is not evidence of the shipped minimum OS. Use a clean build directory or explicitly pass the deployment target when reusing a cache.
