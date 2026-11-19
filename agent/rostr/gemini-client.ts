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
    const targetModel = attempt === maxRetries ? MONARCH_GEMINI_FALLBACK_MODEL : MONARCH_GEMINI_MODEL;
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
 * Synthesize real human-sounding WAV voiceover audio via Gemini 3.8 TTS.
 * Unary output returns a complete WAV file (audio/wav, 24kHz mono 16-bit).
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
  const model =
    params.model || (params.highFidelity ? MONARCH_TTS_FLAGSHIP_MODEL : MONARCH_TTS_LITE_MODEL);
  const style = params.style || 'Warm, composed, articulate documentary narrator';

  const response = await ai.models.generateContent({
    model,
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

  if (!base64Audio) {
    throw new Error('Gemini 3.8 TTS returned no audio payload.');
  }

  const sizeBytes = Buffer.byteLength(base64Audio, 'base64');

  return {
    mimeType,
    base64Audio,
    audioDataUrl: `data:${mimeType};base64,${base64Audio}`,
    sizeBytes,
    voiceName,
    model,
  };
}
