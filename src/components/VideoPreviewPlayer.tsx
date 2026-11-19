import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
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
  MusicPresetId,
  TimelineScene,
  UniversalVideoTimeline,
  VoiceoverClip,
} from '../types/monarch';
import { MonarchLogo } from './MonarchLogo';

interface VideoPreviewPlayerProps {
  timeline: UniversalVideoTimeline;
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

function isDarkHex(hex: string): boolean {
  const clean = (hex || '#102D69').replace('#', '');
  if (clean.length !== 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}

export const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
  timeline,
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

  const lastFrameRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
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

  const sceneElapsed = Math.max(0, currentTime - currentScene.startSec);
  const sceneProgress = Math.min(1, sceneElapsed / Math.max(0.5, currentScene.durationSec));
  const enterEase = Math.min(1, sceneElapsed / 0.55);

  const kicker = currentScene.elements.find((e) => e.type === 'kicker');
  const headline = currentScene.elements.find((e) => e.type === 'headline');
  const sub = currentScene.elements.find((e) => e.type === 'subheadline' || e.type === 'cta-card');

  const activeCaption = currentScene.captions.find(
    (c) => sceneElapsed >= c.startOffsetSec && sceneElapsed <= c.endOffsetSec
  );

  const darkBg = isDarkHex(currentScene.background.primaryColor);
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

  // Real browser WebM video capture via Canvas + MediaRecorder
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
      const exportDuration = Math.min(totalDuration, 18); // crisp export timing
      const totalFrames = Math.round(exportDuration * fps);

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

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = timeline.brandKit.accentColor;
        ctx.font = '600 20px "JetBrains Mono", monospace';
        ctx.fillText((kEl?.content || sc.title).toUpperCase(), 64, 84);

        ctx.fillStyle = hEl?.color || '#FFFFFF';
        ctx.font = '700 54px "Plus Jakarta Sans", sans-serif';
        const words = (hEl?.content || sc.title).split(' ');
        let line = '';
        let y = height * 0.44;
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (ctx.measureText(test).width > width - 140) {
            ctx.fillText(line, 64, y);
            line = w;
            y += 64;
          } else {
            line = test;
          }
        }
        if (line) ctx.fillText(line, 64, y);

        ctx.fillStyle = timeline.brandKit.accentColor;
        ctx.fillRect(64, y + 26, 92, 4);

        ctx.fillStyle = sEl?.color || '#CBD5E1';
        ctx.font = '400 24px "DM Sans", sans-serif';
        ctx.fillText((sEl?.content || '').slice(0, 82), 64, y + 74);

        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = '500 18px "DM Sans", sans-serif';
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

  return (
    <div className="flex flex-col gap-3">
      {/* Viewport Header with Renderer Mode Switcher & WebM Export */}
      <div className="rounded-xl border border-slate-200 bg-[#09142B] p-3">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1 rounded-lg bg-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setRenderMode('stage')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                renderMode === 'stage' ? 'bg-white text-[#102D69]' : 'text-slate-300 hover:text-white'
              }`}
            >
              Studio Stage
            </button>
            {hyperframesHtml && (
              <button
                type="button"
                onClick={() => setRenderMode('gsap')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  renderMode === 'gsap' ? 'bg-white text-[#102D69]' : 'text-slate-300 hover:text-white'
                }`}
              >
                Motion Frame
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {voiceoverClips.length > 0 && (
              <span className="font-mono text-[11px] text-[#D4AF37]">
                Voice ready ({voiceoverClips.length})
              </span>
            )}
            <button
              type="button"
              disabled={exportingWebm}
              onClick={() => void handleExportWebm()}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white/10 px-2.5 text-[11px] font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              {exportingWebm ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span>{exportingWebm ? 'Rendering...' : 'Export .webm'}</span>
            </button>
          </div>
        </div>

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
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 82% 18%, ${currentScene.background.accentGlow}, transparent 48%)`,
              }}
            />

            {/* Top Bar inside Video Frame */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-5 sm:px-8 sm:pt-6">
              <span
                className="font-mono text-[11px] font-medium tracking-wider"
                style={{
                  color: darkBg ? timeline.brandKit.accentColor : timeline.brandKit.primaryColor,
                  opacity: enterEase,
                }}
              >
                {kicker?.content || currentScene.title}
              </span>
              <div className="flex items-center gap-2">
                <MonarchLogo size={20} variant={darkBg ? 'gold' : 'color'} />
                <span
                  className="font-display text-xs font-semibold tracking-tight"
                  style={{ color: darkBg ? '#FFFFFF' : '#0F172A' }}
                >
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
                  <MonarchLogo size={compact ? 44 : 56} variant={darkBg ? 'gold' : 'color'} />
                  <h3
                    className={`mt-4 font-display font-bold tracking-tight text-balance ${
                      compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'
                    }`}
                    style={{ color: headline?.color || (darkBg ? '#FFFFFF' : '#0F172A') }}
                  >
                    {headline?.content || timeline.brandKit.brandName}
                  </h3>
                  <div
                    className="my-3 h-[2px] w-14"
                    style={{ backgroundColor: timeline.brandKit.accentColor }}
                  />
                  <p
                    className="max-w-md text-xs sm:text-sm"
                    style={{ color: sub?.color || (darkBg ? '#CBD5E1' : '#475569') }}
                  >
                    {sub?.content || timeline.brandKit.tagline}
                  </p>
                </div>
              ) : (
                <div className="max-w-xl">
                  <h3
                    className={`font-display font-bold leading-[1.1] tracking-tight text-balance ${
                      timeline.projectMeta.aspectRatio === '9:16'
                        ? 'text-xl'
                        : compact
                          ? 'text-xl sm:text-2xl'
                          : 'text-2xl sm:text-4xl'
                    }`}
                    style={{ color: headline?.color || (darkBg ? '#FFFFFF' : '#0F172A') }}
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
                    className={`leading-relaxed ${
                      timeline.projectMeta.aspectRatio === '9:16' ? 'text-xs' : 'text-xs sm:text-sm'
                    }`}
                    style={{ color: sub?.color || (darkBg ? '#CBD5E1' : '#475569') }}
                  >
                    {sub?.content || ''}
                  </p>
                </div>
              )}
            </div>

            {/* Synced Caption Strip */}
            <div className="relative z-10 flex items-end justify-between px-6 pb-4 sm:px-8 sm:pb-5">
              {activeCaption ? (
                <div className="max-w-[85%] rounded-md bg-black/65 px-3 py-1.5 text-xs leading-snug text-white backdrop-blur-xs">
                  {activeCaption.text}
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transport Controls & Interactive Scene Track */}
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

        {/* Multi-Scene Track Blocks */}
        <div className="mt-3 flex gap-1.5">
          {timeline.scenes.map((scene, idx) => {
            const widthPct = (scene.durationSec / totalDuration) * 100;
            const isCurrent = scene.id === currentScene.id;
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
                  {scene.durationSec}s
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
