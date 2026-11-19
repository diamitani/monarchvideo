# MONARCH VIDEO — MASTER AGENT ONE-SHEETER
**Executive Architecture, 7 Sub-Agents, 16 Tools, 6 Skills, Workflows & Reference Registry**  
**Base Repository**: `https://github.com/diamitani/monarch-video`  
**Walkthrough Video**: `https://www.loom.com/share/bc62e599848648bf933ad3c06727a091`

---

## 1. Executive Summary
Monarch Video is a full-stack autonomous video production studio and multi-agent backend running on **Google ADK (`@google/adk` v2.5.0)** and the **ROSTR 6-Layer Open Protocol Stack**, persisted via **Firebase Auth & Firestore** and monetized via **Stripe Checkout**. It transforms raw natural-language briefs, uploaded brand documents/logos, and multi-platform B-roll footage into real H.264 `.mp4`, `.webm`, **HyperFrames HTML/GSAP**, and **Remotion TSX** video montages.

---

## 2. The 6-Layer ROSTR + Google ADK Stack
| Layer | Module | Responsibility | Verification Invariant |
| :--- | :--- | :--- | :--- |
| **Layer 1: Context & Memory** | `ContextEngine` (`agent/rostr/context-engine.ts`) | Hybrid BM25 + Vector RRF retrieval, RAG DAL trust scoring, HF/Kaggle dataset priors, and pinned `SOUL.md` / `COVENANT.md` records | `totalRecords >= 8`, top match returns active covenant & priors |
| **Layer 2: Intent & Reasoning** | `PALCompiler` + `ReasoningAdapter` (`agent/rostr/pal-compiler.ts`) | 4-stage PAL compilation (*Parse → Analyze → Hypothesize → Rewrite*) via `gemini-4-hydrogen` with automatic `gemini-3.1-flash-lite` failover | Deterministic JSON schema + cost & runtime selection |
| **Layer 3: Tool Protocol** | `MCPServer` (`agent/rostr/mcp-protocol.ts`) | Stateless JSON-RPC 2.0 (`2026-07-28`) exposing all **16 tools** with `composio-*` namespace enforcement | `tools/list` & `tools/call` pass JSON-RPC 2.0 compliance |
| **Layer 4: Multi-Agent Mesh** | `ACPRouter` (`agent/rostr/acp-protocol.ts`) | Open ACP 1.0 + A2A `/.well-known/agent.json` discovery across all **7 sub-agents** | All 7 sub-agents discoverable and callable via ACP runs |
| **Layer 5: Closed-Loop Harness** | `NPAOHarness` + `TraceLogger` (`agent/rostr/npao-harness.ts`) | Closed-loop *Navigate → Plan → Act → Observe* execution with OpenTelemetry trace spans | Every pipeline run emits structured trace spans (`status: OK`) |
| **Layer 6: Portable Meta-Builder** | `SixthAgentMetaBuilder` (`agent/rostr/meta-builder.ts`) | Compiles portable ROSTR + ADK agent bundles (`SOUL.md`, `COVENANT.md`, `rostr.config.ts`) | Exports valid 6-file portable agent blueprint |

---

## 3. The 7 Sub-Agents & Step-by-Step Workflows

### Sub-Agent 1: `monarch_video_orchestrator` (Root Executive Router)
- **Model**: `gemini-4-hydrogen` (via `@google/adk` `LlmAgent` + `Runner`)
- **Tools**: All 16 registered ADK & MCP tools
- **Workflow**:
  1. Receive user prompt, brand kit, media assets, or edit diff instruction.
  2. Query Layer 1 `ContextEngine` for brand covenant rules, HF/Kaggle priors, and active Cinema Style Blueprint.
  3. Delegate sequential production across Sub-Agents 2 → 6, or route targeted conversational edits directly to Sub-Agent 6 (`editor_json_translator`).
  4. Invoke Sub-Agent 7 (`hermes_covenant_auditor`) to log episodic traces and verify output invariants.

### Sub-Agent 2: `pal_intent_compiler` (Intent & Runtime Architect)
- **Skill**: `pal-video-compiler` (`agent/skills/pal-video-compiler.ts`)
- **Tools**: `composio_video_bootstrap`, `composio_runtime_route`, `composio_context_search`
- **Workflow**:
  1. **Parse Data**: Extract topic, aspect ratio (`16:9`, `9:16`, `1:1`), duration, platform, and explicit brand inputs.
  2. **Semantic Analysis**: Classify deliverable category, audience persona, emotional arc, and pacing rhythm.
  3. **Create Hypothesis**: Select optimal runtime (`hyperframes`, `remotion`, or `hybrid-veo-hyperframes`), enforce the 2026 retired-Sora guardrail and Remotion license gate, and compute token/USD cost breakdown.
  4. **Rewrite Prompt**: Synthesize the executive `masterCreativePrompt`.

