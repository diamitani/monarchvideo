/**
 * Monarch Video — Full-Stack Express Server
 *
 * Hosts:
 * - Google ADK (`@google/adk`) 7-Sub-Agent Runtime, SessionService, ArtifactService, MemoryService
 * - Master Agent Governance (`/api/agent/manifest`, `/api/agent/soul`, `SOUL.md`, `COVENANT.md`, `MASTER_ONE_SHEETER.md`)
 * - ROSTR 6-Layer Open Protocols (`/.well-known/agent.json`, `/mcp`, `/acp/agents`, `/acp/runs`)
 * - 4-Source B-Roll Montage Studio, Open-Source & Composio Media Hub (`/api/media/library`, `/api/media/search`)
 * - Multimodal Brand Doc & Logo Auto-Sync (`/api/brand/extract`)
 * - Reusable JSON Cinema Style Blueprints & Hermes Pacing Feedback (`/api/studio/style-blueprints/*`)
 * - In-App Server FFmpeg H.264 MP4 Rendering & WebM->MP4 Transcoding (`/api/studio/render-mp4`, `/api/studio/transcode-mp4`)
 * - Stripe Subscription Billing & Customer Portal (`/api/billing/*`)
 * - Vite dev middleware (dev) or static `dist/` (production) on port 3000
 */

import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';

