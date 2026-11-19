import type {
  AgentSkillSpecification,
  CanonicalReferenceLink,
  DesignStyleBlueprint,
  MonarchMasterManifest,
  OpenMediaLibraryItem,
  SubAgentSpecification,
} from '../../src/types/monarch.ts';

export interface MonarchRostrConfig {
  name: string;
  slug: string;
  mission: string;
  mcpProtocolVersion: '2026-07-28';
  mcpServers: string[];
  skills: string[];
  acp: {
    version: '1.0';
    a2aCompatible: boolean;
    peers: string[];
  };
  reasoning: {
    provider: 'gemini' | 'anthropic' | 'openai' | 'ollama';
    model: string;
  };
  substrate: {
    provider: 'cloudflare-context-engine';
    hybridRetrieval: boolean;
    ragDalCredibility: boolean;
  };
}

export const MONARCH_GITHUB_REPO = 'https://github.com/diamitani/monarch-video';
export const MONARCH_LOOM_WALKTHROUGH_URL =
  'https://www.loom.com/share/bc62e599848648bf933ad3c06727a091';
export const MONARCH_LOOM_EMBED_URL =
  'https://www.loom.com/embed/bc62e599848648bf933ad3c06727a091';

export const monarchRostrConfig: MonarchRostrConfig = {
  name: 'monarch-video-agent',
  slug: 'monarch-video-agent',
  mission:
    'Transform natural-language creative briefs, brand documents, and open-source/Composio media libraries into studio-grade, editable B-roll video montages through 4-stage PAL intent compilation, 7-sub-agent Google ADK orchestration, and deterministic HyperFrames/Remotion/FFmpeg MP4 rendering.',
  mcpProtocolVersion: '2026-07-28',
  mcpServers: [
    'composio-github',
    'composio-google-drive',
    'composio-youtube',
    'composio-slack',
    'composio-notion',
    'composio-pexels',
    'composio-pixabay',
    'composio-wikimedia',
    'composio-openverse',
    'composio-coverr',
  ],
  skills: [
    'video-env-bootstrap',
    'pal-video-compiler',
    'brand-identity-extractor',
    'artistic-director-suite',
    'broll-montage-engine',
    'editor-json-translator',
    'hermes-self-improver',
  ],
  acp: {
    version: '1.0',
    a2aCompatible: true,
    peers: [
      'monarch_video_orchestrator',
      'pal_intent_compiler',
      'brand_kit_guardian',
      'artistic_director_suite',
      'broll_montage_harvester',
      'editor_json_translator',
      'hermes_covenant_auditor',
    ],
  },
  reasoning: {
    provider: 'gemini',
    model: 'gemini-4-hydrogen',
  },
  substrate: {
    provider: 'cloudflare-context-engine',
    hybridRetrieval: true,
    ragDalCredibility: true,
  },
};

export const MONARCH_SOUL_MD = `# MONARCH VIDEO AGENT — SOUL.md
Repository Base: ${MONARCH_GITHUB_REPO}
Walkthrough Reference: ${MONARCH_LOOM_WALKTHROUGH_URL}
Architecture: Google ADK (@google/adk v2.5.0) + ROSTR 6-Layer Open Protocol + Hermes Self-Improving Loop

## 1. Identity & Essence
You are Monarch, an executive film director, commercial montage editor, and deterministic programmatic video engineer. You direct rhythm, contrast, sound design, brand fidelity, and visual authority.
Emblem: Two mirrored lions forming a butterfly silhouette beneath a crown in Royal Blue (#102D69) and Satin Metallic Gold (#D4AF37) on Alabaster Studio Surfaces (#FAFBFD).

## 2. Core Artistic Convictions (The Monarch Doctrine)
1. Montage Over Static Slides: Every scene breathes with real moving HD B-roll footage (1.5s-3.5s sub-cut cadence), optical dolly/pan movement, measured contrast scrims, and crisp transitions (hard-cut, whip-pan, gold-wipe, zoom-punch).
2. Sacred Brand Fidelity: Uploaded brand guideline documents (.pdf, .md, .txt, .json) and logos (.png, .svg, .jpg, .webp) are automatically extracted via multimodal Gemini and synced into the top watermark bar, lower-thirds, and closing brand outro card.
3. Dataset-Grounded Cinematography: Ground camera framing and cut cadence in CineBoard3D, Film Shots Dataset, CyberAgent Crello Animation, MuSS, and MoCap-VCMotion priors.
4. 4-Source Open Media Mastery: Harvest B-roll across (1) Curated Same-Origin HD MP4 Cinema Plates (/assets/broll/*.mp4), (2) Creator-Uploaded Video Clips & Logos, (3) Open-Source & Composio Media Platforms (Pexels, Pixabay, Wikimedia Commons, Openverse, Coverr), and (4) Programmatic Motion (HyperFrames HTML/GSAP, Remotion TSX, OpenMontage, Google Veo 3.1).
5. Continuous Self-Improvement (Hermes Loop): Every creator edit and pacing feedback updates the active JSON Cinema Style Blueprint and records an episodic lesson in the ROSTR ContextEngine.
`;

export const MONARCH_COVENANT_MD = `# Monarch Video Agent Covenant

## Article I — Objective
Transform natural-language creative requests, uploaded brand documents/logos, and multi-platform B-roll libraries into studio-grade, editable B-roll video montages through 4-stage PAL intent compilation, 7-sub-agent Google ADK orchestration, and deterministic HyperFrames, Remotion, WebM, and FFmpeg H.264 MP4 rendering.

## Article II — Capabilities & 7-Sub-Agent Hierarchy
- Orchestrates 7 specialized sub-agents across Google ADK and Open ACP 1.0:
  1. monarch_video_orchestrator (Root Executive Router)
  2. pal_intent_compiler (4-Stage PAL Intent & Runtime Architect)
  3. brand_kit_guardian (Multimodal Brand Doc & Logo Auto-Synchronizer)
  4. artistic_director_suite (Treatment, Storyboard, Script & Gemini 3.8 TTS Director)
  5. broll_montage_harvester (4-Source B-Roll & JSON Style Blueprint Choreographer)
  6. editor_json_translator (Universal Timeline JSON, HyperFrames, Remotion & FFmpeg MP4 Compiler)
  7. hermes_covenant_auditor (Guardrail Gatekeeper & Self-Improving Memory Loop)
- Exposes 16 deterministic tools across both Google ADK FunctionTool and Stateless MCP 2026-07-28.

## Article III — Non-Negotiable Constitutional Guardrails
- Retired Provider Prohibition: Never wire deprecated endpoints (e.g., retired OpenAI Sora API, discontinued September 24, 2026); deterministically route generative video to Google Veo 3.1, Runway Gen-4.5, Kling 4.0, or LTX-2.5.
- Remotion Commercial License Gate: Enforce Remotion commercial license check for organizations with >3 employees; default to Apache-2.0 HyperFrames and MIT OpenMontage for zero-royalty commercial renders.
- Composio Namespace Enforcement: Utilize composio-* prefixed MCP servers exclusively for external integrations.
- Strict Schema & Non-Destructive Diff Invariant: Validate Universal Video Timeline JSON (schemaVersion 1.0.0) before invoking any render target, and preserve untouched scene nodes during conversational edits.
- Server-Side Secret Isolation: Never expose or request secret API keys in the browser client.
`;

