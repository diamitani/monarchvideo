/**
 * Zero-Dependency Procedural Web Audio Studio Score & SFX Engine
 *
 * Synthesizes royalty-free underscore stems synchronized with Monarch preview playback,
 * with automatic -14 dB ducking whenever real Gemini 3.8 TTS narration is speaking.
 */

import type { MusicPresetId } from '../types/monarch';

export class ProceduralStudioAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private timerId: number | null = null;
  private stepIndex = 0;
  private isPlaying = false;
  private preset: MusicPresetId = 'cello-ostinato';
  private baseVolume = 0.24;
  private isDucked = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.baseVolume;
      this.musicGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setPreset(preset: MusicPresetId) {
    this.preset = preset;
    if (this.isPlaying) {
      this.stop();
      this.start(preset, this.baseVolume);
    }
  }

  setVolume(volume: number) {
    this.baseVolume = Math.max(0, Math.min(0.6, volume));
    this.applyGain();
  }

  setDucked(ducked: boolean) {
    this.isDucked = ducked;
    this.applyGain();
  }

  private applyGain() {
    if (!this.ctx || !this.musicGain) return;
    // -14 dB ducking ratio ~ 0.20x when voiceover is active
    const target = this.isDucked ? this.baseVolume * 0.22 : this.baseVolume;
    this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }

  start(preset: MusicPresetId = this.preset, volume = this.baseVolume) {
    this.preset = preset;
    this.baseVolume = Math.max(0, Math.min(0.6, volume));
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stop();
    this.isPlaying = true;
    this.stepIndex = 0;
    this.applyGain();

    const intervalMs =
      preset === 'minimal-pulse' ? 250 : preset === 'cello-ostinato' ? 312 : preset === 'felt-piano' ? 420 : 600;

    this.playStep();
    this.timerId = window.setInterval(() => this.playStep(), intervalMs);
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  playTransitionSfx() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.14);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  private playStep() {
    if (!this.ctx || !this.musicGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const step = this.stepIndex++;

    if (this.preset === 'cello-ostinato') {
      // Regal D-minor / F-major chamber cello motif
      const notes = [146.83, 174.61, 220.0, 174.61, 130.81, 164.81, 196.0, 164.81];
      const freq = notes[step % notes.length];
      this.triggerVoice(freq, 'sawtooth', 0.28, 360, 0.32, now);
      if (step % 4 === 0) {
        this.triggerVoice(freq / 2, 'triangle', 0.65, 220, 0.45, now);
      }
    } else if (this.preset === 'felt-piano') {
      const chords = [
        [261.63, 329.63, 392.0],
        [220.0, 261.63, 329.63],
        [174.61, 220.0, 261.63],
        [196.0, 246.94, 293.66],
      ];
      const chord = chords[Math.floor(step / 2) % chords.length];
      const freq = chord[step % chord.length];
      this.triggerVoice(freq, 'triangle', 0.55, 780, 0.34, now);
    } else if (this.preset === 'minimal-pulse') {
      const bass = [110.0, 110.0, 130.81, 146.83, 110.0, 110.0, 98.0, 130.81];
      const freq = bass[step % bass.length];
      this.triggerVoice(freq, 'triangle', 0.18, 420, step % 2 === 0 ? 0.42 : 0.2, now);
    } else {
      // ambient-glass
      const notes = [293.66, 369.99, 440.0, 587.33];
      const freq = notes[step % notes.length];
      this.triggerVoice(freq, 'sine', 0.9, 1200, 0.25, now);
    }
  }

  private triggerVoice(
    freq: number,
    type: OscillatorType,
    duration: number,
    cutoffHz: number,
    level: number,
    startTime: number
  ) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffHz, startTime);

    env.gain.setValueAtTime(0.0008, startTime);
    env.gain.linearRampToValueAtTime(level, startTime + 0.025);
    env.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.04);
  }
}
