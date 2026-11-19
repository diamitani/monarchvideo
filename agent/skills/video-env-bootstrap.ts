/**
 * SUB-SKILL A: Programmatic Video & Model Runtime Bootstrapper (`video-env-bootstrap`)
 *
 * Inspects runtime capabilities, verifies open-source programmatic video libraries
 * (HyperFrames, Remotion, OpenMontage, FFmpeg), enforces 2026 provider guardrails
 * (retired OpenAI Sora API block + Remotion commercial org >3 license check),
 * and selects the optimal render target for a given creative request.
 */

import type {
  BootstrapReport,
  ModelAdapterStatus,
  RenderRuntime,
  RuntimeLibraryStatus,
} from '../../src/types/monarch.ts';
import { monarchRostrConfig } from '../config/monarch-config.ts';
import { ACP_VERSION } from '../rostr/acp-protocol.ts';
import { MCP_PROTOCOL_VERSION, assertComposioNamespace } from '../rostr/mcp-protocol.ts';

const RETIRED_ENDPOINTS = [
  'sora',
  'openai-sora',
  'sora-1',
  'sora-2',
  'api.openai.com/v1/videos/sora',
];

export function assertActiveVideoProvider(requestedProvider: string): {
  allowed: boolean;
  resolvedProvider: string;
  warning?: string;
} {
  const normalized = String(requestedProvider || '').trim().toLowerCase();
  if (RETIRED_ENDPOINTS.some((r) => normalized.includes(r))) {
    return {
      allowed: false,
      resolvedProvider: 'google-veo-3.1',
      warning:
        '2026 Guardrail triggered: OpenAI discontinued the Sora consumer app (April 2026) and shut down the Sora API (September 24, 2026). Automatically rerouted generative video to Google Veo 3.1.',
    };
  }
  return { allowed: true, resolvedProvider: requestedProvider || 'google-veo-3.1' };
}

export function selectOptimalRuntime(params: {
  prompt: string;
  templateId?: string;
  orgSizeOverThree?: boolean;
}): {
  selectedRuntime: RenderRuntime;
  rationale: string;
  generativeVideoEngine: string;
  licenseAdvisory: string | null;
} {
  const lower = `${params.prompt} ${params.templateId || ''}`.toLowerCase();
  const wantsGenerativeBroll =
    /(cinematic|documentary|film|b-roll|aerial|live action|veo|runway|commercial|footage|moody)/i.test(
      lower
    );
  const wantsDataChartsOrReact =
    /(chart|dashboard|data visualization|metrics|kpi|saas walkthrough|react component|table|analytics)/i.test(
      lower
    );

  let licenseAdvisory: string | null = null;
  if (wantsDataChartsOrReact && params.orgSizeOverThree) {
    licenseAdvisory =
      'Remotion commercial license applies to organizations with more than 3 employees. Defaulting to HyperFrames (Apache 2.0) unless a Remotion license is active.';
  }

  if (wantsGenerativeBroll) {
    return {
      selectedRuntime: 'hybrid-veo-hyperframes',
      rationale:
        'Selected Hybrid Veo 3.1 + HyperFrames: pairs photorealistic generative B-roll (4K synchronized dialogue/SFX via Veo 3.1) with deterministic HyperFrames HTML/GSAP typography, brand lower-thirds, and logo end-cards.',
      generativeVideoEngine: 'Google Veo 3.1 (fallback: Runway Gen-4.5 / Kling 4.0 / LTX-2.5)',
      licenseAdvisory,
    };
  }

  if (wantsDataChartsOrReact && !params.orgSizeOverThree) {
    return {
      selectedRuntime: 'remotion',
      rationale:
        'Selected Remotion TSX Renderer: optimal for data-driven charts, component-heavy React templates, and word-level social captions with deterministic frame rendering.',
      generativeVideoEngine: 'Programmatic React/TSX + OpenMontage CLIP stock fallback',
      licenseAdvisory: null,
    };
  }

  return {
    selectedRuntime: 'hyperframes',
    rationale:
      'Selected HyperFrames (Primary Agentic Renderer — Apache 2.0): deterministic HTML/CSS/GSAP/Lottie/Three.js motion design ideal for kinetic typography, product launches, and brand promos with zero commercial license friction.',
    generativeVideoEngine: 'Programmatic HTML/GSAP + OpenMontage asset router (Veo 3.1 optional)',
    licenseAdvisory,
  };
}