export const MONARCH_SYSTEM_PROMPT = `You are the Monarch Video Agent, an executive creative director, commercial B-roll montage editor, and programmatic video engineer operating within the Google ADK + ROSTR 6-layer open-protocol framework.

Your constitutional identity is governed by SOUL.md and COVENANT.md:
1. Run 4-Stage PAL (Parse Data, Semantic Analysis, Create Hypothesis, Rewrite Prompt) via pal_intent_compiler to clarify intent and select the optimal runtime (HyperFrames, Remotion, or Hybrid with Veo 3.1 / Runway Gen-4.5 / Kling 4.0 / LTX-2.5).
2. Extract and synchronize any uploaded Brand Document or Logo via brand_kit_guardian (rendering custom logoUrl in watermarks and outros).
3. Direct Artistic Pre-Production via artistic_director_suite: Project Brief, Cinema Style Blueprint, Video Treatment, CineBoard3D-grounded Storyboard, Time-Coded Script, and Gemini 3.8 TTS narration.
4. Harvest multi-shot 1.5s-3.5s B-roll sub-cuts across Curated HD MP4s, User Uploads, Pexels, Pixabay, Wikimedia Commons, and Openverse via broll_montage_harvester.
5. Compile validated Universal Video Timeline JSON into HyperFrames HTML/GSAP, Remotion TSX, WebM, and FFmpeg H.264 MP4 via editor_json_translator, while logging self-improving lessons via hermes_covenant_auditor.

Guardrail: Never route generative video to retired OpenAI Sora endpoints (discontinued Sept 24, 2026).
External MCP connectors: composio-github, composio-google-drive, composio-youtube, composio-slack, composio-notion, composio-pexels, composio-pixabay, composio-wikimedia, composio-openverse, composio-coverr.`;

export const MONARCH_ROSTR_CONFIG_TS = `// ROSTR Configuration — Monarch Video Agent (7 Sub-Agents · 16 Tools)
export default {
  name: "monarch-video-agent",
  repositoryBase: "${MONARCH_GITHUB_REPO}",
  mcpProtocolVersion: "2026-07-28",
  mcpServers: [
    "composio-github",
    "composio-google-drive",
    "composio-youtube",
    "composio-slack",
    "composio-notion",
    "composio-pexels",
    "composio-pixabay",
    "composio-wikimedia",
    "composio-openverse",
    "composio-coverr"
  ],
  skills: [
    "video-env-bootstrap",
    "pal-video-compiler",
    "brand-identity-extractor",
    "artistic-director-suite",
    "broll-montage-engine",
    "editor-json-translator",
    "hermes-self-improver"
  ],
  acp: {
    version: "1.0",
    a2aCompatible: true,
    peers: [
      "monarch_video_orchestrator",
      "pal_intent_compiler",
      "brand_kit_guardian",
      "artistic_director_suite",
      "broll_montage_harvester",
      "editor_json_translator",
      "hermes_covenant_auditor"
    ]
  },
  reasoning: {
    provider: "gemini",
    model: "gemini-4-hydrogen"
  }
};
`;

export const CURATED_BROLL_LIBRARY: OpenMediaLibraryItem[] = [
  {
    id: 'broll-studio-architecture-dolly',
    title: 'Royal Architectural Light Dolly',
    platform: 'curated-hd',
    mediaType: 'video',
    url: '/assets/broll/studio-architecture-dolly.mp4',
    durationSec: 4,
    author: 'Monarch Cinema Unit',
    license: 'CC0 / Monarch Studio Native HD',
    tags: ['architecture', 'studio', 'royal', 'dolly', 'launch', 'brand'],
  },
  {
    id: 'broll-hardware-macro-brass',
    title: 'Anamorphic Brushed Brass Hardware Macro',
    platform: 'curated-hd',
    mediaType: 'video',
    url: '/assets/broll/hardware-macro-brass.mp4',
    durationSec: 4,
    author: 'Monarch Cinema Unit',
    license: 'CC0 / Monarch Studio Native HD',
    tags: ['hardware', 'macro', 'brass', 'gold', 'product', 'luxury'],
  },
  {
    id: 'broll-atelier-craft-pan',
    title: 'Atelier Editorial Craft Lateral Pan',
    platform: 'curated-hd',
    mediaType: 'video',
    url: '/assets/broll/atelier-craft-pan.mp4',
    durationSec: 4,
    author: 'Monarch Cinema Unit',
    license: 'CC0 / Monarch Studio Native HD',
    tags: ['atelier', 'craft', 'editorial', 'design', 'pan', 'story'],
  },
  {
    id: 'broll-optical-desk-precision',
    title: 'Optical Precision Instrument Desk',
    platform: 'curated-hd',
    mediaType: 'video',
    url: '/assets/broll/optical-desk-precision.mp4',
    durationSec: 4,
    author: 'Monarch Cinema Unit',
    license: 'CC0 / Monarch Studio Native HD',
    tags: ['optical', 'precision', 'tech', 'saas', 'metrics', 'desk'],
  },
  {
    id: 'broll-royal-navy-light-sweep',
    title: 'Deep Royal Navy Horizon Light Sweep',
    platform: 'curated-hd',
    mediaType: 'video',
    url: '/assets/broll/royal-navy-light-sweep.mp4',
    durationSec: 4,
    author: 'Monarch Cinema Unit',
    license: 'CC0 / Monarch Studio Native HD',
    tags: ['navy', 'light', 'cinema', 'sweep', 'mood', 'documentary'],
  },
  {
    id: 'broll-satin-gold-anamorphic',
    title: 'Satin Gold Anamorphic Flare Finisher',
    platform: 'curated-hd',
    mediaType: 'video',
    url: '/assets/broll/satin-gold-anamorphic.mp4',
    durationSec: 4,
    author: 'Monarch Cinema Unit',
    license: 'CC0 / Monarch Studio Native HD',
    tags: ['gold', 'anamorphic', 'outro', 'finisher', 'crest', 'reveal'],
  },
];

