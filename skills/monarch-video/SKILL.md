---
name: monarch-video
description: >
  End-to-end agentic video production skill for the Monarch Video app.
  Bootstraps programmatic video engines (HyperFrames, Remotion, OpenMontage,
  FFmpeg), Google ADK runtime services, and BYOK/AI Gateway model adapters;
  runs 4-stage PAL intent extraction; produces artistic pre-production artifacts
  (brief, brand/template selection, treatment, storyboard, script); translates
  specs into Universal Video Timeline JSON; and executes non-destructive
  conversational edits.
---

# Monarch Video

Orchestrate studio-grade, editable programmatic videos from natural language prompts using a four-stage pipeline backed by **Google ADK** (`LlmAgent`, `SequentialAgent`, `SessionService`, `ArtifactService`, `MemoryService`) and the **ROSTR 6-Layer Open-Protocol Stack** (ContextEngine, PAL, Stateless MCP `2026-07-28`, ACP `1.0` / A2A, NPAO Traces).

## Core Architecture and Bundled Reference Files

- `scripts/bootstrap-env.sh`: Runnable environment installer and health checker for Node.js, FFmpeg, HyperFrames CLI (`npx hyperframes check / snapshot / timeline`), Remotion (`npx skills add remotion-dev/skills`), Google ADK, and server-side BYOK / AI Gateway environment variables.
- `references/timeline-schema.md`: Canonical TypeScript interfaces for `UniversalVideoTimeline` and incremental `TimelinePatch`.
- `references/rostr-agent-stack.md`: Plug-and-play ROSTR + Google ADK backend configuration (`covenant.md`, `rostr.config.ts`, `system_prompt.txt`) using Composio MCP servers (`composio-*`).

## Step 1: Bootstrap and Verify Runtime (`video-env-bootstrap`)

Before generating code or renders, verify the execution environment and model adapters:

1. Run `scripts/bootstrap-env.sh` to verify `node`, `ffmpeg`, `npx hyperframes`, `remotion`, and server-configured provider adapters.
2. Select the optimal render runtime:
   - **HyperFrames (Default — Apache 2.0)**: Primary agentic renderer (HTML/CSS/GSAP/Lottie/Three.js via Puppeteer + FFmpeg). Validate compositions with `npx hyperframes check`, inspect frames with `npx hyperframes snapshot --at 0,2,5`, and apply mutations via `npx hyperframes timeline <verb> --plan --json`.
   - **Remotion (Secondary React Renderer)**: React/TypeScript compositions with frame-accurate `useCurrentFrame()` and `spring()`. Install official rules via `npx skills add remotion-dev/skills`. Enforce commercial license check for organizations with more than 3 employees.
   - **OpenMontage Hybrid**: Combine CLIP-indexed stock retrieval (Pexels, Unsplash, Archive.org) or generative video clips with HyperFrames/Remotion compositions.
3. Active 2026 Model Adapters (Server-Side BYOK or Managed AI Gateway):
   - **Google ADK + Gemini / Veo 3.1**: Primary agent runtime, PAL/Artistic compiler (`gemini-4-hydrogen`), native TTS (`gemini-3.8-flash-tts`), music (`lyria-3-clip-preview`), and 4K generative video (`veo-3.1`).
   - **Anthropic Claude**: Optional BYOK scriptwriter and HyperFrames/Remotion code compiler.
   - **OpenAI**: Optional BYOK LLM orchestration, still imagery, and TTS narration.
   - **Optional Media Providers**: Runway Gen-4.5, Kling 4.0, ElevenLabs TTS, and open-weights LTX-2.5.

## Step 2: PAL Intent Extraction (`pal-video-compiler`)

Run every new request through the 4-stage Prompt Abstraction Layer (PAL):
1. **Parse Data**: Extract topic, reference URLs/files, brand logos/colors, aspect ratio (`16:9`, `9:16`, `1:1`), duration, and destination platform.
2. **Semantic Analysis**: Infer target audience persona, emotional arc, pacing, visual grammar, and project classification (`Ad`, `Brand Film`, `Product Launch`, `Explainer`, `Social Short`, `Documentary`).
3. **Create Hypothesis**: Propose the optimal creative strategy, select target render runtime (`hyperframes`, `remotion`, or `hybrid-veo-hyperframes`), and generate a transparent BYOK vs Managed Gateway cost estimate.
4. **Rewrite Original Prompt**: Synthesize a deterministic Master Creative Prompt locking visual, audio, and brand constraints.

## Step 3: Artistic Pre-Production (`artistic-director-suite`)

Produce all 6 editable, versioned artifacts saved via Google ADK `ArtifactService`:
1. Project Brief & Type Classification
2. Template & Brand Kit Selection (Default Monarch Royal Blue `#102D69` & Gold `#D4AF37`, or custom brand tokens)
3. 1-Page Video Treatment
4. Shot-by-Shot Storyboard
5. Aligned Script & Time-Coded Cue Sheet
6. Final Production Prompt + **Human Approval Checkpoint** before compilation or paid rendering.

## Step 4: Timeline JSON Translation & Live Edit Loop (`editor-json-translator`)

1. Emit strict `UniversalVideoTimeline` JSON conforming to `references/timeline-schema.md`.
2. Deterministically compile to **HyperFrames HTML/GSAP** and **Remotion TSX** bundles.
3. **Bi-Directional Conversational Diff Loop**: Run a scoped PAL diff to emit a `TimelinePatch` that mutates ONLY the requested scenes while preserving untouched scenes and incrementing artifact version history.

## Critical 2026 Guardrails

- **Retired Endpoints**: Never wire retired OpenAI Sora endpoints (discontinued April 2026, API shut down September 24, 2026). Always route generative clips to Google Veo 3.1, Runway Gen-4.5, Kling 4.0, or LTX-2.5.
- **Approval Before Impact**: Require explicit user confirmation before paid generative video calls, final high-res renders, or external publishing.
- **Idempotent Edits**: Never regenerate the entire timeline from scratch during conversational edits; patch only targeted scene nodes.
- **Composio MCP Mandate**: Route all external integrations exclusively through `composio-*` MCP servers.