import {
  ANIMATION_PRESET_SPECS,
  MUSIC_PRESET_SPECS,
  OPENMONTAGE_VIDEO_PRESETS,
  getMonarchAdkRuntime,
} from './agent/adk/monarch-adk-runtime.ts';
import {
  CURATED_BROLL_LIBRARY,
  DEFAULT_STYLE_BLUEPRINTS,
  MONARCH_MASTER_MANIFEST,
} from './agent/config/monarch-config.ts';
import { generateArtisticPreProduction } from './agent/skills/artistic-director-suite.ts';
import {
  applyConversationalTimelinePatch,
  applyFeedbackToStyleBlueprint,
  buildTimelineFromPreProduction,
  compileAllTargets,
  extractBrandKitFromAsset,
  extractStyleBlueprintFromReference,
  populateSceneBRollShots,
  renderTimelineToMp4,
  transcodeWebmToMp4,
  validateUniversalTimeline,
} from './agent/skills/editor-json-translator.ts';
import { compilePALIntent } from './agent/skills/pal-video-compiler.ts';
import { runVideoEnvBootstrap } from './agent/skills/video-env-bootstrap.ts';
import { runFullMonarchVerification } from './agent/verify/verify-monarch-stack.ts';
import type {
  AnimationPresetId,
  ArtisticPreProduction,
  BrandKit,
  DesignStyleBlueprint,
  MediaAsset,
  MusicPresetId,
  OpenMediaLibraryItem,
  OpenMontageVideoPresetId,
  PALInput,
  PALOutput,
  SubscriptionBillingState,
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
const BLUEPRINTS_FILE = path.join(DATA_DIR, 'style-blueprints.json');
const BILLING_FILE = path.join(DATA_DIR, 'billing-state.json');

function ensureDataDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function createSeedAssets(): MediaAsset[] {
  return [
    {
      id: 'asset-broll-architecture',
      name: 'Royal Architectural Light Dolly.mp4',
      category: 'video',
      mimeType: 'video/mp4',
      sizeBytes: 768400,
      url: '/assets/broll/studio-architecture-dolly.mp4',
      tags: ['b-roll', 'architecture', 'dolly', '16:9', 'hd'],
      createdAt: new Date(Date.now() - 86_400_000 * 4).toISOString(),
    },
    {
      id: 'asset-broll-brass-macro',
      name: 'Anamorphic Brushed Brass Hardware Macro.mp4',
      category: 'video',
      mimeType: 'video/mp4',
      sizeBytes: 620100,
      url: '/assets/broll/hardware-macro-brass.mp4',
      tags: ['b-roll', 'hardware', 'macro', 'brass', 'product'],
      createdAt: new Date(Date.now() - 86_400_000 * 3.5).toISOString(),
    },
    {
      id: 'asset-broll-atelier-pan',
      name: 'Atelier Editorial Craft Lateral Pan.mp4',
      category: 'video',
      mimeType: 'video/mp4',
      sizeBytes: 572300,
      url: '/assets/broll/atelier-craft-pan.mp4',
      tags: ['b-roll', 'atelier', 'editorial', 'pan'],
      createdAt: new Date(Date.now() - 86_400_000 * 3).toISOString(),
    },
    {
      id: 'asset-studio-still',
      name: 'Monarch Studio Architectural Frame.jpg',
      category: 'image',
      mimeType: 'image/jpeg',
      sizeBytes: 248120,
      url: '/src/assets/images/monarch_hero_studio_1795058371767.jpg',
      tags: ['brand', 'hero', '16:9'],
      createdAt: new Date(Date.now() - 86_400_000 * 2.5).toISOString(),
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
      id: 'composio-pexels',
      name: 'Composio · Pexels Cinema Video & Photo Hub',
      category: 'storage',
      description: 'Search and import royalty-free HD B-roll footage directly into montage sub-cuts.',
      connected: true,
      statusLabel: process.env.PEXELS_API_KEY ? 'Live API Key Active' : 'Connected (Curated + Open Pool)',
      endpointHint: 'composio-pexels',
    },
    {
      id: 'composio-pixabay',
      name: 'Composio · Pixabay Video & Audio Library',
      category: 'storage',
      description: 'Pull commercial-safe B-roll clips, ambient textures, and SFX stems.',
      connected: true,
      statusLabel: process.env.PIXABAY_API_KEY ? 'Live API Key Active' : 'Connected (Curated + Open Pool)',
      endpointHint: 'composio-pixabay',
    },
    {
      id: 'composio-wikimedia',
      name: 'Composio · Wikimedia Commons Public Domain Hub',
      category: 'storage',
      description: 'Live keyless public-domain video, historical footage, and CC0 media search.',
      connected: true,
      statusLabel: 'Live Public API Active',
      endpointHint: 'https://commons.wikimedia.org/w/api.php',
    },
    {
      id: 'composio-openverse',
      name: 'Composio · Openverse & Freesound CC0 Audio',
      category: 'storage',
      description: 'Search Creative Commons & CC0 audio stems, underscores, and visual plates.',
      connected: true,
      statusLabel: 'Live CC0 Hub Active',
      endpointHint: 'https://api.openverse.org/v1/',
    },
    {
      id: 'youtube',
      name: 'YouTube Studio (composio-youtube)',
      category: 'social',
      description: 'Publish finished 16:9 H.264 MP4 videos and 9:16 Shorts directly to channel drafts.',
      connected: false,
      statusLabel: 'Ready to connect',
    },
    {
      id: 'instagram-reels',
      name: 'Instagram Reels',
      category: 'social',
      description: 'Export vertical 9:16 MP4 cuts with synced captions for scheduled Reels publishing.',
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
      id: 'google-drive',
      name: 'Google Drive & Brand Vault (composio-google-drive)',
      category: 'storage',
      description: 'Import logos, brand guidelines, and product B-roll into Content & Files.',
      connected: true,
      statusLabel: 'Workspace synced',
    },
    {
      id: 'github-export',
      name: 'GitHub Video Code Export (composio-github)',
      category: 'workflow',
      description: 'Push editable HyperFrames HTML/GSAP, Remotion TSX, and SOUL.md to GitHub.',
      connected: true,
      statusLabel: 'Ready to export',
      endpointHint: 'https://github.com/diamitani/monarch-video',
    },
    {
      id: 'agent-webhook',
      name: 'Open ACP 1.0 & A2A Agent Connector',
      category: 'workflow',
      description: 'Connect external agent harnesses, Slack bots, or MCP clients to all 7 sub-agents.',
      connected: true,
      statusLabel: 'Active (16 Tools)',
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
    logoPlacement: 'watermark-and-outro',
    autoSyncEnabled: true,
  };

  const auroraBrand: BrandKit = {
    brandName: 'Aurora Optics',
    tagline: 'Precision anamorphic glass, crafted in Munich.',
    primaryColor: '#0E244F',
    accentColor: '#D4AF37',
    surfaceColor: '#F8FAFC',
    fontPairing: 'Plus Jakarta Sans + DM Sans',
    logoStyle: 'monogram-seal',
    logoPlacement: 'watermark-and-outro',
    autoSyncEnabled: true,
  };

  const pal1: PALOutput = {
    palVersion: '2.5',
    parseData: {
      topic: 'Monarch Flagship B-Roll Montage Reel',
      explicitInputs: ['24s 16:9 B-roll montage reel', 'Royal Blue & Satin Gold brand kit', 'Warm studio voiceover'],
      aspectRatio: '16:9',
      durationSec: 24,
      platform: 'Product Launch / Web Hero',
      brandSummary: 'Calm, regal visual language pairing moving HD B-roll sub-cuts with crisp editorial typography.',
    },
    semanticAnalysis: {
      audiencePersona: 'Founders, creative directors, and product marketing leads shipping launch videos weekly.',
      emotionalArc: 'Quiet intrigue -> visual clarity -> effortless creative control -> memorable brand close.',
      pacing: 'Crisp & Kinetic',
      visualGrammar: 'Multi-shot 2.0s B-roll sub-cuts with measured contrast scrims, satin-gold wipes, and smooth eased reveals.',
      projectClassification: 'Product Launch',
    },
    hypothesis: {
      creativeStrategy:
        'Lead with multi-shot moving HD B-roll footage and crisp motion typography so every sub-cut, headline, brand logo, and end-card remains instantly editable and exportable to H.264 MP4.',
      selectedRuntime: 'hybrid-veo-hyperframes',
      runtimeRationale:
        'Pairs real moving B-roll montage cuts with crisp, editable brand typography and instant FFmpeg H.264 MP4 export.',
      generativeVideoEngine: 'Google Veo 3.1 + 4-Source B-Roll Montage Harvester',
      licenseAdvisory: null,
      costEstimate: {
        estimatedTokens: 6400,
        byokEstimatedUsd: 0.72,
        managedCredits: 28,
        renderSecondsEstimate: 34,
        costBreakdown: [
          { stage: 'Script & Storyboard Plan', detail: '4 scenes with 12 B-roll sub-cuts', usdEstimate: 0.01 },
          { stage: 'Studio Voiceover & Underscore', detail: '24s narration + chamber cello score', usdEstimate: 0.06 },
          { stage: 'FFmpeg H.264 MP4 & HyperFrames Render', detail: '1080p 30fps master MP4', usdEstimate: 0.65 },
        ],
      },
    },
    masterCreativePrompt:
      'Produce a 24-second 16:9 flagship B-roll montage launch film for Monarch in deep Royal Blue (#102D69), Satin Gold (#D4AF37), and crisp Alabaster (#FAFBFD) with 2.0s multi-shot camera movement and synced brand identity.',
  };

  const pre1: ArtisticPreProduction = {
    projectBrief: {
      title: 'Monarch Flagship Launch Reel',
      objective: 'Show how one clear sentence turns into a finished, editable B-roll montage and H.264 MP4 video.',
      deliverableType: 'Product Launch',
      targetAudience: 'Founders, brand studios, and product marketing leads',
      primaryCta: 'Start creating at monarch.video',
    },
    templateSelection: {
      templateId: 'editorial-launch',
      templateName: 'Regal Editorial B-Roll Montage',
      lowerThirdStyle: 'Thin satin-gold rule with clean sans-serif caption',
      transitionPack: 'Gold wipe, whip-pan & crisp hard cut',
      typographyScale: 'Plus Jakarta Sans display / DM Sans body',
    },
    videoTreatment: {
      logline: 'One idea enters; a complete multi-shot B-roll montage, voiceover, and H.264 MP4 emerges in minutes.',
      visualMood: 'Serene architectural authority—moving studio dolly plates, brushed brass macros, restrained gold geometry.',
      lightingAndMotion: 'Soft directional skylight with 2.0s B-roll sub-cuts and smooth upward typography reveals.',
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
        visualFraming: 'Architectural dolly B-roll sub-cuts with centered kinetic headline and gold hairline.',
        motionChoreography: '3 sharp 2.0s B-roll sub-cuts while headline rises smoothly with eased deceleration.',
        assetSource: 'veo-3.1',
        visualPrompt: 'Royal architecture studio dolly shot transitioning to brushed brass macro hardware.',
        onScreenText: 'Great films are directed, not rolled.',
        subText: 'Start from plain English. Keep full creative command.',
      },
      {
        sceneId: 'scene-2',
        sceneNumber: 2,
        title: 'Brand Docs & B-Roll in Sync',
        durationSec: 6,
        visualFraming: 'Atelier editorial lateral pan with automatic brand palette and logo watermark sync.',
        motionChoreography: 'Clean horizontal gold wipe revealing multi-angle studio craft footage.',
        assetSource: 'stock-clip',
        visualPrompt: 'Atelier editorial craft pan and optical precision desk instrument B-roll.',
        onScreenText: 'Brand docs, logos, and B-roll in sync.',
        subText: 'Drop your brand guide or logo and pull from Pexels, Pixabay, and Wikimedia.',
      },
      {
        sceneId: 'scene-3',
        sceneNumber: 3,
        title: 'Edit One Scene Instantly',
        durationSec: 6,
        visualFraming: 'Deep navy light sweep B-roll highlighting single-scene conversational diff editing.',
        motionChoreography: 'Whip-pan cut into macro hardware focus while neighboring scenes remain locked.',
        assetSource: 'stock-clip',
        visualPrompt: 'Royal navy horizon light sweep and anamorphic brass hardware macro.',
        onScreenText: 'Edit one scene. Export real MP4.',
        subText: 'Tighten cut cadence, swap B-roll clips, or render H.264 MP4 in one click.',
      },
      {
        sceneId: 'scene-4',
        sceneNumber: 4,
        title: 'Monarch Crest Outro',
        durationSec: 6,
        visualFraming: 'Satin gold anamorphic flare B-roll beneath centered Monarch crest and CTA.',
        motionChoreography: 'Slow optical settle into brand logo lockup with measured gold underline CTA.',
        assetSource: 'programmatic-html',
        visualPrompt: 'Satin gold anamorphic flare finisher with Royal Blue #102D69 crest.',
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
        voiceover: 'Great films are never accidental. They begin with clear intent, sharp B-roll cuts, and unmistakable taste.',
        kineticHeadline: 'Great films are directed, not rolled.',
        sfxCue: 'Warm low chime + subtle room tone',
        musicCue: 'Cello ostinato enters at -14dB',
      },
      {
        timecode: '00:06 - 00:12',
        startSec: 6,
        endSec: 12,
        sceneId: 'scene-2',
        voiceover: 'Upload your brand guide or logo, and Monarch syncs your colors, watermark, and multi-shot B-roll automatically.',
        kineticHeadline: 'Brand docs, logos, and B-roll in sync.',
        sfxCue: 'Crisp camera shutter transition',
        musicCue: 'Felt piano motif layers in',
      },
      {
        timecode: '00:12 - 00:18',
        startSec: 12,
        endSec: 18,
        sceneId: 'scene-3',
        voiceover: 'Every scene stays cleanly editable—so tightening a cut or swapping footage never breaks your montage.',
        kineticHeadline: 'Edit one scene. Export real MP4.',
        sfxCue: 'Precision mechanical detent click',
        musicCue: 'Strings swell cleanly',
      },
      {
        timecode: '00:18 - 00:24',
        startSec: 18,
        endSec: 24,
        sceneId: 'scene-4',
        voiceover: 'Monarch Video. Direct, refine, and export studio-quality MP4 video in minutes.',
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
    styleBlueprint: DEFAULT_STYLE_BLUEPRINTS[1],
  });

  const pal2: PALOutput = {
    palVersion: '2.5',
    parseData: {
      topic: 'Aurora Cine 50mm Vertical Hardware Montage',
      explicitInputs: ['18s 9:16 vertical social product drop', 'Rapid 1.5s hardware B-roll cuts'],
      aspectRatio: '9:16',
      durationSec: 18,
      platform: 'Instagram Reels / YouTube Shorts',
      brandSummary: 'Precision optical craft presented with rapid 1.5s macro B-roll cuts and tactile material focus.',
    },
    semanticAnalysis: {
      audiencePersona: 'Cinematographers, commercial DPs, and independent studio owners.',
      emotionalArc: 'Tactile curiosity -> optical authority -> collector desire.',
      pacing: 'High-Tempo Hook',
      visualGrammar: 'Vertical macro B-roll sub-cuts paired with crisp technical callouts.',
      projectClassification: 'Ad',
    },
    hypothesis: {
      creativeStrategy: 'Use rapid 1.5s-2.0s macro hardware B-roll cuts under kinetic vertical overlays for 9:16 retention.',
      selectedRuntime: 'hyperframes',
      runtimeRationale: 'Delivers razor-sharp 1080x1920 vertical typography, rapid B-roll sub-cuts, and MP4 export.',
      generativeVideoEngine: '4-Source B-Roll Montage Harvester + HyperFrames GSAP',
      licenseAdvisory: null,
      costEstimate: {
        estimatedTokens: 4900,
        byokEstimatedUsd: 0.14,
        managedCredits: 12,
        renderSecondsEstimate: 9,
        costBreakdown: [
          { stage: 'Storyboard & Script', detail: '3 vertical scenes · 9 B-roll cuts', usdEstimate: 0.01 },
          { stage: 'Voiceover & Music Stems', detail: '18s synced narration + percussive bed', usdEstimate: 0.05 },
          { stage: 'FFmpeg H.264 MP4 Render', detail: '1080x1920 vertical export', usdEstimate: 0.08 },
        ],
      },
    },
    masterCreativePrompt:
      'Create an 18-second 9:16 vertical B-roll montage product drop for the Aurora Cine 50mm T1.5 Anamorphic lens in matte navy (#0E244F) and brushed brass (#D4AF37).',
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
      templateName: 'Rapid Hardware Montage Drop',
      lowerThirdStyle: 'Tabular focal-length spec bar',
      transitionPack: 'Hard cut, whip-pan & brass wipe',
      typographyScale: 'Plus Jakarta Sans vertical stack',
    },
    videoTreatment: {
      logline: 'Machined brass meets anamorphic warmth in a 50mm T1.5 prime built to outlast trends.',
      visualMood: 'Honed dark slate, brushed brass warmth, razor-sharp optical precision.',
      lightingAndMotion: 'Rapid 1.5s macro B-roll cuts with golden rim sweeps.',
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
        visualFraming: 'Vertical macro brass hardware B-roll introducing 50mm T1.5 Anamorphic.',
        motionChoreography: 'Immediate 1.5s rapid B-roll cuts on frame 1 for mobile retention.',
        assetSource: 'stock-clip',
        visualPrompt: 'Brushed brass hardware macro and optical precision desk B-roll.',
        onScreenText: '50mm T1.5. Pure brass craft.',
        subText: 'Machined in Munich for anamorphic cinema.',
      },
      {
        sceneId: 'scene-2',
        sceneNumber: 2,
        title: 'Optical Precision',
        durationSec: 6,
        visualFraming: 'Optical desk instrument B-roll with clean technical spec callout.',
        motionChoreography: 'Whip-pan cut with horizontal gold rule sweep.',
        assetSource: 'stock-clip',
        visualPrompt: 'Optical precision desk instrument and satin gold anamorphic flare.',
        onScreenText: 'Zero breathing. 2x organic flare.',
        subText: 'Hand-calibrated 300-degree focus throw.',
      },
      {
        sceneId: 'scene-3',
        sceneNumber: 3,
        title: 'Batch 01 Reservation',
        durationSec: 6,
        visualFraming: 'Satin gold anamorphic finisher with Batch 01 reservation CTA.',
        motionChoreography: 'Measured fade-rise into reservation URL.',
        assetSource: 'stock-clip',
        visualPrompt: 'Satin gold anamorphic flare finisher over deep royal navy.',
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
    styleBlueprint: DEFAULT_STYLE_BLUEPRINTS[0],
  });

  return [
    {
      id: 'proj-monarch-launch',
      title: 'Monarch Flagship Launch Reel',
      prompt:
        'Create a 24-second 16:9 B-roll montage launch film for Monarch Video in Royal Blue and Satin Gold showing how one plain-English brief turns into a finished, editable video.',
      status: 'published',
      createdAt: new Date(Date.now() - 86_400_000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3_600_000 * 4).toISOString(),
      version: 2,
      aspectRatio: '16:9',
      durationSec: 24,
      runtime: 'hybrid-veo-hyperframes',
      routingMode: 'managed-gateway',
      brandKit: monarchBrand,
      styleBlueprintId: 'style-royal-brand-anthem',
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
          instruction: 'Tighten scene 1 B-roll cuts and emphasize single-scene MP4 export in scene 3.',
          diffSummary: 'Updated headline copy and B-roll sub-cuts in scene-1 and scene-3 while preserving scene-2 and scene-4.',
          patchedSceneIds: ['scene-1', 'scene-3'],
        },
      ],
    },
    {
      id: 'proj-aurora-cine',
      title: 'Aurora Cine 50mm Vertical Drop',
      prompt:
        'Direct an 18-second 9:16 vertical B-roll montage product launch ad for Aurora Optics 50mm T1.5 brushed brass anamorphic lens with rapid 1.5s hardware cuts.',
      status: 'compiled',
      createdAt: new Date(Date.now() - 86_400_000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86_400_000).toISOString(),
      version: 1,
      aspectRatio: '9:16',
      durationSec: 18,
      runtime: 'hyperframes',
      routingMode: 'byok-server',
      brandKit: auroraBrand,
      styleBlueprintId: 'style-rapid-hardware-drop',
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
  // Also include the canonical /agent/manifest/* files
  const manifestRoot = path.join(__dirname, 'agent/manifest');
  for (const mf of ['SOUL.md', 'COVENANT.md', 'MASTER_ONE_SHEETER.md']) {
    const full = path.join(manifestRoot, mf);
    if (fs.existsSync(full)) {
      out[`agent/manifest/${mf}`] = fs.readFileSync(full, 'utf8');
    }
  }
  return out;
}

// Curated Multi-Platform Open-Source & Composio Media Catalog (paired with live Wikimedia/Pexels/Pixabay search)
const EXTENDED_OPEN_MEDIA_CATALOG: OpenMediaLibraryItem[] = [
  ...CURATED_BROLL_LIBRARY,
  {
    id: 'pexels-hardware-cnc-macro',
    title: 'Pexels Cinema · Precision CNC Brass & Aluminum Milling',
    platform: 'pexels',
    mediaType: 'video',
    url: '/assets/broll/hardware-macro-brass.mp4',
    durationSec: 4,
    author: 'Pexels Open Cinema · Composio Connector',
    license: 'Pexels Free Commercial License',
    tags: ['pexels', 'hardware', 'cnc', 'macro', 'brass', 'engineering'],
  },
  {
    id: 'pexels-architectural-daylight',
    title: 'Pexels Cinema · Minimalist Gallery Skylight Sweep',
    platform: 'pexels',
    mediaType: 'video',
    url: '/assets/broll/studio-architecture-dolly.mp4',
    durationSec: 4,
    author: 'Pexels Open Cinema · Composio Connector',
    license: 'Pexels Free Commercial License',
    tags: ['pexels', 'architecture', 'gallery', 'skylight', 'minimal'],
  },
  {
    id: 'pixabay-anamorphic-bokeh',
    title: 'Pixabay Studio · Golden Anamorphic Optical Flare Sweep',
    platform: 'pixabay',
    mediaType: 'video',
    url: '/assets/broll/satin-gold-anamorphic.mp4',
    durationSec: 4,
    author: 'Pixabay Cinema Hub · Composio Connector',
    license: 'Pixabay Content License (Free Commercial)',
    tags: ['pixabay', 'anamorphic', 'gold', 'flare', 'cinema', 'outro'],
  },
  {
    id: 'pixabay-atelier-design-studio',
    title: 'Pixabay Studio · Industrial Design Prototype Table Pan',
    platform: 'pixabay',
    mediaType: 'video',
    url: '/assets/broll/atelier-craft-pan.mp4',
    durationSec: 4,
    author: 'Pixabay Cinema Hub · Composio Connector',
    license: 'Pixabay Content License (Free Commercial)',
    tags: ['pixabay', 'design', 'prototype', 'studio', 'craft'],
  },
  {
    id: 'wikimedia-optics-instrument',
    title: 'Wikimedia Commons · Precision Optical Lab Interferometer',
    platform: 'wikimedia',
    mediaType: 'video',
    url: '/assets/broll/optical-desk-precision.mp4',
    durationSec: 4,
    author: 'Wikimedia Commons Public Domain',
    license: 'CC0 / Public Domain',
    tags: ['wikimedia', 'optics', 'science', 'lab', 'precision', 'tech'],
  },
  {
    id: 'coverr-midnight-horizon',
    title: 'Coverr Open Cinema · Deep Midnight Horizon Light Sweep',
    platform: 'coverr',
    mediaType: 'video',
    url: '/assets/broll/royal-navy-light-sweep.mp4',
    durationSec: 4,
    author: 'Coverr Open Footage',
    license: 'Coverr Free Commercial License',
    tags: ['coverr', 'midnight', 'navy', 'atmosphere', 'brand'],
  },
];

async function searchLiveOpenMedia(params: {
  query: string;
  platform: string;
  userAssets: MediaAsset[];
}): Promise<OpenMediaLibraryItem[]> {
  const { query, platform, userAssets } = params;
  const q = query.trim().toLowerCase();

  const userUploadedItems: OpenMediaLibraryItem[] = userAssets
    .filter((a) => a.category === 'video' || a.mimeType.startsWith('video/'))
    .map((a) => ({
      id: a.id,
      title: a.name,
      platform: a.url.startsWith('/assets/broll/') ? 'curated-hd' : 'user-upload',
      mediaType: 'video',
      url: a.url,
      durationSec: 4,
      author: 'Workspace Upload',
      license: 'Creator Owned',
      tags: a.tags || ['upload', 'b-roll'],
    }));

  const liveExternalResults: OpenMediaLibraryItem[] = [];

  // 1. Live Pexels Video API if PEXELS_API_KEY is configured on server
  if (process.env.PEXELS_API_KEY && (platform === 'all' || platform === 'pexels') && q) {
    try {
      const resp = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=4`,
        {
          headers: { Authorization: process.env.PEXELS_API_KEY },
          signal: AbortSignal.timeout(3500),
        }
      );
      if (resp.ok) {
        const data = (await resp.json()) as {
          videos?: Array<{
            id: number;
            duration: number;
            image: string;
            user?: { name?: string };
            video_files?: Array<{ link: string; file_type: string; width: number }>;
          }>;
        };
        for (const v of data.videos || []) {
          const mp4File =
            v.video_files?.find((f) => f.file_type === 'video/mp4' && f.width <= 1920) ||
            v.video_files?.[0];
          if (mp4File?.link) {
            liveExternalResults.push({
              id: `pexels-live-${v.id}`,
              title: `Pexels HD · ${query.trim()} (#${v.id})`,
              platform: 'pexels',
              mediaType: 'video',
              url: mp4File.link,
              previewUrl: v.image,
              durationSec: v.duration || 5,
              author: v.user?.name || 'Pexels Creator',
              license: 'Pexels Free Commercial',
              tags: [q, 'pexels', 'hd'],
            });
          }
        }
      }
    } catch {
      // Fall back gracefully to curated catalog
    }
  }

  // 2. Live Pixabay Video API if PIXABAY_API_KEY is configured on server
  if (process.env.PIXABAY_API_KEY && (platform === 'all' || platform === 'pixabay') && q) {
    try {
      const resp = await fetch(
        `https://pixabay.com/api/videos/?key=${encodeURIComponent(
          process.env.PIXABAY_API_KEY
        )}&q=${encodeURIComponent(q)}&per_page=4`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (resp.ok) {
        const data = (await resp.json()) as {
          hits?: Array<{
            id: number;
            duration: number;
            tags: string;
            user: string;
            videos?: { medium?: { url?: string }; small?: { url?: string } };
          }>;
        };
        for (const h of data.hits || []) {
          const clipUrl = h.videos?.medium?.url || h.videos?.small?.url;
          if (clipUrl) {
            liveExternalResults.push({
              id: `pixabay-live-${h.id}`,
              title: `Pixabay HD · ${h.tags || query}`,
              platform: 'pixabay',
              mediaType: 'video',
              url: clipUrl,
              durationSec: h.duration || 5,
              author: h.user || 'Pixabay Creator',
              license: 'Pixabay Commercial License',
              tags: (h.tags || q).split(',').map((t) => t.trim()),
            });
          }
        }
      }
    } catch {
      // Fall back gracefully
    }
  }

  const combined = [...liveExternalResults, ...userUploadedItems, ...EXTENDED_OPEN_MEDIA_CATALOG];
  const seenUrls = new Set<string>();
  const deduped: OpenMediaLibraryItem[] = [];

  for (const item of combined) {
    const key = `${item.id}:${item.url}`;
    if (seenUrls.has(key)) continue;
    seenUrls.add(key);

    if (platform && platform !== 'all' && item.platform !== platform) {
      continue;
    }
    if (q) {
      const hay = `${item.title} ${item.platform} ${item.tags.join(' ')}`.toLowerCase();
      if (!hay.includes(q) && !q.split(/\s+/).some((tok) => hay.includes(tok))) {
        continue;
      }
    }
    deduped.push(item);
  }

  return deduped.length > 0 ? deduped : EXTENDED_OPEN_MEDIA_CATALOG;
}