export const DEFAULT_STYLE_BLUEPRINTS: DesignStyleBlueprint[] = [
  {
    id: 'style-rapid-hardware-drop',
    name: 'Rapid Hardware & Product Drop',
    archetype: 'Apple / Teenage Engineering Montage',
    description:
      'High-velocity 1.5s-2.0s macro hardware sub-cuts with crisp hard cuts, whip-pans, and high-contrast anamorphic grade.',
    shotCadenceSec: [1.5, 2.0, 1.5, 2.0],
    cutRhythm: 'rapid-montage',
    transitionPack: ['hard-cut', 'whip-pan', 'zoom-punch', 'gold-wipe'],
    colorGrade: {
      name: 'Anamorphic Brass Contrast',
      cssFilter: 'contrast(1.14) saturate(1.08) brightness(0.96)',
      scrimCss: 'linear-gradient(180deg, rgba(6,13,30,0.30) 0%, rgba(6,13,30,0.82) 100%)',
    },
    typographyRules: {
      headlineMaxWords: 6,
      placement: 'lower-left',
      lowerThirdStyle: 'Satin Gold Hairline Rule + Tabular Index',
    },
    musicBpmRange: [116, 128],
    usageCount: 42,
    ratingScore: 96,
    learnedNotes: [
      '1.5s opening macro hook increases scene retention.',
      'Pair hard cuts on B-roll sub-shots with staggered 120ms headline reveals.',
    ],
  },
  {
    id: 'style-royal-brand-anthem',
    name: 'Monarch Royal Brand Anthem',
    archetype: 'Leica / Porsche Editorial Monograph',
    description:
      'Measured 2.5s-3.0s architectural dolly shots with satin-gold wipes, warm low-register cello pulse, and centered regal typography.',
    shotCadenceSec: [2.5, 3.0, 2.5],
    cutRhythm: 'kinetic-editorial',
    transitionPack: ['gold-wipe', 'hard-cut', 'zoom-punch'],
    colorGrade: {
      name: 'Royal Architectural Grade',
      cssFilter: 'contrast(1.08) saturate(1.05) brightness(0.98)',
      scrimCss: 'linear-gradient(180deg, rgba(9,26,62,0.28) 0%, rgba(7,17,38,0.84) 100%)',
    },
    typographyRules: {
      headlineMaxWords: 8,
      placement: 'center',
      lowerThirdStyle: 'Architectural Glass Plate + Gold Crest',
    },
    musicBpmRange: [88, 102],
    usageCount: 64,
    ratingScore: 98,
    learnedNotes: [
      'Always anchor final 4s outro on custom brand logo mark.',
      'Maintain -14 dB ducking under Kore documentary narration.',
    ],
  },
  {
    id: 'style-kinetic-saas-launch',
    name: 'Kinetic SaaS & AI Launch',
    archetype: 'Linear / Stripe Release Film',
    description:
      'Crisp 2.0s multi-angle product & optical desk cuts with razor-sharp metric callouts and zero visual clutter.',
    shotCadenceSec: [2.0, 2.0, 2.0],
    cutRhythm: 'rapid-montage',
    transitionPack: ['hard-cut', 'gold-wipe', 'whip-pan'],
    colorGrade: {
      name: 'Prism Optical Cobalt',
      cssFilter: 'contrast(1.12) saturate(1.10) hue-rotate(-4deg)',
      scrimCss: 'linear-gradient(180deg, rgba(11,18,32,0.32) 0%, rgba(11,18,32,0.85) 100%)',
    },
    typographyRules: {
      headlineMaxWords: 7,
      placement: 'lower-left',
      lowerThirdStyle: 'Tabular Metric Callout + Clean Rule',
    },
    musicBpmRange: [108, 122],
    usageCount: 38,
    ratingScore: 95,
    learnedNotes: [
      'Alternate macro hardware B-roll with clean metric callout frames.',
    ],
  },
  {
    id: 'style-documentary-cinema-noir',
    name: 'Documentary Cinema Noir',
    archetype: 'A24 / Criterion Short Documentary',
    description:
      'Deliberate 3.0s-3.5s atmospheric shots with subtle 1.06x optical dolly settle, felt piano score, and high-contrast editorial captions.',
    shotCadenceSec: [3.0, 3.5, 3.0],
    cutRhythm: 'measured-cinema',
    transitionPack: ['hard-cut', 'zoom-punch'],
    colorGrade: {
      name: 'Cinema Lens Noir',
      cssFilter: 'contrast(1.18) saturate(0.88) sepia(0.08)',
      scrimCss: 'linear-gradient(180deg, rgba(5,10,20,0.35) 0%, rgba(5,10,20,0.88) 100%)',
    },
    typographyRules: {
      headlineMaxWords: 9,
      placement: 'lower-left',
      lowerThirdStyle: 'Minimal Documentary Timecode Rule',
    },
    musicBpmRange: [76, 90],
    usageCount: 27,
    ratingScore: 94,
    learnedNotes: [
      'Use Fenrir or Charon voice persona for deeper documentary resonance.',
    ],
  },
];

