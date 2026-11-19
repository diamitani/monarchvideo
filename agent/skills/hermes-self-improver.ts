/**
 * HERMES-STYLE SELF-IMPROVING AGENT LOOP (`hermes-self-improver.ts`)
 *
 * Implements the 4-stage closed learning loop fused with ROSTR Layer 1 ContextEngine:
 *  1. SOUL.md identity & creative boundaries
 *  2. Episodic Reflection (critiques recent traces & conversational edits -> concrete lessons)
 *  3. Autonomous Procedural Skill Synthesis (compiles reusable Markdown SKILL.md recipes)
 *  4. Human-Gated Promotion (prevents autonomous drift; creator approves before pinning to ContextEngine)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Type, type Schema } from '@google/genai';
import type { ContextEngine } from '../rostr/context-engine.ts';
import { generateStructuredJson, hasServerGeminiKey } from '../rostr/gemini-client.ts';
import type { TraceLogger } from '../rostr/trace-logger.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface HermesMemoryItem {
  id: string;
  kind: 'lesson' | 'synthesized-skill' | 'episode';
  title: string;
  summary: string;
  skillMarkdown?: string;
  tags: string[];
  status: 'pending-review' | 'promoted' | 'archived';
  createdAt: string;
  sourceProjectId?: string;
}

export interface CreativeDatasetPrior {
  id: string;
  hub: 'Hugging Face' | 'Kaggle';
  datasetName: string;
  focus: string;
  monarchApplication: string;
  priorRule: string;
}

export const CREATIVE_DATASET_PRIORS: CreativeDatasetPrior[] = [
  {
    id: 'hf-cineboard3d',
    hub: 'Hugging Face',
    datasetName: 'EngineeringAI-LAB/CineBoard3D',
    focus: '3D storyboarding & multi-shot spatial consistency',
    monarchApplication: 'create_storyboard',
    priorRule:
      'Maintain spatial anchor continuity and consistent subject eyeline across consecutive storyboard scenes.',
  },
  {
    id: 'hf-muss',
    hub: 'Hugging Face',
    datasetName: 'MuSS (Multi-Shot Subject-to-Video)',
    focus: 'Multi-shot cinematic montage transitions & cadence',
    monarchApplication: 'create_agent_json',
    priorRule:
      'Keep hook scenes 4–6s with decisive gold-wipe or crisp-cut transitions; resolve outros over 5–7s.',
  },
  {
    id: 'hf-crello-animation',
    hub: 'Hugging Face',
    datasetName: 'cyberagent/crello-animation',
    focus: 'Motion graphics templates, layer stagger & kinetic typography',
    monarchApplication: 'select_animations',
    priorRule:
      'Stagger kicker, display headline, gold hairline, and subheadline entrances by 0.12s–0.18s with power3.out easing.',
  },
  {
    id: 'hf-camera-motion',
    hub: 'Hugging Face',
    datasetName: 'fengyee/camera-motion-dataset-and-benchmark',
    focus: 'Annotated cinematic camera trajectories (cam-motion.jsonl)',
    monarchApplication: 'create_treatment',
    priorRule:
      'Specify explicit camera vectors (slow dolly-in, locked architectural tripod, lateral track) instead of generic motion words.',
  },
  {
    id: 'hf-matsynth',
    hub: 'Hugging Face',
    datasetName: 'gvecchio/MatSynth',
    focus: 'PBR materials, lighting roughness & surface realism',
    monarchApplication: 'select_video',
    priorRule:
      'Ground generative B-roll prompts in tactile PBR finishes: fluted matte stone, satin brushed brass, velvet navy, optical glass.',
  },
  {
    id: 'kaggle-film-shots',
    hub: 'Kaggle',
    datasetName: 'Film Shots Dataset',
    focus: 'Shot scale taxonomy (ECU, CU, Medium, Wide, Establishing)',
    monarchApplication: 'create_storyboard',
    priorRule:
      'Progress shot scales purposefully: Wide Establishing Hook -> Medium Process -> Close-Up Detail -> Symmetrical Crest Outro.',
  },
  {
    id: 'kaggle-mocap-vcmotion',
    hub: 'Kaggle',
    datasetName: 'MoCap-VCMotion Dataset',
    focus: 'Multi-view 3D motion kinematics & natural easing curves',
    monarchApplication: 'select_animations',
    priorRule:
      'Use critically damped springs (damping: 18, stiffness: 120) and smooth deceleration curves to avoid robotic linear motion.',
  },
  {
    id: 'kaggle-animation-movies',
    hub: 'Kaggle',
    datasetName: '25K Animation Movies Data',
    focus: 'Narrative arc structure, loglines & genre pacing',
    monarchApplication: 'create_treatment',
    priorRule:
      'Every treatment opens with a 1-sentence tension logline and closes with an unmistakable single-action brand resolution.',
  },
];

const REFLECTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    lessonTitle: { type: Type.STRING },
    lessonSummary: { type: Type.STRING },
    skillTitle: { type: Type.STRING },
    skillSlug: { type: Type.STRING },
    skillMarkdown: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['lessonTitle', 'lessonSummary', 'skillTitle', 'skillSlug', 'skillMarkdown', 'tags'],
};

interface RawReflection {
  lessonTitle: string;
  lessonSummary: string;
  skillTitle: string;
  skillSlug: string;
  skillMarkdown: string;
  tags: string[];
}

export class HermesSelfImprover {
  private memories: HermesMemoryItem[] = [];
  private soulMd: string;
  private substrate: ContextEngine;
  private traceLogger: TraceLogger;

  constructor(params: { substrate: ContextEngine; traceLogger: TraceLogger }) {
    this.substrate = params.substrate;
    this.traceLogger = params.traceLogger;
    this.soulMd = this.loadSoulFile();

    // Seed initial Hermes foundational lesson so the workspace immediately shows progressive disclosure
    this.memories.push({
      id: 'hermes-seed-pacing',
      kind: 'synthesized-skill',
      title: 'Editorial Hook & Gold-Rule Cadence',
      summary:
        'Distilled from Crello Animation & Film Shots priors: opening scenes under 6s with a 1-line headline (<7 words) and a 0.14s staggered satin-gold hairline maximize retention without visual clutter.',
      skillMarkdown: `---\nname: editorial-hook-cadence\ntrigger: Product launches, brand reels, and 16:9 hero videos\n---\n\n# Editorial Hook & Gold-Rule Cadence\n1. Limit Scene 1 display headline to 5–7 words.\n2. Trigger gold hairline wipe 140ms after headline entrance (\`power3.out\`).\n3. Pair with -14dB cello ostinato ducked beneath calm studio narration.\n`,
      tags: ['pacing', 'crello-animation', 'hyperframes', 'monarch'],
      status: 'promoted',
      createdAt: new Date(Date.now() - 3600_000 * 12).toISOString(),
    });
  }

  private loadSoulFile(): string {
    const soulPath = path.resolve(__dirname, '../../skills/monarch-video/SOUL.md');
    if (fs.existsSync(soulPath)) {
      return fs.readFileSync(soulPath, 'utf8');
    }
    return '# Monarch Director SOUL\nCraft deterministic, regal, editable programmatic video with human-gated self-improvement.';
  }

  async seedDatasetPriorsIntoContext(): Promise<number> {
    await this.substrate.upsert({
      id: 'hermes-soul-charter',
      content: this.soulMd,
      source: 'hermes-soul',
      trustScore: 0.99,
      pinned: true,
      tags: ['hermes', 'soul', 'self-improvement'],
    });

    for (const prior of CREATIVE_DATASET_PRIORS) {
      await this.substrate.upsert({
        id: `dataset-${prior.id}`,
        content: `[${prior.hub} · ${prior.datasetName}] (${prior.focus}) -> Applies to ${prior.monarchApplication}: ${prior.priorRule}`,
        source: `dataset:${prior.hub.toLowerCase().replace(/\s+/g, '-')}`,
        trustScore: 0.96,
        pinned: true,
        tags: ['dataset', prior.hub.toLowerCase(), prior.monarchApplication],
      });
    }

    return CREATIVE_DATASET_PRIORS.length;
  }

  getState() {
    return {
      soulMd: this.soulMd,
      datasetPriors: CREATIVE_DATASET_PRIORS,
      memories: [...this.memories],
      stats: {
        totalMemories: this.memories.length,
        promotedSkills: this.memories.filter((m) => m.status === 'promoted').length,
        pendingReview: this.memories.filter((m) => m.status === 'pending-review').length,
        indexedDatasets: CREATIVE_DATASET_PRIORS.length,
      },
    };
  }

  async reflectAndSynthesize(params: {
    contextSummary?: string;
    projectId?: string;
  }): Promise<{ lesson: HermesMemoryItem; synthesizedSkill: HermesMemoryItem; traceId: string }> {
    const trace = this.traceLogger.startTrace('hermes.reflect_and_synthesize', {
      projectId: params.projectId || 'global',
    });

    const recentSpans = this.traceLogger.getRecentSpans(10);
    const contextStats = this.substrate.stats();
    const observation =
      params.contextSummary ||
      `Observed ${recentSpans.length} execution spans and ${contextStats.totalEpisodes} studio episodes across PAL compilation, artistic direction, and conversational scene patching.`;

    try {
      let parsed: RawReflection;

      if (hasServerGeminiKey()) {
        parsed = await generateStructuredJson<RawReflection>({
          systemInstruction: `${this.soulMd}\n\nYou are executing the Hermes Self-Improving Reflection Loop. Critique recent video production runs, extract ONE actionable creative engineering lesson, and synthesize ONE concise reusable Markdown skill recipe (with YAML frontmatter).`,
          contents: `Recent Observation:\n${observation}\n\nRecent Spans:\n${JSON.stringify(
            recentSpans.map((s) => ({ name: s.name, status: s.status, durationMs: s.durationMs })),
            null,
            2
          )}\n\nIndexed Creative Datasets: CineBoard3D, MuSS, Crello Animation, Camera Motion Benchmark, MatSynth, Film Shots, MoCap-VCMotion.`,
          responseSchema: REFLECTION_SCHEMA,
        });
      } else {
        parsed = {
          lessonTitle: 'Scoped Patch Preservation & Shot-Scale Rhythm',
          lessonSummary: `From recent studio traces (${recentSpans.length} spans): pairing Film Shots scale progression (Wide -> Medium -> Close-Up -> Crest) with scoped JSON scene diffs cuts iteration time while preserving brand consistency.`,
          skillTitle: 'Shot-Scale Progression Recipe',
          skillSlug: 'shot-scale-progression',
          skillMarkdown: `---\nname: shot-scale-progression\ntrigger: Multi-scene commercial or launch video\ndatasets: [Film Shots Dataset, CineBoard3D, MuSS]\n---\n\n# Shot-Scale Progression\n- Scene 1: Wide architectural establishing frame (5–6s)\n- Scene 2: Medium editorial split with tabular proof (6s)\n- Scene 3: Tight kinetic detail callout (6s)\n- Scene 4: Symmetrical brand crest outro with single CTA (6s)\n`,
          tags: ['hermes', 'shot-scale', 'cineboard3d', 'storyboard'],
        };
      }

      const now = new Date().toISOString();
      const lesson: HermesMemoryItem = {
        id: `hermes-lesson-${crypto.randomUUID().slice(0, 8)}`,
        kind: 'lesson',
        title: parsed.lessonTitle,
        summary: parsed.lessonSummary,
        tags: (parsed.tags || ['hermes']).slice(0, 6),
        status: 'pending-review',
        createdAt: now,
        sourceProjectId: params.projectId,
      };

      const synthesizedSkill: HermesMemoryItem = {
        id: `hermes-skill-${crypto.randomUUID().slice(0, 8)}`,
        kind: 'synthesized-skill',
        title: parsed.skillTitle,
        summary: parsed.lessonSummary,
        skillMarkdown: parsed.skillMarkdown,
        tags: [...new Set(['synthesized-skill', ...(parsed.tags || [])])].slice(0, 8),
        status: 'pending-review',
        createdAt: now,
        sourceProjectId: params.projectId,
      };

      this.memories.unshift(synthesizedSkill, lesson);
      trace.finish('OK', { lessonId: lesson.id, skillId: synthesizedSkill.id });
      return { lesson, synthesizedSkill, traceId: trace.traceId };
    } catch (err) {
      trace.finish('ERROR', { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  async promoteMemory(id: string, action: 'promoted' | 'archived'): Promise<HermesMemoryItem | null> {
    const item = this.memories.find((m) => m.id === id);
    if (!item) return null;
    item.status = action;

    if (action === 'promoted') {
      await this.substrate.upsert({
        id: `promoted-${item.id}`,
        content: `[Hermes Promoted ${item.kind}] ${item.title}: ${item.summary}\n${item.skillMarkdown || ''}`,
        source: 'hermes-promoted-skill',
        trustScore: 0.97,
        pinned: true,
        tags: ['hermes-promoted', ...item.tags],
      });
    }

    return item;
  }
}
