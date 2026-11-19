/**
 * Monarch Video — Full-Stack Express Server
 *
 * Hosts:
 * - Google ADK (`@google/adk`) Runtime, SessionService, ArtifactService, MemoryService
 * - ROSTR 6-Layer Open Protocols (`/.well-known/agent.json`, `/mcp`, `/acp/agents`, `/acp/runs`)
 * - Monarch Video 4 Strengthened Skills (`/api/agent/*`, `/api/studio/*`, `/api/adk/*`)
 * - Vite dev middleware (dev) or static `dist/` (production) on port 3000
 */

import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';

import { getMonarchAdkRuntime } from './agent/adk/monarch-adk-runtime.ts';
import { generateArtisticPreProduction } from './agent/skills/artistic-director-suite.ts';
import {
  applyConversationalTimelinePatch,
  buildTimelineFromPreProduction,
  compileAllTargets,
  validateUniversalTimeline,
} from './agent/skills/editor-json-translator.ts';
import { compilePALIntent } from './agent/skills/pal-video-compiler.ts';
import { runVideoEnvBootstrap } from './agent/skills/video-env-bootstrap.ts';
import type {
  ArtisticPreProduction,
  BrandKit,
  PALInput,
  PALOutput,
  UniversalVideoTimeline,
  VideoProject,
} from './src/types/monarch.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, '.monarch-data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

