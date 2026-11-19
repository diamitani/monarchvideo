/**
 * SUB-SKILL C: Artistic Pre-Production Suite (`artistic-director-suite`)
 *
 * Generates all 6 versioned, editable studio pre-production artifacts from an
 * approved PAL compilation:
 *   1. Project Brief & Type Classification
 *   2. Template & Brand Design Selection
 *   3. 1-Page Video Treatment
 *   4. Shot-by-Shot Storyboard
 *   5. Aligned Script & Cue Sheet
 *   6. Final Production Prompt
 */

import { Type, type Schema } from '@google/genai';
import type {
  ArtisticPreProduction,
  BrandKit,
  PALOutput,
} from '../../src/types/monarch.ts';
import { MONARCH_SYSTEM_PROMPT } from '../config/monarch-config.ts';
import { generateStructuredJson } from '../rostr/gemini-client.ts';

const ARTISTIC_SUITE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    projectBrief: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        objective: { type: Type.STRING },
        deliverableType: {
          type: Type.STRING,
          enum: ['Ad', 'Brand Film', 'Product Launch', 'Explainer', 'Social Short', 'Documentary'],
        },
        targetAudience: { type: Type.STRING },
        primaryCta: { type: Type.STRING },
      },
      required: ['title', 'objective', 'deliverableType', 'targetAudience', 'primaryCta'],
    },
    templateSelection: {
      type: Type.OBJECT,
      properties: {
        templateId: { type: Type.STRING },
        templateName: { type: Type.STRING },
        lowerThirdStyle: { type: Type.STRING },
        transitionPack: { type: Type.STRING },
        typographyScale: { type: Type.STRING },
      },
      required: ['templateId', 'templateName', 'lowerThirdStyle', 'transitionPack', 'typographyScale'],
    },
    videoTreatment: {
      type: Type.OBJECT,
      properties: {
        logline: { type: Type.STRING },
        visualMood: { type: Type.STRING },
        lightingAndMotion: { type: Type.STRING },
        soundscapeAndMusic: { type: Type.STRING },
        voiceoverDirection: { type: Type.STRING },
        narrativeHook: { type: Type.STRING },
      },
      required: [
        'logline',
        'visualMood',
        'lightingAndMotion',
        'soundscapeAndMusic',
        'voiceoverDirection',
        'narrativeHook',
      ],
    },
    storyboard: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sceneId: { type: Type.STRING },
          sceneNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          durationSec: { type: Type.NUMBER },
          visualFraming: { type: Type.STRING },
          motionChoreography: { type: Type.STRING },
          assetSource: {
            type: Type.STRING,
            enum: ['programmatic-html', 'remotion-tsx', 'veo-3.1', 'stock-clip'],
          },
          visualPrompt: { type: Type.STRING },
          onScreenText: { type: Type.STRING },
          subText: { type: Type.STRING },
        },
        required: [
          'sceneId',
          'sceneNumber',
          'title',
          'durationSec',
          'visualFraming',
          'motionChoreography',
          'assetSource',
          'visualPrompt',
          'onScreenText',
          'subText',
        ],
      },
    },
    scriptAndCueSheet: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timecode: { type: Type.STRING },
          startSec: { type: Type.NUMBER },
          endSec: { type: Type.NUMBER },
          sceneId: { type: Type.STRING },
          voiceover: { type: Type.STRING },
          kineticHeadline: { type: Type.STRING },
          sfxCue: { type: Type.STRING },
          musicCue: { type: Type.STRING },
        },
        required: [
          'timecode',
          'startSec',
          'endSec',
          'sceneId',
          'voiceover',
          'kineticHeadline',
          'sfxCue',
          'musicCue',
        ],
      },
    },
    finalProductionPrompt: { type: Type.STRING },
  },
  required: [
    'projectBrief',
    'templateSelection',
    'videoTreatment',
    'storyboard',
    'scriptAndCueSheet',
    'finalProductionPrompt',
  ],
};