export const MONARCH_SUB_AGENTS: SubAgentSpecification[] = [
  {
    id: 'monarch_video_orchestrator',
    name: 'Monarch Executive Orchestrator',
    role: 'Root Google ADK LlmAgent & ACP 1.0 Executive Router',
    layer: 'ROSTR Layer 4 & 5 (ACP 1.0 + Closed-Loop NPAO Harness)',
    model: 'gemini-4-hydrogen',
    systemInstruction:
      'Coordinate the 7-sub-agent video production pipeline, enforce SOUL.md and COVENANT.md invariants, manage ADK session/artifact state, and synthesize final director delivery.',
    tools: [
      'composio_video_bootstrap',
      'composio_runtime_route',
      'composio_context_search',
      'composio_media_connector',
      'extract_brand_identity',
      'create_treatment',
      'create_storyboard',
      'create_script',
      'harvest_broll_montage',
      'compile_style_blueprint',
      'create_agent_json',
      'render_mp4_video',
      'select_voiceover',
      'select_audio',
      'select_animations',
      'select_video',
      'verify_covenant_compliance',
    ],
    skills: [
      'video-env-bootstrap',
      'pal-video-compiler',
      'brand-identity-extractor',
      'artistic-director-suite',
      'broll-montage-engine',
      'editor-json-translator',
      'hermes-self-improver',
    ],
    workflowSteps: [
      {
        step: 1,
        phase: 'Intake & Context Grounding',
        action: 'Query Layer 1 ContextEngine for brand identity, dataset priors, and active style blueprint.',
        verificationGate: 'ContextEngine returns >= 3 grounded records with trustScore >= 0.90.',
      },
      {
        step: 2,
        phase: 'Sequential Sub-Agent Delegation',
        action: 'Route through PAL -> Brand Guardian -> Artistic Director -> B-Roll Harvester -> Timeline Translator.',
        verificationGate: 'Each sub-agent emits an OpenTelemetry trace span with status === OK.',
      },
      {
        step: 3,
        phase: 'Covenant Audit & Delivery',
        action: 'Run hermes_covenant_auditor to verify schema, guardrails, and playable B-roll / MP4 artifacts.',
        verificationGate: 'validateUniversalTimeline.valid === true && zero retired-Sora endpoints.',
      },
    ],
    inputContract: 'PALInput | TimelineEditRequest | BrandExtractionRequest',
    outputContract: 'Complete VideoProject bundle (PALOutput, ArtisticPreProduction, UniversalVideoTimeline, CompiledTargets, MP4/WebM)',
  },
  {
    id: 'pal_intent_compiler',
    name: 'PAL Intent & Runtime Architect',
    role: '4-Stage PAL Framework & Runtime Router',
    layer: 'ROSTR Layer 2 (PAL Compiler + Reasoning Adapter)',
    model: 'gemini-4-hydrogen',
    systemInstruction:
      'Execute 4-Stage PAL (Parse Data -> Semantic Analysis -> Create Hypothesis -> Master Creative Prompt) and select HyperFrames, Remotion, or Hybrid Veo 3.1 runtime.',
    tools: ['composio_video_bootstrap', 'composio_runtime_route', 'composio_context_search'],
    skills: ['video-env-bootstrap', 'pal-video-compiler'],
    workflowSteps: [
      {
        step: 1,
        phase: 'Stage 1: Parse Data',
        action: 'Extract explicit topic, aspect ratio, duration, target platform, and brand kit parameters.',
        verificationGate: 'All required PALInput fields normalized.',
      },
      {
        step: 2,
        phase: 'Stage 2 & 3: Semantic Analysis & Hypothesis',
        action: 'Determine pacing, visual grammar, optimal runtime, license advisory, and USD/token cost breakdown.',
        verificationGate: 'Retired OpenAI Sora blocked; Remotion >3 employees license gate checked.',
      },
      {
        step: 3,
        phase: 'Stage 4: Rewrite Master Prompt',
        action: 'Produce executive masterCreativePrompt ready for pre-production.',
        verificationGate: 'masterCreativePrompt length >= 40 chars.',
      },
    ],
    inputContract: 'PALInput',
    outputContract: 'PALOutput',
  },
  {
    id: 'brand_kit_guardian',
    name: 'Brand Kit & Logo Guardian',
    role: 'Multimodal Brand Document & Logo Auto-Synchronizer',
    layer: 'ROSTR Layer 1 & 2 (Multimodal Gemini + RAG DAL Brand Memory)',
    model: 'gemini-4-hydrogen',
    systemInstruction:
      'Analyze uploaded brand documents (.pdf, .md, .txt, .json) and logos (.png, .svg, .jpg, .webp) to extract and synchronize hex colors, font pairings, brand voice, and logoUrl across all scenes.',
    tools: ['extract_brand_identity', 'composio_context_search'],
    skills: ['brand-identity-extractor'],
    workflowSteps: [
      {
        step: 1,
        phase: 'Multimodal Asset Inspection',
        action: 'Inspect image inlineData or document textContent via Gemini multimodal extraction.',
        verificationGate: 'Valid MIME type and non-empty payload.',
      },
      {
        step: 2,
        phase: 'Palette & Logo Normalization',
        action: 'Extract primaryColor, accentColor, surfaceColor, fontPairing, tagline, and attach logoUrl if image.',
        verificationGate: 'All color tokens match 6-digit hex format (#RRGGBB).',
      },
      {
        step: 3,
        phase: 'Timeline & Cloud Sync',
        action: 'Sync extracted BrandKit into active project timeline and Firestore defaultBrandKit.',
        verificationGate: 'Timeline watermark and outro reflect active BrandKit.',
      },
    ],
    inputContract: '{ name, mimeType, dataUrl?, textContent?, currentBrandKit? }',
    outputContract: '{ brandKit: BrandKit, summary: string, confidence: number }',
  },
  {
    id: 'artistic_director_suite',
    name: 'Artistic Pre-Production Director',
    role: 'Treatment, Storyboard, Script & Gemini 3.8 TTS Director',
    layer: 'ROSTR Layer 2 & 3 (Creative Tools + Gemini v1beta TTS)',
    model: 'gemini-4-hydrogen + gemini-3.8-flash-lite-tts',
    systemInstruction:
      'Produce executive Video Treatment, CineBoard3D-grounded Storyboard, Time-Coded Script & Cue Sheet, and real 24kHz WAV voiceover narration.',
    tools: ['create_treatment', 'create_storyboard', 'create_script', 'select_voiceover', 'select_audio'],
    skills: ['artistic-director-suite'],
    workflowSteps: [
      {
        step: 1,
        phase: 'Treatment & Brief',
        action: 'Author logline, visual mood, lighting/motion rules, and soundscape direction.',
        verificationGate: 'Treatment aligns with PAL emotionalArc and BrandKit.',
      },
      {
        step: 2,
        phase: 'Storyboard & Script Alignment',
        action: 'Generate 4-6 storyboard scene cards and time-coded script cues using CineBoard3D and MuSS priors.',
        verificationGate: 'Sum of scene durations equals project totalDurationSec.',
      },
      {
        step: 3,
        phase: 'Voiceover & Score Synthesis',
        action: 'Synthesize 24kHz WAV narration via gemini-3.8-flash-lite-tts and set -14 dB Web Audio score ducking.',
        verificationGate: 'Valid RIFF/WAVE header and non-zero PCM payload.',
      },
    ],
    inputContract: '{ pal: PALOutput, brandKit: BrandKit, templateId: string }',
    outputContract: 'ArtisticPreProduction + VoiceoverClip[]',
  },
  {
    id: 'broll_montage_harvester',
    name: '4-Source B-Roll Montage Harvester',
    role: 'Multi-Platform Open Media Connector & Montage Sub-Cut Choreographer',
    layer: 'ROSTR Layer 3 (Composio Media Hub + Style Blueprint Compiler)',
    model: 'gemini-4-hydrogen',
    systemInstruction:
      'Harvest moving B-roll video footage across Curated HD MP4s, User Uploads, Pexels, Pixabay, Wikimedia Commons, and Openverse, slicing scenes into 1.5s-3.5s montage sub-cuts.',
    tools: [
      'harvest_broll_montage',
      'composio_media_connector',
      'compile_style_blueprint',
      'select_animations',
      'select_video',
    ],
    skills: ['broll-montage-engine'],
    workflowSteps: [
      {
        step: 1,
        phase: 'Style Blueprint Loading',
        action: 'Load shotCadenceSec, transitionPack, and colorGrade from active DesignStyleBlueprint.',
        verificationGate: 'shotCadenceSec values between 1.0s and 5.0s.',
      },
      {
        step: 2,
        phase: '4-Source Media Harvesting',
        action: 'Match scene visual prompts against User Uploaded videos, Curated HD MP4s, and Composio media search.',
        verificationGate: 'Every scene receives 2-3 playable B-roll sub-cuts.',
      },
      {
        step: 3,
        phase: 'Transition & Grade Assignment',
        action: 'Assign alternating kenBurns vectors (dolly-in, pan-left, pan-right, pull-back) and cut transitions.',
        verificationGate: 'All brollShots within a scene sum to scene.durationSec.',
      },
    ],
    inputContract: '{ scenes, styleBlueprint, availableMedia, userUploadedVideos }',
    outputContract: 'TimelineScene[] with populated brollShots: BRollShot[]',
  },
  {
    id: 'editor_json_translator',
    name: 'Universal Timeline & MP4 Compiler',
    role: 'Deterministic JSON Validator, HyperFrames/Remotion Compiler & FFmpeg MP4 Renderer',
    layer: 'ROSTR Layer 3 & 5 (Deterministic Execution & Non-Destructive Diffs)',
    model: 'gemini-4-hydrogen',
    systemInstruction:
      'Validate Universal Video Timeline JSON (schemaVersion 1.0.0), execute non-destructive conversational diffs, compile HyperFrames HTML/GSAP and Remotion TSX, and render H.264 MP4 via FFmpeg.',
    tools: ['create_agent_json', 'render_mp4_video'],
    skills: ['editor-json-translator'],
    workflowSteps: [
      {
        step: 1,
        phase: 'Schema Validation',
        action: 'Validate UniversalVideoTimeline structure, timecodes, brollShots, and brandKit tokens.',
        verificationGate: 'validateUniversalTimeline(timeline).valid === true.',
      },
      {
        step: 2,
        phase: 'Multi-Target Code Compilation',
        action: 'Compile standalone HyperFrames HTML/GSAP and Remotion TSX with <video> B-roll and <img src="logoUrl">.',
        verificationGate: 'Both compiled targets contain active brand colors, B-roll clips, and scene headlines.',
      },
      {
        step: 3,
        phase: 'FFmpeg H.264 MP4 Rendering',
        action: 'Stitch B-roll sub-cuts, apply color grade and brand overlays, and encode libx264 yuv420p MP4 via /usr/bin/ffmpeg.',
        verificationGate: 'Generated .mp4 file exists, sizeBytes > 10000, and plays natively in HTML5 <video>.',
      },
    ],
    inputContract: 'UniversalVideoTimeline + EditInstruction?',
    outputContract: 'CompiledTargets + TimelinePatchResult + RenderedMP4Artifact',
  },
  {
    id: 'hermes_covenant_auditor',
    name: 'Hermes Self-Improving & Covenant Auditor',
    role: 'Infallibility Gatekeeper, Style Blueprint Learner & Skill Synthesizer',
    layer: 'ROSTR Layer 1, 5 & 6 (Hermes Loop + OpenTelemetry Audit)',
    model: 'gemini-4-hydrogen',
    systemInstruction:
      'Audit all pipeline outputs against COVENANT.md, adapt Cinema Style Blueprints from creator feedback, and synthesize promoted skills into ContextEngine.',
    tools: ['verify_covenant_compliance'],
    skills: ['hermes-self-improver'],
    workflowSteps: [
      {
        step: 1,
        phase: 'Constitutional Invariant Audit',
        action: 'Verify retired-Sora block, Remotion license gate, Composio prefixes, and Timeline JSON validity.',
        verificationGate: 'All 12 verification checks pass (overallPassed === true).',
      },
      {
        step: 2,
        phase: 'Style Blueprint Weight Adaptation',
        action: 'Adjust shotCadenceSec and ratingScore when creators trigger feedback ("cut-faster", "love-pacing").',
        verificationGate: 'Updated blueprint persisted in memory and ContextEngine.',
      },
      {
        step: 3,
        phase: 'Episodic Skill Promotion',
        action: 'Record episode trace and synthesize reusable SKILL.md candidate for human promotion.',
        verificationGate: 'Episode logged with extracted lessons.',
      },
    ],
    inputContract: 'EpisodeInput | BlueprintFeedbackInput',
    outputContract: 'VerificationSuiteReport + HermesEpisode + SkillCandidate',
  },
];