function createSeedProjects(): VideoProject[] {
  const monarchBrand: BrandKit = {
    brandName: 'Monarch',
    tagline: 'Direct studio-grade video with natural language.',
    primaryColor: '#102D69',
    accentColor: '#D4AF37',
    surfaceColor: '#FAFBFD',
    fontPairing: 'Plus Jakarta Sans + DM Sans',
    logoStyle: 'monarch-crest',
  };

  const auroraBrand: BrandKit = {
    brandName: 'Aurora Optics',
    tagline: 'Precision anamorphic glass, crafted in Munich.',
    primaryColor: '#0E244F',
    accentColor: '#D4AF37',
    surfaceColor: '#F8FAFC',
    fontPairing: 'Plus Jakarta Sans + DM Sans',
    logoStyle: 'monogram-seal',
  };

  const pal1: PALOutput = {
    palVersion: '2.0',
    parseData: {
      topic: 'Monarch Video Platform Launch Film',
      explicitInputs: ['30s 16:9 launch reel', 'Monarch Royal Blue & Gold kit', 'Show PAL -> Storyboard -> Live JSON Edit'],
      aspectRatio: '16:9',
      durationSec: 24,
      platform: 'Product Launch / Web Hero',
      brandSummary: 'Calm, regal, consumer-first workspace pairing editorial precision with deterministic motion design.',
    },
    semanticAnalysis: {
      audiencePersona: 'Creative directors, product marketers, and founder-led teams shipping launch films weekly.',
      emotionalArc: 'Quiet intrigue -> architectural clarity -> effortless creative mastery -> confident brand resonance.',
      pacing: 'Crisp & Kinetic',
      visualGrammar: 'Editorial Swiss typography on deep royal navy planes, hairline satin-gold dividers, deliberate eased reveals.',
      projectClassification: 'Product Launch',
    },
    hypothesis: {
      creativeStrategy:
        'Anchor the reel in deterministic HyperFrames kinetic typography with one Veo 3.1 atmospheric studio establishing shot so every headline, metric, and brand lockup remains editable as structured JSON.',
      selectedRuntime: 'hybrid-veo-hyperframes',
      runtimeRationale:
        'Combines photorealistic studio B-roll with deterministic Apache-2.0 HyperFrames HTML/GSAP typography and zero per-seat licensing overhead.',
      generativeVideoEngine: 'Google Veo 3.1 (fallback: Runway Gen-4.5 / Kling 4.0 / LTX-2.5)',
      licenseAdvisory: null,
      costEstimate: {
        estimatedTokens: 6400,
        byokEstimatedUsd: 0.72,
        managedCredits: 28,
        renderSecondsEstimate: 34,
        costBreakdown: [
          { stage: 'PAL & Pre-Production (Gemini 4)', detail: '6,400 est. tokens across 4 stages', usdEstimate: 0.01 },
          { stage: 'Voiceover & Music Stems', detail: '24s synced VO + chamber string pulse', usdEstimate: 0.06 },
          { stage: 'Generative B-Roll (Veo 3.1)', detail: '2 hero clips + HyperFrames compositing', usdEstimate: 0.65 },
        ],
      },
    },
    masterCreativePrompt:
      'Produce a 24-second 16:9 flagship launch film for Monarch Video in deep Royal Blue (#102D69), Satin Gold (#D4AF37), and crisp Alabaster (#FAFBFD). Open with a calm editorial hook contrasting raw natural language against full studio pre-production, progress through PAL compilation, live storyboard framing, and non-destructive JSON editing, and close on the mirrored-lion Monarch crest with a measured call to action.',
  };

  const pre1: ArtisticPreProduction = {
    projectBrief: {
      title: 'Monarch Flagship Launch Reel',
      objective: 'Demonstrate how one natural-language brief becomes an editable studio video.',
      deliverableType: 'Product Launch',
      targetAudience: 'Founders, brand studios, and product marketing leads',
      primaryCta: 'Direct your first film at monarch.video',
    },
    templateSelection: {
      templateId: 'editorial-launch',
      templateName: 'Regal Editorial Launch',
      lowerThirdStyle: 'Hairline gold rule with crisp sans-serif caption',
      transitionPack: 'Gold wipe & measured cross-dissolve',
      typographyScale: 'Plus Jakarta Sans 80px display / DM Sans 30px body',
    },
    videoTreatment: {
      logline: 'One sentence enters; an entire creative department compiles, directs, and renders on command.',
      visualMood: 'Serene architectural authority—fluted navy surfaces, crisp alabaster plates, restrained gold geometry.',
      lightingAndMotion: 'Soft directional skylight with smooth power3.out typography rises and zero harsh bounce.',
      soundscapeAndMusic: 'Minimalist cello ostinato at 96 BPM with soft analog felt piano and muted air-whoosh transitions.',
      voiceoverDirection: 'Composed, warm, unhurried documentary narrator with crisp diction.',
      narrativeHook: 'Great videos are not generated by chance—they are directed.',
    },
    storyboard: [
      {
        sceneId: 'scene-1',
        sceneNumber: 1,
        title: 'The Opening Hook',
        durationSec: 6,
        visualFraming: 'Full-bleed deep royal blue architectural canvas with centered kinetic headline and subtle gold hairline.',
        motionChoreography: 'Headline rises 32px with power3.out easing; gold rule draws left-to-right at 0.8s.',
        assetSource: 'veo-3.1',
        visualPrompt: 'Serene architectural motion studio bathed in soft skylight, royal blue fluted paneling and subtle gold light refraction.',
        onScreenText: 'Great films are directed, not rolled.',
        subText: 'Start from plain English. Keep full creative command.',
      },
      {
        sceneId: 'scene-2',
        sceneNumber: 2,
        title: 'PAL & Artistic Pre-Production',
        durationSec: 6,
        visualFraming: 'Crisp alabaster editorial split showing treatment, storyboard frames, and synced voiceover timecodes.',
        motionChoreography: 'Clean horizontal wipe revealing structured scene cards in crisp cadence.',
        assetSource: 'programmatic-html',
        visualPrompt: 'Editorial alabaster layout with royal blue typography and thin metallic gold timeline track.',
        onScreenText: 'Treatment, storyboard, and script in sync.',
        subText: 'Four-stage PAL compilation locks brand palette, pacing, and voice before a single frame renders.',
      },
      {
        sceneId: 'scene-3',
        sceneNumber: 3,
        title: 'Non-Destructive Timeline JSON',
        durationSec: 6,
        visualFraming: 'Midnight navy programmatic editor frame highlighting a single scene color and timing diff.',
        motionChoreography: 'Scale-settle focus on scene 2 patch while neighboring scenes remain locked.',
        assetSource: 'programmatic-html',
        visualPrompt: 'Deep navy code-to-motion stage showing HyperFrames GSAP and Remotion TSX deterministic compilation.',
        onScreenText: 'Edit one scene. Preserve the rest.',
        subText: 'Conversational diffs patch canonical Timeline JSON and re-compile to HyperFrames or Remotion.',
      },
      {
        sceneId: 'scene-4',
        sceneNumber: 4,
        title: 'Monarch Crest Outro',
        durationSec: 6,
        visualFraming: 'Regal centered Monarch mirrored-lion crest in satin gold over royal blue velvet gradient.',
        motionChoreography: 'Slow cross-dissolve into crest lockup with measured gold underline CTA.',
        assetSource: 'programmatic-html',
        visualPrompt: 'Minimalist luxury end-card in Royal Blue #102D69 with Satin Gold #D4AF37 brand insignia.',
        onScreenText: 'Monarch Video',
        subText: 'Direct your first film at monarch.video',
      },
    ],
    scriptAndCueSheet: [
      {
        timecode: '00:00 - 00:06',
        startSec: 0,
        endSec: 6,
        sceneId: 'scene-1',
        voiceover: 'Great films are never accidental. They begin with clear intent, deliberate pacing, and unmistakable taste.',
        kineticHeadline: 'Great films are directed, not rolled.',
        sfxCue: 'Warm low chime + subtle room tone',
        musicCue: 'Cello ostinato enters at -16dB',
      },
      {
        timecode: '00:06 - 00:12',
        startSec: 6,
        endSec: 12,
        sceneId: 'scene-2',
        voiceover: 'Describe your vision in plain English. Monarch drafts the treatment, storyboard, and time-coded script before rendering.',
        kineticHeadline: 'Treatment, storyboard, and script in sync.',
        sfxCue: 'Crisp paper-turn transition',
        musicCue: 'Felt piano motif layers in',
      },
      {
        timecode: '00:12 - 00:18',
        startSec: 12,
        endSec: 18,
        sceneId: 'scene-3',
        voiceover: 'Every scene compiles into editable Timeline JSON—so changing a headline, color, or beat never breaks your cut.',
        kineticHeadline: 'Edit one scene. Preserve the rest.',
        sfxCue: 'Precision mechanical detent click',
        musicCue: 'Strings swell cleanly',
      },
      {
        timecode: '00:18 - 00:24',
        startSec: 18,
        endSec: 24,
        sceneId: 'scene-4',
        voiceover: 'Monarch Video. Bring your own keys or run through our gateway—and ship studio work in minutes.',
        kineticHeadline: 'Monarch Video',
        sfxCue: 'Soft resonant brass tail',
        musicCue: 'Resolve on major ninth chord',
      },
    ],
    finalProductionPrompt: pal1.masterCreativePrompt,
  };

  const timeline1 = buildTimelineFromPreProduction({
    pal: pal1,
    preProduction: pre1,
    brandKit: monarchBrand,
  });

  const pal2: PALOutput = {
    palVersion: '2.0',
    parseData: {
      topic: 'Aurora Cine 50mm Anamorphic Hardware Launch',
      explicitInputs: ['18s 9:16 social product drop', 'Matte navy & brushed brass hardware aesthetic'],
      aspectRatio: '9:16',
      durationSec: 18,
      platform: 'Instagram Reels / YouTube Shorts',
      brandSummary: 'Precision German optical craft presented with restraint and tactile material focus.',
    },
    semanticAnalysis: {
      audiencePersona: 'Cinematographers, commercial DPs, and independent studio owners.',
      emotionalArc: 'Tactile curiosity -> optical authority -> collector desire.',
      pacing: 'High-Tempo Hook',
      visualGrammar: 'Vertical macro framing paired with Swiss technical callouts in tabular monospace.',
      projectClassification: 'Ad',
    },
    hypothesis: {
      creativeStrategy: 'Use HyperFrames kinetic vertical overlays over Veo 3.1 macro lens lighting sweeps for crisp 9:16 retention.',
      selectedRuntime: 'hyperframes',
      runtimeRationale: 'Apache-2.0 HyperFrames delivers ultra-crisp 1080x1920 vertical typography and sub-second preview edits.',
      generativeVideoEngine: 'Programmatic HTML/GSAP + Veo 3.1 optional macro B-roll',
      licenseAdvisory: null,
      costEstimate: {
        estimatedTokens: 4900,
        byokEstimatedUsd: 0.14,
        managedCredits: 12,
        renderSecondsEstimate: 9,
        costBreakdown: [
          { stage: 'PAL & Pre-Production (Gemini 4)', detail: '4,900 est. tokens', usdEstimate: 0.01 },
          { stage: 'Voiceover & Music Stems', detail: '18s synced narration + percussive bed', usdEstimate: 0.05 },
          { stage: 'Programmatic Motion Render', detail: '3 deterministic vertical scenes', usdEstimate: 0.08 },
        ],
      },
    },
    masterCreativePrompt:
      'Create an 18-second 9:16 vertical product drop for the Aurora Cine 50mm T1.5 Anamorphic lens in matte navy (#0E244F) and brushed brass (#D4AF37). Keep pacing tight with 3 crisp vertical scenes highlighting optical clarity, brass focus gears, and limited first-batch reservation.',
  };

  const pre2: ArtisticPreProduction = {
    projectBrief: {
      title: 'Aurora Cine 50mm Vertical Drop',
      objective: 'Drive pre-orders for the brushed-brass 50mm anamorphic cinema lens.',
      deliverableType: 'Ad',
      targetAudience: 'Cinematographers and commercial directors',
      primaryCta: 'Reserve Batch 01 at auroraoptics.de',
    },
    templateSelection: {
      templateId: 'social-vertical-drop',
      templateName: 'Vertical Hardware Drop',
      lowerThirdStyle: 'Tabular monospace focal-length spec bar',
      transitionPack: 'Crisp cut & brass wipe',
      typographyScale: 'Plus Jakarta Sans 72px vertical stack',
    },
    videoTreatment: {
      logline: 'Machined brass meets anamorphic warmth in a 50mm T1.5 prime built to outlast trends.',
      visualMood: 'Honed dark slate, brushed brass warmth, razor-sharp optical precision.',
      lightingAndMotion: 'Golden rim sweeps with tight spring-damped title locks.',
      soundscapeAndMusic: 'Tactile focus-ring clicks synced to minimalist percussive pulse at 120 BPM.',
      voiceoverDirection: 'Understated, technical, confident.',
      narrativeHook: 'Glass that bends light without bending truth.',
    },
    storyboard: [
      {
        sceneId: 'scene-1',
        sceneNumber: 1,
        title: 'Anamorphic Reveal',
        durationSec: 6,
        visualFraming: 'Vertical hero lockup introducing 50mm T1.5 Anamorphic.',
        motionChoreography: 'Immediate kinetic reveal on frame 1 for mobile retention.',
        assetSource: 'programmatic-html',
        visualPrompt: 'Matte navy and brushed brass cinema lens resting on slate stone in golden rim light.',
        onScreenText: '50mm T1.5. Pure brass craft.',
        subText: 'Machined in Munich for anamorphic cinema.',
      },
      {
        sceneId: 'scene-2',
        sceneNumber: 2,
        title: 'Optical Precision',
        durationSec: 6,
        visualFraming: 'Clean alabaster technical spec callout.',
        motionChoreography: 'Horizontal gold rule sweep with crisp spec reveal.',
        assetSource: 'programmatic-html',
        visualPrompt: 'Alabaster technical plate highlighting 2x squeeze ratio and zero focus breathing.',
        onScreenText: 'Zero breathing. 2x organic flare.',
        subText: 'Hand-calibrated 300-degree focus throw.',
      },
      {
        sceneId: 'scene-3',
        sceneNumber: 3,
        title: 'Batch 01 Reservation',
        durationSec: 6,
        visualFraming: 'Deep navy closing lockup with Batch 01 CTA.',
        motionChoreography: 'Measured fade-rise into reservation URL.',
        assetSource: 'programmatic-html',
        visualPrompt: 'Aurora Optics seal in brushed gold over deep navy.',
        onScreenText: 'Aurora Cine I',
        subText: 'Reserve Batch 01 at auroraoptics.de',
      },
    ],
    scriptAndCueSheet: [
      {
        timecode: '00:00 - 00:06',
        startSec: 0,
        endSec: 6,
        sceneId: 'scene-1',
        voiceover: 'Fifty millimeters. T-one-point-five. Machined from solid brass for filmmakers who still care about glass.',
        kineticHeadline: '50mm T1.5. Pure brass craft.',
        sfxCue: 'Crisp aperture ring detent',
        musicCue: 'Minimal sub-bass pulse',
      },
      {
        timecode: '00:06 - 00:12',
        startSec: 6,
        endSec: 12,
        sceneId: 'scene-2',
        voiceover: 'Zero focus breathing and a genuine two-x anamorphic squeeze—calibrated by hand in Munich.',
        kineticHeadline: 'Zero breathing. 2x organic flare.',
        sfxCue: 'Smooth gear glide',
        musicCue: 'Percussive tick joins',
      },
      {
        timecode: '00:12 - 00:18',
        startSec: 12,
        endSec: 18,
        sceneId: 'scene-3',
        voiceover: 'Aurora Cine One. Numbered Batch One reservations are open now.',
        kineticHeadline: 'Aurora Cine I',
        sfxCue: 'Soft metallic resolve',
        musicCue: 'Clean cut to silence',
      },
    ],
    finalProductionPrompt: pal2.masterCreativePrompt,
  };

  const timeline2 = buildTimelineFromPreProduction({
    pal: pal2,
    preProduction: pre2,
    brandKit: auroraBrand,
  });

  return [
    {
      id: 'proj-monarch-launch',
      title: 'Monarch Flagship Launch Reel',
      prompt:
        'Create a 24-second 16:9 launch film for Monarch Video in our Royal Blue and Satin Gold brand kit showing how one plain-English prompt compiles into a treatment, storyboard, script, and editable Timeline JSON.',
      status: 'compiled',
      createdAt: new Date(Date.now() - 86_400_000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3_600_000 * 4).toISOString(),
      version: 2,
      aspectRatio: '16:9',
      durationSec: 24,
      runtime: 'hybrid-veo-hyperframes',
      routingMode: 'managed-gateway',
      brandKit: monarchBrand,
      pal: pal1,
      preProduction: pre1,
      timeline: timeline1,
      compiled: compileAllTargets(timeline1),
      editHistory: [
        {
          version: 2,
          timestamp: new Date(Date.now() - 3_600_000 * 4).toISOString(),
          instruction: 'Tighten scene 1 headline and emphasize non-destructive editing in scene 3.',
          diffSummary: 'Updated headline copy in scene-1 and scene-3 while preserving scene-2 and scene-4 timings.',
          patchedSceneIds: ['scene-1', 'scene-3'],
        },
      ],
    },
    {
      id: 'proj-aurora-cine',
      title: 'Aurora Cine 50mm Vertical Drop',
      prompt:
        'Direct an 18-second 9:16 vertical product launch ad for Aurora Optics 50mm T1.5 brushed brass anamorphic lens with crisp technical callouts and high-tempo pacing.',
      status: 'compiled',
      createdAt: new Date(Date.now() - 86_400_000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86_400_000).toISOString(),
      version: 1,
      aspectRatio: '9:16',
      durationSec: 18,
      runtime: 'hyperframes',
      routingMode: 'byok-server',
      brandKit: auroraBrand,
      pal: pal2,
      preProduction: pre2,
      timeline: timeline2,
      compiled: compileAllTargets(timeline2),
      editHistory: [],
    },
  ];
}