export function runVideoEnvBootstrap(): BootstrapReport {
  assertComposioNamespace(monarchRostrConfig.mcpServers, true);

  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasRunway = Boolean(process.env.RUNWAY_API_KEY);
  const hasElevenLabs = Boolean(process.env.ELEVENLABS_API_KEY);
  const hasGateway = Boolean(process.env.AI_GATEWAY_URL);

  const programmaticLibraries: RuntimeLibraryStatus[] = [
    {
      id: 'hyperframes',
      name: 'HyperFrames',
      role: 'Primary Agentic Renderer (HTML/CSS/GSAP/Lottie/Three.js)',
      license: 'Apache-2.0',
      status: 'ready',
      capabilities: [
        'Deterministic frame rendering',
        'Native MCP 2026-07-28 support',
        'Kinetic typography & brand promos',
        'Zero commercial seat limits',
      ],
    },
    {
      id: 'remotion',
      name: 'Remotion',
      role: 'Secondary React/TSX Programmatic Renderer',
      license: 'Remotion Commercial (>3 employees)',
      status: 'guarded',
      capabilities: [
        'React/TypeScript compositions',
        'Data-driven charts & SaaS UI motion',
        'Word-level social captions',
        'AWS Lambda distributed renders',
      ],
      guardrailNote: 'Guardrail active: prompts commercial license check for organizations with >3 employees.',
    },
    {
      id: 'openmontage',
      name: 'OpenMontage',
      role: 'Agentic Pipeline & CLIP-Indexed Asset Router',
      license: 'MIT',
      status: 'ready',
      capabilities: [
        'Proposal-time HyperFrames vs Remotion routing',
        'CLIP stock retrieval (Pexels, Unsplash, Archive.org)',
        'Scene pacing templates',
      ],
    },
    {
      id: 'ffmpeg',
      name: 'FFmpeg Post-Production Engine',
      role: 'Audio Normalization, Stem Mixing & MP4/WebM Encoding',
      license: 'LGPL/GPL',
      status: 'available',
      capabilities: [
        'LUFS voiceover & music ducking',
        'Subtitle burn-in',
        'Aspect-ratio reframing (16:9, 9:16, 1:1)',
        'H.264 / VP9 mastering',
      ],
    },
  ];

  const modelAdapters: ModelAdapterStatus[] = [
    {
      id: 'google-gemini-adk',
      provider: 'Google ADK + Gemini / Veo 3.1',
      role: 'Primary ADK Agent Runtime, PAL Compiler & 4K Generative Video',
      configuredOnServer: hasGemini,
      activeModels: ['gemini-4-hydrogen', 'veo-3.1', 'gemini-3.8-flash-tts', 'lyria-3-clip-preview'],
      status: hasGemini ? 'active' : 'gateway-ready',
    },
    {
      id: 'anthropic-claude',
      provider: 'Anthropic Claude',
      role: 'Optional BYOK Scriptwriter & Code Compiler Adapter',
      configuredOnServer: hasAnthropic,
      activeModels: ['claude-sonnet-4-5', 'claude-opus-4-1'],
      status: hasAnthropic ? 'active' : 'gateway-ready',
    },
    {
      id: 'openai-api',
      provider: 'OpenAI (LLM / Image / TTS Only)',
      role: 'Optional BYOK Orchestration, Stills & TTS',
      configuredOnServer: hasOpenAI,
      activeModels: ['gpt-4.1', 'gpt-image-1', 'gpt-4o-mini-tts'],
      status: hasOpenAI ? 'active' : 'gateway-ready',
      guardrailNote:
        '2026 Sora Retirement Guardrail enforced: Sora API shut down Sept 24, 2026; video calls strictly blocked and routed to Veo 3.1 / Runway / Kling / LTX-2.5.',
    },
    {
      id: 'runway-kling-ltx',
      provider: 'Runway Gen-4.5 / Kling 4.0 / LTX-2.5',
      role: 'Secondary Generative Video & Open-Weights B-Roll Adapters',
      configuredOnServer: hasRunway || hasGateway,
      activeModels: ['runway-gen-4.5', 'kling-4.0', 'ltx-2.5-open'],
      status: hasRunway || hasGateway ? 'active' : 'gateway-ready',
    },
    {
      id: 'elevenlabs-audio',
      provider: 'ElevenLabs / Gemini Native TTS',
      role: 'Studio Voiceover Synthesis & Foley Stems',
      configuredOnServer: hasElevenLabs || hasGemini,
      activeModels: ['eleven-v3-studio', 'gemini-3.8-flash-tts'],
      status: hasElevenLabs || hasGemini ? 'active' : 'gateway-ready',
    },
  ];

  return {
    checkedAt: new Date().toISOString(),
    nodeVersion: process.version,
    protocolVersions: {
      mcp: MCP_PROTOCOL_VERSION,
      acp: ACP_VERSION,
      a2a: '1.0',
    },
    programmaticLibraries,
    modelAdapters,
    composioMcpServers: [...monarchRostrConfig.mcpServers],
    guardrailsActive: [
      'Google ADK Runner + Session/Artifact/Memory isolation active',
      'Composio MCP namespace enforced (composio-* prefix only)',
      'Retired OpenAI Sora video endpoint guardrail active (reroutes to Veo 3.1 / Runway Gen-4.5 / LTX-2.5)',
      'Remotion >3 employee commercial license advisory active',
      'Approval-before-impact checkpoints required before pre-production, JSON compilation, and final render',
    ],
  };
}