export const MONARCH_SKILLS_REGISTRY: AgentSkillSpecification[] = [
  {
    id: 'video-env-bootstrap',
    name: 'Sub-Skill A: Environment & Provider Bootstrap',
    purpose:
      'Probes Node, NPX, and /usr/bin/ffmpeg binaries, verifies HyperFrames/OpenMontage/Remotion readiness, and enforces the 2026 retired-Sora guardrail.',
    modulePath: '/agent/skills/video-env-bootstrap.ts',
    subAgentsUsing: ['monarch_video_orchestrator', 'pal_intent_compiler'],
    toolsExposed: ['composio_video_bootstrap', 'composio_runtime_route', 'select_video'],
    workflowSteps: [
      'Probe local CLI binaries (node, npx, ffmpeg) via child_process.',
      'Audit active generative video providers and block retired OpenAI Sora endpoints.',
      'Select optimal runtime (HyperFrames Apache-2.0, OpenMontage MIT, or Remotion with license check).',
    ],
    infallibilityCheck: 'assertActiveVideoProvider("openai-sora") throws deterministic redirect to Google Veo 3.1.',
  },
  {
    id: 'pal-video-compiler',
    name: 'Sub-Skill B: 4-Stage PAL Intent Compiler',
    purpose:
      'Compiles raw natural-language video requests into structured 4-stage PAL briefs with cost estimation and master creative prompts.',
    modulePath: '/agent/skills/pal-video-compiler.ts',
    subAgentsUsing: ['monarch_video_orchestrator', 'pal_intent_compiler'],
    toolsExposed: ['composio_runtime_route'],
    workflowSteps: [
      'Stage 1 (Parse Data): Normalize aspect ratio, duration, platform, and brand inputs.',
      'Stage 2 (Semantic Analysis): Determine audience persona, emotional arc, and pacing.',
      'Stage 3 (Hypothesis): Compute token/USD cost estimate and select render runtime.',
      'Stage 4 (Rewrite Prompt): Generate executive masterCreativePrompt.',
    ],
    infallibilityCheck: 'compilePALIntent always returns valid 4-stage PALOutput even under upstream LLM fallback.',
  },
  {
    id: 'brand-identity-extractor',
    name: 'Sub-Skill C1: Multimodal Brand Doc & Logo Synchronizer',
    purpose:
      'Extracts structured BrandKit (hex palette, typography, brand voice, tagline, and logoUrl) from uploaded logos or brand documents.',
    modulePath: '/agent/skills/editor-json-translator.ts',
    subAgentsUsing: ['brand_kit_guardian', 'monarch_video_orchestrator'],
    toolsExposed: ['extract_brand_identity'],
    workflowSteps: [
      'Accept uploaded image (.png, .svg, .jpg, .webp) or brand doc (.pdf, .md, .txt, .json).',
      'Analyze via multimodal Gemini 4 Hydrogen to extract hex colors, font pairing, and tagline.',
      'Bind uploaded image data URL directly to brandKit.logoUrl for watermark and outro rendering.',
    ],
    infallibilityCheck: 'Extracted hex codes always validate against /^#[0-9A-Fa-f]{6}$/ with Royal/Gold fallback.',
  },
  {
    id: 'artistic-director-suite',
    name: 'Sub-Skill C2: Artistic Pre-Production & Gemini TTS Director',
    purpose:
      'Generates studio treatment, CineBoard3D-grounded storyboard, time-coded script, and 24kHz Gemini 3.8 TTS WAV narration.',
    modulePath: '/agent/skills/artistic-director-suite.ts',
    subAgentsUsing: ['artistic_director_suite', 'monarch_video_orchestrator'],
    toolsExposed: ['create_treatment', 'create_storyboard', 'create_script', 'select_voiceover', 'select_audio'],
    workflowSteps: [
      'Generate Project Brief and Video Treatment grounded in Layer 1 dataset priors.',
      'Build shot-by-shot Storyboard and aligned time-coded Script & Cue Sheet.',
      'Synthesize 24kHz WAV voiceover via gemini-3.8-flash-lite-tts on v1beta endpoint.',
    ],
    infallibilityCheck: 'Voiceover WAV buffer contains valid 44-byte RIFF/WAVE header + 24kHz mono PCM audio.',
  },
  {
    id: 'broll-montage-engine',
    name: 'Sub-Skill D1: 4-Source B-Roll Montage & Style Blueprint Engine',
    purpose:
      'Slices scenes into 1.5s-3.5s moving B-roll sub-cuts across Curated HD MP4s, User Uploads, Pexels, Pixabay, Wikimedia Commons, and Openverse.',
    modulePath: '/agent/skills/editor-json-translator.ts',
    subAgentsUsing: ['broll_montage_harvester', 'monarch_video_orchestrator'],
    toolsExposed: ['harvest_broll_montage', 'composio_media_connector', 'compile_style_blueprint', 'select_animations'],
    workflowSteps: [
      'Apply active DesignStyleBlueprint shotCadenceSec, transitionPack, and CSS colorGrade.',
      'Assign 2-3 moving B-roll video sub-cuts per scene from the 4-source media pool.',
      'Reverse-engineer new JSON Cinema Style Blueprints from creator reference briefs.',
    ],
    infallibilityCheck: 'Every TimelineScene contains >= 2 playable brollShots with valid .mp4 URLs.',
  },
  {
    id: 'editor-json-translator',
    name: 'Sub-Skill D2: Universal Timeline Compiler, Diff Patcher & FFmpeg MP4 Renderer',
    purpose:
      'Compiles Universal Video Timeline JSON into HyperFrames HTML/GSAP, Remotion TSX, and real H.264 MP4 video files via /usr/bin/ffmpeg.',
    modulePath: '/agent/skills/editor-json-translator.ts',
    subAgentsUsing: ['editor_json_translator', 'monarch_video_orchestrator'],
    toolsExposed: ['create_agent_json', 'render_mp4_video'],
    workflowSteps: [
      'Validate UniversalVideoTimeline schemaVersion 1.0.0.',
      'Compile standalone HyperFrames HTML/GSAP and Remotion TSX code artifacts.',
      'Apply non-destructive conversational diffs while preserving untouched scenes.',
      'Execute /usr/bin/ffmpeg to stitch B-roll sub-cuts into a downloadable H.264 MP4 file.',
    ],
    infallibilityCheck: 'FFmpeg MP4 render produces playable H.264 yuv420p video with +faststart flag.',
  },
  {
    id: 'hermes-self-improver',
    name: 'Sub-Skill E: Hermes Self-Improving Loop & Covenant Auditor',
    purpose:
      'Captures episodic lessons, adapts style blueprint pacing weights from creator feedback, and promotes reusable skills into ContextEngine.',
    modulePath: '/agent/skills/hermes-self-improver.ts',
    subAgentsUsing: ['hermes_covenant_auditor', 'monarch_video_orchestrator'],
    toolsExposed: ['verify_covenant_compliance'],
    workflowSteps: [
      'Seed Hugging Face & Kaggle cinematography dataset priors into Layer 1 ContextEngine.',
      'Reflect on production & edit episodes to extract reusable pacing/design lessons.',
      'Update DesignStyleBlueprint shotCadenceSec on creator feedback and promote verified skills.',
    ],
    infallibilityCheck: '12-point verification suite validates all 6 ROSTR layers, ADK services, B-roll, and MP4 pipeline.',
  },
];

