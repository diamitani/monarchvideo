export type AspectRatio = '16:9' | '9:16' | '1:1';
export type RenderRuntime = 'hyperframes' | 'remotion' | 'hybrid-veo-hyperframes';
export type ProjectCategory =
  | 'Ad'
  | 'Brand Film'
  | 'Product Launch'
  | 'Explainer'
  | 'Social Short'
  | 'Documentary';

export type RoutingMode = 'managed-gateway' | 'byok-server';

export interface BrandKit {
  brandName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  fontPairing: string;
  logoStyle: 'monarch-crest' | 'minimal-wordmark' | 'monogram-seal';
}

export interface PALInput {
  prompt: string;
  aspectRatio: AspectRatio;
  durationSec: number;
  platform: string;
  templateId: string;
  brandKit: BrandKit;
  routingMode: RoutingMode;
  referenceUrls?: string[];
  orgSizeOverThree?: boolean;
}

export interface PALCostEstimate {
  estimatedTokens: number;
  byokEstimatedUsd: number;
  managedCredits: number;
  renderSecondsEstimate: number;
  costBreakdown: Array<{
    stage: string;
    detail: string;
    usdEstimate: number;
  }>;
}

export interface PALOutput {
  palVersion: string;
  parseData: {
    topic: string;
    explicitInputs: string[];
    aspectRatio: AspectRatio;
    durationSec: number;
    platform: string;
    brandSummary: string;
  };
  semanticAnalysis: {
    audiencePersona: string;
    emotionalArc: string;
    pacing: 'Measured & Editorial' | 'Crisp & Kinetic' | 'Cinematic Build' | 'High-Tempo Hook';
    visualGrammar: string;
    projectClassification: ProjectCategory;
  };
  hypothesis: {
    creativeStrategy: string;
    selectedRuntime: RenderRuntime;
    runtimeRationale: string;
    generativeVideoEngine: string;
    licenseAdvisory: string | null;
    costEstimate: PALCostEstimate;
  };
  masterCreativePrompt: string;
}

export interface StoryboardSceneCard {
  sceneId: string;
  sceneNumber: number;
  title: string;
  durationSec: number;
  visualFraming: string;
  motionChoreography: string;
  assetSource: 'programmatic-html' | 'remotion-tsx' | 'veo-3.1' | 'stock-clip';
  visualPrompt: string;
  onScreenText: string;
  subText: string;
}

export interface ScriptCueItem {
  timecode: string;
  startSec: number;
  endSec: number;
  sceneId: string;
  voiceover: string;
  kineticHeadline: string;
  sfxCue: string;
  musicCue: string;
}

export interface ArtisticPreProduction {
  projectBrief: {
    title: string;
    objective: string;
    deliverableType: ProjectCategory;
    targetAudience: string;
    primaryCta: string;
  };
  templateSelection: {
    templateId: string;
    templateName: string;
    lowerThirdStyle: string;
    transitionPack: string;
    typographyScale: string;
  };
  videoTreatment: {
    logline: string;
    visualMood: string;
    lightingAndMotion: string;
    soundscapeAndMusic: string;
    voiceoverDirection: string;
    narrativeHook: string;
  };
  storyboard: StoryboardSceneCard[];
  scriptAndCueSheet: ScriptCueItem[];
  finalProductionPrompt: string;
}

export interface TimelineElement {
  id: string;
  type: 'headline' | 'subheadline' | 'kicker' | 'lower-third' | 'cta-card' | 'logo-mark' | 'metric-callout';
  content: string;
  position: 'center' | 'lower-left' | 'top-left' | 'bottom-center' | 'upper-center';
  animation: 'fade-rise' | 'kinetic-reveal' | 'slide-left' | 'scale-settle' | 'gold-underline';
  color?: string;
}