### Sub-Agent 3: `brand_kit_guardian` (Multimodal Brand & Logo Synchronizer)
- **Skill**: `brand-identity-extractor` (`agent/skills/editor-json-translator.ts` + `/api/brand/extract`)
- **Tools**: `extract_brand_identity`, `composio_context_search`
- **Workflow**:
  1. Ingest uploaded logo (`.png`, `.svg`, `.jpg`, `.webp`) or brand guideline doc (`.pdf`, `.md`, `.txt`, `.json`).
  2. Run multimodal Gemini extraction to identify `brandName`, `tagline`, `primaryColor`, `accentColor`, `surfaceColor`, `fontPairing`, `brandVoice`, and `logoUrl`.
  3. Present in **"Confirm & Sync"** banner or auto-sync directly into active `UniversalVideoTimeline` and Firestore `users/{uid}.defaultBrandKit`.

### Sub-Agent 4: `artistic_director_suite` (Pre-Production & Audio Director)
- **Skill**: `artistic-director-suite` (`agent/skills/artistic-director-suite.ts`)
- **Tools**: `create_treatment`, `create_storyboard`, `create_script`, `select_voiceover`, `select_audio`
- **Workflow**:
  1. Draft structured **Project Brief** and **Video Treatment** (logline, lighting, soundscape, voiceover direction).
  2. Construct **Shot-by-Shot Storyboard** grounded in `CineBoard3D` and `Film Shots` camera framing priors.
  3. Author time-coded **Script & Cue Sheet** with kinetic headlines and SFX cues.
  4. Synthesize real 24kHz WAV narration via `gemini-3.8-flash-lite-tts` (`Kore`, `Puck`, `Charon`, `Fenrir`, `Zephyr`) and configure `-14 dB` ducked Web Audio score.

### Sub-Agent 5: `broll_montage_harvester` (4-Source B-Roll & Style Choreographer)
- **Skill**: `broll-montage-engine` (`agent/skills/editor-json-translator.ts`)
- **Tools**: `harvest_broll_montage`, `composio_media_connector`, `compile_style_blueprint`, `select_animations`, `select_video`
- **Workflow**:
  1. Load the active **JSON Cinema Style Blueprint** (`shotCadenceSec`, `cutRhythm`, `transitionPack`, `colorGrade`).
  2. Search across all 4 B-roll tiers: Curated local HD `.mp4` clips (`/assets/broll/*.mp4`), User Uploads, live Composio/open-source libraries (Pexels, Pixabay, Wikimedia Commons, Openverse), and Veo 3.1 / programmatic plates.
  3. Slice each timeline scene into `1.5s–3.5s` multi-shot `brollShots` with alternating `dolly-in`, `pan-left`, `pan-right`, and `pull-back` motion and crisp transitions (`hard-cut`, `whip-pan`, `gold-wipe`, `zoom-punch`).

### Sub-Agent 6: `editor_json_translator` (Timeline Compiler & FFmpeg MP4 Renderer)
- **Skill**: `editor-json-translator` (`agent/skills/editor-json-translator.ts`)
- **Tools**: `create_agent_json`, `render_mp4_video`
- **Workflow**:
  1. Assemble and validate canonical `UniversalVideoTimeline` JSON (`schemaVersion: 1.0.0`).
  2. Compile standalone **HyperFrames HTML/GSAP** (with `<video>` B-roll montage layers + custom `<img src="logoUrl">` watermark/outro) and **Remotion TSX** (`<AbsoluteFill>`, `<OffthreadVideo>`, `spring()`).
  3. Execute non-destructive conversational diffs on follow-up edits (`patchTimelineWithInstruction`).
  4. Render downloadable **H.264 `.mp4`** via server-side `/usr/bin/ffmpeg` (`libx264`, `yuv420p`, `+faststart`) and client 24fps Canvas `.webm` compositor.

### Sub-Agent 7: `hermes_covenant_auditor` (Self-Improvement & Infallibility Gatekeeper)
- **Skill**: `hermes-self-improver` (`agent/skills/hermes-self-improver.ts`)
- **Tools**: `verify_covenant_compliance`
- **Workflow**:
  1. Audit every run against `COVENANT.md` (retired-Sora block, Remotion license gate, Composio prefix, timeline schema validity).
  2. Capture creator pacing feedback (*"Sharper cuts"*, *"Love this pacing"*) to tighten or relax `shotCadenceSec` on the active `DesignStyleBlueprint`.
  3. Synthesize reusable `SKILL.md` candidates for human-in-the-loop promotion into the ROSTR `ContextEngine`.

---

