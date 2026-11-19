/**
 * MONARCH VIDEO BACKEND AGENT — GOOGLE ADK (`@google/adk`) + COMPLETE ROSTR 6-LAYER RUNTIME
 *
 * Unifies:
 * - Google ADK (`LlmAgent`, `SequentialAgent`, `FunctionTool`, `Runner`,
 *   `InMemorySessionService`, `InMemoryArtifactService`, `InMemoryMemoryService`, `Gemini`)
 * - ROSTR Layer 1: `ContextEngine` (Hybrid RRF + RAG DAL + HF/Kaggle Dataset Priors + Hermes SOUL)
 * - ROSTR Layer 2: `PALCompiler` + `ReasoningAdapter` (Gemini 4 + optional Vercel AI Gateway BYOK)
 * - ROSTR Layer 3: `MCPServer` Stateless JSON-RPC 2.0 `2026-07-28` + Composio enforcement
 * - ROSTR Layer 4: `ACPRouter` Open ACP 1.0 + A2A `/.well-known/agent.json` discovery
 * - ROSTR Layer 5: `NPAOHarness` closed-loop execution + `TraceLogger` OpenTelemetry spans
 * - ROSTR Layer 6: `SixthAgentMetaBuilder` portable scaffold compiler
 * - Hermes Self-Improving Loop: `HermesSelfImprover` (reflection -> skill synthesis -> human promotion)
 * - All 8 Dedicated Creative Tools registered across BOTH Google ADK and ROSTR MCP:
 *     create_treatment, create_storyboard, create_script, create_agent_json,
 *     select_voiceover, select_audio, select_animations, select_video
 */

import {
  FunctionTool,
  Gemini,
  InMemoryArtifactService,
  InMemoryMemoryService,
  InMemorySessionService,
  LlmAgent,
  Runner,
  SequentialAgent,
  isFinalResponse,
  stringifyContent,
  version as adkVersion,
} from '@google/adk';
import { z } from 'zod';
import type {
  AnimationPresetId,
  MusicPresetId,
  OpenMontageVideoPresetId,
  UniversalVideoTimeline,
  VoiceoverVoiceName,
} from '../../src/types/monarch.ts';
import {
  MONARCH_COVENANT_MD,
  MONARCH_ROSTR_CONFIG_TS,
  MONARCH_SYSTEM_PROMPT,
  monarchRostrConfig,
} from '../config/monarch-config.ts';
import { ACPRouter } from '../rostr/acp-protocol.ts';
import { ContextEngine } from '../rostr/context-engine.ts';
import { MONARCH_GEMINI_MODEL, synthesizeVoiceoverWav } from '../rostr/gemini-client.ts';
import { MCPServer, assertComposioNamespace } from '../rostr/mcp-protocol.ts';
import { SixthAgentMetaBuilder } from '../rostr/meta-builder.ts';
import { NPAOHarness } from '../rostr/npao-harness.ts';
import { PALCompiler } from '../rostr/pal-compiler.ts';
import { ReasoningAdapter } from '../rostr/reasoning-adapter.ts';
import { TraceLogger } from '../rostr/trace-logger.ts';
import { generateArtisticPreProduction } from '../skills/artistic-director-suite.ts';
import {
  buildTimelineFromPreProduction,
  compileAllTargets,
  validateUniversalTimeline,
} from '../skills/editor-json-translator.ts';
import { HermesSelfImprover } from '../skills/hermes-self-improver.ts';
import { compilePALIntent } from '../skills/pal-video-compiler.ts';
import {
  assertActiveVideoProvider,
  runVideoEnvBootstrap,
  selectOptimalRuntime,
} from '../skills/video-env-bootstrap.ts';

export const MUSIC_PRESET_SPECS: Record<
  MusicPresetId,
  { name: string; bpm: number; mood: string; description: string }
> = {
  'cello-ostinato': {
    name: 'Chamber Cello Ostinato',
    bpm: 96,
    mood: 'Architectural & Regal',
    description: 'Warm low-register string pulse with subtle felt harmonics (-14 dB voice ducking).',
  },
  'felt-piano': {
    name: 'Intimate Felt Piano',
    bpm: 84,
    mood: 'Calm Editorial',
    description: 'Soft felted keys with wide studio room decay ideal for brand films and documentaries.',
  },
  'minimal-pulse': {
    name: 'Precision Hardware Pulse',
    bpm: 120,
    mood: 'Crisp & Kinetic',
    description: 'Tactile muted synth pulse and subtle mechanical clicks tuned for vertical product drops.',
  },
  'ambient-glass': {
    name: 'Luminous Ambient Glass',
    bpm: 78,
    mood: 'Spacious & Modern',
    description: 'Airy harmonic pad with crystal overtones designed for SaaS explainers and reveals.',
  },
};