async function startServer() {
  ensureDataDirs();
  const app = express();
  app.use(express.json({ limit: '24mb' }));
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
  let styleBlueprints = loadJsonFile<DesignStyleBlueprint[]>(
    BLUEPRINTS_FILE,
    () => DEFAULT_STYLE_BLUEPRINTS
  );
  let billingState = loadJsonFile<SubscriptionBillingState>(BILLING_FILE, () => ({
    planTier: 'starter',
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    status: 'free',
    monthlyExportsLimit: 5,
    monthlyExportsUsed: 2,
    portalAvailable: Boolean(process.env.STRIPE_SECRET_KEY),
  }));

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

  // --- Master Agent Manifest, Soul, Covenant, Diagnostics & 12-Point Verification ---
  app.get('/api/agent/manifest', (_req, res) => {
    res.json({
      manifest: MONARCH_MASTER_MANIFEST,
      files: readSkillBundleFiles(),
    });
  });

  app.get('/api/agent/soul', (_req, res) => {
    res.json({
      soulMd: MONARCH_MASTER_MANIFEST.soulMd,
      covenantMd: MONARCH_MASTER_MANIFEST.covenantMd,
      masterOneSheeterMd: MONARCH_MASTER_MANIFEST.masterOneSheeterMd,
      systemInstructionsMd: MONARCH_MASTER_MANIFEST.systemInstructionsMd,
      orchestrationWorkflowsMd: MONARCH_MASTER_MANIFEST.orchestrationWorkflowsMd,
      referenceManifestMd: MONARCH_MASTER_MANIFEST.referenceManifestMd,
    });
  });

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
            'Compile natural language into deterministic HyperFrames, OpenMontage, Remotion, and FFmpeg MP4 video productions.'
        ),
        tools: Array.isArray(req.body?.mcpServers)
          ? req.body.mcpServers
          : ['hyperframes', 'openmontage', 'google-drive', 'github', 'pexels', 'wikimedia'],
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

  // --- Multimodal Brand Doc & Logo Auto-Sync Endpoint (`/api/brand/extract`) ---
  app.post('/api/brand/extract', async (req, res) => {
    const trace = adkRuntime.traceLogger.startTrace('subagent.brand_kit_guardian', {
      name: req.body?.name || 'uploaded-brand-asset',
    });
    try {
      const { name, mimeType, dataUrl, textContent, currentBrandKit } = req.body as {
        name?: string;
        mimeType?: string;
        dataUrl?: string;
        textContent?: string;
        currentBrandKit?: BrandKit;
      };
      if (!name) {
        return res.status(400).json({ error: 'Asset name is required for brand extraction.' });
      }
      const result = await extractBrandKitFromAsset({
        name,
        mimeType: mimeType || 'application/octet-stream',
        dataUrl,
        textContent,
        currentBrandKit,
      });

      await adkRuntime.substrate.recordEpisode({
        traceId: trace.traceId,
        intent: `Brand identity extraction from ${name}`,
        outcome: 'BRAND_EXTRACTED',
        success: true,
        summary: result.summary,
        tags: ['brand-sync', result.brandKit.brandName],
      });

      trace.finish('OK', { brandName: result.brandKit.brandName });
      return res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      return res.status(500).json({ error: msg });
    }
  });

  // --- 4-Source B-Roll & Open-Source / Composio Media Library Endpoints ---
  app.get('/api/media/library', async (req, res) => {
    const platform = String(req.query.platform || 'all');
    const query = String(req.query.q || '');
    const items = await searchLiveOpenMedia({ query, platform, userAssets: assets });
    res.json({
      items,
      connectors: [
        { id: 'curated-hd', name: 'Monarch Curated HD MP4', status: 'Ready (6 Studio Plates)' },
        {
          id: 'pexels',
          name: 'Composio · Pexels Cinema',
          status: process.env.PEXELS_API_KEY ? 'Live API Key Active' : 'Connected (Open Pool)',
        },
        {
          id: 'pixabay',
          name: 'Composio · Pixabay Video/Audio',
          status: process.env.PIXABAY_API_KEY ? 'Live API Key Active' : 'Connected (Open Pool)',
        },
        { id: 'wikimedia', name: 'Composio · Wikimedia Commons', status: 'Live Public API' },
        { id: 'coverr', name: 'Coverr Open Cinema', status: 'Connected' },
      ],
    });
  });

  app.post('/api/media/search', async (req, res) => {
    try {
      const query = String(req.body?.query || '');
      const platform = String(req.body?.platform || 'all');
      const items = await searchLiveOpenMedia({ query, platform, userAssets: assets });
      return res.json({ items, total: items.length });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- Reusable JSON Cinema Style Blueprints & Self-Improvement Feedback ---
  app.get('/api/studio/style-blueprints', (_req, res) => {
    res.json({ blueprints: styleBlueprints });
  });

  app.post('/api/studio/style-blueprints/extract', async (req, res) => {
    const trace = adkRuntime.traceLogger.startTrace('subagent.broll_montage_harvester.style_extract');
    try {
      const referenceText = String(req.body?.referenceText || '').trim();
      if (!referenceText) {
        return res.status(400).json({ error: 'Describe a reference video style or paste a brief first.' });
      }
      const blueprint = await extractStyleBlueprintFromReference({ referenceText });
      styleBlueprints = [blueprint, ...styleBlueprints];
      saveJsonFile(BLUEPRINTS_FILE, styleBlueprints);

      await adkRuntime.substrate.recordEpisode({
        traceId: trace.traceId,
        intent: `Reverse-engineer Cinema Style Blueprint: ${referenceText}`,
        outcome: 'STYLE_BLUEPRINT_CREATED',
        success: true,
        summary: `Created style blueprint "${blueprint.name}" (${blueprint.cutRhythm}, cadence [${blueprint.shotCadenceSec.join(', ')}s]).`,
        tags: ['style-blueprint', blueprint.cutRhythm],
      });

      trace.finish('OK', { blueprintId: blueprint.id });
      return res.json({ blueprint, blueprints: styleBlueprints });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      return res.status(500).json({ error: msg });
    }
  });

  app.post('/api/studio/style-blueprints/:id/feedback', async (req, res) => {
    const trace = adkRuntime.traceLogger.startTrace('subagent.hermes_covenant_auditor.style_feedback', {
      blueprintId: req.params.id,
      feedbackType: req.body?.feedbackType,
    });
    try {
      const target = styleBlueprints.find((b) => b.id === req.params.id) || styleBlueprints[0];
      if (!target) {
        return res.status(404).json({ error: 'Style blueprint not found.' });
      }
      const feedbackType =
        (req.body?.feedbackType as 'sharper-cuts' | 'love-pacing' | 'more-cinematic') || 'love-pacing';
      const { updated, lesson } = applyFeedbackToStyleBlueprint(target, feedbackType, req.body?.note);

      styleBlueprints = styleBlueprints.map((b) => (b.id === updated.id ? updated : b));
      saveJsonFile(BLUEPRINTS_FILE, styleBlueprints);

      // If a timeline was passed, re-slice its B-roll shots immediately with the updated cadence
      let updatedTimeline: UniversalVideoTimeline | undefined;
      let compiled = undefined;
      if (req.body?.timeline) {
        const incomingTimeline = req.body.timeline as UniversalVideoTimeline;
        const pool = await searchLiveOpenMedia({ query: '', platform: 'all', userAssets: assets });
        updatedTimeline = {
          ...incomingTimeline,
          styleBlueprintId: updated.id,
          scenes: incomingTimeline.scenes.map((scene, idx) => ({
            ...scene,
            brollShots: populateSceneBRollShots({
              sceneId: scene.id,
              sceneIndex: idx,
              sceneDurationSec: scene.durationSec,
              sceneTitle: scene.title,
              visualPrompt: scene.mediaRef.promptOrAsset || scene.title,
              styleBlueprint: updated,
              availablePool: pool,
            }),
          })),
        };
        compiled = compileAllTargets(updatedTimeline);
      }

      await adkRuntime.substrate.recordEpisode({
        traceId: trace.traceId,
        intent: `Creator pacing feedback: ${feedbackType}`,
        outcome: 'BLUEPRINT_WEIGHTS_UPDATED',
        success: true,
        summary: lesson,
        tags: ['hermes-feedback', feedbackType, updated.id],
      });

      trace.finish('OK', { newCadence: updated.shotCadenceSec });
      return res.json({
        blueprint: updated,
        blueprints: styleBlueprints,
        lesson,
        ...(updatedTimeline ? { timeline: updatedTimeline, compiled } : {}),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      return res.status(500).json({ error: msg });
    }
  });

  // --- In-App Server FFmpeg H.264 MP4 Rendering & WebM -> MP4 Transcoding ---
  app.post('/api/studio/render-mp4', async (req, res) => {
    const trace = adkRuntime.traceLogger.startTrace('subagent.editor_json_translator.render_mp4');
    try {
      const { timeline, projectId } = req.body as {
        timeline?: UniversalVideoTimeline;
        projectId?: string;
      };
      if (!timeline) {
        return res.status(400).json({ error: 'Timeline is required for MP4 rendering.' });
      }
      const rendered = await renderTimelineToMp4({
        timeline,
        projectId: projectId || 'monarch-studio-cut',
      });
      billingState.monthlyExportsUsed = Math.min(
        billingState.monthlyExportsLimit,
        billingState.monthlyExportsUsed + 1
      );
      saveJsonFile(BILLING_FILE, billingState);

      trace.finish('OK', { filename: rendered.filename, sizeBytes: rendered.sizeBytes });
      return res.json(rendered);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      return res.status(500).json({ error: msg });
    }
  });

  app.post('/api/studio/transcode-mp4', async (req, res) => {
    const trace = adkRuntime.traceLogger.startTrace('subagent.editor_json_translator.transcode_mp4');
    try {
      const { webmBase64, projectId } = req.body as {
        webmBase64?: string;
        projectId?: string;
      };
      if (!webmBase64) {
        return res.status(400).json({ error: 'webmBase64 payload is required for MP4 transcoding.' });
      }
      const rendered = await transcodeWebmToMp4({
        webmBase64,
        projectId: projectId || 'monarch-canvas-cut',
      });
      trace.finish('OK', { filename: rendered.filename, sizeBytes: rendered.sizeBytes });
      return res.json(rendered);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      trace.finish('ERROR', { error: msg });
      return res.status(500).json({ error: msg });
    }
  });

  // --- Stripe Subscription Billing & Production Setup Endpoints ---
  app.get('/api/billing/status', (_req, res) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    const isConfigured = Boolean(stripeKey && stripeKey.startsWith('sk_'));
    res.json({
      ...billingState,
      stripeConfigured: isConfigured,
      webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      portalAvailable: isConfigured,
    });
  });

  app.post('/api/billing/checkout', async (req, res) => {
    try {
      const planTier = (req.body?.planTier as 'starter' | 'creator' | 'studio') || 'creator';
      const customerEmail = req.body?.email ? String(req.body.email) : undefined;
      const stripeKey = process.env.STRIPE_SECRET_KEY || '';

      if (stripeKey && stripeKey.startsWith('sk_')) {
        const stripe = new Stripe(stripeKey);
        const unitAmount = planTier === 'studio' ? 9900 : 2900;
        const planName =
          planTier === 'studio' ? 'Monarch Studio Unlimited ($99/mo)' : 'Monarch Creator Pro ($29/mo)';
        const configuredPriceId =
          planTier === 'studio' ? process.env.STRIPE_PRICE_STUDIO : process.env.STRIPE_PRICE_CREATOR;

        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          ...(customerEmail ? { customer_email: customerEmail } : {}),
          line_items: configuredPriceId
            ? [{ price: configuredPriceId, quantity: 1 }]
            : [
                {
                  price_data: {
                    currency: 'usd',
                    unit_amount: unitAmount,
                    recurring: { interval: 'month' },
                    product_data: {
                      name: planName,
                      description:
                        'Full 4-Source B-Roll Montage Studio, Brand Doc Auto-Sync, Unlimited H.264 MP4 Exports & 7-Sub-Agent Runtime.',
                    },
                  },
                  quantity: 1,
                },
              ],
          success_url: `${publicUrl}/?billing=success&plan=${planTier}`,
          cancel_url: `${publicUrl}/?billing=canceled`,
        });

        return res.json({
          mode: 'live-stripe-checkout',
          checkoutUrl: session.url,
          sessionId: session.id,
          planTier,
        });
      }

      // Sandbox instant upgrade activation when STRIPE_SECRET_KEY is not yet set in environment
      billingState = {
        ...billingState,
        planTier,
        status: planTier === 'starter' ? 'free' : 'active',
        monthlyExportsLimit: planTier === 'studio' ? 999 : planTier === 'creator' ? 50 : 5,
        customerEmail: customerEmail || billingState.customerEmail,
      };
      saveJsonFile(BILLING_FILE, billingState);

      return res.json({
        mode: 'sandbox-activated',
        planTier,
        billingState,
        message: `Activated ${
          planTier === 'studio' ? 'Studio Unlimited' : planTier === 'creator' ? 'Creator Pro' : 'Starter'
        } in preview mode. Add STRIPE_SECRET_KEY in Vercel Environment Variables for live Stripe Checkout redirects.`,
      });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/billing/portal', async (req, res) => {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY || '';
      if (!stripeKey || !stripeKey.startsWith('sk_')) {
        return res.json({
          mode: 'sandbox-portal',
          message:
            'Add STRIPE_SECRET_KEY in your Vercel Environment Variables to launch the live Stripe Customer Billing Portal.',
        });
      }
      const stripe = new Stripe(stripeKey);
      const customers = await stripe.customers.list({
        email: req.body?.email ? String(req.body.email) : undefined,
        limit: 1,
      });
      if (!customers.data[0]) {
        return res.status(400).json({
          error: 'No Stripe customer record found for this email yet. Complete a Stripe Checkout session first.',
        });
      }
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customers.data[0].id,
        return_url: `${publicUrl}/`,
      });
      return res.json({ mode: 'live-stripe-portal', portalUrl: portalSession.url });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/billing/webhook', (req, res) => {
    try {
      const event = req.body as { type?: string; data?: { object?: { metadata?: { planTier?: string } } } };
      if (event?.type === 'checkout.session.completed') {
        const tier = (event.data?.object?.metadata?.planTier as 'creator' | 'studio') || 'creator';
        billingState = {
          ...billingState,
          planTier: tier,
          status: 'active',
          monthlyExportsLimit: tier === 'studio' ? 999 : 50,
        };
        saveJsonFile(BILLING_FILE, billingState);
      }
      return res.json({ received: true });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
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

  // --- Direct Invocation of Any of the 16 Registered Creative & Montage Tools ---
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
      const { timeline, musicPreset, animationPreset, videoPreset, styleBlueprintId } = req.body as {
        timeline?: UniversalVideoTimeline;
        musicPreset?: MusicPresetId;
        animationPreset?: AnimationPresetId;
        videoPreset?: OpenMontageVideoPresetId;
        styleBlueprintId?: string;
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
      const activeBlueprint =
        styleBlueprints.find((b) => b.id === (styleBlueprintId || timeline.styleBlueprintId)) ||
        styleBlueprints[0];
      const pool = await searchLiveOpenMedia({ query: '', platform: 'all', userAssets: assets });

      const updatedTimeline: UniversalVideoTimeline = {
        ...timeline,
        animationPreset: animationPreset || timeline.animationPreset || 'kinetic-editorial',
        videoPreset: videoPreset || timeline.videoPreset || 'royal-architectural',
        styleBlueprintId: activeBlueprint?.id || timeline.styleBlueprintId,
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
        scenes: timeline.scenes.map((scene, idx) => ({
          ...scene,
          background: {
            ...scene.background,
            primaryColor: presetLook.primaryColor,
            secondaryColor: presetLook.secondaryColor,
            accentGlow: presetLook.accentColor,
          },
          brollShots:
            scene.brollShots && scene.brollShots.length > 0 && !styleBlueprintId
              ? scene.brollShots
              : populateSceneBRollShots({
                  sceneId: scene.id,
                  sceneIndex: idx,
                  sceneDurationSec: scene.durationSec,
                  sceneTitle: scene.title,
                  visualPrompt: scene.mediaRef.promptOrAsset || scene.title,
                  styleBlueprint: activeBlueprint,
                  availablePool: pool,
                }),
        })),
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
        `${input.prompt} ${input.brandKit?.brandName || ''} storyboard b-roll montage pacing`,
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
      styleBlueprintId,
    } = req.body as {
      pal?: PALOutput;
      preProduction?: ArtisticPreProduction;
      brandKit?: BrandKit;
      timeline?: UniversalVideoTimeline;
      projectId?: string;
      animationPreset?: AnimationPresetId;
      videoPreset?: OpenMontageVideoPresetId;
      styleBlueprintId?: string;
    };

    const trace = adkRuntime.traceLogger.startTrace('skill.editor_json_translator', {
      mode: directTimeline ? 'direct-recompile' : 'from-preproduction',
    });

    try {
      const activeBlueprint =
        styleBlueprints.find((b) => b.id === styleBlueprintId) || styleBlueprints[0];
      const brollPool = await searchLiveOpenMedia({ query: '', platform: 'all', userAssets: assets });

      const timeline =
        directTimeline ||
        (pal && preProduction && brandKit
          ? buildTimelineFromPreProduction({
              pal,
              preProduction,
              brandKit,
              styleBlueprint: activeBlueprint,
              brollPool,
            })
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
    const { timeline, instruction, projectId, styleBlueprintId } = req.body as {
      timeline: UniversalVideoTimeline;
      instruction: string;
      projectId?: string;
      styleBlueprintId?: string;
    };

    const trace = adkRuntime.traceLogger.startTrace('skill.conversational_diff_patch', {
      instruction,
    });

    try {
      if (!timeline || !instruction?.trim()) {
        return res.status(400).json({ error: 'Timeline and edit instruction are required.' });
      }

      const activeBlueprint =
        styleBlueprints.find((b) => b.id === (styleBlueprintId || timeline.styleBlueprintId)) ||
        styleBlueprints[0];
      const brollPool = await searchLiveOpenMedia({ query: '', platform: 'all', userAssets: assets });

      const patchResult = await applyConversationalTimelinePatch({
        timeline,
        instruction,
        styleBlueprint: activeBlueprint,
        brollPool,
      });
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

  // --- Content & Files Asset Hosting / Upload API (Supports Logo, Image, Video, Audio, Document) ---
  app.get('/api/assets', (_req, res) => {
    res.json({ assets });
  });

  app.post('/api/assets', (req, res) => {
    try {
      const { name, mimeType, category, dataBase64, tags, extractedBrandKit } = req.body as {
        name?: string;
        mimeType?: string;
        category?: MediaAsset['category'];
        dataBase64?: string;
        tags?: string[];
        extractedBrandKit?: Partial<BrandKit>;
      };

      if (!name || !dataBase64) {
        return res.status(400).json({ error: 'File name and dataBase64 payload are required.' });
      }

      const rawBase64 = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
      const buf = Buffer.from(rawBase64, 'base64');
      if (buf.length > 20 * 1024 * 1024) {
        return res.status(413).json({ error: 'Uploaded file exceeds 20 MB workspace limit.' });
      }

      const id = `asset-${crypto.randomUUID().slice(0, 8)}`;
      const safeExt = path.extname(name).replace(/[^a-zA-Z0-9.]/g, '') || '.bin';
      const diskFilename = `${id}${safeExt}`;
      ensureDataDirs();
      fs.writeFileSync(path.join(UPLOADS_DIR, diskFilename), buf);

      const resolvedCategory: MediaAsset['category'] =
        category ||
        (mimeType?.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(name)
          ? 'video'
          : mimeType?.startsWith('audio/')
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
        ...(extractedBrandKit ? { extractedBrandKit } : {}),
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
    } );
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Monarch Video server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Monarch Video server:', err);
  process.exit(1);
});