export const MONARCH_CANONICAL_REFERENCES: CanonicalReferenceLink[] = [
  {
    id: 'ref-monarch-github',
    title: 'Monarch Video Base Repository (diamitani/monarch-video)',
    category: 'repository',
    url: MONARCH_GITHUB_REPO,
    license: 'MIT / Apache-2.0',
    integrationRole: 'Canonical architecture base for Monarch Video Agent, SOUL.md, COVENANT.md, and multi-agent studio.',
  },
  {
    id: 'ref-monarch-loom',
    title: 'Monarch Studio Product Walkthrough (Loom)',
    category: 'repository',
    url: MONARCH_LOOM_WALKTHROUGH_URL,
    license: 'First-Party Walkthrough',
    integrationRole: 'Embedded video walkthrough accessible in Marketing Site and Studio Workspace.',
  },
  {
    id: 'ref-hyperframes',
    title: 'HyperFrames HTML/CSS/GSAP Video Engine',
    category: 'engine',
    url: 'https://github.com/heygen-com/hyperframes',
    license: 'Apache-2.0',
    integrationRole: 'Primary deterministic HTML5/GSAP programmatic video compiler target.',
  },
  {
    id: 'ref-openmontage',
    title: 'OpenMontage Agentic Video Pipeline',
    category: 'engine',
    url: 'https://github.com/calesthio/OpenMontage',
    license: 'MIT',
    integrationRole: 'Open-source montage grading, optical camera vectors, and B-roll stitching pipeline.',
  },
  {
    id: 'ref-remotion',
    title: 'Remotion React Programmatic Video Framework',
    category: 'engine',
    url: 'https://github.com/remotion-dev/remotion',
    license: 'Remotion License (Free <=3 employees)',
    integrationRole: 'Secondary React TSX compilation target (<AbsoluteFill>, <OffthreadVideo>, spring()).',
  },
  {
    id: 'ref-google-adk',
    title: 'Google Agent Development Kit (@google/adk)',
    category: 'protocol',
    url: 'https://github.com/google/adk-js',
    license: 'Apache-2.0',
    integrationRole: 'Core LlmAgent, SequentialAgent, FunctionTool, Runner, Session, Artifact, and Memory runtime.',
  },
  {
    id: 'ref-mcp-2026',
    title: 'Model Context Protocol (Stateless JSON-RPC 2026-07-28)',
    category: 'protocol',
    url: 'https://modelcontextprotocol.io',
    license: 'Open Specification',
    integrationRole: 'Layer 3 tool transport exposing all 16 creative, montage, brand, and Composio tools.',
  },
  {
    id: 'ref-dataset-cineboard3d',
    title: 'CineBoard3D & Film Shots Cinematography Priors',
    category: 'dataset',
    url: 'https://huggingface.co/datasets',
    license: 'CC-BY-4.0',
    integrationRole: 'Seeded in Layer 1 ContextEngine for shot scale progression (WS -> MS -> ECU) and 3D camera blocking.',
  },
  {
    id: 'ref-dataset-crello',
    title: 'CyberAgent Crello Animation & MoCap-VCMotion Priors',
    category: 'dataset',
    url: 'https://huggingface.co/datasets/cyberagent/crello',
    license: 'Apache-2.0',
    integrationRole: 'Governs 120ms kinetic typography stagger, power3.out easing, and non-colliding B-roll cuts.',
  },
  {
    id: 'ref-composio-media',
    title: 'Composio & Open-Source Media Platforms (Pexels, Pixabay, Wikimedia, Openverse)',
    category: 'media-hub',
    url: 'https://commons.wikimedia.org/w/api.php',
    license: 'CC0 / Public Domain / Pexels & Pixabay Open License',
    integrationRole: 'Live 4-source video & audio harvesting across public-domain and open media libraries.',
  },
];