export const ANIMATION_PRESET_SPECS: Record<
  AnimationPresetId,
  { name: string; library: string; easing: string; description: string }
> = {
  'kinetic-editorial': {
    name: 'Kinetic Editorial Rise',
    library: 'HyperFrames GSAP 3.12 (Apache-2.0)',
    easing: 'power3.out',
    description: 'Measured vertical display rise with staggered satin-gold rule sweep.',
  },
  'satin-gold-wipe': {
    name: 'Satin Gold Wipe',
    library: 'HyperFrames GSAP 3.12 (Apache-2.0)',
    easing: 'expo.out',
    description: 'Horizontal clip-path reveal swept by a hairline metallic gold accent.',
  },
  'architectural-split': {
    name: 'Architectural Split Glide',
    library: 'HyperFrames GSAP 3.12 + Crello Priors',
    easing: 'power3.out',
    description: 'Clean lateral slide tuned for structured SaaS specs and editorial cards.',
  },
  'cinematic-zoom': {
    name: 'Cinematic Lens Settle',
    library: 'OpenMontage + GSAP Optical Motion',
    easing: 'power2.out',
    description: 'Subtle 1.05x -> 1.00x optical settle paired with deliberate cross-dissolves.',
  },
};

export const OPENMONTAGE_VIDEO_PRESETS: Record<
  OpenMontageVideoPresetId,
  {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    surfaceColor: string;
    description: string;
  }
> = {
  'royal-architectural': {
    name: 'Monarch Royal Architectural',
    primaryColor: '#102D69',
    secondaryColor: '#091A3E',
    accentColor: '#D4AF37',
    surfaceColor: '#FAFBFD',
    description: 'Signature Royal Blue planes paired with Satin Gold geometry and Alabaster cards.',
  },
  'cinema-lens-noir': {
    name: 'Cinema Lens Noir',
    primaryColor: '#0B1220',
    secondaryColor: '#162238',
    accentColor: '#D4AF37',
    surfaceColor: '#F8FAFC',
    description: 'Dark anamorphic slate with warm brushed brass rim highlights.',
  },
  'alabaster-editorial': {
    name: 'Alabaster Gallery Editorial',
    primaryColor: '#102D69',
    secondaryColor: '#193C85',
    accentColor: '#C59F2B',
    surfaceColor: '#FFFFFF',
    description: 'Bright gallery-grade typography emphasis with crisp ink contrast.',
  },
  'prism-optical': {
    name: 'Prism Optical Tech',
    primaryColor: '#13224A',
    secondaryColor: '#09142B',
    accentColor: '#60A5FA',
    surfaceColor: '#F8FAFC',
    description: 'Technical cobalt optical look built for product walkthroughs and metrics.',
  },
};

export interface MonarchAdkRuntime {
  adkVersion: string;
  appName: string;
  sessionService: InMemorySessionService;
  artifactService: InMemoryArtifactService;
  memoryService: InMemoryMemoryService;
  substrate: ContextEngine;
  palCompiler: PALCompiler;
  reasoningAdapter: ReasoningAdapter;
  mcpServer: MCPServer;
  acpRouter: ACPRouter;
  npaoHarness: NPAOHarness;
  metaBuilder: SixthAgentMetaBuilder;
  hermes: HermesSelfImprover;
  traceLogger: TraceLogger;
  registeredCreativeTools: string[];
  invokeCreativeTool: (toolName: string, args: Record<string, unknown>) => Promise<unknown>;
  saveArtifact: (params: {
    userId: string;
    sessionId: string;
    filename: string;
    mimeType: string;
    content: string;
  }) => Promise<number>;
  listSessionArtifacts: (params: { userId: string; sessionId: string }) => Promise<string[]>;
  runAdkAdvisor: (params: {
    userId: string;
    sessionId: string;
    prompt: string;
  }) => Promise<{ text: string; eventsCount: number; traceId: string; sessionId: string }>;
  getConfigBundle: () => {
    covenantMd: string;
    rostrConfigTs: string;
    systemPromptTxt: string;
    discoveryCard: Record<string, unknown>;
    mcpTools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
    registeredCreativeTools: string[];
    contextStats: { namespace: string; totalRecords: number; totalEpisodes: number };
    adkServices: {
      sdk: string;
      version: string;
      model: string;
      sessionService: string;
      artifactService: string;
      memoryService: string;
      agents: string[];
    };
    hermesStats: ReturnType<HermesSelfImprover['getState']>['stats'];
  };
}

let singletonRuntime: MonarchAdkRuntime | null = null;

