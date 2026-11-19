# OpenMontage, HyperFrames & Open-Source Video Pipelines Reference

## 1. OpenMontage (`https://github.com/OpenMontageInc/OpenMontage`)
OpenMontage is an MIT-licensed agentic video production pipeline that pairs structured scene plans with deterministic programmatic rendering and CLIP-indexed royalty-free stock retrieval.

### Core Visual Presets Wired in Monarch (`select_video`)
- **`royal-architectural`**: Deep Royal Blue (`#102D69`) + Satin Gold (`#D4AF37`) architectural planes, subtle radial skylight glow, crisp geometric framing.
- **`cinema-lens-noir`**: Honed charcoal slate (`#0A0F1C`) + warm brushed brass (`#D4AF37`) rim lighting inspired by anamorphic hardware films.
- **`alabaster-editorial`**: Gallery-grade alabaster (`#FAFBFD`) + ink slate (`#0F172A`) high-legibility Swiss editorial plates.
- **`prism-optical`**: Cool cobalt-indigo (`#13224A`) + luminous sapphire accents for technical SaaS explainers and data storytelling.

## 2. HyperFrames CLI (`Apache-2.0`)
- Deterministic HTML5 / CSS / GSAP 3.12+ / SVG / Lottie / Three.js video composition engine.
- Exposes `window.__HYPERFRAMES_SEEK__(sec)` plus `postMessage({ type: 'monarch-seek' | 'monarch-play' | 'monarch-pause', sec })` for live embedded sandboxed iframe preview and frame-accurate Puppeteer/Chromium MP4/WebM export.
- Zero commercial seat restrictions (recommended default over Remotion for teams >3 employees).

### GSAP Choreography Packs Wired in Monarch (`select_animations`)
- **`kinetic-editorial`**: Smooth `power3.out` vertical headline rise (`y: 36 -> 0`) + synchronized gold hairline draw.
- **`satin-gold-wipe`**: Horizontal editorial clip-path reveal with satin-gold leading rule.
- **`architectural-split`**: Asymmetric two-column glide (`x: -28 -> 0`) tuned for SaaS explainers and spec callouts.
- **`cinematic-zoom`**: Subtle Ken Burns optical settle (`scale: 1.06 -> 1.0`) tailored for documentary and luxury product films.

## 3. Free Audio & Human Voiceover Stack
- **Voiceover (`select_voiceover`)**: Real server-side **Gemini 3.8 TTS** (`gemini-3.8-flash-lite-tts` & `gemini-3.8-flash-tts`) producing studio 24kHz mono 16-bit WAV clips with selectable voices (`Kore`, `Puck`, `Charon`, `Fenrir`, `Zephyr`) and natural director style cues.
- **Music & SFX (`select_audio`)**: Zero-dependency procedural **Web Audio API** studio score synthesizer (`cello-ostinato`, `felt-piano`, `minimal-pulse`, `ambient-glass`) with automatic `-14 dB` ducking during active narration.
