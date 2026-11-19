/**
 * SUB-SKILL B: PAL Intent Extraction Engine (`pal-video-compiler`)
 *
 * 4-stage Prompt Abstraction Layer (PAL):
 *   1. Parse Data
 *   2. Semantic Analysis
 *   3. Create Hypothesis (+ optimal runtime & transparent cost estimate)
 *   4. Rewrite Original Prompt (Master Creative Prompt)
 */

import { Type, type Schema } from '@google/genai';
import type { PALInput, PALOutput } from '../../src/types/monarch.ts';
import { MONARCH_SYSTEM_PROMPT } from '../config/monarch-config.ts';
import { generateStructuredJson } from '../rostr/gemini-client.ts';
import { selectOptimalRuntime } from './video-env-bootstrap.ts';

const PAL_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    parseData: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        explicitInputs: { type: Type.ARRAY, items: { type: Type.STRING } },
        brandSummary: { type: Type.STRING },
      },
      required: ['topic', 'explicitInputs', 'brandSummary'],
    },
    semanticAnalysis: {
      type: Type.OBJECT,
      properties: {
        audiencePersona: { type: Type.STRING },
        emotionalArc: { type: Type.STRING },
        pacing: {
          type: Type.STRING,
          enum: ['Measured & Editorial', 'Crisp & Kinetic', 'Cinematic Build', 'High-Tempo Hook'],
        },
        visualGrammar: { type: Type.STRING },
        projectClassification: {
          type: Type.STRING,
          enum: ['Ad', 'Brand Film', 'Product Launch', 'Explainer', 'Social Short', 'Documentary'],
        },
      },
      required: [
        'audiencePersona',
        'emotionalArc',
        'pacing',
        'visualGrammar',
        'projectClassification',
      ],
    },
    creativeStrategy: { type: Type.STRING },
    masterCreativePrompt: { type: Type.STRING },
  },
  required: ['parseData', 'semanticAnalysis', 'creativeStrategy', 'masterCreativePrompt'],
};

interface RawPALResponse {
  parseData: {
    topic: string;
    explicitInputs: string[];
    brandSummary: string;
  };
  semanticAnalysis: PALOutput['semanticAnalysis'];
  creativeStrategy: string;
  masterCreativePrompt: string;
}

export function calculateCostEstimate(
  durationSec: number,
  runtime: 'hyperframes' | 'remotion' | 'hybrid-veo-hyperframes'
) {
  const sceneEstimate = Math.max(4, Math.min(8, Math.round(durationSec / 6)));
  const planningTokens = 3800 + sceneEstimate * 650;
  const llmUsd = Number(((planningTokens / 1_000_000) * 1.25).toFixed(4));
  const voiceoverUsd = Number((durationSec * 0.0025).toFixed(4));
  const genVideoUsd = runtime === 'hybrid-veo-hyperframes' ? Number((Math.min(12, durationSec * 0.35) * 0.08).toFixed(2)) : 0;
  const renderUsd = Number((durationSec * 0.004).toFixed(4));
  const totalByok = Number((llmUsd + voiceoverUsd + genVideoUsd + renderUsd).toFixed(2));
  const managedCredits = Math.max(8, Math.round(totalByok * 32 + sceneEstimate * 2));

  return {
    estimatedTokens: planningTokens,
    byokEstimatedUsd: Math.max(0.04, totalByok),
    managedCredits,
    renderSecondsEstimate: Math.round(durationSec * (runtime === 'hybrid-veo-hyperframes' ? 1.4 : 0.45)),
    costBreakdown: [
      {
        stage: 'PAL & Pre-Production (Gemini 4)',
        detail: `${planningTokens.toLocaleString()} est. tokens across 4 stages`,
        usdEstimate: Math.max(0.01, llmUsd),
      },
      {
        stage: 'Voiceover & Music Stems',
        detail: `${durationSec}s synced VO + adaptive underscore`,
        usdEstimate: Math.max(0.02, voiceoverUsd),
      },
      {
        stage: runtime === 'hybrid-veo-hyperframes' ? 'Generative B-Roll (Veo 3.1)' : 'Programmatic Motion Render',
        detail:
          runtime === 'hybrid-veo-hyperframes'
            ? '2 hero generative clips + HyperFrames compositing'
            : `${sceneEstimate} deterministic scenes via ${runtime}`,
        usdEstimate: Math.max(0.01, genVideoUsd || renderUsd),
      },
    ],
  };
}

export async function compilePALIntent(
  input: PALInput,
  contextSnippets: string[] = []
): Promise<PALOutput> {
  const runtimeChoice = selectOptimalRuntime({
    prompt: input.prompt,
    templateId: input.templateId,
    orgSizeOverThree: input.orgSizeOverThree,
  });

  const contextBlock =
    contextSnippets.length > 0
      ? `\nRetrieved Brand & Project Memory (RAG DAL):\n${contextSnippets.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
      : '';

  const userPayload = `Run the 4-stage PAL Intent Extraction Engine on this video request:

User Natural-Language Prompt:
"${input.prompt}"

Explicit Parameters:
- Target Aspect Ratio: ${input.aspectRatio}
- Target Duration: ${input.durationSec} seconds
- Target Platform: ${input.platform}
- Selected Visual Template: ${input.templateId}
- Brand Name: ${input.brandKit.brandName}
- Brand Tagline: ${input.brandKit.tagline}
- Brand Palette: Primary ${input.brandKit.primaryColor}, Accent ${input.brandKit.accentColor}, Surface ${input.brandKit.surfaceColor}
- Font Pairing: ${input.brandKit.fontPairing}
- Recommended Programmatic Runtime: ${runtimeChoice.selectedRuntime}
- Reference URLs: ${(input.referenceUrls || []).join(', ') || 'None'}
${contextBlock}

Requirements:
1. Extract crisp explicit inputs and summarize brand tone.
2. Perform deep semantic analysis (specific audience persona, emotional arc, pacing, visual grammar, and project classification).
3. Write a concise creative strategy explaining why ${runtimeChoice.selectedRuntime} fits this production.
4. Synthesize a deterministic, studio-grade Master Creative Prompt (120-200 words) that locks in visual mood, narrative structure, typography hierarchy, soundscape, and brand constraints so the Artistic Director Suite has zero ambiguity.`;

  const aiResult = await generateStructuredJson<RawPALResponse>({
    systemInstruction: `${MONARCH_SYSTEM_PROMPT}\n\nYou are executing Sub-Skill B (pal-video-compiler). Return clean, concrete, studio-grade creative prose with zero marketing fluff.`,
    contents: userPayload,
    responseSchema: PAL_RESPONSE_SCHEMA,
  });

  const costEstimate = calculateCostEstimate(input.durationSec, runtimeChoice.selectedRuntime);

  return {
    palVersion: '2.0',
    parseData: {
      topic: aiResult.parseData.topic,
      explicitInputs: aiResult.parseData.explicitInputs,
      aspectRatio: input.aspectRatio,
      durationSec: input.durationSec,
      platform: input.platform,
      brandSummary: aiResult.parseData.brandSummary,
    },
    semanticAnalysis: aiResult.semanticAnalysis,
    hypothesis: {
      creativeStrategy: aiResult.creativeStrategy,
      selectedRuntime: runtimeChoice.selectedRuntime,
      runtimeRationale: runtimeChoice.rationale,
      generativeVideoEngine: runtimeChoice.generativeVideoEngine,
      licenseAdvisory: runtimeChoice.licenseAdvisory,
      costEstimate,
    },
    masterCreativePrompt: aiResult.masterCreativePrompt,
  };
}
