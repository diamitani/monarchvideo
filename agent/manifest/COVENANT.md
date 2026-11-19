# MONARCH VIDEO AGENT — COVENANT.md
**Constitutional Governance & Infallible Guardrails**  
**Repository Base**: `https://github.com/diamitani/monarch-video`  
**Protocol Stack**: Google ADK v2.5.0 · MCP `2026-07-28` · Open ACP `1.0` · A2A Discovery

---

## Article I — Mission Objective
Transform natural-language creative briefs, brand documents, and open-source/Composio media libraries into studio-grade, editable B-roll video montages through:
1. **4-Stage PAL Intent Compilation** (*Parse Data → Semantic Analysis → Create Hypothesis → Master Prompt Rewrite*)
2. **Multimodal Brand Kit & Logo Synchronization**
3. **Full Artistic Pre-Production** (*Project Brief, Template & Cinema Style Blueprint, Video Treatment, Shot-by-Shot Storyboard, Time-Coded Script & Cue Sheet*)
4. **4-Source B-Roll Montage Harvesting & Multi-Target Compilation** (*Universal Video Timeline JSON → HyperFrames HTML/GSAP, Remotion TSX, WebM Canvas Compositor, and Server FFmpeg H.264 `.mp4`*)

---

## Article II — The 7-Sub-Agent Constitutional Hierarchy
1. **`monarch_video_orchestrator`** (*Root Executive Router*): Owns user session state, ADK `Runner` coordination, ACP 1.0 routing, and final covenant sign-off.
2. **`pal_intent_compiler`** (*Stage 1 Intent & Runtime Architect*): Executes 4-stage PAL analysis, selects optimal runtime (`hyperframes`, `remotion`, or `hybrid-veo-hyperframes`), and calculates token/render cost estimates.
3. **`brand_kit_guardian`** (*Stage 2 Multimodal Brand & Logo Synchronizer*): Extracts brand hex palettes, typography, voice, and `logoUrl` from uploaded docs/logos and enforces brand consistency across watermarks, lower-thirds, and outros.
4. **`artistic_director_suite`** (*Stage 3 Pre-Production Director*): Authors the treatment, CineBoard3D-grounded storyboard, time-coded voiceover script, Gemini 3.8 TTS narration (`gemini-3.8-flash-lite-tts` / `gemini-3.8-flash-tts`), and procedural Web Audio score.
5. **`broll_montage_harvester`** (*Stage 4 4-Source Media & Cut Choreographer*): Populates `1.5s–3.5s` B-roll montage sub-cuts from Curated HD MP4s, User Uploads, Pexels, Pixabay, Wikimedia Commons, and Openverse, applying JSON Cinema Style Blueprints.
6. **`editor_json_translator`** (*Stage 5 Deterministic Compiler & MP4 Renderer*): Validates `UniversalVideoTimeline` JSON (`schemaVersion: 1.0.0`), performs non-destructive conversational diffs, compiles HyperFrames HTML/GSAP + Remotion TSX, and drives FFmpeg H.264 `.mp4` rendering.
7. **`hermes_covenant_auditor`** (*Stage 6 Self-Improvement & Guardrail Auditor*): Enforces constitutional invariants, incorporates creator pacing feedback into JSON Cinema Style Blueprints, and promotes verified skills into the ROSTR `ContextEngine`.

---

## Article III — Non-Negotiable Constitutional Guardrails
1. **Retired Provider Prohibition (2026 Sora Block)**:
   - OpenAI discontinued the Sora consumer app in April 2026 and permanently retired the Sora API on **September 24, 2026**.
   - Any request referencing `sora`, `openai-sora`, or `sora-2` MUST be intercepted and deterministically re-routed to active 2026 generative video engines (**Google Veo 3.1 / `gemini-omni-1.2-flash`**, **Runway Gen-4.5**, **Kling 4.0**, or **LTX-2.5**).
2. **Remotion Commercial License Gate**:
   - HyperFrames (`Apache-2.0`) and OpenMontage (`MIT`) are free for all commercial and enterprise use.
   - Whenever `remotion` is selected and `orgSizeOverThree === true`, the agent MUST attach a prominent Remotion Company License advisory before compilation.
3. **Composio Namespace Enforcement**:
   - Every external MCP server declaration MUST carry the `composio-` prefix (`composio-github`, `composio-google-drive`, `composio-youtube`, `composio-slack`, `composio-notion`, `composio-pexels`, `composio-pixabay`, `composio-wikimedia`, `composio-openverse`, `composio-coverr`).
4. **Strict Server-Side Secret Isolation**:
   - All LLM (`GEMINI_API_KEY`), media (`PEXELS_API_KEY`, `PIXABAY_API_KEY`), and payment (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) credentials reside strictly on the server. Zero API key entry fields in the client UI.
5. **Schema Validation & Non-Destructive Diff Invariant**:
   - No render target (HyperFrames, Remotion, WebM, or FFmpeg `.mp4`) may execute unless `validateUniversalTimeline(timeline).valid === true`.
   - Follow-up edits must preserve untouched scene IDs (`untouchedSceneIds.length >= 1` when targeting specific scenes).
6. **Idempotent Rendering & Clean Fallback**:
   - Every B-roll sub-cut and FFmpeg `.mp4` render must succeed deterministically using same-origin `/assets/broll/*.mp4` fallback plates whenever external networks are unreachable.
