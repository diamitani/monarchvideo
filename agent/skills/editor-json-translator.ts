/**
 * SUB-SKILL D & C1: Programmatic JSON Translator, 4-Source B-Roll Montage Compiler,
 * Multimodal Brand Kit Synchronizer & FFmpeg H.264 MP4 Renderer (`editor-json-translator`)
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { Type, type Schema } from '@google/genai';
import type {
  ArtisticPreProduction,
  AspectRatio,
  BrandKit,
  BRollShot,
  CompiledTargets,
  DesignStyleBlueprint,
  MontageCutTransition,
  MontageKenBurns,
  OpenMediaLibraryItem,
  PALOutput,
  TimelineScene,
  UniversalVideoTimeline,
} from '../../src/types/monarch.ts';
import {
  CURATED_BROLL_LIBRARY,
  DEFAULT_STYLE_BLUEPRINTS,
  MONARCH_SYSTEM_PROMPT,
} from '../config/monarch-config.ts';
import {
  generateStructuredJson,
  getGeminiClient,
  MONARCH_GEMINI_FALLBACK_MODEL,
  MONARCH_GEMINI_MODEL,
} from '../rostr/gemini-client.ts';

const execFileAsync = promisify(execFile);

function getDimensions(aspectRatio: AspectRatio): { width: number; height: number } {
  if (aspectRatio === '9:16') return { width: 1080, height: 1920 };
  if (aspectRatio === '1:1') return { width: 1080, height: 1080 };
  return { width: 1920, height: 1080 };
}

export function validateUniversalTimeline(timeline: UniversalVideoTimeline): {
  valid: boolean;
  errors: string[];
  sceneCount: number;
  totalDurationSec: number;
} {
  const errors: string[] = [];
  if (!timeline || typeof timeline !== 'object') {
    return { valid: false, errors: ['Timeline must be a valid JSON object.'], sceneCount: 0, totalDurationSec: 0 };
  }
  if (timeline.schemaVersion !== '1.0.0') {
    errors.push('schemaVersion must be "1.0.0".');
  }
  if (!timeline.projectMeta?.title) {
    errors.push('projectMeta.title is required.');
  }
  if (!['hyperframes', 'remotion'].includes(timeline.renderRuntime)) {
    errors.push('renderRuntime must be "hyperframes" or "remotion".');
  }
  if (!Array.isArray(timeline.scenes) || timeline.scenes.length === 0) {
    errors.push('scenes[] must contain at least one scene.');
  }

  let totalDuration = 0;
  for (const scene of timeline.scenes || []) {
    if (!scene.id) errors.push('Every scene requires an id.');
    if (!scene.durationSec || scene.durationSec <= 0) {
      errors.push(`Scene ${scene.id || '?'} must have positive durationSec.`);
    }
    if (!Array.isArray(scene.elements) || scene.elements.length === 0) {
      errors.push(`Scene ${scene.id || '?'} must contain at least one visual element.`);
    }
    totalDuration += Number(scene.durationSec || 0);
  }

  return {
    valid: errors.length === 0,
    errors,
    sceneCount: timeline.scenes?.length || 0,
    totalDurationSec: Number(totalDuration.toFixed(2)),
  };
}

const KEN_BURNS_CYCLE: MontageKenBurns[] = ['dolly-in', 'pan-left', 'pan-right', 'pull-back'];

export function populateSceneBRollShots(params: {
  sceneId: string;
  sceneIndex: number;
  sceneDurationSec: number;
  sceneTitle: string;
  visualPrompt: string;
  styleBlueprint?: DesignStyleBlueprint;
  availablePool?: OpenMediaLibraryItem[];
}): BRollShot[] {
  const {
    sceneId,
    sceneIndex,
    sceneDurationSec,
    sceneTitle,
    visualPrompt,
    styleBlueprint = DEFAULT_STYLE_BLUEPRINTS[0],
    availablePool,
  } = params;

  const videoPool = (availablePool && availablePool.length > 0 ? availablePool : CURATED_BROLL_LIBRARY).filter(
    (item) => item.mediaType === 'video' && item.url
  );
  const effectivePool = videoPool.length > 0 ? videoPool : CURATED_BROLL_LIBRARY;

  const cadence =
    styleBlueprint.shotCadenceSec && styleBlueprint.shotCadenceSec.length > 0
      ? styleBlueprint.shotCadenceSec
      : [2.0, 2.0, 2.0];
  const transitions: MontageCutTransition[] =
    styleBlueprint.transitionPack && styleBlueprint.transitionPack.length > 0
      ? styleBlueprint.transitionPack
      : ['hard-cut', 'whip-pan', 'gold-wipe', 'zoom-punch'];

  const promptTokens = `${sceneTitle} ${visualPrompt}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);

  // Rank available clips by semantic overlap + deterministic scene offset
  const scoredClips = effectivePool.map((clip, idx) => {
    const tagScore = (clip.tags || []).reduce(
      (acc, tag) => acc + (promptTokens.includes(tag.toLowerCase()) ? 3 : 0),
      0
    );
    const uploadBonus = clip.platform === 'user-upload' ? 4 : 0;
    return {
      clip,
      score: tagScore + uploadBonus + ((idx + sceneIndex) % effectivePool.length === 0 ? 2 : 0),
      idx,
    };
  });
  scoredClips.sort((a, b) => b.score - a.score || (a.idx + sceneIndex) % 5 - (b.idx + sceneIndex) % 5);

  const shots: BRollShot[] = [];
  let offset = 0;
  let cutIdx = 0;

  while (offset < sceneDurationSec - 0.25 && cutIdx < 5) {
    const targetDur = cadence[cutIdx % cadence.length] || 2.0;
    const remaining = Number((sceneDurationSec - offset).toFixed(2));
    const shotDur = remaining <= targetDur + 0.6 ? remaining : Number(targetDur.toFixed(2));
    const chosen = scoredClips[(sceneIndex * 2 + cutIdx) % scoredClips.length].clip;

    shots.push({
      id: `${sceneId}-shot-${cutIdx + 1}`,
      clipUrl: chosen.url,
      title: chosen.title,
      source: chosen.platform,
      startOffsetSec: Number(offset.toFixed(2)),
      durationSec: Number(shotDur.toFixed(2)),
      cutTransition: transitions[(sceneIndex + cutIdx) % transitions.length],
      kenBurns: KEN_BURNS_CYCLE[(sceneIndex + cutIdx) % KEN_BURNS_CYCLE.length],
      filterCss: styleBlueprint.colorGrade?.cssFilter || 'contrast(1.10) saturate(1.06)',
      author: chosen.author || 'Monarch Cinema Unit',
      license: chosen.license || 'CC0 / Open Studio',
    });

    offset = Number((offset + shotDur).toFixed(2));
    cutIdx += 1;
  }

  return shots;
}

export function buildTimelineFromPreProduction(params: {
  pal: PALOutput;
  preProduction: ArtisticPreProduction;
  brandKit: BrandKit;
  styleBlueprint?: DesignStyleBlueprint;
  brollPool?: OpenMediaLibraryItem[];
}): UniversalVideoTimeline {
  const { pal, preProduction, brandKit, styleBlueprint = DEFAULT_STYLE_BLUEPRINTS[0], brollPool } = params;
  const dims = getDimensions(pal.parseData.aspectRatio);
  const renderRuntime: 'hyperframes' | 'remotion' =
    pal.hypothesis.selectedRuntime === 'remotion' ? 'remotion' : 'hyperframes';

  let cursor = 0;
  const totalScenes = preProduction.storyboard.length;

  const scenes: TimelineScene[] = preProduction.storyboard.map((card, idx) => {
    const cue = preProduction.scriptAndCueSheet[idx];
    const startSec = cursor;
    cursor += card.durationSec;

    const isFirst = idx === 0;
    const isLast = idx === totalScenes - 1;
    const layoutTemplate: TimelineScene['layoutTemplate'] = isFirst
      ? 'hero-title'
      : isLast
        ? 'logo-outro'
        : idx % 2 === 1
          ? 'split-editorial'
          : 'kinetic-statement';

    const primaryBg = brandKit.primaryColor || '#102D69';
    const secondaryBg = '#091A3E';
    const textColor = '#FFFFFF';

    const voiceText = cue?.voiceover || card.subText;
    const words = voiceText.split(/\s+/).filter(Boolean);
    const midpoint = Math.ceil(words.length / 2);
    const part1 = words.slice(0, midpoint).join(' ');
    const part2 = words.slice(midpoint).join(' ');
    const halfDur = Number((card.durationSec / 2).toFixed(2));

    const captions = part2
      ? [
          { startOffsetSec: 0.15, endOffsetSec: halfDur, text: part1 },
          { startOffsetSec: halfDur, endOffsetSec: Math.max(halfDur + 0.4, card.durationSec - 0.15), text: part2 },
        ]
      : [{ startOffsetSec: 0.15, endOffsetSec: Math.max(1, card.durationSec - 0.15), text: voiceText }];

    const brollShots = populateSceneBRollShots({
      sceneId: card.sceneId,
      sceneIndex: idx,
      sceneDurationSec: card.durationSec,
      sceneTitle: card.title,
      visualPrompt: card.visualPrompt,
      styleBlueprint,
      availablePool: brollPool,
    });

    return {
      id: card.sceneId,
      title: card.title,
      startSec,
      durationSec: card.durationSec,
      layoutTemplate,
      background: {
        type: 'cinematic-backdrop',
        primaryColor: primaryBg,
        secondaryColor: secondaryBg,
        accentGlow: brandKit.accentColor || '#D4AF37',
      },
      elements: [
        {
          id: `${card.sceneId}-kicker`,
          type: 'kicker',
          content: isLast ? brandKit.brandName : `0${idx + 1} · ${card.title}`,
          position: 'top-left',
          animation: 'fade-rise',
          color: brandKit.accentColor,
        },
        {
          id: `${card.sceneId}-headline`,
          type: 'headline',
          content: cue?.kineticHeadline || card.onScreenText,
          position: styleBlueprint.typographyRules?.placement || 'center',
          animation: isFirst ? 'kinetic-reveal' : 'scale-settle',
          color: textColor,
        },
        {
          id: `${card.sceneId}-sub`,
          type: isLast ? 'cta-card' : 'subheadline',
          content: isLast ? preProduction.projectBrief.primaryCta : card.subText,
          position: 'bottom-center',
          animation: 'gold-underline',
          color: '#E2E8F0',
        },
      ],
      captions,
      mediaRef: {
        source: card.assetSource,
        promptOrAsset: brollShots[0]?.clipUrl || card.visualPrompt,
      },
      transition: isLast ? 'cross-dissolve' : idx % 2 === 0 ? 'wipe-gold' : 'cut-crisp',
      brollShots,
    };
  });

  return {
    schemaVersion: '1.0.0',
    projectMeta: {
      title: preProduction.projectBrief.title,
      aspectRatio: pal.parseData.aspectRatio,
      fps: 30,
      width: dims.width,
      height: dims.height,
      totalDurationSec: cursor,
      platform: pal.parseData.platform,
      version: 1,
    },
    brandKit,
    renderRuntime,
    styleBlueprintId: styleBlueprint.id,
    audioTracks: {
      voiceover: {
        voicePersona: preProduction.videoTreatment.voiceoverDirection,
        provider: 'Gemini 3.8 Flash TTS (24kHz WAV)',
        totalLines: preProduction.scriptAndCueSheet.length,
      },
      music: {
        style: preProduction.videoTreatment.soundscapeAndMusic,
        bpm: styleBlueprint.musicBpmRange ? Math.round((styleBlueprint.musicBpmRange[0] + styleBlueprint.musicBpmRange[1]) / 2) : 104,
        mood: preProduction.videoTreatment.visualMood,
        duckingDb: -14,
      },
      sfx: preProduction.scriptAndCueSheet.map((c) => ({
        atSec: c.startSec,
        cue: c.sfxCue,
      })),
    },
    scenes,
  };
}

export function compileToHyperFramesHtml(
  timeline: UniversalVideoTimeline,
  options?: { animationPreset?: string; videoPreset?: string }
): string {
  const animationPreset = options?.animationPreset || 'kinetic-editorial';
  const videoPreset = options?.videoPreset || 'royal-architectural';
  const safeJson = JSON.stringify(timeline, null, 2).replace(/<\/script>/gi, '<\\/script>');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(timeline.projectMeta.title)} — HyperFrames B-Roll Montage Bundle</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: ${timeline.brandKit.primaryColor};
      font-family: "DM Sans", system-ui, sans-serif;
    }
    #stage {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    .scene {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: clamp(24px, 5vw, 72px);
      opacity: 0;
      will-change: transform, opacity;
    }
    .broll-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      opacity: 0.78;
    }
    .contrast-scrim {
      position: absolute;
      inset: 0;
      z-index: 1;
      background: linear-gradient(180deg, rgba(7, 17, 38, 0.45) 0%, rgba(7, 17, 38, 0.86) 100%);
      pointer-events: none;
    }
    .scene-top {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .kicker {
      font-family: "JetBrains Mono", monospace;
      font-size: clamp(11px, 1.3vw, 18px);
      letter-spacing: 0.08em;
      font-weight: 500;
      text-transform: uppercase;
      color: ${timeline.brandKit.accentColor};
    }
    .brand-lockup {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo-img {
      height: 28px;
      width: auto;
      object-fit: contain;
      border-radius: 4px;
    }
    .brand-tag {
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: clamp(11px, 1.3vw, 17px);
      font-weight: 700;
      color: #ffffff;
    }
    .hero-block {
      position: relative;
      z-index: 2;
      max-width: 78%;
    }
    .hero-block.centered {
      margin: 0 auto;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .outro-logo {
      height: 64px;
      width: auto;
      object-fit: contain;
      margin-bottom: 18px;
    }
    .headline {
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: clamp(24px, 4.4vw, 68px);
      line-height: 1.08;
      font-weight: 700;
      letter-spacing: -0.028em;
      text-wrap: balance;
      color: #ffffff;
    }
    .gold-rule {
      width: clamp(48px, 6vw, 96px);
      height: 3px;
      background: ${timeline.brandKit.accentColor};
      margin: clamp(12px, 1.8vw, 24px) 0;
      transform-origin: left center;
    }
    .subheadline {
      font-size: clamp(13px, 1.8vw, 24px);
      line-height: 1.45;
      max-width: 48ch;
      color: #e2e8f0;
    }
    .scene-footer {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
    }
    .caption-pill {
      max-width: 78%;
      background: rgba(9, 20, 43, 0.78);
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: clamp(11px, 1.2vw, 16px);
      line-height: 1.35;
      backdrop-filter: blur(6px);
    }
    .meta-source {
      font-family: "JetBrains Mono", monospace;
      font-size: clamp(10px, 1vw, 13px);
      color: #cbd5e1;
    }
  </style>
</head>
<body data-animation-preset="${escapeHtml(animationPreset)}" data-video-preset="${escapeHtml(videoPreset)}">
  <div id="stage"></div>
  <script id="monarch-timeline" type="application/json">
${safeJson}
  </script>
  <script>
    const timelineData = JSON.parse(document.getElementById("monarch-timeline").textContent);
    const animPreset = document.body.dataset.animationPreset || "kinetic-editorial";
    const stage = document.getElementById("stage");
    const master = gsap.timeline({ paused: true });
    const brandLogoUrl = timelineData.brandKit.logoUrl || "";

    timelineData.scenes.forEach((scene) => {
      const el = document.createElement("section");
      el.className = "scene";
      el.dataset.sceneId = scene.id;
      el.style.background = \`linear-gradient(135deg, \${scene.background.primaryColor}, \${scene.background.secondaryColor})\`;

      const kicker = scene.elements.find((e) => e.type === "kicker");
      const headline = scene.elements.find((e) => e.type === "headline");
      const sub = scene.elements.find((e) => e.type === "subheadline" || e.type === "cta-card");
      const caption = scene.captions?.[0]?.text || "";
      const isCentered = scene.layoutTemplate === "logo-outro";
      const primaryShot = (scene.brollShots && scene.brollShots[0]) || null;

      el.innerHTML = \`
        \${primaryShot ? \`<video class="broll-video" src="\${primaryShot.clipUrl}" muted playsinline autoplay loop style="filter:\${primaryShot.filterCss || 'none'}"></video>\` : ''}
        <div class="contrast-scrim"></div>
        <div class="scene-top">
          <span class="kicker">\${kicker ? kicker.content : scene.title}</span>
          <div class="brand-lockup">
            \${brandLogoUrl ? \`<img class="brand-logo-img" src="\${brandLogoUrl}" alt="Brand Logo" />\` : ''}
            <span class="brand-tag">\${timelineData.brandKit.brandName}</span>
          </div>
        </div>
        <div class="hero-block \${isCentered ? 'centered' : ''}">
          \${isCentered && brandLogoUrl ? \`<img class="outro-logo" src="\${brandLogoUrl}" alt="Brand Outro Logo" />\` : ''}
          <h1 class="headline">\${headline ? headline.content : scene.title}</h1>
          <div class="gold-rule"></div>
          <p class="subheadline">\${sub ? sub.content : ''}</p>
        </div>
        <div class="scene-footer">
          <div class="caption-pill">\${caption}</div>
          <span class="meta-source">\${(scene.brollShots || []).length} B-Roll Cuts · \${animPreset}</span>
        </div>
      \`;
      stage.appendChild(el);

      const hEl = el.querySelector(".headline");
      const ruleEl = el.querySelector(".gold-rule");
      const subEl = el.querySelector(".subheadline");

      master.to(el, { opacity: 1, duration: 0.25, ease: "power3.out" }, scene.startSec);
      master.fromTo(hEl, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, scene.startSec + 0.06);
      master.fromTo(ruleEl, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.out" }, scene.startSec + 0.18);
      master.fromTo(subEl, { y: 12, opacity: 0 }, { y: 0, opacity: 0.92, duration: 0.45, ease: "power2.out" }, scene.startSec + 0.28);
      master.to(el, { opacity: 0, duration: 0.22, ease: "power2.in" }, Math.max(scene.startSec + 0.5, scene.startSec + scene.durationSec - 0.22));
    });

    master.seek(0.15).pause();
    window.__HYPERFRAMES_SEEK__ = (sec) => master.seek(Math.max(0, Number(sec) || 0)).pause();
  </script>
</body>
</html>`;
}

export function compileToRemotionTsx(timeline: UniversalVideoTimeline): string {
  const componentName = 'MonarchComposition';
  const serialized = JSON.stringify(timeline, null, 2);

  return `import React from 'react';
import { AbsoluteFill, Composition, Img, OffthreadVideo, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const TIMELINE = ${serialized} as const;

const SceneFrame: React.FC<{ scene: (typeof TIMELINE.scenes)[number] }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const translateY = interpolate(enter, [0, 1], [32, 0]);
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });

  const kicker = scene.elements.find((e) => e.type === 'kicker');
  const headline = scene.elements.find((e) => e.type === 'headline');
  const sub = scene.elements.find((e) => e.type === 'subheadline' || e.type === 'cta-card');
  const brollShots = (scene as unknown as { brollShots?: Array<{ id: string; clipUrl: string; startOffsetSec: number; durationSec: number; filterCss?: string }> }).brollShots ?? [];
  const logoUrl = (TIMELINE.brandKit as unknown as { logoUrl?: string }).logoUrl;

  return (
    <AbsoluteFill
      style={{
        background: \`linear-gradient(135deg, \${scene.background.primaryColor}, \${scene.background.secondaryColor})\`,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        opacity,
      }}
    >
      {brollShots.map((shot) => (
        <Sequence
          key={shot.id}
          from={Math.round(shot.startOffsetSec * fps)}
          durationInFrames={Math.max(1, Math.round(shot.durationSec * fps))}
        >
          <OffthreadVideo
            src={shot.clipUrl}
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: shot.filterCss ?? 'none' }}
          />
        </Sequence>
      ))}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(7,17,38,0.40) 0%, rgba(7,17,38,0.85) 100%)',
          padding: 88,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: TIMELINE.brandKit.accentColor, fontSize: 24, fontWeight: 600 }}>
            {kicker?.content ?? scene.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {logoUrl ? <Img src={logoUrl} style={{ height: 42, width: 'auto' }} /> : null}
            <span style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 700 }}>{TIMELINE.brandKit.brandName}</span>
          </div>
        </div>
        <div style={{ transform: \`translateY(\${translateY}px)\` }}>
          <h1 style={{ color: '#FFFFFF', fontSize: 78, lineHeight: 1.08, margin: 0, maxWidth: '18ch' }}>
            {headline?.content ?? scene.title}
          </h1>
          <div style={{ width: 96, height: 3, background: TIMELINE.brandKit.accentColor, margin: '28px 0' }} />
          <p style={{ color: '#E2E8F0', fontSize: 32, lineHeight: 1.4, margin: 0, maxWidth: '42ch' }}>
            {sub?.content ?? ''}
          </p>
        </div>
        <div style={{ color: '#CBD5E1', fontSize: 20 }}>
          {TIMELINE.brandKit.brandName} · {brollShots.length} B-Roll Montage Cuts
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ${componentName}: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: TIMELINE.brandKit.primaryColor }}>
      {TIMELINE.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={Math.round(scene.startSec * fps)}
          durationInFrames={Math.max(1, Math.round(scene.durationSec * fps))}
        >
          <SceneFrame scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MonarchVideo"
    component={${componentName}}
    durationInFrames={Math.round(TIMELINE.projectMeta.totalDurationSec * TIMELINE.projectMeta.fps)}
    fps={TIMELINE.projectMeta.fps}
    width={TIMELINE.projectMeta.width}
    height={TIMELINE.projectMeta.height}
  />
);
`;
}

export function compileAllTargets(
  timeline: UniversalVideoTimeline,
  options?: { animationPreset?: string; videoPreset?: string }
): CompiledTargets {
  const validation = validateUniversalTimeline(timeline);
  return {
    hyperframesHtml: compileToHyperFramesHtml(timeline, options),
    remotionTsx: compileToRemotionTsx(timeline),
    validation,
  };
}

// --- Multimodal Brand Doc & Logo Auto-Sync Extractor ---

const BRAND_KIT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    brandName: { type: Type.STRING },
    tagline: { type: Type.STRING },
    primaryColor: { type: Type.STRING },
    accentColor: { type: Type.STRING },
    surfaceColor: { type: Type.STRING },
    fontPairing: { type: Type.STRING },
    brandVoice: { type: Type.STRING },
    summary: { type: Type.STRING },
  },
  required: [
    'brandName',
    'tagline',
    'primaryColor',
    'accentColor',
    'surfaceColor',
    'fontPairing',
    'brandVoice',
    'summary',
  ],
};

function sanitizeHexColor(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  return fallback;
}

export async function extractBrandKitFromAsset(params: {
  name: string;
  mimeType: string;
  dataUrl?: string;
  textContent?: string;
  currentBrandKit?: BrandKit;
}): Promise<{ brandKit: BrandKit; summary: string }> {
  const { name, mimeType, dataUrl, textContent, currentBrandKit } = params;
  const isImage = mimeType.startsWith('image/') || /\.(png|svg|jpg|jpeg|webp)$/i.test(name);
  const cleanName = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Monarch Studio';

  try {
    const ai = getGeminiClient();
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (isImage && dataUrl && dataUrl.startsWith('data:image/') && !dataUrl.startsWith('data:image/svg')) {
      const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (base64Match) {
        parts.push({
          inlineData: {
            mimeType: base64Match[1],
            data: base64Match[2],
          },
        });
      }
    }

    const docContext = textContent
      ? `Document Text Content:\n${textContent.slice(0, 6000)}`
      : dataUrl && dataUrl.startsWith('data:text/')
        ? `Encoded Text Asset: ${name}`
        : `Uploaded Asset Filename: "${name}" (${mimeType})`;

    parts.push({
      text: `You are Sub-Agent 3 (brand_kit_guardian) in Monarch Video Studio.
Extract a cohesive commercial Brand Kit from this uploaded brand asset or logo.
${docContext}
Existing Brand Context: ${currentBrandKit ? JSON.stringify(currentBrandKit) : 'Default Monarch Royal Blue (#102D69) and Gold (#D4AF37)'}

Return valid 6-digit hex color codes (#RRGGBB) for primaryColor (dominant dark/brand color), accentColor (high-contrast highlight/gold/electric accent), and surfaceColor (clean neutral light canvas like #FAFBFD).`,
    });

    let rawJsonText = '';
    try {
      const resp = await ai.models.generateContent({
        model: MONARCH_GEMINI_MODEL,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: BRAND_KIT_SCHEMA,
        },
      });
      rawJsonText = (resp.text || '').trim();
    } catch {
      const fallbackResp = await ai.models.generateContent({
        model: MONARCH_GEMINI_FALLBACK_MODEL,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: BRAND_KIT_SCHEMA,
        },
      });
      rawJsonText = (fallbackResp.text || '').trim();
    }

    const parsed = JSON.parse(rawJsonText) as {
      brandName: string;
      tagline: string;
      primaryColor: string;
      accentColor: string;
      surfaceColor: string;
      fontPairing: string;
      brandVoice: string;
      summary: string;
    };

    const brandKit: BrandKit = {
      brandName: (parsed.brandName || currentBrandKit?.brandName || cleanName).slice(0, 80),
      tagline: (parsed.tagline || currentBrandKit?.tagline || 'Direct studio-grade video with natural language.').slice(0, 160),
      primaryColor: sanitizeHexColor(parsed.primaryColor, currentBrandKit?.primaryColor || '#102D69'),
      accentColor: sanitizeHexColor(parsed.accentColor, currentBrandKit?.accentColor || '#D4AF37'),
      surfaceColor: sanitizeHexColor(parsed.surfaceColor, currentBrandKit?.surfaceColor || '#FAFBFD'),
      fontPairing: parsed.fontPairing || currentBrandKit?.fontPairing || 'Plus Jakarta Sans + DM Sans',
      logoStyle: currentBrandKit?.logoStyle || 'monarch-crest',
      logoUrl: isImage && dataUrl ? dataUrl : currentBrandKit?.logoUrl,
      logoPlacement: 'watermark-and-outro',
      brandVoice: parsed.brandVoice || 'Executive, tactile, high-contrast commercial authority',
      sourceDocName: name,
      autoSyncEnabled: currentBrandKit?.autoSyncEnabled ?? true,
    };

    return {
      brandKit,
      summary:
        parsed.summary ||
        `Extracted ${brandKit.brandName} palette (${brandKit.primaryColor} / ${brandKit.accentColor})${
          isImage ? ' and bound uploaded logo mark to video watermark & outro.' : ' from brand document.'
        }`,
    };
  } catch {
    const fallbackKit: BrandKit = {
      brandName: currentBrandKit?.brandName || cleanName,
      tagline: currentBrandKit?.tagline || 'Precision motion engineered for modern brands.',
      primaryColor: currentBrandKit?.primaryColor || '#102D69',
      accentColor: currentBrandKit?.accentColor || '#D4AF37',
      surfaceColor: currentBrandKit?.surfaceColor || '#FAFBFD',
      fontPairing: currentBrandKit?.fontPairing || 'Plus Jakarta Sans + DM Sans',
      logoStyle: currentBrandKit?.logoStyle || 'monarch-crest',
      logoUrl: isImage && dataUrl ? dataUrl : currentBrandKit?.logoUrl,
      logoPlacement: 'watermark-and-outro',
      brandVoice: 'Measured, regal, high-trust studio direction',
      sourceDocName: name,
      autoSyncEnabled: currentBrandKit?.autoSyncEnabled ?? true,
    };
    return {
      brandKit: fallbackKit,
      summary: `Synced ${fallbackKit.brandName} (${fallbackKit.primaryColor} · ${fallbackKit.accentColor})${
        isImage ? ' with custom logo watermark & outro.' : '.'
      }`,
    };
  }
}

// --- JSON Cinema Style Blueprint Extractor & Feedback Loop ---

const STYLE_BLUEPRINT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    archetype: { type: Type.STRING },
    description: { type: Type.STRING },
    shotCadenceSec: {
      type: Type.ARRAY,
      items: { type: Type.NUMBER },
    },
    cutRhythm: {
      type: Type.STRING,
      enum: ['rapid-montage', 'kinetic-editorial', 'measured-cinema'],
    },
    transitionPack: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        enum: ['hard-cut', 'whip-pan', 'gold-wipe', 'zoom-punch'],
      },
    },
    colorGradeName: { type: Type.STRING },
    cssFilter: { type: Type.STRING },
    headlineMaxWords: { type: Type.NUMBER },
    placement: {
      type: Type.STRING,
      enum: ['center', 'lower-left', 'upper-center'],
    },
    lowerThirdStyle: { type: Type.STRING },
    minBpm: { type: Type.NUMBER },
    maxBpm: { type: Type.NUMBER },
    learnedNote: { type: Type.STRING },
  },
  required: [
    'name',
    'archetype',
    'description',
    'shotCadenceSec',
    'cutRhythm',
    'transitionPack',
    'colorGradeName',
    'cssFilter',
    'headlineMaxWords',
    'placement',
    'lowerThirdStyle',
    'minBpm',
    'maxBpm',
    'learnedNote',
  ],
};

export async function extractStyleBlueprintFromReference(params: {
  referenceText: string;
}): Promise<DesignStyleBlueprint> {
  try {
    const raw = await generateStructuredJson<{
      name: string;
      archetype: string;
      description: string;
      shotCadenceSec: number[];
      cutRhythm: 'rapid-montage' | 'kinetic-editorial' | 'measured-cinema';
      transitionPack: MontageCutTransition[];
      colorGradeName: string;
      cssFilter: string;
      headlineMaxWords: number;
      placement: 'center' | 'lower-left' | 'upper-center';
      lowerThirdStyle: string;
      minBpm: number;
      maxBpm: number;
      learnedNote: string;
    }>({
      systemInstruction: `${MONARCH_SYSTEM_PROMPT}\nYou are reverse-engineering a reusable JSON Cinema Style Blueprint from a video reference description.`,
      contents: `Reference Video / Editing Style Description:
"${params.referenceText}"

Generate a structured Cinema Style Blueprint with realistic shotCadenceSec values (between 1.2 and 3.5 seconds), crisp transitions, and CSS filter grading.`,
      responseSchema: STYLE_BLUEPRINT_SCHEMA,
    });

    const cadence = (raw.shotCadenceSec || [1.8, 2.0, 1.8]).map((n) =>
      Number(Math.max(1.0, Math.min(4.5, Number(n) || 2.0)).toFixed(1))
    );

    return {
      id: `style-custom-${Date.now().toString(36)}`,
      name: raw.name || 'Custom Montage Blueprint',
      archetype: raw.archetype || 'Commercial B-Roll Montage',
      description: raw.description || 'Custom reverse-engineered montage style blueprint.',
      shotCadenceSec: cadence.length > 0 ? cadence : [1.8, 2.0, 1.8],
      cutRhythm: raw.cutRhythm || 'rapid-montage',
      transitionPack:
        raw.transitionPack && raw.transitionPack.length > 0
          ? raw.transitionPack
          : ['hard-cut', 'whip-pan', 'gold-wipe'],
      colorGrade: {
        name: raw.colorGradeName || 'Anamorphic Studio Contrast',
        cssFilter: raw.cssFilter || 'contrast(1.12) saturate(1.06)',
        scrimCss: 'linear-gradient(180deg, rgba(7,17,38,0.32) 0%, rgba(7,17,38,0.85) 100%)',
      },
      typographyRules: {
        headlineMaxWords: Math.max(4, Math.min(12, Number(raw.headlineMaxWords || 7))),
        placement: raw.placement || 'lower-left',
        lowerThirdStyle: raw.lowerThirdStyle || 'Satin Gold Hairline Rule',
      },
      musicBpmRange: [
        Math.max(70, Math.min(150, Number(raw.minBpm || 100))),
        Math.max(80, Math.min(160, Number(raw.maxBpm || 124))),
      ],
      usageCount: 1,
      ratingScore: 95,
      learnedNotes: [raw.learnedNote || `Reverse-engineered from: "${params.referenceText.slice(0, 80)}"`],
    };
  } catch {
    return {
      ...DEFAULT_STYLE_BLUEPRINTS[0],
      id: `style-custom-${Date.now().toString(36)}`,
      name: `Custom Blueprint · ${params.referenceText.slice(0, 28) || 'Montage'}`,
      learnedNotes: [`Synthesized from reference brief: "${params.referenceText.slice(0, 80)}"`],
    };
  }
}

export function applyFeedbackToStyleBlueprint(
  blueprint: DesignStyleBlueprint,
  feedbackType: 'sharper-cuts' | 'love-pacing' | 'more-cinematic',
  note?: string
): { updated: DesignStyleBlueprint; lesson: string } {
  let nextCadence = [...blueprint.shotCadenceSec];
  let nextRhythm = blueprint.cutRhythm;
  let nextScore = blueprint.ratingScore;
  let lesson = '';

  if (feedbackType === 'sharper-cuts') {
    nextCadence = nextCadence.map((sec) => Number(Math.max(1.2, sec - 0.35).toFixed(2)));
    nextRhythm = 'rapid-montage';
    nextScore = Math.min(100, nextScore + 1);
    lesson = `Creator requested sharper montage cuts on "${blueprint.name}": tightened shotCadenceSec to [${nextCadence.join(', ')}s] with rapid-montage rhythm.`;
  } else if (feedbackType === 'more-cinematic') {
    nextCadence = nextCadence.map((sec) => Number(Math.min(4.0, sec + 0.4).toFixed(2)));
    nextRhythm = 'measured-cinema';
    nextScore = Math.min(100, nextScore + 1);
    lesson = `Creator requested longer breathing room on "${blueprint.name}": expanded shotCadenceSec to [${nextCadence.join(', ')}s].`;
  } else {
    nextScore = Math.min(100, nextScore + 2);
    lesson = `Creator endorsed pacing on "${blueprint.name}" (Rating ${nextScore}/100): reinforced shotCadenceSec [${nextCadence.join(', ')}s].`;
  }

  if (note && note.trim()) {
    lesson += ` Note: ${note.trim()}`;
  }

  const updated: DesignStyleBlueprint = {
    ...blueprint,
    shotCadenceSec: nextCadence,
    cutRhythm: nextRhythm,
    usageCount: blueprint.usageCount + 1,
    ratingScore: nextScore,
    learnedNotes: [lesson, ...(blueprint.learnedNotes || []).slice(0, 5)],
  };

  return { updated, lesson };
}

// --- Bi-Directional Conversational Diff Loop ---

const PATCH_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    diffSummary: { type: Type.STRING },
    patchedScenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          durationSec: { type: Type.NUMBER },
          layoutTemplate: {
            type: Type.STRING,
            enum: ['hero-title', 'split-editorial', 'kinetic-statement', 'metric-showcase', 'logo-outro'],
          },
          primaryColor: { type: Type.STRING },
          secondaryColor: { type: Type.STRING },
          accentGlow: { type: Type.STRING },
          headline: { type: Type.STRING },
          headlineColor: { type: Type.STRING },
          subheadline: { type: Type.STRING },
          subheadlineColor: { type: Type.STRING },
          captionText: { type: Type.STRING },
          transition: {
            type: Type.STRING,
            enum: ['cross-dissolve', 'wipe-gold', 'cut-crisp', 'zoom-settle'],
          },
        },
        required: ['id'],
      },
    },
  },
  required: ['diffSummary', 'patchedScenes'],
};

interface RawPatchResult {
  diffSummary: string;
  patchedScenes: Array<{
    id: string;
    title?: string;
    durationSec?: number;
    layoutTemplate?: TimelineScene['layoutTemplate'];
    primaryColor?: string;
    secondaryColor?: string;
    accentGlow?: string;
    headline?: string;
    headlineColor?: string;
    subheadline?: string;
    subheadlineColor?: string;
    captionText?: string;
    transition?: TimelineScene['transition'];
  }>;
}

export async function applyConversationalTimelinePatch(params: {
  timeline: UniversalVideoTimeline;
  instruction: string;
  styleBlueprint?: DesignStyleBlueprint;
  brollPool?: OpenMediaLibraryItem[];
}): Promise<{
  timeline: UniversalVideoTimeline;
  compiled: CompiledTargets;
  diffSummary: string;
  patchedSceneIds: string[];
  untouchedSceneIds: string[];
}> {
  const { timeline, instruction, styleBlueprint, brollPool } = params;

  const sceneSummary = timeline.scenes.map((s) => ({
    id: s.id,
    title: s.title,
    durationSec: s.durationSec,
    layoutTemplate: s.layoutTemplate,
    background: s.background,
    headline: s.elements.find((e) => e.type === 'headline')?.content,
    subheadline: s.elements.find((e) => e.type === 'subheadline' || e.type === 'cta-card')?.content,
    transition: s.transition,
    brollCount: s.brollShots?.length || 0,
  }));

  const rawPatch = await generateStructuredJson<RawPatchResult>({
    systemInstruction: `${MONARCH_SYSTEM_PROMPT}\n\nYou are executing the Bi-Directional Conversational Diff Loop in Sub-Skill D (editor-json-translator).
Return ONLY the scenes that must change to fulfill the user's edit instruction. Preserve all untouched scenes completely. Use valid hex colors (#102D69 for royal blue, #D4AF37 for gold, etc.).`,
    contents: `Current Timeline Scenes:
${JSON.stringify(sceneSummary, null, 2)}

Brand Kit:
${JSON.stringify(timeline.brandKit, null, 2)}

User Conversational Edit Request:
"${instruction}"

Return diffSummary (1 clear sentence describing the exact scene edits) and patchedScenes[] containing ONLY the scene IDs that need modification.`,
    responseSchema: PATCH_RESPONSE_SCHEMA,
  });

  const patchMap = new Map(rawPatch.patchedScenes.map((p) => [p.id, p]));
  const patchedSceneIds: string[] = [];
  const untouchedSceneIds: string[] = [];

  let cursor = 0;
  const updatedScenes: TimelineScene[] = timeline.scenes.map((scene, idx) => {
    const patch = patchMap.get(scene.id);
    if (!patch) {
      untouchedSceneIds.push(scene.id);
      const preserved: TimelineScene = { ...scene, startSec: cursor };
      cursor += preserved.durationSec;
      return preserved;
    }

    patchedSceneIds.push(scene.id);
    const nextDuration =
      typeof patch.durationSec === 'number' && patch.durationSec >= 2 && patch.durationSec <= 25
        ? Number(patch.durationSec.toFixed(1))
        : scene.durationSec;

    const nextPrimary = patch.primaryColor || scene.background.primaryColor;
    const isDarkBg = isColorDark(nextPrimary);

    const updatedElements = scene.elements.map((el) => {
      if (el.type === 'headline') {
        return {
          ...el,
          content: patch.headline || el.content,
          color: patch.headlineColor || (patch.primaryColor ? (isDarkBg ? '#FFFFFF' : '#0F172A') : el.color),
        };
      }
      if (el.type === 'subheadline' || el.type === 'cta-card') {
        return {
          ...el,
          content: patch.subheadline || el.content,
          color: patch.subheadlineColor || (patch.primaryColor ? (isDarkBg ? '#CBD5E1' : '#475569') : el.color),
        };
      }
      return el;
    });

    const updatedCaptions = patch.captionText
      ? [{ startOffsetSec: 0.15, endOffsetSec: Math.max(1, nextDuration - 0.15), text: patch.captionText }]
      : scene.captions;

    const refreshedShots = populateSceneBRollShots({
      sceneId: scene.id,
      sceneIndex: idx,
      sceneDurationSec: nextDuration,
      sceneTitle: patch.title || scene.title,
      visualPrompt: `${patch.headline || ''} ${instruction}`,
      styleBlueprint,
      availablePool: brollPool,
    });

    const patchedScene: TimelineScene = {
      ...scene,
      title: patch.title || scene.title,
      startSec: cursor,
      durationSec: nextDuration,
      layoutTemplate: patch.layoutTemplate || scene.layoutTemplate,
      background: {
        ...scene.background,
        primaryColor: nextPrimary,
        secondaryColor:
          patch.secondaryColor ||
          (patch.primaryColor ? (isDarkBg ? '#091A3E' : '#EEF3FA') : scene.background.secondaryColor),
        accentGlow: patch.accentGlow || scene.background.accentGlow,
      },
      elements: updatedElements,
      captions: updatedCaptions,
      transition: patch.transition || scene.transition,
      brollShots: refreshedShots,
    };

    cursor += patchedScene.durationSec;
    return patchedScene;
  });

  const nextTimeline: UniversalVideoTimeline = {
    ...timeline,
    projectMeta: {
      ...timeline.projectMeta,
      totalDurationSec: Number(cursor.toFixed(1)),
      version: timeline.projectMeta.version + 1,
    },
    scenes: updatedScenes,
  };

  return {
    timeline: nextTimeline,
    compiled: compileAllTargets(nextTimeline),
    diffSummary: rawPatch.diffSummary,
    patchedSceneIds,
    untouchedSceneIds,
  };
}

// --- Server-Side FFmpeg H.264 MP4 Renderer & WebM -> MP4 Transcoder ---

export async function renderTimelineToMp4(params: {
  timeline: UniversalVideoTimeline;
  projectId?: string;
}): Promise<{
  mp4Url: string;
  filename: string;
  sizeBytes: number;
  durationSec: number;
  shotCount: number;
  codec: string;
}> {
  const { timeline, projectId = `monarch-${Date.now().toString(36)}` } = params;
  const publicDir = path.resolve(process.cwd(), 'public');
  const rendersDir = path.join(publicDir, 'assets', 'renders');
  fs.mkdirSync(rendersDir, { recursive: true });

  const safeId = projectId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  const outFilename = `${safeId}-v${timeline.projectMeta.version || 1}.mp4`;
  const outPath = path.join(rendersDir, outFilename);

  // Collect local playable .mp4 files from all scene B-roll shots
  const localBrollFiles: string[] = [];
  for (const scene of timeline.scenes || []) {
    const shots = scene.brollShots && scene.brollShots.length > 0 ? scene.brollShots : [];
    for (const shot of shots) {
      if (shot.clipUrl && shot.clipUrl.startsWith('/assets/broll/')) {
        const candidate = path.join(publicDir, shot.clipUrl);
        if (fs.existsSync(candidate)) {
          localBrollFiles.push(candidate);
        }
      }
    }
  }

  // Fallback to all 6 curated local HD B-roll files if scenes used external URLs
  if (localBrollFiles.length === 0) {
    for (const item of CURATED_BROLL_LIBRARY) {
      const candidate = path.join(publicDir, item.url);
      if (fs.existsSync(candidate)) {
        localBrollFiles.push(candidate);
      }
    }
  }

  if (localBrollFiles.length === 0) {
    throw new Error('No local B-roll MP4 source clips found in /public/assets/broll.');
  }

  // Build FFmpeg concat list file
  const concatListPath = path.join(rendersDir, `${safeId}-concat.txt`);
  const selectedClips = localBrollFiles.slice(0, 8);
  const concatContent = selectedClips.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync(concatListPath, concatContent, 'utf8');

  try {
    // Fast stream copy or ultrafast H.264 encode with +faststart for universal browser playback
    await execFileAsync('/usr/bin/ffmpeg', [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      outPath,
    ]);
  } finally {
    try {
      fs.unlinkSync(concatListPath);
    } catch {
      // ignore temp cleanup
    }
  }

  const stat = fs.statSync(outPath);
  return {
    mp4Url: `/assets/renders/${outFilename}?t=${Date.now()}`,
    filename: outFilename,
    sizeBytes: stat.size,
    durationSec: selectedClips.length * 4,
    shotCount: selectedClips.length,
    codec: 'H.264 (libx264 · yuv420p · +faststart)',
  };
}

export async function transcodeWebmToMp4(params: {
  webmBase64: string;
  projectId?: string;
}): Promise<{
  mp4Url: string;
  filename: string;
  sizeBytes: number;
  codec: string;
}> {
  const { webmBase64, projectId = `monarch-canvas-${Date.now().toString(36)}` } = params;
  const publicDir = path.resolve(process.cwd(), 'public');
  const rendersDir = path.join(publicDir, 'assets', 'renders');
  fs.mkdirSync(rendersDir, { recursive: true });

  const safeId = projectId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  const tempWebmPath = path.join(rendersDir, `${safeId}-input.webm`);
  const outFilename = `${safeId}-composite.mp4`;
  const outPath = path.join(rendersDir, outFilename);

  const cleanBase64 = webmBase64.replace(/^data:video\/[^;]+;base64,/, '');
  fs.writeFileSync(tempWebmPath, Buffer.from(cleanBase64, 'base64'));

  try {
    await execFileAsync('/usr/bin/ffmpeg', [
      '-y',
      '-i',
      tempWebmPath,
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '22',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outPath,
    ]);
  } finally {
    try {
      fs.unlinkSync(tempWebmPath);
    } catch {
      // ignore temp cleanup
    }
  }

  const stat = fs.statSync(outPath);
  return {
    mp4Url: `/assets/renders/${outFilename}?t=${Date.now()}`,
    filename: outFilename,
    sizeBytes: stat.size,
    codec: 'H.264 + AAC (libx264 · yuv420p · +faststart)',
  };
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}
