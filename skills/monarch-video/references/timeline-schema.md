# Universal Video Timeline JSON Schema (`timeline-schema.md`)

Canonical TypeScript contract bridging Monarch Video's PAL Intent Compiler and Artistic Pre-Production Suite into deterministic **HyperFrames HTML/GSAP** and **Remotion TSX** compositions, with non-destructive `TimelinePatch` support.

```ts
export type AspectRatio = "16:9" | "9:16" | "1:1";

export interface UniversalVideoTimeline {
  schemaVersion: "1.0.0";
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
  brandKit: {
    brandName: string;
    tagline: string;
    primaryColor: string;   // Default Monarch Royal Blue: #102D69
    accentColor: string;    // Default Monarch Gold: #D4AF37
    surfaceColor: string;   // Default Alabaster: #FAFBFD
    fontPairing: string;
    logoStyle: "monarch-crest" | "minimal-wordmark" | "monogram-seal";
  };
  renderRuntime: "hyperframes" | "remotion";
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
    sfx: Array<{ atSec: number; cue: string }>;
  };
  scenes: Array<{
    id: string;
    title: string;
    startSec: number;
    durationSec: number;
    layoutTemplate:
      | "hero-title"
      | "split-editorial"
      | "kinetic-statement"
      | "metric-showcase"
      | "logo-outro";
    background: {
      type: "solid" | "gradient" | "cinematic-backdrop";
      primaryColor: string;
      secondaryColor: string;
      accentGlow: string;
    };
    elements: Array<{
      id: string;
      type: "headline" | "subheadline" | "kicker" | "lower-third" | "cta-card" | "logo-mark" | "metric-callout";
      content: string;
      position: "center" | "lower-left" | "top-left" | "bottom-center" | "upper-center";
      animation: "fade-rise" | "kinetic-reveal" | "slide-left" | "scale-settle" | "gold-underline";
      color?: string;
    }>;
    captions: Array<{ startOffsetSec: number; endOffsetSec: number; text: string }>;
    mediaRef: {
      source: "programmatic-html" | "remotion-tsx" | "veo-3.1" | "stock-clip";
      promptOrAsset: string;
    };
    transition: "cross-dissolve" | "wipe-gold" | "cut-crisp" | "zoom-settle";
  }>;
}

export interface TimelinePatch {
  diffSummary: string;
  patchedSceneIds: string[];
  untouchedSceneIds: string[];
  patchedScenes: Array<{
    id: string;
    title?: string;
    durationSec?: number;
    primaryColor?: string;
    secondaryColor?: string;
    headline?: string;
    subheadline?: string;
    transition?: "cross-dissolve" | "wipe-gold" | "cut-crisp" | "zoom-settle";
  }>;
}
```
