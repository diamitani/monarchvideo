/**
 * MONARCH VIDEO BACKEND AGENT — GOOGLE ADK (`@google/adk`) + ROSTR 6-LAYER RUNTIME
 *
 * Unifies:
 * - Google Agent Development Kit (`LlmAgent`, `SequentialAgent`, `FunctionTool`,
 *   `Runner`, `InMemorySessionService`, `InMemoryArtifactService`, `InMemoryMemoryService`,
 *   `Gemini` backed by `gemini-4-hydrogen`)
 * - ROSTR Layer 1 (`ContextEngine` Hybrid RRF + RAG DAL)
 * - ROSTR Layer 3 (`MCPServer` Stateless JSON-RPC 2.0 `2026-07-28` + Composio enforcement)
 * - ROSTR Layer 4 (`ACPRouter` Open ACP 1.0 + A2A `/.well-known/agent.json` discovery)
 * - ROSTR Layer 5 (`TraceLogger` OpenTelemetry-compatible span forensics)
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
import {
  MONARCH_COVENANT_MD,
  MONARCH_ROSTR_CONFIG_TS,
  MONARCH_SYSTEM_PROMPT,
  monarchRostrConfig,
} from '../config/monarch-config.ts';
import { ACPRouter } from '../rostr/acp-protocol.ts';
import { ContextEngine } from '../rostr/context-engine.ts';
import { MONARCH_GEMINI_MODEL } from '../rostr/gemini-client.ts';
import { MCPServer, assertComposioNamespace } from '../rostr/mcp-protocol.ts';
import { TraceLogger } from '../rostr/trace-logger.ts';
import { runVideoEnvBootstrap, selectOptimalRuntime, assertActiveVideoProvider } from '../skills/video-env-bootstrap.ts';

export interface MonarchAdkRuntime {
  adkVersion: string;
  appName: string;
  sessionService: InMemorySessionService;
  artifactService: InMemoryArtifactService;
  memoryService: InMemoryMemoryService;
  substrate: ContextEngine;
  mcpServer: MCPServer;
  acpRouter: ACPRouter;
  traceLogger: TraceLogger;
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
  };
}

let singletonRuntime: MonarchAdkRuntime | null = null;

export function getMonarchAdkRuntime(publicUrl = 'http://localhost:3000'): MonarchAdkRuntime {
  if (singletonRuntime) return singletonRuntime;

  // Ensure @google/adk picks up GEMINI_API_KEY seamlessly
  if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
    process.env.GOOGLE_GENAI_API_KEY = process.env.GEMINI_API_KEY;
  }

  assertComposioNamespace(monarchRostrConfig.mcpServers, true);

  // 1. ROSTR Layer 1 & 5
  const substrate = new ContextEngine({ namespace: monarchRostrConfig.slug });
  const traceLogger = new TraceLogger({ serviceName: monarchRostrConfig.name });

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
      'HyperFrames (Apache 2.0 HTML/CSS/GSAP/Lottie/Three.js) is the primary agentic renderer. Remotion TSX is secondary for React/data-chart videos (check commercial license for orgs >3 employees).',
    source: 'runtime-policy',
    trustScore: 0.98,
    pinned: true,
    tags: ['hyperframes', 'remotion', 'runtime'],
  });

  // 2. Google ADK Core Services
  const appName = 'monarch_video_studio';
  const sessionService = new InMemorySessionService();
  const artifactService = new InMemoryArtifactService();
  const memoryService = new InMemoryMemoryService();

  // 3. Google ADK FunctionTools (Zod-typed wrappers around Monarch's 4 Core Skills)
  const bootstrapTool = new FunctionTool({
    name: 'video_env_bootstrap',
    description:
      'Inspect programmatic video libraries (HyperFrames, Remotion, OpenMontage, FFmpeg), 2026 model adapters, and active guardrails.',
    parameters: z.object({}),
    execute: async () => runVideoEnvBootstrap(),
  });

  const runtimeSelectorTool = new FunctionTool({
    name: 'select_video_runtime',
    description:
      'Select the optimal programmatic render runtime (HyperFrames, Remotion, or Hybrid Veo 3.1 + HyperFrames) and validate provider guardrails.',
    parameters: z.object({
      prompt: z.string().describe('Creative video request description'),
      templateId: z.string().optional().describe('Optional template identifier'),
      requestedVideoProvider: z.string().optional().describe('Optional requested generative video engine'),
      orgSizeOverThree: z.boolean().optional().describe('Whether the organization has more than 3 employees'),
    }),
    execute: async ({ prompt, templateId, requestedVideoProvider, orgSizeOverThree }) => {
      const runtime = selectOptimalRuntime({ prompt, templateId, orgSizeOverThree });
      const providerCheck = assertActiveVideoProvider(requestedVideoProvider || 'google-veo-3.1');
      return { runtime, providerCheck };
    },
  });

  const brandContextSearchTool = new FunctionTool({
    name: 'composio_context_search',
    description:
      'Search the ROSTR ContextEngine substrate using hybrid RRF + RAG DAL credibility weighting for brand guidelines and prior video episodes.',
    parameters: z.object({
      query: z.string().describe('Search query for brand kits, policies, or past video episodes'),
      topK: z.number().optional().describe('Maximum results to return'),
    }),
    execute: async ({ query, topK }) => {
      const matches = await substrate.query(query, { topK: topK ?? 4 });
      return { matches };
    },
  });

  // 4. Google ADK Specialized Sub-Agents + Sequential Production Pipeline (lazily bound to Gemini key at runtime)
  const agentNames = [
    'monarch_video_orchestrator',
    'monarch_production_pipeline',
    'pal_video_compiler',
    'artistic_director_suite',
    'editor_json_translator',
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
        'GEMINI_API_KEY is not configured on the server. Please select or add your API key in Settings > Secrets.'
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
        description:
          'Runs the 4-stage PAL intent extraction engine and selects the optimal programmatic video runtime.',
        instruction: `${MONARCH_SYSTEM_PROMPT}\nFocus on Sub-Skill B (PAL Intent Extraction): Parse Data, Semantic Analysis, Create Hypothesis, and Master Creative Prompt.`,
        tools: [bootstrapTool, runtimeSelectorTool, brandContextSearchTool],
        outputKey: 'pal_brief',
      });

      const artisticDirectorAgent = new LlmAgent({
        name: 'artistic_director_suite',
        model: geminiModel,
        description:
          'Produces studio pre-production artifacts: Project Brief, Brand/Template Selection, Video Treatment, Storyboard, and Script.',
        instruction: `${MONARCH_SYSTEM_PROMPT}\nFocus on Sub-Skill C (Artistic Pre-Production Suite). Build cohesive visual treatments, shot-by-shot storyboards, and synced voiceover/music cue sheets.`,
        tools: [brandContextSearchTool],
        outputKey: 'artistic_preproduction',
      });

      const timelineTranslatorAgent = new LlmAgent({
        name: 'editor_json_translator',
        model: geminiModel,
        description:
          'Translates approved creative pre-production into strict Universal Video Timeline JSON for HyperFrames or Remotion.',
        instruction: `${MONARCH_SYSTEM_PROMPT}\nFocus on Sub-Skill D (Universal Video Timeline JSON & Bi-Directional Diff Editing). Preserve untouched scenes during conversational edits.`,
        outputKey: 'timeline_spec',
      });

      const pipelineAgent = new SequentialAgent({
        name: 'monarch_production_pipeline',
        description:
          'Deterministic Google ADK SequentialAgent orchestrating PAL -> Artistic Pre-Production -> Timeline Translation.',
        subAgents: [palCompilerAgent, artisticDirectorAgent, timelineTranslatorAgent],
      });

      const rootAgent = new LlmAgent({
        name: 'monarch_video_orchestrator',
        model: geminiModel,
        description:
          'Executive Monarch Video Agent coordinating PAL compilation, artistic direction, runtime selection, and conversational timeline editing.',
        instruction: `${MONARCH_SYSTEM_PROMPT}\n\nYou are backed by Google ADK services (SessionService, ArtifactService, MemoryService) and ROSTR open protocols (MCP 2026-07-28, ACP 1.0). Be concise, concrete, and helpful.`,
        tools: [bootstrapTool, runtimeSelectorTool, brandContextSearchTool],
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

  // 5. ROSTR Layer 3: Stateless MCP 2026-07-28 Server
  const mcpServer = new MCPServer({ name: `${monarchRostrConfig.slug}-mcp`, version: '1.0.0' });
  mcpServer.registerTool({
    name: 'composio_video_bootstrap',
    description: 'Verify HyperFrames, Remotion, OpenMontage, FFmpeg, Google ADK, and 2026 model adapters.',
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
    description: 'Query ROSTR ContextEngine hybrid retrieval (BM25 + Vector RRF + RAG DAL credibility).',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
    handler: async (args) => ({
      matches: await substrate.query(String(args.query || ''), { topK: 4 }),
    }),
  });

  // 6. ROSTR Layer 4: Open ACP 1.0 + A2A Router
  const acpRouter = new ACPRouter({ publicUrl });
  acpRouter.registerAgent({
    name: 'monarch-video-agent',
    description: 'Primary Google ADK + ROSTR programmatic video production orchestrator.',
    capabilities: ['google-adk', 'pal-video-compiler', 'artistic-director-suite', 'editor-json-translator'],
    handler: async ({ input }) => ({
      engine: 'google-adk',
      adkVersion,
      bootstrap: runVideoEnvBootstrap(),
      receivedParts: input.length,
    }),
  });
  acpRouter.registerAgent({
    name: 'artistic-director',
    description: 'Specialist ADK sub-agent for video treatment, storyboard, and script cue sheets.',
    capabilities: ['treatment', 'storyboard', 'script', 'brand-kit'],
    handler: async () => ({
      status: 'READY',
      subSkill: 'artistic-director-suite',
      model: MONARCH_GEMINI_MODEL,
    }),
  });
  acpRouter.registerAgent({
    name: 'timeline-compiler',
    description: 'Specialist ADK sub-agent for Universal Video Timeline JSON -> HyperFrames/Remotion compilation.',
    capabilities: ['timeline-json', 'hyperframes-html', 'remotion-tsx', 'conversational-diff'],
    handler: async () => ({
      status: 'READY',
      subSkill: 'editor-json-translator',
      targets: ['hyperframes', 'remotion'],
    }),
  });
  acpRouter.registerAgent({
    name: 'media-router',
    description: 'Specialist ADK sub-agent for OpenMontage asset routing and Veo 3.1 / Runway / LTX-2.5 guardrails.',
    capabilities: ['video-env-bootstrap', 'veo-3.1', 'sora-retirement-guardrail'],
    handler: async () => runVideoEnvBootstrap(),
  });

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
    const revision = await artifactService.saveArtifact({
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
    return revision;
  }

  async function listSessionArtifacts(params: { userId: string; sessionId: string }): Promise<string[]> {
    await ensureSession(params.userId, params.sessionId);
    return artifactService.listArtifactKeys({
      appName,
      userId: params.userId,
      sessionId: params.sessionId,
    });
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
    mcpServer,
    acpRouter,
    traceLogger,
    saveArtifact,
    listSessionArtifacts,
    runAdkAdvisor,
    getConfigBundle: () => ({
      covenantMd: MONARCH_COVENANT_MD,
      rostrConfigTs: MONARCH_ROSTR_CONFIG_TS,
      systemPromptTxt: MONARCH_SYSTEM_PROMPT,
      discoveryCard: acpRouter.getDiscoveryCard('monarch-video-agent'),
      mcpTools: mcpServer.listToolManifest(),
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
    }),
  };

  return singletonRuntime;
}
