# Creative Video & Animation Dataset References (Hugging Face & Kaggle)

Monarch Video's ROSTR `ContextEngine` (Layer 1) indexes curated cinematography, storyboard composition, camera trajectory, and motion-graphics priors distilled from open-access Hugging Face and Kaggle creative video datasets.

## Hugging Face Open Creative Datasets
1. **`EngineeringAI-LAB/CineBoard3D`** (Hugging Face)
   - *Domain*: 3D storyboarding, shot-by-shot spatial staging, and multi-shot subject consistency.
   - *Monarch Prior*: Enforces consistent visual framing, eyeline continuity, and spatial anchor rules across consecutive storyboard cards (`create_storyboard`).
2. **`MuSS` — Multi-Shot Subject-to-Video Benchmark** (Hugging Face)
   - *Domain*: Multi-shot narrative assembly, montage pacing, and seamless scene transitions.
   - *Monarch Prior*: Governs scene duration cadence (3–8s per beat), transition pacing (`wipe-gold`, `cross-dissolve`, `cut-crisp`), and subject persistence across shots.
3. **`cyberagent/crello-animation`** (Hugging Face)
   - *Domain*: Graphic design motion templates, kinetic typography entrances, layer staggering, and visual hierarchy.
   - *Monarch Prior*: Calibrates GSAP entrance stagger delays (`0.10s–0.22s`), safe margin geometry, and display-to-body type contrast in `select_animations` and `compileToHyperFramesHtml`.
4. **`fengyee/camera-motion-dataset-and-benchmark` (`cam-motion.jsonl`)** (Hugging Face)
   - *Domain*: Annotated cinematic camera trajectories (dolly-in, crane-up, tracking pan, locked architectural tripod).
   - *Monarch Prior*: Grounds `videoTreatment.lightingAndMotion` and `storyboard[].motionChoreography` with authentic cinematographic camera terms instead of vague motion descriptions.
5. **`gvecchio/MatSynth`** (Hugging Face)
   - *Domain*: Physically-based rendering (PBR) surface textures, lighting roughness, and material aesthetics.
   - *Monarch Prior*: Enriches luxury hardware and architectural B-roll prompts (fluted matte stone, brushed brass, velvet navy, optical glass) for Veo 3.1 & OpenMontage backdrops.

## Kaggle Open Video & Motion Datasets
6. **`Film Shots Dataset`** (Kaggle)
   - *Domain*: Labeled cinematic shot types (ECU, Close-Up, Medium, Wide, Establishing) and cut-boundary grammar.
   - *Monarch Prior*: Balances shot scale progression (Wide Hook -> Medium Detail -> Close-Up Proof -> Symmetrical Outro) across every Monarch storyboard.
7. **`MoCap-VCMotion Dataset`** (Kaggle)
   - *Domain*: Multi-view 3D skeletal motion timing curves and natural easing kinematics.
   - *Monarch Prior*: Informs spring damping ratios (`damping: 18, stiffness: 120`) and easing curves (`power3.out`, `expo.out`) for organic motion feel.
8. **`25K Animation Movies Data` / `52,000 Animation Movie Details`** (Kaggle)
   - *Domain*: Narrative arc structures, loglines, audience pacing benchmarks, and genre tone clusters.
   - *Monarch Prior*: Strengthens `create_treatment` loglines and 3-act emotional arcs for short-form commercials, explainers, and brand films.
