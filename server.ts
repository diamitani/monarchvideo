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

import {
  ANIMATION_PRESET_SPECS,
  MUSIC_PRESET_SPECS,
  OPENMONTAGE_VIDEO_PRESETS,
  getMonarchAdkRuntime,
} from './agent/adk/monarch-adk-runtime.ts';
import { generateArtisticPreProduction } from './agent/skills/artistic-director-suite.ts';
import {
  applyConversationalTimelinePatch,
  buildTimelineFromPreProduction,
  compileAllTargets,
  validateUniversalTimeline,
} from './agent/skills/editor-json-translator.ts';
import { compilePALIntent } from './agent/skills/pal-video-compiler.ts';
import { runVideoEnvBootstrap } from './agent/skills/video-env-bootstrap.ts';
import { runFullMonarchVerification } from './agent/verify/verify-monarch-stack.ts';
import type {
  AnimationPresetId,
  ArtisticPreProduction,
  BrandKit,
  MediaAsset,
  MusicPresetId,
  OpenMontageVideoPresetId,
  PALInput,
  PALOutput,
  UniversalVideoTimeline,
  VideoProject,
  VoiceoverVoiceName,
  WorkspaceIntegration,
} from './src/types/monarch.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, '.monarch-data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
const INTEGRATIONS_FILE = path.join(DATA_DIR, 'integrations.json');

function ensureDataDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function createSeedAssets(): MediaAsset[] {
  return [
    {
      id: 'asset-studio-still',
      name: 'Monarch Studio Architectural Frame.jpg',
      category: 'image',
      mimeType: 'image/jpeg',
      sizeBytes: 248120,
      url: '/src/assets/images/monarch_hero_studio_1795058371767.jpg',
      tags: ['brand', 'hero', '16:9'],
      createdAt: new Date(Date.now() - 86_400_000 * 3).toISOString(),
    },
    {
      id: 'asset-cinema-lens',
      name: 'Aurora 50mm Anamorphic Product Still.jpg',
      category: 'image',
      mimeType: 'image/jpeg',
      sizeBytes: 194500,
      url: '/src/assets/images/monarch_showcase_launch_1795058373184.jpg',
      tags: ['hardware', 'product', 'launch'],
      createdAt: new Date(Date.now() - 86_400_000 * 2).toISOString(),
    },
    {
      id: 'asset-brand-atelier',
      name: 'Copenhagen Atelier Storyboard Plate.jpg',
      category: 'image',
      mimeType: 'image/jpeg',
      sizeBytes: 210400,
      url: '/src/assets/images/monarch_showcase_brandfilm_1795058372638.jpg',
      tags: ['editorial', 'brand-film'],
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
  ];
}

function createSeedIntegrations(publicUrl: string): WorkspaceIntegration[] {
  return [
    {
      id: 'youtube',
      name: 'YouTube Studio',
      category: 'social',
      description: 'Publish finished 16:9 videos and 9:16 Shorts directly to your channel drafts.',
      connected: false,
      statusLabel: 'Ready to connect',
    },
    {
      id: 'instagram-reels',
      name: 'Instagram Reels',
      category: 'social',
      description: 'Export vertical 9:16 cuts with synced captions for scheduled Reels publishing.',
      connected: false,
      statusLabel: 'Ready to connect',
    },
    {
      id: 'tiktok',
      name: 'TikTok Creator',
      category: 'social',
      description: 'Send vertical product drops directly to your TikTok inbox as drafts.',
      connected: false,
      statusLabel: 'Ready to connect',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Company Page',
      category: 'social',
      description: 'Share launch films and product walkthroughs directly to company feeds.',
      connected: false,
      statusLabel: 'Ready to connect',
    },
    {
      id: 'google-drive',
      name: 'Google Drive & Brand Vault',
      category: 'storage',
      description: 'Import logos, font guidelines, and product photography into Content & Files.',
      connected: true,
      statusLabel: 'Workspace synced',
    },
    {
      id: 'github-export',
      name: 'GitHub Video Code Export',
      category: 'workflow',
      description: 'Push editable HTML/GSAP and React video templates directly to a repository.',
      connected: true,
      statusLabel: 'Ready to export',
    },
    {
      id: 'agent-webhook',
      name: 'External Agent Connector',
      category: 'workflow',
      description: 'Connect external automation tools, Slack bots, or custom agent harnesses via standard endpoints.',
      connected: true,
      statusLabel: 'Active',
      endpointHint: `${publicUrl}/.well-known/agent.json`,
    },
  ];
}

function loadJsonFile<T>(filePath: string, fallbackFactory: () => T): T {
  try {
    ensureDataDirs();
    if (!fs.existsSync(filePath)) {
      const seed = fallbackFactory();
      fs.writeFileSync(filePath, JSON.stringify(seed, null, 2), 'utf8');
      return seed;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallbackFactory();
  }
}

function saveJsonFile<T>(filePath: string, data: T) {
  try {
    ensureDataDirs();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Failed to persist ${path.basename(filePath)}:`, err);
  }
}

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
      topic: 'Monarch Flagship Launch Reel',
      explicitInputs: ['24s 16:9 launch reel', 'Royal Blue & Satin Gold brand kit', 'Warm studio voiceover'],
      aspectRatio: '16:9',
      durationSec: 24,
      platform: 'Product Launch / Web Hero',
      brandSummary: 'Calm, regal visual language pairing crisp editorial typography with fluid motion.',
    },
    semanticAnalysis: {
      audiencePersona: 'Founders, creative directors, and product marketing leads shipping launch videos weekly.',
      emotionalArc: 'Quiet intrigue -> visual clarity -> effortless creative control -> memorable brand close.',
      pacing: 'Crisp & Kinetic',
      visualGrammar: 'Editorial display typography on deep royal navy planes, thin satin-gold dividers, smooth eased reveals.',
      projectClassification: 'Product Launch',
    },
    hypothesis: {
      creativeStrategy:
        'Lead with crisp motion typography and an atmospheric establishing opening so every headline, caption, and end-card remains instantly editable.',
      selectedRuntime: 'hybrid-veo-hyperframes',
      runtimeRationale:
        'Pairs photorealistic opening footage with crisp, editable brand typography and instant scene-level previews.',
      generativeVideoEngine: 'Google Veo 3.1 (fallback: Runway Gen-4.5 / Kling 4.0 / LTX-2.5)',
      licenseAdvisory: null,
      costEstimate: {
        estimatedTokens: 6400,
        byokEstimatedUsd: 0.72,
        managedCredits: 28,
        renderSecondsEstimate: 34,
        costBreakdown: [
          { stage: 'Script & Storyboard Plan', detail: '4 scenes with synced captions', usdEstimate: 0.01 },
          { stage: 'Studio Voiceover & Underscore', detail: '24s narration + chamber cello score', usdEstimate: 0.06 },
          { stage: 'Visual Compositing & Export', detail: '1080p 30fps master render', usdEstimate: 0.65 },
        ],
      },
    },
    masterCreativePrompt:
      'Produce a 24-second 16:9 flagship launch film for Monarch in deep Royal Blue (#102D69), Satin Gold (#D4AF37), and crisp Alabaster (#FAFBFD). Open with a memorable hook, showcase the streamlined storyboard-to-cut workflow, highlight instant single-scene editing, and close on the Monarch crest.',
  };

  const pre1: ArtisticPreProduction = {
    projectBrief: {
      title: 'Monarch Flagship Launch Reel',
      objective: 'Show how one clear sentence turns into a finished, editable brand video.',
      deliverableType: 'Product Launch',
      targetAudience: 'Founders, brand studios, and product marketing leads',
      primaryCta: 'Start creating at monarch.video',
    },
    templateSelection: {
      templateId: 'editorial-launch',
      templateName: 'Regal Editorial Launch',
      lowerThirdStyle: 'Thin satin-gold rule with clean sans-serif caption',
      transitionPack: 'Gold wipe & smooth cross-dissolve',
      typographyScale: 'Plus Jakarta Sans display / DM Sans body',
    },
    videoTreatment: {
      logline: 'One idea enters; a complete storyboard, voiceover, and editable brand cut emerges in minutes.',
      visualMood: 'Serene architectural authority—fluted navy surfaces, bright alabaster plates, restrained gold geometry.',
      lightingAndMotion: 'Soft directional skylight with smooth upward typography reveals and balanced timing.',
      soundscapeAndMusic: 'Minimalist cello ostinato at 96 BPM with soft felt piano and subtle air transitions.',
      voiceoverDirection: 'Composed, warm, unhurried documentary narrator with crisp diction.',
      narrativeHook: 'Great videos are not left to chance—they are directed.',
    },
    storyboard: [
      {
        sceneId: 'scene-1',
        sceneNumber: 1,
        title: 'The Opening Hook',
        durationSec: 6,
        visualFraming: 'Full-bleed deep royal blue canvas with centered kinetic headline and subtle gold hairline.',
        motionChoreography: 'Headline rises smoothly with eased deceleration; gold rule sweeps left-to-right.',
        assetSource: 'veo-3.1',
        visualPrompt: 'Serene architectural motion studio bathed in soft skylight, royal blue fluted paneling and subtle gold light refraction.',
        onScreenText: 'Great films are directed, not rolled.',
        subText: 'Start from plain English. Keep full creative command.',
      },
      {
        sceneId: 'scene-2',
        sceneNumber: 2,
        title: 'Storyboard & Script in Sync',
        durationSec: 6,
        visualFraming: 'Crisp alabaster editorial split showing visual scenes and timed narration.',
        motionChoreography: 'Clean horizontal wipe revealing structured scene cards in crisp cadence.',
        assetSource: 'programmatic-html',
        visualPrompt: 'Editorial alabaster layout with royal blue typography and thin metallic gold timeline track.',
        onScreenText: 'Storyboard, script, and voice in sync.',
        subText: 'Lock your brand palette, pacing, and narration before exporting a single frame.',
      },
      {
        sceneId: 'scene-3',
        sceneNumber: 3,
        title: 'Edit One Scene Instantly',
        durationSec: 6,
        visualFraming: 'Midnight navy canvas highlighting a single scene update while other cuts stay locked.',
        motionChoreography: 'Scale-settle focus on scene copy while neighboring scenes remain untouched.',
        assetSource: 'programmatic-html',
        visualPrompt: 'Deep navy motion stage demonstrating instant single-scene edits and color swaps.',
        onScreenText: 'Edit one scene. Keep the rest.',
        subText: 'Ask for a tighter headline, new voice, or warmer look without starting over.',
      },
      {
        sceneId: 'scene-4',
        sceneNumber: 4,
        title: 'Monarch Crest Outro',
        durationSec: 6,
        visualFraming: 'Regal centered Monarch mirrored-lion crest in satin gold over royal blue gradient.',
        motionChoreography: 'Slow cross-dissolve into crest lockup with measured gold underline CTA.',
        assetSource: 'programmatic-html',
        visualPrompt: 'Minimalist luxury end-card in Royal Blue #102D69 with Satin Gold #D4AF37 brand insignia.',
        onScreenText: 'Monarch Video',
        subText: 'Start creating at monarch.video',
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
        musicCue: 'Cello ostinato enters at -14dB',
      },
      {
        timecode: '00:06 - 00:12',
        startSec: 6,
        endSec: 12,
        sceneId: 'scene-2',
        voiceover: 'Describe your vision in plain English. Monarch drafts your treatment, storyboard, and timed voiceover before export.',
        kineticHeadline: 'Storyboard, script, and voice in sync.',
        sfxCue: 'Crisp paper-turn transition',
        musicCue: 'Felt piano motif layers in',
      },
      {
        timecode: '00:12 - 00:18',
        startSec: 12,
        endSec: 18,
        sceneId: 'scene-3',
        voiceover: 'Every scene stays cleanly editable—so changing a headline, color, or beat never breaks your cut.',
        kineticHeadline: 'Edit one scene. Keep the rest.',
        sfxCue: 'Precision mechanical detent click',
        musicCue: 'Strings swell cleanly',
      },
      {
        timecode: '00:18 - 00:24',
        startSec: 18,
        endSec: 24,
        sceneId: 'scene-4',
        voiceover: 'Monarch Video. Direct, refine, and publish studio-quality work in minutes.',
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
      topic: 'Aurora Cine 50mm Vertical Drop',
      explicitInputs: ['18s 9:16 vertical social product drop', 'Matte navy & brushed brass hardware aesthetic'],
      aspectRatio: '9:16',
      durationSec: 18,
      platform: 'Instagram Reels / YouTube Shorts',
      brandSummary: 'Precision optical craft presented with restraint and tactile material focus.',
    },
    semanticAnalysis: {
      audiencePersona: 'Cinematographers, commercial DPs, and independent studio owners.',
      emotionalArc: 'Tactile curiosity -> optical authority -> collector desire.',
      pacing: 'High-Tempo Hook',
      visualGrammar: 'Vertical macro framing paired with crisp technical callouts.',
      projectClassification: 'Ad',
    },
    hypothesis: {
      creativeStrategy: 'Use kinetic vertical overlays over crisp lighting sweeps for strong 9:16 retention.',
      selectedRuntime: 'hyperframes',
      runtimeRationale: 'Delivers razor-sharp 1080x1920 vertical typography and sub-second preview edits.',
      generativeVideoEngine: 'Programmatic Motion + optional macro B-roll',
      licenseAdvisory: null,
      costEstimate: {
        estimatedTokens: 4900,
        byokEstimatedUsd: 0.14,
        managedCredits: 12,
        renderSecondsEstimate: 9,
        costBreakdown: [
          { stage: 'Storyboard & Script', detail: '3 vertical scenes', usdEstimate: 0.01 },
          { stage: 'Voiceover & Music Stems', detail: '18s synced narration + percussive bed', usdEstimate: 0.05 },
          { stage: 'Motion Render', detail: '1080x1920 vertical export', usdEstimate: 0.08 },
        ],
      },
    },
    masterCreativePrompt:
      'Create an 18-second 9:16 vertical product drop for the Aurora Cine 50mm T1.5 Anamorphic lens in matte navy (#0E244F) and brushed brass (#D4AF37).',
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
      lowerThirdStyle: 'Tabular focal-length spec bar',
      transitionPack: 'Crisp cut & brass wipe',
      typographyScale: 'Plus Jakarta Sans vertical stack',
    },
    videoTreatment: {
      logline: 'Machined brass meets anamorphic warmth in a 50mm T1.5 prime built to outlast trends.',
      visualMood: 'Honed dark slate, brushed brass warmth, razor-sharp optical precision.',
      lightingAndMotion: 'Golden rim sweeps with tight damped title locks.',
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
        'Create a 24-second 16:9 launch film for Monarch Video in Royal Blue and Satin Gold showing how one plain-English brief turns into a finished, editable video.',
      status: 'published',
      createdAt: new Date(Date.now() - 86_400_000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3_600_000 * 4).toISOString(),
      version: 2,
      aspectRatio: '16:9',
      durationSec: 24,
      runtime: 'hybrid-veo-hyperframes',
      routingMode: 'managed-gateway',
      brandKit: monarchBrand,
      mediaSelections: {
        voiceover: {
          voiceName: 'Kore',
          style: 'Warm, composed, unhurried documentary narrator',
          model: 'gemini-3.8-flash-lite-tts',
          clips: [],
        },
        audio: {
          musicPreset: 'cello-ostinato',
          bpm: 96,
          musicVolume: 0.24,
          duckingDb: -14,
          sfxEnabled: true,
        },
        animationPreset: 'kinetic-editorial',
        videoPreset: 'royal-architectural',
      },
      pal: pal1,
      preProduction: pre1,
      timeline: timeline1,
      compiled: compileAllTargets(timeline1, {
        animationPreset: 'kinetic-editorial',
        videoPreset: 'royal-architectural',
      }),
      editHistory: [
        {
          version: 2,
          timestamp: new Date(Date.now() - 3_600_000 * 4).toISOString(),
          instruction: 'Tighten scene 1 headline and emphasize single-scene editing in scene 3.',
          diffSummary: 'Updated headline copy in scene-1 and scene-3 while preserving scene-2 and scene-4.',
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
      mediaSelections: {
        voiceover: {
          voiceName: 'Fenrir',
          style: 'Understated, technical, confident hardware narrator',
          model: 'gemini-3.8-flash-lite-tts',
          clips: [],
        },
        audio: {
          musicPreset: 'minimal-pulse',
          bpm: 120,
          musicVolume: 0.24,
          duckingDb: -14,
          sfxEnabled: true,
        },
        animationPreset: 'satin-gold-wipe',
        videoPreset: 'cinema-lens-noir',
      },
      pal: pal2,
      preProduction: pre2,
      timeline: timeline2,
      compiled: compileAllTargets(timeline2, {
        animationPreset: 'satin-gold-wipe',
        videoPreset: 'cinema-lens-noir',
      }),
      editHistory: [],
    },
  ];
}

function readSkillBundleFiles(): Record<string, string> {
  const skillRoot = path.join(__dirname, 'skills/monarch-video');
  const files = [
    'SKILL.md',
    'SOUL.md',
    'scripts/bootstrap-env.sh',
    'references/timeline-schema.md',
    'references/rostr-agent-stack.md',
    'references/openmontage-pipelines.md',
    'references/creative-datasets.md',
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
  ensureDataDirs();
  const app = express();
  app.use(express.json({ limit: '16mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  const publicUrl =
    process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
      ? process.env.APP_URL
      : `http://localhost:${PORT}`;

  const adkRuntime = getMonarchAdkRuntime(publicUrl);
  let projects = loadJsonFile<VideoProject[]>(PROJECTS_FILE, createSeedProjects);
  let assets = loadJsonFile<MediaAsset[]>(ASSETS_FILE, createSeedAssets);
  let integrations = loadJsonFile<WorkspaceIntegration[]>(INTEGRATIONS_FILE, () =>
    createSeedIntegrations(publicUrl)
  );

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

  app.post('/api/rostr/npao', async (req, res) => {
    try {
      const result = await adkRuntime.npaoHarness.run({
        intent: String(req.body?.intent || ''),
        idempotencyKey: req.body?.idempotencyKey ?? null,
        sessionId: req.body?.sessionId ?? null,
      });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- Agent Diagnostics, Verification, Hermes & 6th-Agent Scaffold ---
  app.get('/api/agent/bootstrap', (_req, res) => {
    res.json({
      ...runVideoEnvBootstrap(),
      presets: {
        music: MUSIC_PRESET_SPECS,
        animations: ANIMATION_PRESET_SPECS,
        video: OPENMONTAGE_VIDEO_PRESETS,
      },
    });
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

  app.post('/api/agent/verify', async (_req, res) => {
    try {
      const report = await runFullMonarchVerification(adkRuntime);
      return res.json(report);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/agent/scaffold', (req, res) => {
    try {
      const blueprint = adkRuntime.metaBuilder.compileBlueprint({
        name: String(req.body?.name || 'Monarch Video Agent'),
        mission: String(
          req.body?.mission ||
            'Compile natural language into deterministic HyperFrames, OpenMontage, and Remotion video productions.'
        ),
        tools: Array.isArray(req.body?.mcpServers)
          ? req.body.mcpServers
          : ['hyperframes', 'openmontage', 'google-drive', 'github'],
        publicUrl,
      });
      return res.json(blueprint);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/agent/hermes/state', (_req, res) => {
    res.json(adkRuntime.hermes.getState());
  });

  app.post('/api/agent/hermes/reflect', async (req, res) => {
    try {
      const result = await adkRuntime.hermes.reflectAndSynthesize({
        contextSummary: req.body?.contextSummary,
        projectId: req.body?.projectId,
      });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/agent/hermes/promote', async (req, res) => {
    try {
      const id = String(req.body?.id || '');
      const action = req.body?.action === 'archived' ? 'archived' : 'promoted';
      const updated = await adkRuntime.hermes.promoteMemory(id, action);
      if (!updated) return res.status(404).json({ error: 'Memory item not found.' });
      return res.json({ item: updated, stats: adkRuntime.hermes.getState().stats });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
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
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
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

  // --- Direct Invocation of Any of the 8 Registered Creative Tools ---
  app.post('/api/studio/tool/:toolName', async (req, res) => {
    try {
      const result = await adkRuntime.invokeCreativeTool(req.params.toolName, req.body || {});
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- Real Gemini 3.8 TTS Human Voiceover Synthesis (select_voiceover) ---
  app.post('/api/studio/voiceover', async (req, res) => {
    try {
      const { scenes, text, voiceName, style, highFidelity } = req.body as {
        scenes?: Array<{ sceneId: string; text: string }>;
        text?: string;
        voiceName?: VoiceoverVoiceName;
        style?: string;
        highFidelity?: boolean;
      };

      const selectedVoice: VoiceoverVoiceName = voiceName || 'Kore';
      const selectedStyle = style || 'Warm, composed, unhurried studio narrator';

      if (Array.isArray(scenes) && scenes.length > 0) {
        const clips = [];
        for (const s of scenes.slice(0, 8)) {
          const result = (await adkRuntime.invokeCreativeTool('select_voiceover', {
            text: s.text,
            voiceName: selectedVoice,
            style: selectedStyle,
            highFidelity: Boolean(highFidelity),
          })) as {
            voiceName: VoiceoverVoiceName;
            model: string;
            mimeType: string;
            audioDataUrl: string;
          };
          clips.push({
            sceneId: s.sceneId,
            text: s.text,
            voiceName: result.voiceName,
            style: selectedStyle,
            mimeType: result.mimeType,
            audioDataUrl: result.audioDataUrl,
            generatedAt: new Date().toISOString(),
          });
        }
        return res.json({ voiceName: selectedVoice, style: selectedStyle, clips });
      }

      if (!text?.trim()) {
        return res.status(400).json({ error: 'Provide either scenes[] or text for voiceover synthesis.' });
      }

      const single = await adkRuntime.invokeCreativeTool('select_voiceover', {
        text: text.trim(),
        voiceName: selectedVoice,
        style: selectedStyle,
        highFidelity: Boolean(highFidelity),
      });
      return res.json(single);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- Media Preset Selection (select_audio, select_animations, select_video + live recompile) ---
  app.post('/api/studio/media-select', async (req, res) => {
    try {
      const { timeline, musicPreset, animationPreset, videoPreset } = req.body as {
        timeline?: UniversalVideoTimeline;
        musicPreset?: MusicPresetId;
        animationPreset?: AnimationPresetId;
        videoPreset?: OpenMontageVideoPresetId;
      };

      const [audioSpec, animSpec, videoSpec] = await Promise.all([
        adkRuntime.invokeCreativeTool('select_audio', { musicPreset: musicPreset || 'cello-ostinato' }),
        adkRuntime.invokeCreativeTool('select_animations', {
          animationPreset: animationPreset || 'kinetic-editorial',
        }),
        adkRuntime.invokeCreativeTool('select_video', {
          videoPreset: videoPreset || 'royal-architectural',
        }),
      ]);

      if (!timeline) {
        return res.json({ audioSpec, animSpec, videoSpec });
      }

      const presetLook =
        OPENMONTAGE_VIDEO_PRESETS[videoPreset || 'royal-architectural'] ||
        OPENMONTAGE_VIDEO_PRESETS['royal-architectural'];
      const musicMeta =
        MUSIC_PRESET_SPECS[musicPreset || 'cello-ostinato'] || MUSIC_PRESET_SPECS['cello-ostinato'];

      const updatedTimeline: UniversalVideoTimeline = {
        ...timeline,
        animationPreset: animationPreset || timeline.animationPreset || 'kinetic-editorial',
        videoPreset: videoPreset || timeline.videoPreset || 'royal-architectural',
        brandKit: {
          ...timeline.brandKit,
          primaryColor: presetLook.primaryColor,
          accentColor: presetLook.accentColor,
          surfaceColor: presetLook.surfaceColor,
        },
        audioTracks: {
          ...timeline.audioTracks,
          music: {
            ...timeline.audioTracks.music,
            presetId: musicPreset || 'cello-ostinato',
            bpm: musicMeta.bpm,
            style: musicMeta.name,
            mood: musicMeta.mood,
          },
        },
        scenes: timeline.scenes.map((scene, idx) => {
          const isLight =
            (videoPreset === 'alabaster-editorial' && idx < timeline.scenes.length - 1) ||
            (idx > 0 && idx < timeline.scenes.length - 1 && idx % 2 === 1);
          const nextPrimary = isLight ? presetLook.surfaceColor : presetLook.primaryColor;
          const nextSecondary = isLight ? '#EEF3FA' : presetLook.secondaryColor;
          const headlineColor = isLight ? '#0F172A' : '#FFFFFF';
          const subColor = isLight ? '#475569' : '#CBD5E1';
          return {
            ...scene,
            background: {
              ...scene.background,
              primaryColor: nextPrimary,
              secondaryColor: nextSecondary,
              accentGlow: presetLook.accentColor,
            },
            elements: scene.elements.map((el) => {
              if (el.type === 'headline') return { ...el, color: headlineColor };
              if (el.type === 'subheadline' || el.type === 'cta-card') return { ...el, color: subColor };
              if (el.type === 'kicker') return { ...el, color: presetLook.accentColor };
              return el;
            }),
          };
        }),
      };

      const compiled = compileAllTargets(updatedTimeline, {
        animationPreset: updatedTimeline.animationPreset,
        videoPreset: updatedTimeline.videoPreset,
      });

      return res.json({
        timeline: updatedTimeline,
        compiled,
        audioSpec,
        animSpec,
        videoSpec,
      });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
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
        return res.status(400).json({ error: 'Please describe your video idea first.' });
      }

      const contextMatches = await adkRuntime.substrate.query(
        `${input.prompt} ${input.brandKit?.brandName || ''} storyboard pacing`,
        { topK: 5 }
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
        summary: `Compiled plan for "${pal.parseData.topic}" (${pal.hypothesis.selectedRuntime}, ${input.aspectRatio}, ${input.durationSec}s).`,
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
        return res.status(400).json({ error: 'Approved plan and Brand Kit are required.' });
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
    const {
      pal,
      preProduction,
      brandKit,
      timeline: directTimeline,
      projectId,
      animationPreset,
      videoPreset,
    } = req.body as {
      pal?: PALOutput;
      preProduction?: ArtisticPreProduction;
      brandKit?: BrandKit;
      timeline?: UniversalVideoTimeline;
      projectId?: string;
      animationPreset?: AnimationPresetId;
      videoPreset?: OpenMontageVideoPresetId;
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
        return res.status(400).json({ error: 'Provide either storyboard details or a Timeline JSON.' });
      }

      const validation = validateUniversalTimeline(timeline);
      if (!validation.valid) {
        trace.finish('BLOCKED', { errors: validation.errors });
        return res.status(400).json({
          error: `Timeline validation failed: ${validation.errors.join(' ')}`,
          validation,
        });
      }

      const compiled = compileAllTargets(timeline, {
        animationPreset: animationPreset || timeline.animationPreset || 'kinetic-editorial',
        videoPreset: videoPreset || timeline.videoPreset || 'royal-architectural',
      });
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
        return res.status(400).json({ error: 'Timeline and edit instruction are required.' });
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

  // --- Persistent Project Library (Drafts & Published) ---
  app.get('/api/studio/projects', (_req, res) => {
    res.json({ projects });
  });

  app.post('/api/studio/projects', (req, res) => {
    const incoming = req.body as VideoProject;
    if (!incoming || !incoming.id) {
      return res.status(400).json({ error: 'Valid project object with id is required.' });
    }
    const stamped: VideoProject = { ...incoming, updatedAt: new Date().toISOString() };
    const idx = projects.findIndex((p) => p.id === incoming.id);
    if (idx >= 0) {
      projects[idx] = stamped;
    } else {
      projects = [stamped, ...projects];
    }
    saveJsonFile(PROJECTS_FILE, projects);
    return res.json({ project: stamped, total: projects.length });
  });

  app.post('/api/studio/projects/:id/publish', (req, res) => {
    const target = projects.find((p) => p.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'Project not found.' });
    const nextStatus = req.body?.published === false ? 'compiled' : 'published';
    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();
    saveJsonFile(PROJECTS_FILE, projects);
    return res.json({ project: target });
  });

  app.delete('/api/studio/projects/:id', (req, res) => {
    projects = projects.filter((p) => p.id !== req.params.id);
    saveJsonFile(PROJECTS_FILE, projects);
    return res.json({ ok: true, total: projects.length });
  });

  // --- Content & Files Asset Hosting / Upload API ---
  app.get('/api/assets', (_req, res) => {
    res.json({ assets });
  });

  app.post('/api/assets', (req, res) => {
    try {
      const { name, mimeType, category, dataBase64, tags } = req.body as {
        name?: string;
        mimeType?: string;
        category?: MediaAsset['category'];
        dataBase64?: string;
        tags?: string[];
      };

      if (!name || !dataBase64) {
        return res.status(400).json({ error: 'File name and dataBase64 payload are required.' });
      }

      const rawBase64 = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
      const buf = Buffer.from(rawBase64, 'base64');
      if (buf.length > 10 * 1024 * 1024) {
        return res.status(413).json({ error: 'Uploaded file exceeds 10 MB workspace limit.' });
      }

      const id = `asset-${crypto.randomUUID().slice(0, 8)}`;
      const safeExt = path.extname(name).replace(/[^a-zA-Z0-9.]/g, '') || '.bin';
      const diskFilename = `${id}${safeExt}`;
      ensureDataDirs();
      fs.writeFileSync(path.join(UPLOADS_DIR, diskFilename), buf);

      const resolvedCategory: MediaAsset['category'] =
        category ||
        (mimeType?.startsWith('audio/')
          ? 'audio'
          : mimeType?.startsWith('image/')
            ? name.toLowerCase().includes('logo')
              ? 'logo'
              : 'image'
            : 'document');

      const newAsset: MediaAsset = {
        id,
        name: name.slice(0, 180),
        category: resolvedCategory,
        mimeType: mimeType || 'application/octet-stream',
        sizeBytes: buf.length,
        url: `/uploads/${diskFilename}`,
        tags: Array.isArray(tags) ? tags.slice(0, 8) : [resolvedCategory],
        createdAt: new Date().toISOString(),
      };

      assets = [newAsset, ...assets];
      saveJsonFile(ASSETS_FILE, assets);
      return res.json({ asset: newAsset });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.delete('/api/assets/:id', (req, res) => {
    const existing = assets.find((a) => a.id === req.params.id);
    if (existing?.url.startsWith('/uploads/')) {
      const fileOnDisk = path.join(UPLOADS_DIR, path.basename(existing.url));
      if (fs.existsSync(fileOnDisk)) {
        try {
          fs.unlinkSync(fileOnDisk);
        } catch {
          // Ignore file unlink race
        }
      }
    }
    assets = assets.filter((a) => a.id !== req.params.id);
    saveJsonFile(ASSETS_FILE, assets);
    return res.json({ ok: true, total: assets.length });
  });

  // --- Workspace Integrations & Connectors ---
  app.get('/api/integrations', (_req, res) => {
    res.json({ integrations });
  });

  app.post('/api/integrations/:id/toggle', (req, res) => {
    const item = integrations.find((i) => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Integration not found.' });
    item.connected = !item.connected;
    item.statusLabel = item.connected ? 'Connected' : 'Ready to connect';
    saveJsonFile(INTEGRATIONS_FILE, integrations);
    return res.json({ integration: item, integrations });
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
    console.log(`Monarch Video server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Monarch Video server:', err);
  process.exit(1);
});