function loadProjects(): VideoProject[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PROJECTS_FILE)) {
      const seeds = createSeedProjects();
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(seeds, null, 2), 'utf8');
      return seeds;
    }
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as VideoProject[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : createSeedProjects();
  } catch {
    return createSeedProjects();
  }
}

function saveProjects(projects: VideoProject[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist projects:', err);
  }
}

function readSkillBundleFiles(): Record<string, string> {
  const skillRoot = path.join(__dirname, 'skills/monarch-video');
  const files = [
    'SKILL.md',
    'scripts/bootstrap-env.sh',
    'references/timeline-schema.md',
    'references/rostr-agent-stack.md',
  ];
  const out: Record<string, string> = {};
  for (const rel of files) {
    const full = path.join(skillRoot, rel);
    if (fs.existsSync(full)) {
      out[rel] = fs.readFileSync(full, 'utf8');
    }
  }
  return out;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  const publicUrl = process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
    ? process.env.APP_URL
    : `http://localhost:${PORT}`;

  const adkRuntime = getMonarchAdkRuntime(publicUrl);
  let projects = loadProjects();

  // --- ROSTR Open Protocol Endpoints ---
  app.get('/.well-known/agent.json', (_req, res) => {
    res.json(adkRuntime.acpRouter.getDiscoveryCard('monarch-video-agent'));
  });

  app.post('/mcp', async (req, res) => {
    const trace = adkRuntime.traceLogger.startTrace('rostr.mcp.rpc', {
      method: req.body?.method || 'unknown',
    });
    try {
      const rpcResponse = await adkRuntime.mcpServer.handleJsonRpc(req.body);
      trace.finish('OK');
      res.json(rpcResponse);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      res.status(500).json({ error: msg });
    }
  });

  app.get('/acp/agents', (_req, res) => {
    res.json({ agents: adkRuntime.acpRouter.listAgents() });
  });

  app.post('/acp/runs', async (req, res) => {
    const trace = adkRuntime.traceLogger.startTrace('rostr.acp.run', {
      agent: req.body?.agent_name || 'monarch-video-agent',
    });
    try {
      const run = await adkRuntime.acpRouter.createRun({
        agentName: req.body?.agent_name || 'monarch-video-agent',
        input: req.body?.input || [],
        mode: req.body?.mode || 'sync',
        metadata: req.body?.metadata || {},
      });
      trace.finish('OK', { runId: run.run_id, status: run.status });
      res.json(run);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      res.status(400).json({ error: msg });
    }
  });

  app.get('/acp/runs/:runId', (req, res) => {
    const run = adkRuntime.acpRouter.getRun(req.params.runId);
    if (!run) return res.status(404).json({ error: 'ACP run not found' });
    return res.json(run);
  });

  // --- Agent Bootstrap, Config, Skill Bundle & Traces ---
  app.get('/api/agent/bootstrap', (_req, res) => {
    res.json(runVideoEnvBootstrap());
  });

  app.get('/api/agent/config', (_req, res) => {
    res.json({
      ...adkRuntime.getConfigBundle(),
      skillBundle: readSkillBundleFiles(),
    });
  });

  app.get('/api/agent/traces', (_req, res) => {
    res.json({ spans: adkRuntime.traceLogger.getRecentSpans(50) });
  });

  // --- Google ADK Interactive Runner & Artifact Service ---
  app.post('/api/adk/chat', async (req, res) => {
    try {
      const prompt = String(req.body?.prompt || '').trim();
      const sessionId = String(req.body?.sessionId || `sess_${crypto.randomUUID().slice(0, 8)}`);
      const userId = String(req.body?.userId || 'monarch-creator');

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }
      const result = await adkRuntime.runAdkAdvisor({ userId, sessionId, prompt });
      return res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  });

  app.get('/api/adk/artifacts/:sessionId', async (req, res) => {
    try {
      const userId = String(req.query.userId || 'monarch-creator');
      const keys = await adkRuntime.listSessionArtifacts({
        userId,
        sessionId: req.params.sessionId,
      });
      res.json({ sessionId: req.params.sessionId, artifacts: keys });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- Monarch Video Studio Pipeline Endpoints ---
  app.post('/api/studio/pal', async (req, res) => {
    const input = req.body as PALInput & { projectId?: string };
    const trace = adkRuntime.traceLogger.startTrace('skill.pal_video_compiler', {
      aspectRatio: input.aspectRatio,
      durationSec: input.durationSec,
      templateId: input.templateId,
      routingMode: input.routingMode,
    });

    try {
      if (!input.prompt || !input.prompt.trim()) {
        trace.finish('BLOCKED', { reason: 'Empty prompt' });
        return res.status(400).json({ error: 'Please describe your video idea before compiling PAL intent.' });
      }

      const contextMatches = await adkRuntime.substrate.query(
        `${input.prompt} ${input.brandKit?.brandName || ''}`,
        { topK: 3 }
      );
      const pal = await compilePALIntent(
        input,
        contextMatches.map((m) => `[${m.source}] ${m.content}`)
      );

      const sessionId = input.projectId || `proj-${crypto.randomUUID().slice(0, 8)}`;
      await adkRuntime.saveArtifact({
        userId: 'monarch-creator',
        sessionId,
        filename: 'pal-brief.json',
        mimeType: 'application/json',
        content: JSON.stringify(pal, null, 2),
      });

      await adkRuntime.substrate.recordEpisode({
        traceId: trace.traceId,
        intent: input.prompt,
        outcome: 'PAL_COMPILED',
        success: true,
        summary: `PAL compiled for "${pal.parseData.topic}" (${pal.hypothesis.selectedRuntime}, ${input.aspectRatio}, ${input.durationSec}s).`,
        tags: ['pal', pal.hypothesis.selectedRuntime],
      });

      trace.finish('OK', { selectedRuntime: pal.hypothesis.selectedRuntime });
      return res.json({ pal, traceId: trace.traceId, sessionId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      return res.status(500).json({ error: msg });
    }
  });

  app.post('/api/studio/preproduction', async (req, res) => {
    const { pal, brandKit, templateId, projectId } = req.body as {
      pal: PALOutput;
      brandKit: BrandKit;
      templateId: string;
      projectId?: string;
    };

    const trace = adkRuntime.traceLogger.startTrace('skill.artistic_director_suite', {
      topic: pal?.parseData?.topic,
      templateId,
    });

    try {
      if (!pal || !brandKit) {
        return res.status(400).json({ error: 'Approved PAL output and Brand Kit are required.' });
      }
      const preProduction = await generateArtisticPreProduction({
        pal,
        brandKit,
        templateId: templateId || 'editorial-launch',
      });

      const sessionId = projectId || `proj-${crypto.randomUUID().slice(0, 8)}`;
      await adkRuntime.saveArtifact({
        userId: 'monarch-creator',
        sessionId,
        filename: 'preproduction.json',
        mimeType: 'application/json',
        content: JSON.stringify(preProduction, null, 2),
      });

      trace.finish('OK', { scenes: preProduction.storyboard.length });
      return res.json({ preProduction, traceId: trace.traceId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      return res.status(500).json({ error: msg });
    }
  });

  app.post('/api/studio/compile', async (req, res) => {
    const { pal, preProduction, brandKit, timeline: directTimeline, projectId } = req.body as {
      pal?: PALOutput;
      preProduction?: ArtisticPreProduction;
      brandKit?: BrandKit;
      timeline?: UniversalVideoTimeline;
      projectId?: string;
    };

    const trace = adkRuntime.traceLogger.startTrace('skill.editor_json_translator', {
      mode: directTimeline ? 'direct-recompile' : 'from-preproduction',
    });

    try {
      const timeline =
        directTimeline ||
        (pal && preProduction && brandKit
          ? buildTimelineFromPreProduction({ pal, preProduction, brandKit })
          : null);

      if (!timeline) {
        return res.status(400).json({ error: 'Provide either approved pre-production artifacts or a Timeline JSON.' });
      }

      const validation = validateUniversalTimeline(timeline);
      if (!validation.valid) {
        trace.finish('BLOCKED', { errors: validation.errors });
        return res.status(400).json({
          error: `Timeline JSON schema validation failed: ${validation.errors.join(' ')}`,
          validation,
        });
      }

      const compiled = compileAllTargets(timeline);
      const sessionId = projectId || `proj-${crypto.randomUUID().slice(0, 8)}`;

      await Promise.all([
        adkRuntime.saveArtifact({
          userId: 'monarch-creator',
          sessionId,
          filename: 'timeline.json',
          mimeType: 'application/json',
          content: JSON.stringify(timeline, null, 2),
        }),
        adkRuntime.saveArtifact({
          userId: 'monarch-creator',
          sessionId,
          filename: 'hyperframes.html',
          mimeType: 'text/html',
          content: compiled.hyperframesHtml,
        }),
        adkRuntime.saveArtifact({
          userId: 'monarch-creator',
          sessionId,
          filename: 'remotion.tsx',
          mimeType: 'text/plain',
          content: compiled.remotionTsx,
        }),
      ]);

      trace.finish('OK', {
        runtime: timeline.renderRuntime,
        sceneCount: timeline.scenes.length,
      });

      return res.json({ timeline, compiled, traceId: trace.traceId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      return res.status(500).json({ error: msg });
    }
  });

  app.post('/api/studio/patch', async (req, res) => {
    const { timeline, instruction, projectId } = req.body as {
      timeline: UniversalVideoTimeline;
      instruction: string;
      projectId?: string;
    };

    const trace = adkRuntime.traceLogger.startTrace('skill.conversational_diff_patch', {
      instruction,
    });

    try {
      if (!timeline || !instruction?.trim()) {
        return res.status(400).json({ error: 'Timeline JSON and edit instruction are required.' });
      }

      const patchResult = await applyConversationalTimelinePatch({ timeline, instruction });
      const sessionId = projectId || `proj-${crypto.randomUUID().slice(0, 8)}`;

      await adkRuntime.saveArtifact({
        userId: 'monarch-creator',
        sessionId,
        filename: `timeline-v${patchResult.timeline.projectMeta.version}.json`,
        mimeType: 'application/json',
        content: JSON.stringify(patchResult.timeline, null, 2),
      });

      await adkRuntime.substrate.recordEpisode({
        traceId: trace.traceId,
        intent: instruction,
        outcome: 'PATCHED',
        success: true,
        summary: `Patched [${patchResult.patchedSceneIds.join(', ')}] in "${patchResult.timeline.projectMeta.title}": ${patchResult.diffSummary}`,
        tags: ['patch', ...patchResult.patchedSceneIds],
      });

      trace.finish('OK', {
        patchedSceneIds: patchResult.patchedSceneIds,
        untouchedSceneIds: patchResult.untouchedSceneIds,
      });

      return res.json({ ...patchResult, traceId: trace.traceId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      return res.status(500).json({ error: msg });
    }
  });

  // --- Persistent Project Library ---
  app.get('/api/studio/projects', (_req, res) => {
    res.json({ projects });
  });

  app.post('/api/studio/projects', (req, res) => {
    const incoming = req.body as VideoProject;
    if (!incoming || !incoming.id) {
      return res.status(400).json({ error: 'Valid project object with id is required.' });
    }
    const idx = projects.findIndex((p) => p.id === incoming.id);
    if (idx >= 0) {
      projects[idx] = { ...incoming, updatedAt: new Date().toISOString() };
    } else {
      projects = [{ ...incoming, updatedAt: new Date().toISOString() }, ...projects];
    }
    saveProjects(projects);
    return res.json({ project: incoming, total: projects.length });
  });

  app.delete('/api/studio/projects/:id', (req, res) => {
    projects = projects.filter((p) => p.id !== req.params.id);
    saveProjects(projects);
    return res.json({ ok: true, total: projects.length });
  });

  // --- Frontend Serving (Vite Middleware in Dev / Static dist in Production) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Monarch Video (Google ADK + ROSTR Stack) listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Monarch Video server:', err);
  process.exit(1);
});
