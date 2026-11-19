/**
 * SUB-SKILL D: Programmatic JSON Translator & Live Edit Loop (`editor-json-translator`)
 *
 * Bridges creative direction and deterministic code rendering:
 *  1. Builds & strictly validates Universal Video Timeline JSON (`schemaVersion: "1.0.0"`)
 *  2. Deterministically compiles canonical JSON into:
 *       - HyperFrames HTML/CSS/GSAP bundle
 *       - Remotion TSX composition
 *  3. Bi-Directional Conversational Diff Loop: runs a scoped PAL diff via Gemini
 *     that patches ONLY the affected scenes while preserving untouched scenes.
 */

import { Type, type Schema } from '@google/genai';
import type {
  ArtisticPreProduction,
  AspectRatio,
  BrandKit,
  CompiledTargets,
  PALOutput,
  TimelineScene,
  UniversalVideoTimeline,
} from '../../src/types/monarch.ts';
import { MONARCH_SYSTEM_PROMPT } from '../config/monarch-config.ts';
import { generateStructuredJson } from '../rostr/gemini-client.ts';

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

export function buildTimelineFromPreProduction(params: {
  pal: PALOutput;
  preProduction: ArtisticPreProduction;
  brandKit: BrandKit;
}): UniversalVideoTimeline {
  const { pal, preProduction, brandKit } = params;
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

    const useLightScene = !isFirst && !isLast && idx % 2 === 1;
    const primaryBg = useLightScene ? brandKit.surfaceColor : brandKit.primaryColor;
    const secondaryBg = useLightScene ? '#EEF3FA' : '#091A3E';
    const textColor = useLightScene ? '#0F172A' : '#FFFFFF';

    const voiceText = cue?.voiceover || card.subText;
    const words = voiceText.split(/\s+/).filter(Boolean);
    const midpoint = Math.ceil(words.length / 2);
    const part1 = words.slice(0, midpoint).join(' ');
    const part2 = words.slice(midpoint).join(' ');
    const halfDur = Number((card.durationSec / 2).toFixed(2));

    const captions = part2
      ? [
          { startOffsetSec: 0.2, endOffsetSec: halfDur, text: part1 },
          { startOffsetSec: halfDur, endOffsetSec: Math.max(halfDur + 0.5, card.durationSec - 0.2), text: part2 },
        ]
      : [{ startOffsetSec: 0.2, endOffsetSec: Math.max(1, card.durationSec - 0.2), text: voiceText }];

    return {
      id: card.sceneId,
      title: card.title,
      startSec,
      durationSec: card.durationSec,
      layoutTemplate,
      background: {
        type: card.assetSource === 'veo-3.1' ? 'cinematic-backdrop' : 'gradient',
        primaryColor: primaryBg,
        secondaryColor: secondaryBg,
        accentGlow: brandKit.accentColor,
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
          position: 'center',
          animation: isFirst ? 'kinetic-reveal' : 'scale-settle',
          color: textColor,
        },
        {
          id: `${card.sceneId}-sub`,
          type: isLast ? 'cta-card' : 'subheadline',
          content: isLast ? preProduction.projectBrief.primaryCta : card.subText,
          position: 'bottom-center',
          animation: 'gold-underline',
          color: useLightScene ? '#475569' : '#CBD5E1',
        },
      ],
      captions,
      mediaRef: {
        source: card.assetSource,
        promptOrAsset: card.visualPrompt,
      },
      transition: isLast ? 'cross-dissolve' : idx % 2 === 0 ? 'wipe-gold' : 'cut-crisp',
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
    audioTracks: {
      voiceover: {
        voicePersona: preProduction.videoTreatment.voiceoverDirection,
        provider: 'Gemini 3.8 Flash TTS / ElevenLabs Studio',
        totalLines: preProduction.scriptAndCueSheet.length,
      },
      music: {
        style: preProduction.videoTreatment.soundscapeAndMusic,
        bpm: pal.semanticAnalysis.pacing === 'High-Tempo Hook' ? 124 : 96,
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
  <title>${escapeHtml(timeline.projectMeta.title)} — HyperFrames GSAP Bundle</title>
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
    .ambient-glow {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.22;
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
    .brand-tag {
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: clamp(11px, 1.3vw, 17px);
      font-weight: 700;
      letter-spacing: -0.01em;
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
    .headline {
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: clamp(24px, 4.4vw, 68px);
      line-height: 1.08;
      font-weight: 700;
      letter-spacing: -0.028em;
      text-wrap: balance;
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
      opacity: 0.88;
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
      background: rgba(9, 20, 43, 0.72);
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
      opacity: 0.65;
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

      el.innerHTML = \`
        <div class="ambient-glow" style="background:radial-gradient(circle at 80% 18%, \${scene.background.accentGlow}, transparent 52%)"></div>
        <div class="scene-top">
          <span class="kicker">\${kicker ? kicker.content : scene.title}</span>
          <span class="brand-tag" style="color:\${headline?.color || '#fff'}">\${timelineData.brandKit.brandName}</span>
        </div>
        <div class="hero-block \${isCentered ? 'centered' : ''}">
          <h1 class="headline" style="color:\${headline?.color || '#fff'}">\${headline ? headline.content : scene.title}</h1>
          <div class="gold-rule"></div>
          <p class="subheadline" style="color:\${sub?.color || '#cbd5e1'}">\${sub ? sub.content : ''}</p>
        </div>
        <div class="scene-footer">
          <div class="caption-pill">\${caption}</div>
          <span class="meta-source">\${scene.mediaRef.source} · \${animPreset}</span>
        </div>
      \`;
      stage.appendChild(el);

      const hEl = el.querySelector(".headline");
      const ruleEl = el.querySelector(".gold-rule");
      const subEl = el.querySelector(".subheadline");

      master.to(el, { opacity: 1, duration: 0.4, ease: "power3.out" }, scene.startSec);

      if (animPreset === "satin-gold-wipe") {
        master.fromTo(hEl, { clipPath: "inset(0 100% 0 0)", opacity: 0.2 }, { clipPath: "inset(0 0% 0 0)", opacity: 1, duration: 0.72, ease: "expo.out" }, scene.startSec + 0.08);
      } else if (animPreset === "architectural-split") {
        master.fromTo(hEl, { x: -32, opacity: 0 }, { x: 0, opacity: 1, duration: 0.68, ease: "power3.out" }, scene.startSec + 0.08);
      } else if (animPreset === "cinematic-zoom") {
        master.fromTo(el, { scale: 1.05 }, { scale: 1.0, duration: scene.durationSec, ease: "none" }, scene.startSec);
        master.fromTo(hEl, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: "power2.out" }, scene.startSec + 0.12);
      } else {
        master.fromTo(hEl, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, ease: "power3.out" }, scene.startSec + 0.08);
      }

      master.fromTo(ruleEl, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, scene.startSec + 0.22);
      master.fromTo(subEl, { y: 14, opacity: 0 }, { y: 0, opacity: 0.9, duration: 0.55, ease: "power2.out" }, scene.startSec + 0.34);
      master.to(el, { opacity: 0, duration: 0.32, ease: "power2.in" }, Math.max(scene.startSec + 0.6, scene.startSec + scene.durationSec - 0.32));
    });

    master.seek(0.15).pause();

    // Deterministic frame seek hook for HyperFrames CLI / Puppeteer & Monarch Studio Iframe
    window.__HYPERFRAMES_SEEK__ = (sec) => master.seek(Math.max(0, Number(sec) || 0)).pause();
    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "monarch-seek") {
        master.seek(Math.max(0, Number(msg.sec) || 0));
      } else if (msg.type === "monarch-play") {
        if (typeof msg.sec === "number") master.seek(Math.max(0, msg.sec));
        master.play();
      } else if (msg.type === "monarch-pause") {
        if (typeof msg.sec === "number") master.seek(Math.max(0, msg.sec));
        master.pause();
      }
    });
  </script>
</body>
</html>`;
}

export function compileToRemotionTsx(timeline: UniversalVideoTimeline): string {
  const componentName = 'MonarchComposition';
  const serialized = JSON.stringify(timeline, null, 2);

  return `import React from 'react';
import { AbsoluteFill, Composition, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const TIMELINE = ${serialized} as const;

const SceneFrame: React.FC<{ scene: (typeof TIMELINE.scenes)[number] }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const translateY = interpolate(enter, [0, 1], [36, 0]);
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  const kicker = scene.elements.find((e) => e.type === 'kicker');
  const headline = scene.elements.find((e) => e.type === 'headline');
  const sub = scene.elements.find((e) => e.type === 'subheadline' || e.type === 'cta-card');

  return (
    <AbsoluteFill
      style={{
        background: \`linear-gradient(135deg, \${scene.background.primaryColor}, \${scene.background.secondaryColor})\`,
        padding: 88,
        justifyContent: 'space-between',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        opacity,
      }}
    >
      <div style={{ color: TIMELINE.brandKit.accentColor, fontSize: 24, fontWeight: 600 }}>
        {kicker?.content ?? scene.title}
      </div>
      <div style={{ transform: \`translateY(\${translateY}px)\` }}>
        <h1 style={{ color: headline?.color ?? '#FFFFFF', fontSize: 80, lineHeight: 1.08, margin: 0, maxWidth: '18ch' }}>
          {headline?.content ?? scene.title}
        </h1>
        <div style={{ width: 96, height: 3, background: TIMELINE.brandKit.accentColor, margin: '28px 0' }} />
        <p style={{ color: sub?.color ?? '#CBD5E1', fontSize: 32, lineHeight: 1.4, margin: 0, maxWidth: '42ch' }}>
          {sub?.content ?? ''}
        </p>
      </div>
      <div style={{ color: '#94A3B8', fontSize: 20 }}>
        {TIMELINE.brandKit.brandName} · {scene.mediaRef.source}
      </div>
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
}): Promise<{
  timeline: UniversalVideoTimeline;
  compiled: CompiledTargets;
  diffSummary: string;
  patchedSceneIds: string[];
  untouchedSceneIds: string[];
}> {
  const { timeline, instruction } = params;

  const sceneSummary = timeline.scenes.map((s) => ({
    id: s.id,
    title: s.title,
    durationSec: s.durationSec,
    layoutTemplate: s.layoutTemplate,
    background: s.background,
    headline: s.elements.find((e) => e.type === 'headline')?.content,
    subheadline: s.elements.find((e) => e.type === 'subheadline' || e.type === 'cta-card')?.content,
    transition: s.transition,
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
  const updatedScenes: TimelineScene[] = timeline.scenes.map((scene) => {
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
      ? [{ startOffsetSec: 0.2, endOffsetSec: Math.max(1, nextDuration - 0.2), text: patch.captionText }]
      : scene.captions;

    const patchedScene: TimelineScene = {
      ...scene,
      title: patch.title || scene.title,
      startSec: cursor,
      durationSec: nextDuration,
      layoutTemplate: patch.layoutTemplate || scene.layoutTemplate,
      background: {
        ...scene.background,
        primaryColor: nextPrimary,
        secondaryColor: patch.secondaryColor || (patch.primaryColor ? (isDarkBg ? '#091A3E' : '#EEF3FA') : scene.background.secondaryColor),
        accentGlow: patch.accentGlow || scene.background.accentGlow,
      },
      elements: updatedElements,
      captions: updatedCaptions,
      transition: patch.transition || scene.transition,
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
