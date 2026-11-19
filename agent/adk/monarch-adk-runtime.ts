/**
 * MONARCH VIDEO BACKEND AGENT — GOOGLE ADK (`@google/adk`) + COMPLETE ROSTR 6-LAYER RUNTIME
 *
 * Unifies:
 * - Master Agent Governance: `SOUL.md`, `COVENANT.md`, `MASTER_ONE_SHEETER.md`, `MONARCH_MASTER_MANIFEST`
 * - 7 Specialized Sub-Agents across Google ADK (`LlmAgent`, `SequentialAgent`, `Runner`) & Open ACP 1.0:
 *     1. monarch_video_orchestrator
 *     2. pal_intent_compiler
 *     3. brand_kit_guardian
 *     4. artistic_director_suite
 *     5. broll_montage_harvester
 *     6. editor_json_translator
 *     7. hermes_covenant_auditor
 * - All 16 Deterministic Tools registered across BOTH Google ADK and Stateless MCP `2026-07-28`:
 *     create_treatment, create_storyboard, create_script, create_agent_json,
 *     select_voiceover, select_audio, select_animations, select_video,
 *     extract_brand_identity, harvest_broll_montage, compile_style_blueprint,
 *     render_mp4_video, verify_covenant_compliance,
 *     composio_video_bootstrap, composio_runtime_route, composio_media_connector
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
  MonarchMasterManifest,
  MusicPresetId,
  OpenMontageVideoPresetId,
  UniversalVideoTimeline,
  VoiceoverVoiceName,
} from '../../src/types/monarch.ts';
import {
  CURATED_BROLL_LIBRARY,
  DEFAULT_STYLE_BLUEPRINTS,
  MONARCH_COVENANT_MD,
  MONARCH_MASTER_MANIFEST,
  MONARCH_ROSTR_CONFIG_TS,
  MONARCH_SOUL_MD,
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
  extractBrandKitFromAsset,
  extractStyleBlueprintFromReference,
  populateSceneBRollShots,
  renderTimelineToMp4,
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
    soulMd: string;
    covenantMd: string;
    rostrConfigTs: string;
    systemPromptTxt: string;
    masterManifest: MonarchMasterManifest;
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
    id: 'monarch-soul-manifest',
    content: MONARCH_SOUL_MD,
    source: 'agent-soul',
    trustScore: 1.0,
    pinned: true,
    tags: ['soul', 'monarch', 'montage', 'doctrine'],
  });
  void substrate.upsert({
    id: 'monarch-covenant-manifest',
    content: MONARCH_COVENANT_MD,
    source: 'agent-covenant',
    trustScore: 1.0,
    pinned: true,
    tags: ['covenant', 'guardrails', 'subagents', 'tools'],
  });
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
      'HyperFrames (Apache 2.0 HTML/CSS/GSAP/Lottie/Three.js) and OpenMontage (MIT) are primary free open-source programmatic video engines. Remotion TSX is secondary for React/data-chart videos (check commercial license for orgs >3 employees). Server-side /usr/bin/ffmpeg renders H.264 MP4.',
    source: 'runtime-policy',
    trustScore: 0.98,
    pinned: true,
    tags: ['hyperframes', 'openmontage', 'remotion', 'ffmpeg', 'mp4'],
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

  const defaultBrand = {
    brandName: 'Monarch',
    tagline: 'Direct studio-grade video with natural language.',
    primaryColor: '#102D69',
    accentColor: '#D4AF37',
    surfaceColor: '#FAFBFD',
    fontPairing: 'Plus Jakarta Sans + DM Sans',
    logoStyle: 'monarch-crest' as const,
  };

  // --- Unified Handlers for All 16 Deterministic ADK & MCP Tools ---
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
        pipeline: 'OpenMontage (MIT) + HyperFrames CLI (Apache-2.0) + FFmpeg H.264 MP4',
        providerCheck,
      };
    },

    extract_brand_identity: async (args) => {
      const extracted = await extractBrandKitFromAsset({
        name: String(args.name || 'Monarch-Brand-Guide.md'),
        mimeType: String(args.mimeType || 'text/markdown'),
        dataUrl: args.dataUrl ? String(args.dataUrl) : undefined,
        textContent: args.textContent ? String(args.textContent) : undefined,
      });
      return {
        tool: 'extract_brand_identity',
        ...extracted,
      };
    },

    harvest_broll_montage: async (args) => {
      const sceneId = String(args.sceneId || 'scene-1');
      const sceneDurationSec = Number(args.durationSec || 6);
      const sceneTitle = String(args.title || 'Hardware Launch Montage');
      const visualPrompt = String(args.visualPrompt || 'Anamorphic brass macro hardware dolly');
      const blueprint =
        DEFAULT_STYLE_BLUEPRINTS.find((b) => b.id === args.styleBlueprintId) || DEFAULT_STYLE_BLUEPRINTS[0];
      const shots = populateSceneBRollShots({
        sceneId,
        sceneIndex: Number(args.sceneIndex || 0),
        sceneDurationSec,
        sceneTitle,
        visualPrompt,
        styleBlueprint: blueprint,
      });
      return {
        tool: 'harvest_broll_montage',
        styleBlueprintId: blueprint.id,
        shotCount: shots.length,
        brollShots: shots,
      };
    },

    compile_style_blueprint: async (args) => {
      const referenceText = String(
        args.referenceText || 'Rapid 1.5s hardware macro cuts with whip-pans and anamorphic brass grading'
      );
      const blueprint = await extractStyleBlueprintFromReference({ referenceText });
      return {
        tool: 'compile_style_blueprint',
        blueprint,
      };
    },

    render_mp4_video: async (args) => {
      const timeline = args.timeline as UniversalVideoTimeline | undefined;
      if (timeline) {
        const rendered = await renderTimelineToMp4({
          timeline,
          projectId: String(args.projectId || 'monarch-agent-render'),
        });
        return {
          tool: 'render_mp4_video',
          ...rendered,
        };
      }
      // Build a minimal verified timeline from curated B-roll when called standalone
      const fallbackTimeline: UniversalVideoTimeline = {
        schemaVersion: '1.0.0',
        projectMeta: {
          title: 'Monarch Studio MP4 Render',
          aspectRatio: '16:9',
          fps: 30,
          width: 1920,
          height: 1080,
          totalDurationSec: 8,
          platform: 'Web Launch',
          version: 1,
        },
        brandKit: defaultBrand,
        renderRuntime: 'hyperframes',
        audioTracks: {
          voiceover: { voicePersona: 'Kore', provider: 'Gemini 3.8 TTS', totalLines: 1 },
          music: { style: 'Cello Ostinato', bpm: 96, mood: 'Regal', duckingDb: -14 },
          sfx: [],
        },
        scenes: [
          {
            id: 'scene-1',
            title: 'Opening Montage',
            startSec: 0,
            durationSec: 8,
            layoutTemplate: 'hero-title',
            background: {
              type: 'cinematic-backdrop',
              primaryColor: '#102D69',
              secondaryColor: '#091A3E',
              accentGlow: '#D4AF37',
            },
            elements: [
              {
                id: 'el-1',
                type: 'headline',
                content: 'Monarch B-Roll Montage',
                position: 'center',
                animation: 'kinetic-reveal',
              },
            ],
            captions: [],
            mediaRef: { source: 'stock-clip', promptOrAsset: CURATED_BROLL_LIBRARY[0].url },
            transition: 'wipe-gold',
            brollShots: populateSceneBRollShots({
              sceneId: 'scene-1',
              sceneIndex: 0,
              sceneDurationSec: 8,
              sceneTitle: 'Opening Montage',
              visualPrompt: 'Royal architecture and brass hardware',
            }),
          },
        ],
      };
      const rendered = await renderTimelineToMp4({
        timeline: fallbackTimeline,
        projectId: String(args.projectId || 'monarch-verify-mp4'),
      });
      return {
        tool: 'render_mp4_video',
        ...rendered,
      };
    },

    verify_covenant_compliance: async (args) => {
      const requestedProvider = String(args.requestedVideoProvider || 'google-veo-3.1');
      const providerCheck = assertActiveVideoProvider(requestedProvider);
      const composioValid = monarchRostrConfig.mcpServers.every((s) => s.startsWith('composio-'));
      return {
        tool: 'verify_covenant_compliance',
        compliant: providerCheck.resolvedProvider !== 'openai-sora' && composioValid,
        providerCheck,
        composioNamespaceEnforced: composioValid,
        subAgentsActive: MONARCH_MASTER_MANIFEST.subAgents.length,
        registeredToolsCount: MONARCH_MASTER_MANIFEST.registeredTools.length,
      };
    },

    composio_video_bootstrap: async () => runVideoEnvBootstrap(),

    composio_runtime_route: async (args) => ({
      runtime: selectOptimalRuntime({
        prompt: String(args.prompt || 'Monarch video montage'),
        templateId: args.templateId ? String(args.templateId) : undefined,
        orgSizeOverThree: Boolean(args.orgSizeOverThree),
      }),
      providerCheck: assertActiveVideoProvider(String(args.requestedVideoProvider || 'google-veo-3.1')),
    }),

    composio_media_connector: async (args) => {
      const query = String(args.query || '').toLowerCase();
      const platform = String(args.platform || 'all');
      const matches = CURATED_BROLL_LIBRARY.filter((item) => {
        if (platform !== 'all' && item.platform !== platform) return false;
        if (!query) return true;
        return (
          item.title.toLowerCase().includes(query) ||
          item.tags.some((t) => t.toLowerCase().includes(query))
        );
      });
      return {
        tool: 'composio_media_connector',
        platformsConnected: [
          'curated-hd',
          'composio-pexels',
          'composio-pixabay',
          'composio-wikimedia',
          'composio-openverse',
          'composio-coverr',
        ],
        results: matches.length > 0 ? matches : CURATED_BROLL_LIBRARY,
      };
    },
  };

  const registeredCreativeTools = Object.keys(creativeToolHandlers);

  // --- Layer 3: Stateless MCP 2026-07-28 Server (All 16 Tools + Context Search) ---
  const mcpServer = new MCPServer({ name: `${monarchRostrConfig.slug}-mcp`, version: '2.5.0' });

  for (const toolSpec of MONARCH_MASTER_MANIFEST.registeredTools) {
    mcpServer.registerTool({
      name: toolSpec.name,
      description: `[${toolSpec.subAgentOwner}] ${toolSpec.description}`,
      inputSchema: { type: 'object', properties: {} },
      handler: async (args) => creativeToolHandlers[toolSpec.name](args),
    });
  }

  mcpServer.registerTool({
    name: 'composio_context_search',
    description: 'Query ROSTR ContextEngine hybrid retrieval (BM25 + Vector RRF + RAG DAL + SOUL/COVENANT + HF/Kaggle Priors).',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
    handler: async (args) => ({
      matches: await substrate.query(String(args.query || ''), { topK: 5 }),
    }),
  });

  // --- Layer 4: Open ACP 1.0 + A2A Router (All 7 Sub-Agents Registered) ---
  const acpRouter = new ACPRouter({ publicUrl });
  acpRouter.registerAgent({
    name: 'monarch-video-agent',
    description: 'Primary Google ADK + ROSTR 7-Sub-Agent programmatic video montage orchestrator.',
    capabilities: [
      'google-adk',
      'soul-covenant-governed',
      '4-source-broll-montage',
      'ffmpeg-h264-mp4-render',
      'brand-doc-logo-autosync',
      'json-style-blueprints',
      ...registeredCreativeTools,
    ],
    handler: async ({ input }) => ({
      engine: 'google-adk+rostr-6-layer',
      adkVersion,
      subAgentsCount: MONARCH_MASTER_MANIFEST.subAgents.length,
      registeredCreativeTools,
      bootstrap: runVideoEnvBootstrap(),
      receivedParts: input.length,
    }),
  });

  for (const subAgent of MONARCH_MASTER_MANIFEST.subAgents) {
    acpRouter.registerAgent({
      name: subAgent.id,
      description: `${subAgent.name} — ${subAgent.role}`,
      capabilities: [...subAgent.tools, ...subAgent.skills],
      handler: async () => ({
        status: 'READY',
        subAgentId: subAgent.id,
        role: subAgent.role,
        layer: subAgent.layer,
        model: subAgent.model,
        tools: subAgent.tools,
      }),
    });
  }

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

  // --- Google ADK 7-Sub-Agent Hierarchy ---
  const agentNames = MONARCH_MASTER_MANIFEST.subAgents.map((a) => a.id);

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

      const adkFunctionTools = MONARCH_MASTER_MANIFEST.registeredTools.map(
        (t) =>
          new FunctionTool({
            name: t.name,
            description: t.description,
            parameters: z.object({
              prompt: z.string().optional(),
              query: z.string().optional(),
            }),
            execute: async (args) => creativeToolHandlers[t.name](args as Record<string, unknown>),
          })
      );

      const palAgent = new LlmAgent({
        name: 'pal_intent_compiler',
        model: geminiModel,
        description: MONARCH_MASTER_MANIFEST.subAgents[1].role,
        instruction: MONARCH_MASTER_MANIFEST.subAgents[1].systemInstruction,
        outputKey: 'pal_brief',
      });

      const brandGuardianAgent = new LlmAgent({
        name: 'brand_kit_guardian',
        model: geminiModel,
        description: MONARCH_MASTER_MANIFEST.subAgents[2].role,
        instruction: MONARCH_MASTER_MANIFEST.subAgents[2].systemInstruction,
        outputKey: 'brand_identity',
      });

      const artisticDirectorAgent = new LlmAgent({
        name: 'artistic_director_suite',
        model: geminiModel,
        description: MONARCH_MASTER_MANIFEST.subAgents[3].role,
        instruction: MONARCH_MASTER_MANIFEST.subAgents[3].systemInstruction,
        outputKey: 'artistic_preproduction',
      });

      const brollHarvesterAgent = new LlmAgent({
        name: 'broll_montage_harvester',
        model: geminiModel,
        description: MONARCH_MASTER_MANIFEST.subAgents[4].role,
        instruction: MONARCH_MASTER_MANIFEST.subAgents[4].systemInstruction,
        outputKey: 'broll_montage',
      });

      const timelineTranslatorAgent = new LlmAgent({
        name: 'editor_json_translator',
        model: geminiModel,
        description: MONARCH_MASTER_MANIFEST.subAgents[5].role,
        instruction: MONARCH_MASTER_MANIFEST.subAgents[5].systemInstruction,
        outputKey: 'timeline_spec',
      });

      const hermesAuditorAgent = new LlmAgent({
        name: 'hermes_covenant_auditor',
        model: geminiModel,
        description: MONARCH_MASTER_MANIFEST.subAgents[6].role,
        instruction: MONARCH_MASTER_MANIFEST.subAgents[6].systemInstruction,
        outputKey: 'covenant_audit',
      });

      const pipelineAgent = new SequentialAgent({
        name: 'monarch_production_pipeline',
        description:
          'Google ADK 6-Stage SequentialAgent: PAL -> Brand Guardian -> Artistic Director -> B-Roll Harvester -> Timeline & MP4 Translator -> Hermes Covenant Auditor.',
        subAgents: [
          palAgent,
          brandGuardianAgent,
          artisticDirectorAgent,
          brollHarvesterAgent,
          timelineTranslatorAgent,
          hermesAuditorAgent,
        ],
      });

      const rootAgent = new LlmAgent({
        name: 'monarch_video_orchestrator',
        model: geminiModel,
        description: MONARCH_MASTER_MANIFEST.subAgents[0].role,
        instruction: `${MONARCH_SYSTEM_PROMPT}\n\n${MONARCH_SOUL_MD}`,
        tools: adkFunctionTools,
        subAgents: [
          palAgent,
          brandGuardianAgent,
          artisticDirectorAgent,
          brollHarvesterAgent,
          timelineTranslatorAgent,
          hermesAuditorAgent,
        ],
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
      throw new Error(`Unknown Monarch tool: ${toolName}`);
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
      soulMd: MONARCH_SOUL_MD,
      covenantMd: MONARCH_COVENANT_MD,
      rostrConfigTs: MONARCH_ROSTR_CONFIG_TS,
      systemPromptTxt: MONARCH_SYSTEM_PROMPT,
      masterManifest: MONARCH_MASTER_MANIFEST,
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