export function getMonarchAdkRuntime(publicUrl = 'http://localhost:3000'): MonarchAdkRuntime {
  if (singletonRuntime) return singletonRuntime;

  if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
    process.env.GOOGLE_GENAI_API_KEY = process.env.GEMINI_API_KEY;
  }

  assertComposioNamespace(monarchRostrConfig.mcpServers, true);

  // Layer 1 & 5: ContextEngine + TraceLogger + Hermes Self-Improver
  const substrate = new ContextEngine({ namespace: monarchRostrConfig.slug });
  const traceLogger = new TraceLogger({ serviceName: monarchRostrConfig.name });
  const hermes = new HermesSelfImprover({ substrate, traceLogger });

  void substrate.upsert({
    id: 'monarch-brand-identity',
    content:
      'Monarch Video brand identity: Royal Blue (#102D69), Metallic Gold (#D4AF37), two mirrored lions forming a butterfly silhouette with a crown. Calm, regal, consumer-first studio aesthetic.',
    source: 'brand-covenant',
    trustScore: 0.99,
    pinned: true,
    tags: ['brand', 'monarch', 'palette'],
  });
  void substrate.upsert({
    id: 'monarch-2026-video-guardrail',
    content:
      'Critical 2026 provider guardrail: OpenAI discontinued Sora consumer app (April 2026) and retired Sora API (September 24, 2026). Always route generative video clips to Google Veo 3.1, Runway Gen-4.5, Kling 4.0, or LTX-2.5.',
    source: 'runtime-policy',
    trustScore: 1.0,
    pinned: true,
    tags: ['guardrail', 'veo-3.1', 'sora-retired'],
  });
  void substrate.upsert({
    id: 'monarch-runtime-policy',
    content:
      'HyperFrames (Apache 2.0 HTML/CSS/GSAP/Lottie/Three.js) and OpenMontage (MIT) are primary free open-source programmatic video engines. Remotion TSX is secondary for React/data-chart videos (check commercial license for orgs >3 employees).',
    source: 'runtime-policy',
    trustScore: 0.98,
    pinned: true,
    tags: ['hyperframes', 'openmontage', 'remotion', 'runtime'],
  });
  void hermes.seedDatasetPriorsIntoContext();

  // Layer 2: PAL Compiler + ReasoningAdapter (Gemini 4 + Vercel AI Gateway BYOK)
  const palCompiler = new PALCompiler({
    agentName: monarchRostrConfig.name,
    covenant: MONARCH_COVENANT_MD,
    systemPrompt: MONARCH_SYSTEM_PROMPT,
  });
  const reasoningAdapter = new ReasoningAdapter({
    provider: process.env.VERCEL_AI_GATEWAY_URL ? 'vercel-ai-gateway' : 'gemini',
    model: MONARCH_GEMINI_MODEL,
  });

  // Layer 6: 6th-Agent Meta-Builder
  const metaBuilder = new SixthAgentMetaBuilder();

  // Google ADK Core Services
  const appName = 'monarch_video_studio';
  const sessionService = new InMemorySessionService();
  const artifactService = new InMemoryArtifactService();
  const memoryService = new InMemoryMemoryService();

  // --- Shared Implementation of ALL 8 Registered Creative Tools ---
  const defaultBrand = {
    brandName: 'Monarch',
    tagline: 'Direct studio-grade video with natural language.',
    primaryColor: '#102D69',
    accentColor: '#D4AF37',
    surfaceColor: '#FAFBFD',
    fontPairing: 'Plus Jakarta Sans + DM Sans',
    logoStyle: 'monarch-crest' as const,
  };

  const creativeToolHandlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
    create_treatment: async (args) => {
      const prompt = String(args.prompt || 'Monarch brand launch video');
      const aspectRatio = (args.aspectRatio as '16:9' | '9:16' | '1:1') || '16:9';
      const durationSec = Number(args.durationSec || 24);
      const pal =
        (args.pal as Awaited<ReturnType<typeof compilePALIntent>>) ||
        (await compilePALIntent({
          prompt,
          aspectRatio,
          durationSec,
          platform: String(args.platform || 'Web Launch'),
          templateId: String(args.templateId || 'editorial-launch'),
          brandKit: (args.brandKit as typeof defaultBrand) || defaultBrand,
          routingMode: 'managed-gateway',
        }));
      const pre = await generateArtisticPreProduction({
        pal,
        brandKit: (args.brandKit as typeof defaultBrand) || defaultBrand,
        templateId: String(args.templateId || 'editorial-launch'),
      });
      return {
        tool: 'create_treatment',
        projectBrief: pre.projectBrief,
        templateSelection: pre.templateSelection,
        videoTreatment: pre.videoTreatment,
        finalProductionPrompt: pre.finalProductionPrompt,
      };
    },

    create_storyboard: async (args) => {
      const prompt = String(args.prompt || 'Monarch brand launch video');
      const pal =
        (args.pal as Awaited<ReturnType<typeof compilePALIntent>>) ||
        (await compilePALIntent({
          prompt,
          aspectRatio: (args.aspectRatio as '16:9' | '9:16' | '1:1') || '16:9',
          durationSec: Number(args.durationSec || 24),
          platform: String(args.platform || 'Web Launch'),
          templateId: String(args.templateId || 'editorial-launch'),
          brandKit: (args.brandKit as typeof defaultBrand) || defaultBrand,
          routingMode: 'managed-gateway',
        }));
      const pre = await generateArtisticPreProduction({
        pal,
        brandKit: (args.brandKit as typeof defaultBrand) || defaultBrand,
        templateId: String(args.templateId || 'editorial-launch'),
      });
      return {
        tool: 'create_storyboard',
        datasetPriorsApplied: ['CineBoard3D', 'Film Shots Dataset', 'MuSS'],
        storyboard: pre.storyboard,
      };
    },

    create_script: async (args) => {
      const prompt = String(args.prompt || 'Monarch brand launch video');
      const pal =
        (args.pal as Awaited<ReturnType<typeof compilePALIntent>>) ||
        (await compilePALIntent({
          prompt,
          aspectRatio: (args.aspectRatio as '16:9' | '9:16' | '1:1') || '16:9',
          durationSec: Number(args.durationSec || 24),
          platform: String(args.platform || 'Web Launch'),
          templateId: String(args.templateId || 'editorial-launch'),
          brandKit: (args.brandKit as typeof defaultBrand) || defaultBrand,
          routingMode: 'managed-gateway',
        }));
      const pre = await generateArtisticPreProduction({
        pal,
        brandKit: (args.brandKit as typeof defaultBrand) || defaultBrand,
        templateId: String(args.templateId || 'editorial-launch'),
      });
      return {
        tool: 'create_script',
        voiceoverDirection: pre.videoTreatment.voiceoverDirection,
        scriptAndCueSheet: pre.scriptAndCueSheet,
      };
    },

    create_agent_json: async (args) => {
      const directTimeline = args.timeline as UniversalVideoTimeline | undefined;
      if (directTimeline) {
        const validation = validateUniversalTimeline(directTimeline);
        const compiled = compileAllTargets(directTimeline, {
          animationPreset: String(args.animationPreset || 'kinetic-editorial'),
          videoPreset: String(args.videoPreset || 'royal-architectural'),
        });
        return { tool: 'create_agent_json', validation, timeline: directTimeline, compiled };
      }
      const pal = args.pal as Awaited<ReturnType<typeof compilePALIntent>>;
      const preProduction = args.preProduction as Awaited<ReturnType<typeof generateArtisticPreProduction>>;
      const brandKit = (args.brandKit as typeof defaultBrand) || defaultBrand;
      if (!pal || !preProduction) {
        throw new Error('create_agent_json requires either timeline or (pal + preProduction).');
      }
      const timeline = buildTimelineFromPreProduction({ pal, preProduction, brandKit });
      const compiled = compileAllTargets(timeline, {
        animationPreset: String(args.animationPreset || 'kinetic-editorial'),
        videoPreset: String(args.videoPreset || 'royal-architectural'),
      });
      return { tool: 'create_agent_json', timeline, compiled };
    },

    select_voiceover: async (args) => {
      const text = String(args.text || 'Monarch Video compiles natural language into studio motion.');
      const voiceName = (String(args.voiceName || 'Kore') as VoiceoverVoiceName) || 'Kore';
      const style = String(args.style || 'Warm, composed, unhurried documentary studio narrator');
      const highFidelity = Boolean(args.highFidelity);
      const synth = await synthesizeVoiceoverWav({ text, voiceName, style, highFidelity });
      return {
        tool: 'select_voiceover',
        voiceName: synth.voiceName,
        model: synth.model,
        mimeType: synth.mimeType,
        sizeBytes: synth.sizeBytes,
        audioDataUrl: `data:${synth.mimeType};base64,${synth.base64Audio}`,
      };
    },

    select_audio: async (args) => {
      const presetId = (String(args.musicPreset || 'cello-ostinato') as MusicPresetId) || 'cello-ostinato';
      const spec = MUSIC_PRESET_SPECS[presetId] || MUSIC_PRESET_SPECS['cello-ostinato'];
      return {
        tool: 'select_audio',
        musicPreset: presetId,
        ...spec,
        duckingDb: Number(args.duckingDb ?? -14),
        engine: 'Zero-Dependency Procedural Web Audio Synthesizer (Royalty-Free)',
      };
    },

    select_animations: async (args) => {
      const presetId =
        (String(args.animationPreset || 'kinetic-editorial') as AnimationPresetId) || 'kinetic-editorial';
      const spec = ANIMATION_PRESET_SPECS[presetId] || ANIMATION_PRESET_SPECS['kinetic-editorial'];
      return {
        tool: 'select_animations',
        animationPreset: presetId,
        ...spec,
        datasetPriors: ['cyberagent/crello-animation', 'MoCap-VCMotion'],
      };
    },

    select_video: async (args) => {
      const presetId =
        (String(args.videoPreset || 'royal-architectural') as OpenMontageVideoPresetId) ||
        'royal-architectural';
      const spec = OPENMONTAGE_VIDEO_PRESETS[presetId] || OPENMONTAGE_VIDEO_PRESETS['royal-architectural'];
      const providerCheck = assertActiveVideoProvider(String(args.requestedVideoProvider || 'google-veo-3.1'));
      return {
        tool: 'select_video',
        videoPreset: presetId,
        ...spec,
        pipeline: 'OpenMontage (MIT) + HyperFrames CLI (Apache-2.0)',
        providerCheck,
      };
    },
  };

  const registeredCreativeTools = Object.keys(creativeToolHandlers);

  // --- Google ADK Zod FunctionTools (System + All 8 Creative Tools) ---
  const bootstrapTool = new FunctionTool({
    name: 'video_env_bootstrap',
    description:
      'Inspect open-source programmatic video libraries (HyperFrames CLI, OpenMontage, Remotion, FFmpeg), 2026 model adapters, and active guardrails.',
    parameters: z.object({}),
    execute: async () => runVideoEnvBootstrap(),
  });

  const runtimeSelectorTool = new FunctionTool({
    name: 'select_video_runtime',
    description:
      'Select the optimal programmatic render runtime and enforce retired OpenAI Sora + Remotion commercial license guardrails.',
    parameters: z.object({
      prompt: z.string(),
      templateId: z.string().optional(),
      requestedVideoProvider: z.string().optional(),
      orgSizeOverThree: z.boolean().optional(),
    }),
    execute: async ({ prompt, templateId, requestedVideoProvider, orgSizeOverThree }) => ({
      runtime: selectOptimalRuntime({ prompt, templateId, orgSizeOverThree }),
      providerCheck: assertActiveVideoProvider(requestedVideoProvider || 'google-veo-3.1'),
    }),
  });

  const brandContextSearchTool = new FunctionTool({
    name: 'composio_context_search',
    description:
      'Search ROSTR ContextEngine (Hybrid RRF + RAG DAL) for Monarch brand rules, Hugging Face/Kaggle creative video priors, and promoted Hermes skills.',
    parameters: z.object({
      query: z.string(),
      topK: z.number().optional(),
    }),
    execute: async ({ query, topK }) => ({
      matches: await substrate.query(query, { topK: topK ?? 5 }),
    }),
  });

  const adkCreativeTools = [
    new FunctionTool({
      name: 'create_treatment',
      description: 'Draft a studio video treatment, project brief, visual mood, and soundscape direction.',
      parameters: z.object({
        prompt: z.string(),
        aspectRatio: z.enum(['16:9', '9:16', '1:1']).optional(),
        durationSec: z.number().optional(),
      }),
      execute: async (args) => creativeToolHandlers.create_treatment(args),
    }),
    new FunctionTool({
      name: 'create_storyboard',
      description: 'Generate a shot-by-shot storyboard grounded in CineBoard3D and Film Shots priors.',
      parameters: z.object({ prompt: z.string(), durationSec: z.number().optional() }),
      execute: async (args) => creativeToolHandlers.create_storyboard(args),
    }),
    new FunctionTool({
      name: 'create_script',
      description: 'Create a time-coded voiceover script, kinetic headline list, and SFX/music cue sheet.',
      parameters: z.object({ prompt: z.string(), durationSec: z.number().optional() }),
      execute: async (args) => creativeToolHandlers.create_script(args),
    }),
    new FunctionTool({
      name: 'create_agent_json',
      description: 'Compile and validate canonical Universal Video Timeline JSON + HyperFrames HTML/GSAP + Remotion TSX.',
      parameters: z.object({
        animationPreset: z.string().optional(),
        videoPreset: z.string().optional(),
      }),
      execute: async (args) => ({
        schemaVersion: '1.0.0',
        supportedTargets: ['hyperframes-html-gsap', 'remotion-tsx'],
        ...args,
      }),
    }),
    new FunctionTool({
      name: 'select_voiceover',
      description: 'Select a human-sounding Gemini 3.8 TTS voice (Kore, Puck, Charon, Fenrir, Zephyr) and synthesize WAV narration.',
      parameters: z.object({
        text: z.string(),
        voiceName: z.enum(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr']).optional(),
        style: z.string().optional(),
      }),
      execute: async (args) => creativeToolHandlers.select_voiceover(args),
    }),
    new FunctionTool({
      name: 'select_audio',
      description: 'Select a royalty-free procedural Web Audio underscore preset and voice ducking level.',
      parameters: z.object({
        musicPreset: z.enum(['cello-ostinato', 'felt-piano', 'minimal-pulse', 'ambient-glass']).optional(),
        duckingDb: z.number().optional(),
      }),
      execute: async (args) => creativeToolHandlers.select_audio(args),
    }),
    new FunctionTool({
      name: 'select_animations',
      description: 'Select an open-source HyperFrames GSAP choreography preset informed by Crello Animation & MoCap priors.',
      parameters: z.object({
        animationPreset: z
          .enum(['kinetic-editorial', 'satin-gold-wipe', 'architectural-split', 'cinematic-zoom'])
          .optional(),
      }),
      execute: async (args) => creativeToolHandlers.select_animations(args),
    }),
    new FunctionTool({
      name: 'select_video',
      description: 'Select an OpenMontage visual grade preset and validate generative video provider guardrails.',
      parameters: z.object({
        videoPreset: z
          .enum(['royal-architectural', 'cinema-lens-noir', 'alabaster-editorial', 'prism-optical'])
          .optional(),
        requestedVideoProvider: z.string().optional(),
      }),
      execute: async (args) => creativeToolHandlers.select_video(args),
    }),
  ];

  // --- Layer 3: Stateless MCP 2026-07-28 Server (System + All 8 Creative Tools) ---
  const mcpServer = new MCPServer({ name: `${monarchRostrConfig.slug}-mcp`, version: '1.1.0' });

  mcpServer.registerTool({
    name: 'composio_video_bootstrap',
    description: 'Verify HyperFrames CLI, OpenMontage, Remotion, FFmpeg, Google ADK, and 2026 model adapters.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => runVideoEnvBootstrap(),
  });
  mcpServer.registerTool({
    name: 'composio_runtime_route',
    description: 'Select optimal programmatic video runtime and enforce 2026 retired-Sora & Remotion guardrails.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        orgSizeOverThree: { type: 'boolean' },
      },
      required: ['prompt'],
    },
    handler: async (args) =>
      selectOptimalRuntime({
        prompt: String(args.prompt || ''),
        orgSizeOverThree: Boolean(args.orgSizeOverThree),
      }),
  });
  mcpServer.registerTool({
    name: 'composio_context_search',
    description: 'Query ROSTR ContextEngine hybrid retrieval (BM25 + Vector RRF + RAG DAL + HF/Kaggle Dataset Priors).',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
    handler: async (args) => ({
      matches: await substrate.query(String(args.query || ''), { topK: 5 }),
    }),
  });

  // Register all 8 canonical creative tools on MCP 2026-07-28
  const mcpCreativeMeta: Array<{ name: string; description: string }> = [
    { name: 'create_treatment', description: 'Draft studio video treatment, logline, visual mood, and audio plan.' },
    { name: 'create_storyboard', description: 'Generate shot-by-shot storyboard informed by CineBoard3D & Film Shots.' },
    { name: 'create_script', description: 'Create time-coded voiceover script and SFX/music cue sheet.' },
    { name: 'create_agent_json', description: 'Build & validate Universal Video Timeline JSON + HyperFrames/Remotion targets.' },
    { name: 'select_voiceover', description: 'Synthesize real human-sounding Gemini 3.8 TTS WAV narration.' },
    { name: 'select_audio', description: 'Select royalty-free procedural Web Audio underscore & ducking preset.' },
    { name: 'select_animations', description: 'Select open-source GSAP choreography preset for HyperFrames rendering.' },
    { name: 'select_video', description: 'Select OpenMontage visual preset & validate 2026 video provider guardrails.' },
  ];

  for (const toolDef of mcpCreativeMeta) {
    mcpServer.registerTool({
      name: toolDef.name,
      description: toolDef.description,
      inputSchema: { type: 'object', properties: {} },
      handler: async (args) => creativeToolHandlers[toolDef.name](args),
    });
  }

  // --- Layer 4: Open ACP 1.0 + A2A Router ---
  const acpRouter = new ACPRouter({ publicUrl });
  acpRouter.registerAgent({
    name: 'monarch-video-agent',
    description: 'Primary Google ADK + ROSTR programmatic video production orchestrator.',
    capabilities: [
      'google-adk',
      'pal-video-compiler',
      'artistic-director-suite',
      'editor-json-translator',
      'hermes-self-improvement',
      ...registeredCreativeTools,
    ],
    handler: async ({ input }) => ({
      engine: 'google-adk+rostr-6-layer',
      adkVersion,
      registeredCreativeTools,
      bootstrap: runVideoEnvBootstrap(),
      receivedParts: input.length,
    }),
  });
  acpRouter.registerAgent({
    name: 'artistic-director',
    description: 'Specialist ADK sub-agent for treatment, storyboard, script, and dataset-grounded direction.',
    capabilities: ['create_treatment', 'create_storyboard', 'create_script'],
    handler: async () => ({ status: 'READY', subSkill: 'artistic-director-suite', model: MONARCH_GEMINI_MODEL }),
  });
  acpRouter.registerAgent({
    name: 'timeline-compiler',
    description: 'Specialist ADK sub-agent for Timeline JSON -> HyperFrames GSAP & Remotion TSX compilation.',
    capabilities: ['create_agent_json', 'select_animations', 'conversational-diff'],
    handler: async () => ({ status: 'READY', subSkill: 'editor-json-translator', targets: ['hyperframes', 'remotion'] }),
  });
  acpRouter.registerAgent({
    name: 'media-router',
    description: 'Specialist ADK sub-agent for Gemini 3.8 TTS voiceover, Web Audio score, OpenMontage presets, and Veo 3.1 guardrails.',
    capabilities: ['select_voiceover', 'select_audio', 'select_video', 'sora-retirement-guardrail'],
    handler: async () => runVideoEnvBootstrap(),
  });

  // --- Layer 5: Closed-Loop NPAO Harness ---
  const npaoHarness = new NPAOHarness({
    agentName: monarchRostrConfig.name,
    substrate,
    palCompiler,
    reasoningAdapter,
    mcpServer,
    acpRouter,
    traceLogger,
  });

  // --- Google ADK Agents (Lazy instantiation on first runAdkAdvisor call) ---
  const agentNames = [
    'monarch_video_orchestrator',
    'monarch_production_pipeline',
    'pal_video_compiler',
    'artistic_director_suite',
    'editor_json_translator',
    'hermes_self_improver',
  ];

  let cachedAgents: {
    rootAgent: LlmAgent;
    pipelineAgent: SequentialAgent;
    runner: Runner;
  } | null = null;

  function getOrCreateAdkRunner() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error(
        'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY in AI Studio Secrets or Vercel Environment Variables.'
      );
    }
    if (!cachedAgents) {
      const geminiModel = new Gemini({
        model: MONARCH_GEMINI_MODEL,
        apiKey,
        headers: { 'User-Agent': 'aistudio-build' },
      });

      const palCompilerAgent = new LlmAgent({
        name: 'pal_video_compiler',
        model: geminiModel,
        description: 'Runs 4-stage PAL intent extraction and selects the optimal open-source video runtime.',
        instruction: `${MONARCH_SYSTEM_PROMPT}\nFocus on Sub-Skill B (PAL Intent Extraction) and dataset-grounded runtime selection.`,
        tools: [bootstrapTool, runtimeSelectorTool, brandContextSearchTool],
        outputKey: 'pal_brief',
      });

      const artisticDirectorAgent = new LlmAgent({
        name: 'artistic_director_suite',
        model: geminiModel,
        description: 'Produces treatment, storyboard, script, voiceover, and audio/visual selections.',
        instruction: `${MONARCH_SYSTEM_PROMPT}\nFocus on Sub-Skill C (Artistic Pre-Production Suite) using create_treatment, create_storyboard, create_script, select_voiceover, select_audio, select_animations, select_video.`,
        tools: [brandContextSearchTool, ...adkCreativeTools],
        outputKey: 'artistic_preproduction',
      });

      const timelineTranslatorAgent = new LlmAgent({
        name: 'editor_json_translator',
        model: geminiModel,
        description: 'Compiles Universal Video Timeline JSON for HyperFrames HTML/GSAP and Remotion TSX.',
        instruction: `${MONARCH_SYSTEM_PROMPT}\nFocus on Sub-Skill D (Universal Video Timeline JSON & Bi-Directional Diff Editing).`,
        outputKey: 'timeline_spec',
      });

      const pipelineAgent = new SequentialAgent({
        name: 'monarch_production_pipeline',
        description: 'Google ADK SequentialAgent: PAL -> Artistic Direction -> Timeline Translation.',
        subAgents: [palCompilerAgent, artisticDirectorAgent, timelineTranslatorAgent],
      });

      const rootAgent = new LlmAgent({
        name: 'monarch_video_orchestrator',
        model: geminiModel,
        description: 'Executive Monarch Video Agent coordinating Google ADK, ROSTR 6 layers, 8 creative tools, and Hermes reflection.',
        instruction: `${MONARCH_SYSTEM_PROMPT}\n\nYou have 8 registered creative tools (create_treatment, create_storyboard, create_script, create_agent_json, select_voiceover, select_audio, select_animations, select_video), ContextEngine dataset priors, and Google ADK services.`,
        tools: [bootstrapTool, runtimeSelectorTool, brandContextSearchTool, ...adkCreativeTools],
        subAgents: [palCompilerAgent, artisticDirectorAgent, timelineTranslatorAgent],
      });

      const runner = new Runner({
        appName,
        agent: rootAgent,
        sessionService,
        artifactService,
        memoryService,
      });

      cachedAgents = { rootAgent, pipelineAgent, runner };
    }
    return cachedAgents;
  }

  async function ensureSession(userId: string, sessionId: string) {
    const existing = await sessionService.getSession({ appName, userId, sessionId });
    if (existing) return existing;
    return sessionService.createSession({ appName, userId, sessionId });
  }

  async function saveArtifact(params: {
    userId: string;
    sessionId: string;
    filename: string;
    mimeType: string;
    content: string;
  }): Promise<number> {
    await ensureSession(params.userId, params.sessionId);
    return artifactService.saveArtifact({
      appName,
      userId: params.userId,
      sessionId: params.sessionId,
      filename: params.filename,
      artifact: {
        inlineData: {
          mimeType: params.mimeType,
          data: Buffer.from(params.content, 'utf8').toString('base64'),
        },
      },
    });
  }

  async function listSessionArtifacts(params: { userId: string; sessionId: string }): Promise<string[]> {
    await ensureSession(params.userId, params.sessionId);
    return artifactService.listArtifactKeys({
      appName,
      userId: params.userId,
      sessionId: params.sessionId,
    });
  }

  async function invokeCreativeTool(toolName: string, args: Record<string, unknown>) {
    const handler = creativeToolHandlers[toolName];
    if (!handler) {
      throw new Error(`Unknown Monarch creative tool: ${toolName}`);
    }
    const trace = traceLogger.startTrace(`tool.${toolName}`, {
      toolName,
      argKeys: Object.keys(args),
    });
    try {
      const result = await handler(args);
      trace.finish('OK', { toolName });
      return result;
    } catch (err) {
      trace.finish('ERROR', { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  async function runAdkAdvisor(params: { userId: string; sessionId: string; prompt: string }) {
    const trace = traceLogger.startTrace('adk.runner.runAsync', {
      appName,
      agent: 'monarch_video_orchestrator',
      sessionId: params.sessionId,
    });

    try {
      const { runner } = getOrCreateAdkRunner();
      await ensureSession(params.userId, params.sessionId);
      const eventsStream = runner.runAsync({
        userId: params.userId,
        sessionId: params.sessionId,
        newMessage: {
          role: 'user',
          parts: [{ text: params.prompt }],
        },
      });

      let finalText = '';
      let eventsCount = 0;

      for await (const event of eventsStream) {
        eventsCount += 1;
        const text = stringifyContent(event);
        if (text && (isFinalResponse(event) || !finalText)) {
          finalText = text;
        }
      }

      const session = await sessionService.getSession({
        appName,
        userId: params.userId,
        sessionId: params.sessionId,
      });
      if (session) {
        await memoryService.addSessionToMemory(session);
      }

      trace.finish('OK', { eventsCount });
      return {
        text: finalText || 'Monarch ADK Orchestrator completed the request.',
        eventsCount,
        traceId: trace.traceId,
        sessionId: params.sessionId,
      };
    } catch (err) {
      trace.finish('ERROR', { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  singletonRuntime = {
    adkVersion,
    appName,
    sessionService,
    artifactService,
    memoryService,
    substrate,
    palCompiler,
    reasoningAdapter,
    mcpServer,
    acpRouter,
    npaoHarness,
    metaBuilder,
    hermes,
    traceLogger,
    registeredCreativeTools,
    invokeCreativeTool,
    saveArtifact,
    listSessionArtifacts,
    runAdkAdvisor,
    getConfigBundle: () => ({
      covenantMd: MONARCH_COVENANT_MD,
      rostrConfigTs: MONARCH_ROSTR_CONFIG_TS,
      systemPromptTxt: MONARCH_SYSTEM_PROMPT,
      discoveryCard: acpRouter.getDiscoveryCard('monarch-video-agent'),
      mcpTools: mcpServer.listToolManifest(),
      registeredCreativeTools,
      contextStats: substrate.stats(),
      adkServices: {
        sdk: '@google/adk',
        version: adkVersion,
        model: MONARCH_GEMINI_MODEL,
        sessionService: 'InMemorySessionService',
        artifactService: 'InMemoryArtifactService',
        memoryService: 'InMemoryMemoryService',
        agents: agentNames,
      },
      hermesStats: hermes.getState().stats,
    }),
  };

  return singletonRuntime;
}