export const MONARCH_MASTER_MANIFEST: MonarchMasterManifest = {
  version: '2.5.0-infallible',
  repositoryBase: MONARCH_GITHUB_REPO,
  loomWalkthroughUrl: MONARCH_LOOM_WALKTHROUGH_URL,
  soulMd: MONARCH_SOUL_MD,
  covenantMd: MONARCH_COVENANT_MD,
  masterOneSheeterMd: `# MONARCH VIDEO — MASTER AGENT ONE-SHEETER
Repository Base: ${MONARCH_GITHUB_REPO}
Walkthrough: ${MONARCH_LOOM_WALKTHROUGH_URL}

## 1. Executive Architecture
- **Runtime**: Google ADK (@google/adk v2.5.0) + ROSTR 6-Layer Stack (ContextEngine, PALCompiler, MCP 2026-07-28, Open ACP 1.0 + A2A, Closed-Loop NPAO Harness, 6th-Agent Meta-Builder) + Hermes Self-Improving Loop.
- **7 Specialized Sub-Agents**:
  1. monarch_video_orchestrator (Root Executive Router)
  2. pal_intent_compiler (4-Stage PAL Intent & Runtime Architect)
  3. brand_kit_guardian (Multimodal Brand Doc & Logo Auto-Synchronizer)
  4. artistic_director_suite (Treatment, Storyboard, Script & Gemini 3.8 TTS Director)
  5. broll_montage_harvester (4-Source B-Roll & JSON Style Blueprint Choreographer)
  6. editor_json_translator (Universal Timeline JSON, HyperFrames, Remotion & FFmpeg H.264 MP4 Compiler)
  7. hermes_covenant_auditor (Infallibility Gatekeeper & Self-Improving Memory Loop)
- **16 Deterministic ADK & MCP Tools**:
  create_treatment, create_storyboard, create_script, create_agent_json, select_voiceover, select_audio, select_animations, select_video, extract_brand_identity, harvest_broll_montage, compile_style_blueprint, render_mp4_video, verify_covenant_compliance, composio_video_bootstrap, composio_runtime_route, composio_media_connector.
- **4-Source B-Roll Montage & In-App H.264 MP4 Rendering**:
  Combines (1) Curated Local HD MP4 Cinema Plates (/assets/broll/*.mp4), (2) Creator-Uploaded Video Clips & Brand Logos, (3) Live Open-Source & Composio Media Hub (Pexels, Pixabay, Wikimedia Commons, Openverse), and (4) Programmatic Motion into real H.264 .mp4 (via /usr/bin/ffmpeg), .webm, HyperFrames HTML/GSAP, and Remotion TSX.`,
  systemInstructionsMd: MONARCH_SYSTEM_PROMPT,
  orchestrationWorkflowsMd: `# MONARCH 7-SUB-AGENT ORCHESTRATION WORKFLOWS
1. Intake & Context Retrieval -> Layer 1 ContextEngine hybrid RRF query (brand rules + HF/Kaggle priors + style blueprint).
2. Stage 1 PAL Compilation -> pal_intent_compiler runs Parse -> Analyze -> Hypothesize -> Master Prompt.
3. Stage 2 Brand & Logo Sync -> brand_kit_guardian extracts hex palette, fonts, tagline, and logoUrl from uploaded docs/logos.
4. Stage 3 Artistic Pre-Production -> artistic_director_suite produces Treatment, Storyboard, Script, and 24kHz Gemini 3.8 TTS WAV voiceover.
5. Stage 4 4-Source B-Roll Harvesting -> broll_montage_harvester slices scenes into 1.5s-3.5s moving video sub-cuts using active JSON Cinema Style Blueprint.
6. Stage 5 Multi-Target & MP4 Compilation -> editor_json_translator compiles UniversalVideoTimeline JSON, HyperFrames HTML, Remotion TSX, and stitches real H.264 .mp4 via /usr/bin/ffmpeg.
7. Stage 6 Covenant & Hermes Audit -> hermes_covenant_auditor verifies all 12 invariants and updates style blueprint weights from creator feedback.`,
  referenceManifestMd: MONARCH_CANONICAL_REFERENCES.map(
    (r) => `- **${r.title}** (${r.category} · ${r.license}): ${r.url}\n  Role: ${r.integrationRole}`
  ).join('\n'),
  subAgents: MONARCH_SUB_AGENTS,
  skills: MONARCH_SKILLS_REGISTRY,
  registeredTools: [
    {
      name: 'create_treatment',
      category: 'creative-direction',
      description: 'Draft studio video treatment, project brief, visual mood, and soundscape direction.',
      subAgentOwner: 'artistic_director_suite',
    },
    {
      name: 'create_storyboard',
      category: 'creative-direction',
      description: 'Generate shot-by-shot storyboard grounded in CineBoard3D and Film Shots priors.',
      subAgentOwner: 'artistic_director_suite',
    },
    {
      name: 'create_script',
      category: 'creative-direction',
      description: 'Create time-coded voiceover script, kinetic headlines, and SFX/music cue sheet.',
      subAgentOwner: 'artistic_director_suite',
    },
    {
      name: 'create_agent_json',
      category: 'broll-montage',
      description: 'Compile and validate Universal Video Timeline JSON + HyperFrames HTML/GSAP + Remotion TSX.',
      subAgentOwner: 'editor_json_translator',
    },
    {
      name: 'select_voiceover',
      category: 'audio-voice',
      description: 'Synthesize real 24kHz Gemini 3.8 TTS WAV narration (Kore, Puck, Charon, Fenrir, Zephyr).',
      subAgentOwner: 'artistic_director_suite',
    },
    {
      name: 'select_audio',
      category: 'audio-voice',
      description: 'Select royalty-free procedural Web Audio underscore preset and -14 dB voice ducking.',
      subAgentOwner: 'artistic_director_suite',
    },
    {
      name: 'select_animations',
      category: 'broll-montage',
      description: 'Select HyperFrames GSAP choreography preset informed by Crello Animation priors.',
      subAgentOwner: 'broll_montage_harvester',
    },
    {
      name: 'select_video',
      category: 'broll-montage',
      description: 'Select OpenMontage visual grade preset and enforce 2026 generative video provider guardrails.',
      subAgentOwner: 'broll_montage_harvester',
    },
    {
      name: 'extract_brand_identity',
      category: 'brand-intelligence',
      description: 'Extract hex palette, font pairing, tagline, brand voice, and logoUrl from uploaded brand docs or logos.',
      subAgentOwner: 'brand_kit_guardian',
    },
    {
      name: 'harvest_broll_montage',
      category: 'broll-montage',
      description: 'Slice scenes into 1.5s-3.5s moving B-roll video sub-cuts across all 4 media sources.',
      subAgentOwner: 'broll_montage_harvester',
    },
    {
      name: 'compile_style_blueprint',
      category: 'broll-montage',
      description: 'Reverse-engineer or update a reusable JSON Cinema Style Blueprint (shot cadence, transitions, grade).',
      subAgentOwner: 'broll_montage_harvester',
    },
    {
      name: 'render_mp4_video',
      category: 'broll-montage',
      description: 'Render downloadable H.264 MP4 video (libx264, yuv420p, +faststart) via server /usr/bin/ffmpeg.',
      subAgentOwner: 'editor_json_translator',
    },
    {
      name: 'verify_covenant_compliance',
      category: 'governance',
      description: 'Verify timeline schema, retired-Sora guardrail, Remotion license gate, and Composio MCP namespaces.',
      subAgentOwner: 'hermes_covenant_auditor',
    },
    {
      name: 'composio_video_bootstrap',
      category: 'composio-mcp',
      description: 'Inspect Node, NPX, FFmpeg binaries, open-source engines, and 2026 model adapters.',
      subAgentOwner: 'pal_intent_compiler',
    },
    {
      name: 'composio_runtime_route',
      category: 'composio-mcp',
      description: 'Select optimal programmatic render runtime and enforce 2026 provider & license gates.',
      subAgentOwner: 'pal_intent_compiler',
    },
    {
      name: 'composio_media_connector',
      category: 'composio-mcp',
      description: 'Search and import B-roll video & audio across Curated HD, Pexels, Pixabay, Wikimedia Commons, and Openverse.',
      subAgentOwner: 'broll_montage_harvester',
    },
  ],
  references: MONARCH_CANONICAL_REFERENCES,
};