## 4. Complete 16-Tool Registry (Google ADK `FunctionTool` + MCP `2026-07-28`)
| # | Tool Name | Category | Owner Sub-Agent | Purpose |
| :- | :--- | :--- | :--- | :--- |
| 1 | `create_treatment` | Creative Direction | `artistic_director_suite` | Draft studio project brief, logline, visual mood, lighting, and soundscape plan |
| 2 | `create_storyboard` | Creative Direction | `artistic_director_suite` | Generate CineBoard3D-grounded shot-by-shot storyboard cards |
| 3 | `create_script` | Creative Direction | `artistic_director_suite` | Author time-coded voiceover script, kinetic headlines, and SFX/music cue sheet |
| 4 | `create_agent_json` | Timeline Compilation | `editor_json_translator` | Build & validate Universal Video Timeline JSON + HyperFrames HTML + Remotion TSX |
| 5 | `select_voiceover` | Audio & Voice | `artistic_director_suite` | Synthesize real 24kHz Gemini 3.8 TTS WAV narration (`Kore`, `Puck`, `Charon`, `Fenrir`, `Zephyr`) |
| 6 | `select_audio` | Audio & Voice | `artistic_director_suite` | Configure procedural Web Audio score preset (`cello-ostinato`, `felt-piano`, etc.) & `-14 dB` ducking |
| 7 | `select_animations` | B-Roll & Montage | `broll_montage_harvester` | Select HyperFrames GSAP choreography preset (`kinetic-editorial`, `satin-gold-wipe`, etc.) |
| 8 | `select_video` | B-Roll & Montage | `broll_montage_harvester` | Select OpenMontage color grade preset & enforce 2026 generative video provider guardrails |
| 9 | `extract_brand_identity` | Brand Intelligence | `brand_kit_guardian` | Multimodal Gemini extraction of hex palette, typography, brand voice, and `logoUrl` from docs/logos |
| 10 | `harvest_broll_montage` | B-Roll & Montage | `broll_montage_harvester` | Populate multi-shot `1.5s–3.5s` B-roll sub-cuts across all 4 sources into timeline scenes |
| 11 | `compile_style_blueprint` | B-Roll & Montage | `broll_montage_harvester` | Reverse-engineer or update a reusable JSON Cinema Style Blueprint with cut cadence & transitions |
| 12 | `render_mp4_video` | Timeline Compilation | `editor_json_translator` | Render H.264 `.mp4` (`libx264`, `yuv420p`, `+faststart`) via `/usr/bin/ffmpeg` from timeline & B-roll |
| 13 | `verify_covenant_compliance` | Governance | `hermes_covenant_auditor` | Audit timeline, providers, and MCP namespaces against `COVENANT.md` invariants |
| 14 | `composio_video_bootstrap` | Composio MCP | `pal_intent_compiler` | Probe Node, NPX, FFmpeg binaries, open-source engines, and 2026 model adapters |
| 15 | `composio_runtime_route` | Composio MCP | `pal_intent_compiler` | Route prompt to optimal render engine and enforce Sora retirement + Remotion license gates |
| 16 | `composio_media_connector` | Composio MCP | `broll_montage_harvester` | Search & import video/audio across Curated HD, Pexels, Pixabay, Wikimedia Commons, and Openverse |

---

## 5. Canonical Reference & Dataset Registry
- **Monarch Video Base Repository**: `https://github.com/diamitani/monarch-video`
- **Monarch Product Walkthrough (Loom)**: `https://www.loom.com/share/bc62e599848648bf933ad3c06727a091`
- **HyperFrames HTML/GSAP Engine (Apache-2.0)**: `https://github.com/heygen-com/hyperframes`
- **OpenMontage Programmatic Cinema Pipeline (MIT)**: `https://github.com/calesthio/OpenMontage`
- **Remotion React Video Framework**: `https://github.com/remotion-dev/remotion`
- **Google Agent Development Kit (`@google/adk`)**: `https://github.com/google/adk-js`
- **Model Context Protocol (`2026-07-28`)**: `https://modelcontextprotocol.io`
- **Hugging Face & Kaggle Priors Seeded in Layer 1 `ContextEngine`**:
  - `CineBoard3D` (3D camera framing & spatial blocking priors)
  - `Film Shots Dataset` (Shot scale distribution: WS / MS / CU / ECU)
  - `cyberagent/crello-animation` (Motion graphics stagger & easing curves)
  - `MuSS` (Multimodal script-to-scene alignment priors)
  - `MoCap-VCMotion` (Camera velocity & optical settle curves)
- **Open-Source & Composio Media Connectors**:
  - `composio-pexels` (`https://www.pexels.com/api/`)
  - `composio-pixabay` (`https://pixabay.com/api/docs/`)
  - `composio-wikimedia` (`https://commons.wikimedia.org/w/api.php`)
  - `composio-openverse` (`https://api.openverse.org/v1/`)
  - `composio-coverr` (`https://coverr.co`)
