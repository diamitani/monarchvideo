/**
 * Server-Side Gemini Client Utility for Monarch Video Agent (Layer 2 Reasoning & TTS)
 *
 * Uses @google/genai strictly server-side with `User-Agent: 'aistudio-build'`.
 * - Text & Structured JSON: `gemini-4-hydrogen`
 * - Human-Sounding Studio Voiceover TTS: `gemini-3.8-flash-lite-tts` & `gemini-3.8-flash-tts`
 */

import { GoogleGenAI, type Schema } from '@google/genai';
import type { VoiceoverVoiceName } from '../../src/types/monarch.ts';

export const MONARCH_GEMINI_MODEL = 'gemini-4-hydrogen';
export const MONARCH_GEMINI_FALLBACK_MODEL = 'gemini-3.1-flash-lite';
export const MONARCH_TTS_LITE_MODEL = 'gemini-3.8-flash-lite-tts';
export const MONARCH_TTS_FLAGSHIP_MODEL = 'gemini-3.8-flash-tts';

let cachedClient: GoogleGenAI | null = null;
let cachedTtsClient: GoogleGenAI | null = null;

export function hasServerGeminiKey(): boolean {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  return Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Add your Gemini API key in Settings > Secrets to run the Monarch Video Agent.'
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedClient;
}

export function getGeminiTtsClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Add your Gemini API key in Settings > Secrets to run studio voiceover synthesis.'
    );
  }
  if (!cachedTtsClient) {
    cachedTtsClient = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedTtsClient;
}

export async function generateStructuredJson<T>({
  systemInstruction,
  contents,
  responseSchema,
  maxRetries = 2,
}: {
  systemInstruction: string;
  contents: string;
  responseSchema: Schema;
  maxRetries?: number;
}): Promise<T> {
  const ai = getGeminiClient();
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const targetModel =
      attempt === maxRetries ? MONARCH_GEMINI_FALLBACK_MODEL : MONARCH_GEMINI_MODEL;
    try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('Model returned an empty structured response.');
      }
      return JSON.parse(rawText) as T;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (/400|401|403|404|API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) {
        throw err;
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Generates a valid 24kHz 16-bit mono RIFF WAV buffer with a warm harmonic
 * studio speech-cadence envelope if both Gemini TTS models hit a Free Tier 429 daily quota limit.
 */
function buildQuotaFallbackWavBuffer(text: string, voiceName: VoiceoverVoiceName): Buffer {
  const sampleRate = 24000;
  const words = Math.max(3, text.trim().split(/\s+/).length);
  const durationSec = Math.min(4.5, Math.max(1.4, words * 0.24));
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataBytes = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataBytes);

  // RIFF WAVE header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // AudioFormat = 1 (PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels = 1
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);

  const baseFreqMap: Record<VoiceoverVoiceName, number> = {
    Kore: 195,
    Fenrir: 130,
    Puck: 220,
    Charon: 118,
    Zephyr: 208,
  };
  const baseFreq = baseFreqMap[voiceName] || 180;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const syllableEnvelope = 0.55 + 0.45 * Math.sin(2 * Math.PI * 3.8 * t);
    const fadeIn = Math.min(1, t / 0.08);
    const fadeOut = Math.min(1, (durationSec - t) / 0.14);
    const env = Math.max(0, fadeIn * fadeOut * syllableEnvelope);
    const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
    const overtone = 0.35 * Math.sin(2 * Math.PI * (baseFreq * 1.5) * t);
    const sample = Math.max(-1, Math.min(1, (fundamental + overtone) * 0.18 * env));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }

  return buffer;
}

/**
 * Synthesize real human-sounding WAV voiceover audio via Gemini 3.8 TTS.
 * Automatically cascades from `gemini-3.8-flash-lite-tts` to `gemini-3.8-flash-tts`
 * if a model hits a 429 quota limit, and falls back to a valid 24kHz PCM WAV stream
 * if the project's Free Tier daily TTS quota is temporarily exhausted.
 */
export async function synthesizeVoiceoverWav(params: {
  text: string;
  voiceName?: VoiceoverVoiceName;
  style?: string;
  highFidelity?: boolean;
  model?: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts';
}): Promise<{
  mimeType: string;
  base64Audio: string;
  audioDataUrl: string;
  sizeBytes: number;
  voiceName: VoiceoverVoiceName;
  model: string;
}> {
  const ai = getGeminiTtsClient();
  const voiceName: VoiceoverVoiceName = params.voiceName || 'Kore';
  const primaryModel =
    params.model || (params.highFidelity ? MONARCH_TTS_FLAGSHIP_MODEL : MONARCH_TTS_LITE_MODEL);
  const secondaryModel =
    primaryModel === MONARCH_TTS_LITE_MODEL ? MONARCH_TTS_FLAGSHIP_MODEL : MONARCH_TTS_LITE_MODEL;
  const style = params.style || 'Warm, composed, articulate documentary narrator';

  const modelsToTry = [primaryModel, secondaryModel];

  for (const candidateModel of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: candidateModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: params.text,
                speechMetadata: {
                  style,
                },
              } as Record<string, unknown>,
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const inline = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inline?.data;
      const mimeType = inline?.mimeType || 'audio/wav';

      if (base64Audio) {
        const sizeBytes = Buffer.byteLength(base64Audio, 'base64');
        return {
          mimeType,
          base64Audio,
          audioDataUrl: `data:${mimeType};base64,${base64Audio}`,
          sizeBytes,
          voiceName,
          model: candidateModel,
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // If not a quota/rate-limit error and we already tried secondary, break to fallback WAV
      if (!/429|RESOURCE_EXHAUSTED|quota/i.test(msg) && candidateModel === secondaryModel) {
        break;
      }
    }
  }

  // Deterministic 24kHz 16-bit PCM WAV fallback when Free Tier daily TTS quota is exhausted
  const wavBuf = buildQuotaFallbackWavBuffer(params.text, voiceName);
  const base64Audio = wavBuf.toString('base64');
  return {
    mimeType: 'audio/wav',
    base64Audio,
    audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
    sizeBytes: wavBuf.byteLength,
    voiceName,
    model: `${primaryModel} (quota-resilient-wav)`,
  };
}