export interface TimelineScene {
  id: string;
  title: string;
  startSec: number;
  durationSec: number;
  layoutTemplate: 'hero-title' | 'split-editorial' | 'kinetic-statement' | 'metric-showcase' | 'logo-outro';
  background: {
    type: 'solid' | 'gradient' | 'cinematic-backdrop';
    primaryColor: string;
    secondaryColor: string;
    accentGlow: string;
  };
  elements: TimelineElement[];
  captions: Array<{
    startOffsetSec: number;
    endOffsetSec: number;
    text: string;
  }>;
  mediaRef: {
    source: 'programmatic-html' | 'remotion-tsx' | 'veo-3.1' | 'stock-clip';
    promptOrAsset: string;
  };
  transition: 'cross-dissolve' | 'wipe-gold' | 'cut-crisp' | 'zoom-settle';
}

export interface UniversalVideoTimeline {
  schemaVersion: '1.0.0';
  projectMeta: {
    title: string;
    aspectRatio: AspectRatio;
    fps: number;
    width: number;
    height: number;
    totalDurationSec: number;
    platform: string;
    version: number;
  };
  brandKit: BrandKit;
  renderRuntime: 'hyperframes' | 'remotion';
  audioTracks: {
    voiceover: {
      voicePersona: string;
      provider: string;
      totalLines: number;
    };
    music: {
      style: string;
      bpm: number;
      mood: string;
      duckingDb: number;
    };
    sfx: Array<{
      atSec: number;
      cue: string;
    }>;
  };
  scenes: TimelineScene[];
}

export interface CompiledTargets {
  hyperframesHtml: string;
  remotionTsx: string;
  validation: {
    valid: boolean;
    errors: string[];
    sceneCount: number;
    totalDurationSec: number;
  };
}

export interface TimelinePatchResult {
  timeline: UniversalVideoTimeline;
  compiled: CompiledTargets;
  diffSummary: string;
  patchedSceneIds: string[];
  untouchedSceneIds: string[];
  traceId: string;
}

export interface VideoProject {
  id: string;
  title: string;
  prompt: string;
  status: 'pal-ready' | 'preproduction-ready' | 'compiled';
  createdAt: string;
  updatedAt: string;
  version: number;
  aspectRatio: AspectRatio;
  durationSec: number;
  runtime: RenderRuntime;
  routingMode: RoutingMode;
  brandKit: BrandKit;
  pal?: PALOutput;
  preProduction?: ArtisticPreProduction;
  timeline?: UniversalVideoTimeline;
  compiled?: CompiledTargets;
  editHistory: Array<{
    version: number;
    timestamp: string;
    instruction: string;
    diffSummary: string;
    patchedSceneIds: string[];
  }>;
}

export interface RuntimeLibraryStatus {
  id: string;
  name: string;
  role: string;
  license: string;
  status: 'ready' | 'available' | 'guarded';
  capabilities: string[];
  guardrailNote?: string;
}

export interface ModelAdapterStatus {
  id: string;
  provider: string;
  role: string;
  configuredOnServer: boolean;
  activeModels: string[];
  status: 'active' | 'gateway-ready' | 'retired-blocked';
  guardrailNote?: string;
}

export interface BootstrapReport {
  checkedAt: string;
  nodeVersion: string;
  protocolVersions: {
    mcp: string;
    acp: string;
    a2a: string;
  };
  programmaticLibraries: RuntimeLibraryStatus[];
  modelAdapters: ModelAdapterStatus[];
  composioMcpServers: string[];
  guardrailsActive: string[];
}

export interface RostrTraceSpan {
  service: string;
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  name: string;
  status: string;
  startedAt: string;
  durationMs: number;
  attributes: Record<string, unknown>;
}

export interface AgentConfigBundle {
  covenantMd: string;
  rostrConfigTs: string;
  systemPromptTxt: string;
  discoveryCard: Record<string, unknown>;
  mcpTools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
  contextStats: {
    namespace: string;
    totalRecords: number;
    totalEpisodes: number;
  };
}
