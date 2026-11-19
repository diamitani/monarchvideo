/**
 * Server-Side Gemini Client Utility for Monarch Video Agent (Layer 2 Reasoning)
 *
 * Uses @google/genai strictly server-side with `User-Agent: 'aistudio-build'`.
 * Default model: `gemini-4-hydrogen` (structured JSON + fast multi-stage orchestration).
 */

import { GoogleGenAI, type Schema } from '@google/genai';

export const MONARCH_GEMINI_MODEL = 'gemini-4-hydrogen';

let cachedClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
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
    try {
      const response = await ai.models.generateContent({
        model: MONARCH_GEMINI_MODEL,
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
      // Do not retry auth/quota/invalid-model errors
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
