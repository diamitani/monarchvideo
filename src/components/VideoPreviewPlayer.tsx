import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Film,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ProceduralStudioAudio } from '../lib/proceduralAudio';
import type {
  BRollShot,
  MusicPresetId,
  TimelineScene,
  UniversalVideoTimeline,
  VoiceoverClip,
} from '../types/monarch';
import { MonarchLogo } from './MonarchLogo';

interface VideoPreviewPlayerProps {
  timeline: UniversalVideoTimeline;
  projectId?: string;
  hyperframesHtml?: string;
  voiceoverClips?: VoiceoverClip[];
  musicPreset?: MusicPresetId;
  activeSceneId?: string | null;
  onSelectScene?: (sceneId: string) => void;
  compact?: boolean;
}

function formatTime(sec: number): string {
  const clamped = Math.max(0, sec);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  const tenths = Math.floor((clamped % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
  timeline,
  projectId,
  hyperframesHtml,
  voiceoverClips = [],
  musicPreset = 'cello-ostinato',
  activeSceneId,
  onSelectScene,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [renderMode, setRenderMode] = useState<'stage' | 'gsap'>('stage');
  const [isMuted, setIsMuted] = useState(false);
  const [exportingWebm, setExportingWebm] = useState(false);
  const [renderingMp4, setRenderingMp4] = useState(false);
  const [renderedMp4Info, setRenderedMp4Info] = useState<{
    mp4Url: string;
    filename: string;
    sizeBytes: number;
    codec: string;
  } | null>(null);

  const lastFrameRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const brollVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioEngineRef = useRef<ProceduralStudioAudio | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenSceneRef = useRef<string | null>(null);

  const totalDuration = useMemo(
    () =>
      timeline.scenes.reduce((acc, s) => acc + s.durationSec, 0) ||
      timeline.projectMeta.totalDurationSec ||
      15,
    [timeline]
  );

  // Initialize procedural audio synthesizer once
  useEffect(() => {
    audioEngineRef.current = new ProceduralStudioAudio();
    return () => {
      audioEngineRef.current?.stop();
      voiceAudioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    audioEngineRef.current?.setPreset(musicPreset);
  }, [musicPreset]);

  // Jump playhead when user selects a specific scene externally
  useEffect(() => {
    if (!activeSceneId) return;
    const match = timeline.scenes.find((s) => s.id === activeSceneId);
    if (match) {
      setCurrentTime(match.startSec + 0.05);
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'monarch-seek', sec: match.startSec + 0.05 },
        '*'
      );
    }
  }, [activeSceneId, timeline.scenes]);

  const currentScene: TimelineScene = useMemo(() => {
    const found = timeline.scenes.find(
      (s) => currentTime >= s.startSec && currentTime < s.startSec + s.durationSec
    );
    return found || timeline.scenes[0];
  }, [timeline.scenes, currentTime]);

  const sceneElapsed = Math.max(0, currentTime - currentScene.startSec);
  const sceneProgress = Math.min(1, sceneElapsed / Math.max(0.5, currentScene.durationSec));
  const enterEase = Math.min(1, sceneElapsed / 0.45);

  // Determine the active B-roll sub-cut inside the current scene
  const activeBRollShot: BRollShot | null = useMemo(() => {
    const shots = currentScene.brollShots || [];
    if (shots.length === 0) return null;
    const hit = shots.find(
      (shot) =>
        sceneElapsed >= shot.startOffsetSec &&
        sceneElapsed < shot.startOffsetSec + shot.durationSec
    );
    return hit || shots[shots.length - 1] || shots[0];
  }, [currentScene.brollShots, sceneElapsed]);

  const shotElapsed = activeBRollShot
    ? Math.max(0, sceneElapsed - activeBRollShot.startOffsetSec)
    : sceneElapsed;
  const shotProgress = activeBRollShot
    ? Math.min(1, shotElapsed / Math.max(0.4, activeBRollShot.durationSec))
    : sceneProgress;

  // Keep <video> B-roll element playing smoothly
  useEffect(() => {
    const vid = brollVideoRef.current;
    if (!vid) return;
    if (isPlaying) {
      void vid.play().catch(() => {
        // Autoplay muted allowed
      });
    } else {
      vid.pause();
    }
  }, [isPlaying, activeBRollShot?.clipUrl]);

  // Sync procedural underscore + Gemini 3.8 TTS WAV clips with playback
  useEffect(() => {
    const engine = audioEngineRef.current;
    if (!isPlaying) {
      engine?.stop();
      voiceAudioRef.current?.pause();
      lastSpokenSceneRef.current = null;
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'monarch-pause', sec: currentTime },
        '*'
      );
      return;
    }

    if (!isMuted) {
      engine?.start(musicPreset, 0.24);
    } else {
      engine?.stop();
    }

    iframeRef.current?.contentWindow?.postMessage(
      { type: 'monarch-play', sec: currentTime },
      '*'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isMuted, musicPreset]);

  // Play real synthesized WAV narration clip when entering a scene during playback
  useEffect(() => {
    if (!isPlaying || isMuted) return;
    if (lastSpokenSceneRef.current === currentScene.id) return;

    lastSpokenSceneRef.current = currentScene.id;
    audioEngineRef.current?.playTransitionSfx();

    const clip = voiceoverClips.find((c) => c.sceneId === currentScene.id);
    if (clip?.audioDataUrl) {
      voiceAudioRef.current?.pause();
      const audio = new Audio(clip.audioDataUrl);
      voiceAudioRef.current = audio;
      audioEngineRef.current?.setDucked(true);
      audio.onended = () => audioEngineRef.current?.setDucked(false);
      audio.onerror = () => audioEngineRef.current?.setDucked(false);
      void audio.play().catch(() => audioEngineRef.current?.setDucked(false));
    } else {
      audioEngineRef.current?.setDucked(false);
    }
  }, [currentScene.id, isPlaying, isMuted, voiceoverClips]);

  // Smooth real-time playback loop
  useEffect(() => {
    if (!isPlaying) {
      lastFrameRef.current = null;
      return;
    }

    let rafId = 0;
    const tick = (now: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = now;
      }
      const deltaSec = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, totalDuration]);

  const kicker = currentScene.elements.find((e) => e.type === 'kicker');
  const headline = currentScene.elements.find((e) => e.type === 'headline');
  const sub = currentScene.elements.find((e) => e.type === 'subheadline' || e.type === 'cta-card');

  const activeCaption = currentScene.captions.find(
    (c) => sceneElapsed >= c.startOffsetSec && sceneElapsed <= c.endOffsetSec
  );

  const aspectClass =
    timeline.projectMeta.aspectRatio === '9:16'
      ? 'aspect-[9/16] max-w-[300px] mx-auto'
      : timeline.projectMeta.aspectRatio === '1:1'
        ? 'aspect-square max-w-[440px] mx-auto'
        : 'aspect-video w-full';

  const jumpToScene = (idx: number) => {
    const bounded = Math.max(0, Math.min(timeline.scenes.length - 1, idx));
    const scene = timeline.scenes[bounded];
    setCurrentTime(scene.startSec + 0.05);
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'monarch-seek', sec: scene.startSec + 0.05 },
      '*'
    );
    onSelectScene?.(scene.id);
  };

  // Compute optical Ken Burns transform for the active B-roll sub-cut
  const brollTransform = useMemo(() => {
    if (!activeBRollShot) return 'scale(1.03)';
    const p = shotProgress;
    if (activeBRollShot.kenBurns === 'dolly-in') {
      return `scale(${(1.0 + p * 0.08).toFixed(3)})`;
    }
    if (activeBRollShot.kenBurns === 'pull-back') {
      return `scale(${(1.09 - p * 0.07).toFixed(3)})`;
    }
    if (activeBRollShot.kenBurns === 'pan-left') {
      return `scale(1.06) translateX(${(1.5 - p * 3.0).toFixed(2)}%)`;
    }
    return `scale(1.06) translateX(${(-1.5 + p * 3.0).toFixed(2)}%)`;
  }, [activeBRollShot, shotProgress]);

  // Server-side FFmpeg H.264 MP4 render handler
  const handleRenderMp4 = async () => {
    if (renderingMp4) return;
    setRenderingMp4(true);
    try {
      const res = await fetch('/api/studio/render-mp4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeline,
          projectId: projectId || timeline.projectMeta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'MP4 render failed');
      setRenderedMp4Info(data);

      // Trigger automatic browser download of the rendered H.264 MP4
      const a = document.createElement('a');
      a.href = data.mp4Url;
      a.download = data.filename || 'monarch-video.mp4';
      a.click();
    } catch (err) {
      console.error('MP4 render error:', err);
    } finally {
      setRenderingMp4(false);
    }
  };

  // Real browser WebM video capture via Canvas + MediaRecorder (with live <video> B-roll + custom logo <img>)
  const handleExportWebm = async () => {
    if (exportingWebm || typeof MediaRecorder === 'undefined') return;
    setExportingWebm(true);
    setIsPlaying(false);

    try {
      const width = timeline.projectMeta.aspectRatio === '9:16' ? 720 : 1280;
      const height =
        timeline.projectMeta.aspectRatio === '9:16'
          ? 1280
          : timeline.projectMeta.aspectRatio === '1:1'
            ? 1080
            : 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      // Preload custom brand logo image if present
      let customLogoImg: HTMLImageElement | null = null;
      if (timeline.brandKit.logoUrl) {
        try {
          customLogoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = timeline.brandKit.logoUrl!;
          });
        } catch {
          customLogoImg = null;
        }
      }

      const stream = canvas.captureStream(24);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      recorder.start();
      const fps = 24;
      const exportDuration = Math.min(totalDuration, 16);
      const totalFrames = Math.round(exportDuration * fps);
      const liveVideoEl = brollVideoRef.current;

      for (let f = 0; f < totalFrames; f++) {
        const t = (f / totalFrames) * totalDuration;
        const sc =
          timeline.scenes.find((s) => t >= s.startSec && t < s.startSec + s.durationSec) ||
          timeline.scenes[0];
        const elapsed = Math.max(0, t - sc.startSec);
        const alpha = Math.min(1, elapsed / 0.45);
        const hEl = sc.elements.find((e) => e.type === 'headline');
        const kEl = sc.elements.find((e) => e.type === 'kicker');
        const sEl = sc.elements.find((e) => e.type === 'subheadline' || e.type === 'cta-card');

        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, sc.background.primaryColor);
        grad.addColorStop(1, sc.background.secondaryColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Draw live B-roll video frame if ready and same-origin
        if (liveVideoEl && liveVideoEl.readyState >= 2) {
          try {
            ctx.drawImage(liveVideoEl, 0, 0, width, height);
          } catch {
            // ignore cross-origin draw fallback
          }
        }

        // Measured contrast scrim
        const scrim = ctx.createLinearGradient(0, 0, 0, height);
        scrim.addColorStop(0, 'rgba(7, 17, 38, 0.45)');
        scrim.addColorStop(1, 'rgba(7, 17, 38, 0.86)');
        ctx.fillStyle = scrim;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = timeline.brandKit.accentColor;
        ctx.font = '600 20px "JetBrains Mono", monospace';
        ctx.fillText((kEl?.content || sc.title).toUpperCase(), 64, 84);

        if (customLogoImg) {
          try {
            ctx.drawImage(customLogoImg, width - 180, 52, 42, 42);
          } catch {
            // ignore logo draw error
          }
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 52px "Plus Jakarta Sans", sans-serif';
        const words = (hEl?.content || sc.title).split(' ');
        let line = '';
        let y = height * 0.44;
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (ctx.measureText(test).width > width - 140) {
            ctx.fillText(line, 64, y);
            line = w;
            y += 62;
          } else {
            line = test;
          }
        }
        if (line) ctx.fillText(line, 64, y);

        ctx.fillStyle = timeline.brandKit.accentColor;
        ctx.fillRect(64, y + 26, 92, 4);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '400 24px "DM Sans", sans-serif';
        ctx.fillText((sEl?.content || '').slice(0, 82), 64, y + 74);

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '600 18px "DM Sans", sans-serif';
        ctx.fillText(timeline.brandKit.brandName, 64, height - 48);
        ctx.restore();

        await new Promise((r) => setTimeout(r, 1000 / 60));
      }

      recorder.stop();
      const blob = await done;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${timeline.projectMeta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('WebM export error:', err);
    } finally {
      setExportingWebm(false);
    }
  };

  const currentIdx = timeline.scenes.findIndex((s) => s.id === currentScene.id);
  const customLogoUrl = timeline.brandKit.logoUrl;

  return (
    <div className="flex flex-col gap-3">
      {/* Viewport Header with Renderer Mode Switcher + In-App H.264 MP4 & WebM Export */}
      <div className="rounded-xl border border-slate-200 bg-[#09142B] p-3">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1 rounded-lg bg-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setRenderMode('stage')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                renderMode === 'stage' ? 'bg-white text-[#102D69]' : 'text-slate-300 hover:text-white'
              }`}
            >
              B-Roll Montage Stage
            </button>
            {hyperframesHtml && (
              <button
                type="button"
                onClick={() => setRenderMode('gsap')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  renderMode === 'gsap' ? 'bg-white text-[#102D69]' : 'text-slate-300 hover:text-white'
                }`}
              >
                HyperFrames GSAP
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {voiceoverClips.length > 0 && (
              <span className="font-mono text-[11px] text-[#D4AF37]">
                Voice ready ({voiceoverClips.length})
              </span>
            )}
            <button
              type="button"
              disabled={renderingMp4}
              onClick={() => void handleRenderMp4()}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[#D4AF37] px-2.5 text-[11px] font-semibold text-[#09142B] transition-colors hover:bg-[#e3be42] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {renderingMp4 ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Film className="h-3 w-3" />
              )}
              <span>{renderingMp4 ? 'Rendering MP4...' : 'Render .mp4'}</span>
            </button>
            <button
              type="button"
              disabled={exportingWebm}
              onClick={() => void handleExportWebm()}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white/10 px-2.5 text-[11px] font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {exportingWebm ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span>{exportingWebm ? 'Recording...' : 'Export .webm'}</span>
            </button>
          </div>
        </div>

        {/* Rendered MP4 Ready Banner */}
        {renderedMp4Info && (
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#D4AF37]/40 bg-[#102D69]/90 px-3 py-1.5 text-xs text-white">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
              <span>
                H.264 MP4 Ready:{' '}
                <strong className="font-mono">{renderedMp4Info.filename}</strong> ·{' '}
                <span className="font-mono tabular-nums">
                  {(renderedMp4Info.sizeBytes / 1024).toFixed(0)} KB
                </span>
              </span>
            </div>
            <a
              href={renderedMp4Info.mp4Url}
              download={renderedMp4Info.filename}
              className="inline-flex items-center gap-1 font-semibold text-[#D4AF37] hover:underline whitespace-nowrap shrink-0"
            >
              <Download className="h-3 w-3" />
              <span>Download .mp4</span>
            </a>
          </div>
        )}

        {/* Live Video Frame */}
        {renderMode === 'gsap' && hyperframesHtml ? (
          <div className={`relative overflow-hidden rounded-lg bg-[#09142B] ${aspectClass}`}>
            <iframe
              ref={iframeRef}
              title="Live Motion Frame Preview"
              sandbox="allow-scripts"
              srcDoc={hyperframesHtml}
              className="h-full w-full border-0"
              onLoad={() => {
                iframeRef.current?.contentWindow?.postMessage(
                  { type: isPlaying ? 'monarch-play' : 'monarch-seek', sec: currentTime },
                  '*'
                );
              }}
            />
          </div>
        ) : (
          <div
            className={`relative overflow-hidden rounded-lg transition-colors duration-300 ${aspectClass}`}
            style={{
              background: `linear-gradient(135deg, ${currentScene.background.primaryColor} 0%, ${currentScene.background.secondaryColor} 100%)`,
            }}
          >
            {/* Moving B-Roll Video Layer */}
            {activeBRollShot && (
              <video
                ref={brollVideoRef}
                key={activeBRollShot.clipUrl}
                src={activeBRollShot.clipUrl}
                muted
                playsInline
                autoPlay
                loop
                crossOrigin="anonymous"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                style={{
                  filter: activeBRollShot.filterCss || 'contrast(1.10) saturate(1.06)',
                  transform: brollTransform,
                  transition: 'transform 180ms linear',
                }}
              />
            )}

            {/* Measured Contrast Scrim for 4.5:1 WCAG AA Typography Readability */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071126]/90 via-[#071126]/55 to-[#071126]/40" />

            {/* Subtle Gold Wipe Flash on Sub-Cut Transition */}
            {activeBRollShot?.cutTransition === 'gold-wipe' && shotElapsed < 0.22 && (
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1.5"
                style={{ backgroundColor: timeline.brandKit.accentColor }}
              />
            )}

            {/* Top Bar inside Video Frame (with Custom Uploaded Brand Logo Auto-Sync) */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-5 sm:px-8 sm:pt-6">
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[11px] font-medium tracking-wider"
                  style={{
                    color: timeline.brandKit.accentColor,
                    opacity: enterEase,
                  }}
                >
                  {kicker?.content || currentScene.title}
                </span>
                {activeBRollShot && (
                  <span className="hidden sm:inline font-mono text-[10px] text-slate-300/80">
                    · {activeBRollShot.cutTransition} · {activeBRollShot.source}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {customLogoUrl ? (
                  <img
                    src={customLogoUrl}
                    alt={`${timeline.brandKit.brandName} logo`}
                    referrerPolicy="no-referrer"
                    className="h-6 w-auto max-w-[96px] rounded-xs object-contain"
                  />
                ) : (
                  <MonarchLogo size={20} variant="gold" />
                )}
                <span className="font-display text-xs font-semibold tracking-tight text-white">
                  {timeline.brandKit.brandName}
                </span>
              </div>
            </div>

            {/* Primary Center Stage Typography */}
            <div
              className="relative z-10 flex h-[62%] flex-col justify-center px-6 sm:px-8"
              style={{
                opacity: enterEase,
                transform: `translateY(${(1 - enterEase) * 14}px)`,
                transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out',
              }}
            >
              {currentScene.layoutTemplate === 'logo-outro' ? (
                <div className="flex flex-col items-center text-center">
                  {customLogoUrl ? (
                    <img
                      src={customLogoUrl}
                      alt={`${timeline.brandKit.brandName} crest`}
                      referrerPolicy="no-referrer"
                      className="h-14 w-auto max-w-[180px] object-contain"
                    />
                  ) : (
                    <MonarchLogo size={compact ? 44 : 56} variant="gold" />
                  )}
                  <h3
                    className={`mt-4 font-display font-bold tracking-tight text-white text-balance ${
                      compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'
                    }`}
                  >
                    {headline?.content || timeline.brandKit.brandName}
                  </h3>
                  <div
                    className="my-3 h-[2px] w-14"
                    style={{ backgroundColor: timeline.brandKit.accentColor }}
                  />
                  <p className="max-w-md text-xs text-slate-200 sm:text-sm">
                    {sub?.content || timeline.brandKit.tagline}
                  </p>
                </div>
              ) : (
                <div className="max-w-xl">
                  <h3
                    className={`font-display font-bold leading-[1.1] tracking-tight text-white text-balance ${
                      timeline.projectMeta.aspectRatio === '9:16'
                        ? 'text-xl'
                        : compact
                          ? 'text-xl sm:text-2xl'
                          : 'text-2xl sm:text-4xl'
                    }`}
                  >
                    {headline?.content || currentScene.title}
                  </h3>
                  <div
                    className="my-3 h-[2px] transition-all duration-300"
                    style={{
                      width: `${Math.round(32 + sceneProgress * 44)}px`,
                      backgroundColor: timeline.brandKit.accentColor,
                    }}
                  />
                  <p
                    className={`leading-relaxed text-slate-200 ${
                      timeline.projectMeta.aspectRatio === '9:16' ? 'text-xs' : 'text-xs sm:text-sm'
                    }`}
                  >
                    {sub?.content || ''}
                  </p>
                </div>
              )}
            </div>

            {/* Synced Caption Strip & B-Roll Sub-Cut Indicator */}
            <div className="relative z-10 flex items-end justify-between gap-3 px-6 pb-4 sm:px-8 sm:pb-5">
              {activeCaption ? (
                <div className="max-w-[78%] rounded-md bg-black/70 px-3 py-1.5 text-xs leading-snug text-white backdrop-blur-xs">
                  {activeCaption.text}
                </div>
              ) : (
                <div />
              )}

              {currentScene.brollShots && currentScene.brollShots.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {currentScene.brollShots.map((shot, sIdx) => {
                    const isShotActive = activeBRollShot?.id === shot.id;
                    return (
                      <button
                        key={shot.id}
                        type="button"
                        onClick={() =>
                          setCurrentTime(currentScene.startSec + shot.startOffsetSec + 0.05)
                        }
                        title={`${shot.title} (${shot.durationSec}s · ${shot.cutTransition})`}
                        className={`h-1.5 rounded-full transition-all ${
                          isShotActive ? 'w-6 bg-[#D4AF37]' : 'w-2.5 bg-white/35 hover:bg-white/60'
                        }`}
                        aria-label={`Jump to B-roll cut ${sIdx + 1}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transport Controls & Interactive Scene + Sub-Cut Track */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#102D69] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap shrink-0"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              onClick={() => jumpToScene(currentIdx - 1)}
              aria-label="Previous scene"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => jumpToScene(currentIdx + 1)}
              aria-label="Next scene"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentTime(0);
                iframeRef.current?.contentWindow?.postMessage({ type: 'monarch-seek', sec: 0 }, '*');
              }}
              aria-label="Restart preview"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-[#9A7B1C]" />}
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-mono tabular-nums text-slate-900">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="hidden sm:inline tabular-nums">
              {timeline.projectMeta.width}×{timeline.projectMeta.height}
            </span>
            {activeBRollShot && (
              <>
                <span aria-hidden="true" className="hidden md:inline">·</span>
                <span className="hidden md:inline font-mono text-[11px] text-[#102D69] truncate max-w-[180px]">
                  {activeBRollShot.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Scrubber */}
        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.1}
            value={Math.min(currentTime, totalDuration)}
            onChange={(e) => {
              const nextSec = Number(e.target.value);
              setCurrentTime(nextSec);
              iframeRef.current?.contentWindow?.postMessage(
                { type: 'monarch-seek', sec: nextSec },
                '*'
              );
              const hit = timeline.scenes.find(
                (s) => nextSec >= s.startSec && nextSec < s.startSec + s.durationSec
              );
              if (hit) onSelectScene?.(hit.id);
            }}
            aria-label="Timeline scrubber"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#102D69]"
          />
        </div>

        {/* Multi-Scene Track Blocks with B-Roll Sub-Cut Count */}
        <div className="mt-3 flex gap-1.5">
          {timeline.scenes.map((scene, idx) => {
            const widthPct = (scene.durationSec / totalDuration) * 100;
            const isCurrent = scene.id === currentScene.id;
            const cutCount = scene.brollShots?.length || 1;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => jumpToScene(idx)}
                style={{ width: `${widthPct}%` }}
                className={`group flex flex-col items-start overflow-hidden rounded-md border px-2 py-1.5 text-left transition-colors ${
                  isCurrent
                    ? 'border-[#102D69] bg-[#EEF3FA] text-[#102D69]'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className="w-full truncate text-[11px] font-medium">
                  {idx + 1}. {scene.title}
                </span>
                <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                  {scene.durationSec}s · {cutCount} cuts
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