export async function generateArtisticPreProduction(params: {
  pal: PALOutput;
  brandKit: BrandKit;
  templateId: string;
}): Promise<ArtisticPreProduction> {
  const { pal, brandKit, templateId } = params;
  const targetDuration = pal.parseData.durationSec;
  const sceneCount = targetDuration <= 18 ? 4 : targetDuration <= 35 ? 5 : 6;

  const prompt = `Execute Sub-Skill C (artistic-director-suite) from the approved PAL compilation below.

Approved Master Creative Prompt:
${pal.masterCreativePrompt}

Project Context:
- Topic: ${pal.parseData.topic}
- Deliverable Type: ${pal.semanticAnalysis.projectClassification}
- Audience Persona: ${pal.semanticAnalysis.audiencePersona}
- Emotional Arc: ${pal.semanticAnalysis.emotionalArc}
- Pacing: ${pal.semanticAnalysis.pacing}
- Target Duration: ${targetDuration} seconds across exactly ${sceneCount} tightly choreographed scenes whose durations sum to ${targetDuration} seconds.
- Aspect Ratio: ${pal.parseData.aspectRatio}
- Selected Runtime: ${pal.hypothesis.selectedRuntime}
- Template ID: ${templateId}
- Brand Kit: ${brandKit.brandName} ("${brandKit.tagline}"), Primary ${brandKit.primaryColor}, Accent ${brandKit.accentColor}, Surface ${brandKit.surfaceColor}, Fonts ${brandKit.fontPairing}.

Strict Requirements:
- Use scene IDs "scene-1", "scene-2", ..., "scene-${sceneCount}".
- Ensure storyboard[] and scriptAndCueSheet[] have the exact same ${sceneCount} scenes with continuous, non-overlapping startSec and endSec matching each scene's durationSec.
- Format timecode cleanly as "00:00 - 00:06" etc.
- Keep onScreenText crisp (3-8 words max) so kinetic typography reads cleanly in video frames.
- Final scene must be a regal logo & CTA outro for ${brandKit.brandName}.
- Never reference retired OpenAI Sora; use programmatic-html, remotion-tsx, veo-3.1, or stock-clip as assetSource.`;

  const result = await generateStructuredJson<ArtisticPreProduction>({
    systemInstruction: `${MONARCH_SYSTEM_PROMPT}\n\nYou are executing Sub-Skill C (artistic-director-suite). Craft cinematic, high-taste directorial pre-production artifacts ready for deterministic programmatic compilation.`,
    contents: prompt,
    responseSchema: ARTISTIC_SUITE_SCHEMA,
  });

  // Normalize continuous timecodes cleanly in case the model had slight rounding drift
  let cursor = 0;
  const normalizedStoryboard = result.storyboard.map((scene, idx) => {
    const dur = Math.max(3, Math.round(scene.durationSec || targetDuration / sceneCount));
    const normalizedId = `scene-${idx + 1}`;
    return {
      ...scene,
      sceneId: normalizedId,
      sceneNumber: idx + 1,
      durationSec: dur,
    };
  });

  const normalizedScript = normalizedStoryboard.map((scene, idx) => {
    const existingCue = result.scriptAndCueSheet[idx];
    const startSec = cursor;
    const endSec = cursor + scene.durationSec;
    cursor = endSec;
    const fmt = (s: number) => `00:${String(Math.floor(s)).padStart(2, '0')}`;
    return {
      timecode: `${fmt(startSec)} - ${fmt(endSec)}`,
      startSec,
      endSec,
      sceneId: scene.sceneId,
      voiceover: existingCue?.voiceover || scene.subText,
      kineticHeadline: existingCue?.kineticHeadline || scene.onScreenText,
      sfxCue: existingCue?.sfxCue || 'Subtle architectural whoosh',
      musicCue: existingCue?.musicCue || 'Warm string pulse + sub bass',
    };
  });

  return {
    ...result,
    storyboard: normalizedStoryboard,
    scriptAndCueSheet: normalizedScript,
  };
}
