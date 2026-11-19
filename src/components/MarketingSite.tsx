import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Clapperboard,
  Code2,
  Cpu,
  Layers,
  Play,
  SlidersHorizontal,
} from 'lucide-react';
import { MonarchLogo } from './MonarchLogo';

const HERO_STUDIO_IMG = '/src/assets/images/monarch_hero_studio_1795058371767.jpg';
const SHOWCASE_LAUNCH_IMG = '/src/assets/images/monarch_showcase_launch_1795058373184.jpg';
const SHOWCASE_BRAND_IMG = '/src/assets/images/monarch_showcase_brandfilm_1795058372638.jpg';
const SHOWCASE_EXPLAINER_IMG = '/src/assets/images/monarch_showcase_explainer_1795058371907.jpg';

interface MarketingSiteProps {
  onOpenStudio: (options?: { initialPrompt?: string; openTab?: 'composer' | 'inspector' }) => void;
}

const SHOWCASE_ITEMS = [
  {
    id: 'launch',
    label: 'Product Launch Reel',
    aspect: '16:9 · 24s · Hybrid Veo 3.1 + HyperFrames',
    image: SHOWCASE_LAUNCH_IMG,
    imageAlt: 'Matte royal blue and brushed brass cinema camera lens resting on dark slate',
    prompt:
      'Direct a 24-second product launch film for our 50mm T1.5 brushed-brass anamorphic lens. Keep typography restrained, pace cuts to tactile gear detents, and close on Batch 01 reservations.',
    scenes: [
      '00:00–00:06 · Anamorphic silhouette reveal with warm gold rim sweep',
      '00:06–00:12 · Alabaster optical spec plate (2x squeeze, 300° throw)',
      '00:12–00:18 · Deterministic HyperFrames kinetic proof callouts',
      '00:18–00:24 · Brushed brass crest outro & reservation URL',
    ],
    editExample: 'Make scene 2 punchier, switch the background to royal blue, and slow the logo outro by 1.5s.',
  },
  {
    id: 'brandfilm',
    label: 'Editorial Brand Film',
    aspect: '4:3 · 30s · Hybrid Veo 3.1 + HyperFrames',
    image: SHOWCASE_BRAND_IMG,
    imageAlt: 'Sunlit European architectural design atelier with brass drafting tools and storyboard script',
    prompt:
      'Produce a 30-second architectural brand film for a Copenhagen industrial design studio. Pair calm daylight atelier imagery with understated lower-third narration and cello underscore.',
    scenes: [
      '00:00–00:08 · Sunlit limestone table & hand-rolled storyboard open',
      '00:08–00:16 · Measured director treatment quotes in editorial typography',
      '00:16–00:23 · Split-frame drafting details with synced word captions',
      '00:23–00:30 · Minimalist studio wordmark lockup in warm alabaster',
    ],
    editExample: 'Keep scenes 1 and 4 untouched, tighten voiceover in scene 2, and soften transition to cross-dissolve.',
  },
  {
    id: 'explainer',
    label: 'Kinetic SaaS Explainer',
    aspect: '16:9 · 20s · HyperFrames / Remotion TSX',
    image: SHOWCASE_EXPLAINER_IMG,
    imageAlt: 'Sapphire optical glass prisms and slender brushed gold bars on crisp alabaster stone',
    prompt:
      'Build a 20-second programmatic explainer introducing our treasury settlement engine. Compile directly to clean React/GSAP motion graphics with tabular metrics and zero stock clichés.',
    scenes: [
      '00:00–00:05 · Crisp problem hook on alabaster canvas',
      '00:05–00:11 · Geometric flow diagram with synchronized narration',
      '00:11–00:16 · Tabular settlement latency benchmark showcase',
      '00:16–00:20 · Royal blue closing lockup with live demo CTA',
    ],
    editExample: 'Swap runtime target to Remotion TSX and highlight the 420ms settlement figure in satin gold.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How is Monarch different from one-shot AI video generators?',
    a: 'One-shot generators give you an opaque MP4 that breaks whenever you ask for a small revision. Monarch compiles your prompt through 4-stage PAL extraction, generates an editable treatment, storyboard, and script, and builds a canonical Universal Video Timeline JSON compiled to HyperFrames or Remotion. Changing a single headline, color, or beat patches only that scene.',
  },
  {
    q: 'Can I use my own API keys (BYOK) or run through the managed AI Gateway?',
    a: 'Yes. Solo developers and studios can configure server-side BYOK environment adapters for Google Gemini / Veo 3.1, Anthropic Claude, OpenAI (LLM/Image/TTS), Runway Gen-4.5, Kling 4.0, and ElevenLabs, or route seamlessly through Monarch’s Managed AI Gateway with predictable credit metering and pre-render cost approvals.',
  },
  {
    q: 'How does the Google ADK & ROSTR backend orchestrate each video?',
    a: 'Under the hood, Monarch runs on Google ADK (LlmAgent, SequentialAgent, FunctionTool, SessionService, ArtifactService, MemoryService) combined with the ROSTR 6-layer open-protocol stack (ContextEngine RAG DAL, stateless MCP 2026-07-28 via Composio, and ACP 1.0 / A2A discovery). Every pre-production doc and compiled timeline is versioned and inspectable.',
  },
  {
    q: 'Which programmatic rendering libraries and generative video models are supported?',
    a: 'Monarch defaults to HyperFrames (Apache 2.0 HTML/CSS/GSAP/Lottie/Three.js) for kinetic typography and promos, routes React/data-chart videos to Remotion (with automatic >3-employee commercial license checks), pairs CLIP stock via OpenMontage, masters audio/MP4 with FFmpeg, and routes generative clips exclusively to active 2026 engines (Google Veo 3.1, Runway Gen-4.5, Kling 4.0, and open-weights LTX-2.5).',
  },
];

export const MarketingSite: React.FC<MarketingSiteProps> = ({ onOpenStudio }) => {
  const [heroPrompt, setHeroPrompt] = useState(
    'Create a 24-second 16:9 launch film for our fintech treasury platform in Royal Blue and Satin Gold—calm editorial pacing, synced voiceover, and crisp kinetic headlines.'
  );
  const [selectedShowcase, setSelectedShowcase] = useState(SHOWCASE_ITEMS[0].id);
  const [billingMode, setBillingMode] = useState<'managed' | 'byok'>('managed');
  const [openFaq, setOpenFaq] = useState<number>(0);

  const activeShowcase =
    SHOWCASE_ITEMS.find((item) => item.id === selectedShowcase) || SHOWCASE_ITEMS[0];

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenStudio({ initialPrompt: heroPrompt.trim(), openTab: 'composer' });
  };

  return (
    <div className="bg-[#FAFBFD] text-slate-900">
      {/* 1. HERO SECTION — Imagio-inspired calm editorial split with interactive prompt composer */}
      <section className="mx-auto max-w-[1200px] px-6 pt-14 pb-20 lg:pt-20 lg:pb-24">
        <div className="grid items-stretch gap-12 lg:grid-cols-12">
          {/* Left Narrative & Interactive Prompt Bar */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <p className="text-xs font-medium text-[#9A7B1C]">
                Programmatic Video Studio · Google ADK & ROSTR Stack
              </p>
              <h1
                className="mt-4 font-display font-bold tracking-tight text-[#0F172A] text-balance"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', lineHeight: 1.08 }}
              >
                Direct studio-grade video from plain English.
              </h1>
              <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-slate-600">
                Monarch turns a natural-language brief into a full creative treatment,
                shot-by-shot storyboard, synced script, and deterministic HyperFrames or
                Remotion timeline—keeping every scene editable without re-rolling your cut.
              </p>

              {/* Quick-Launch Composer directly into Studio */}
              <form
                onSubmit={handleHeroSubmit}
                className="mt-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition-colors focus-within:border-[#102D69]"
              >
                <label htmlFor="hero-video-prompt" className="sr-only">
                  Describe the video you want to direct
                </label>
                <textarea
                  id="hero-video-prompt"
                  rows={3}
                  value={heroPrompt}
                  onChange={(e) => setHeroPrompt(e.target.value)}
                  className="w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Describe your video concept, brand palette, duration, and aspect ratio..."
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2.5 px-1">
                  <span className="text-xs text-slate-500">
                    PAL Intent · Approval Checkpoints · HyperFrames & Remotion
                  </span>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#102D69] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap shrink-0"
                  >
                    <span>Start Directing</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200/80 pt-5 text-xs text-slate-500">
              <span>Google ADK + Gemini 4 Orchestration</span>
              <span aria-hidden="true">·</span>
              <span>Veo 3.1 / Runway Gen-4.5 / LTX-2.5</span>
              <span aria-hidden="true">·</span>
              <span>BYOK Server Keys or Managed Gateway</span>
            </div>
          </div>

          {/* Right Dominant Visual Frame */}
          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-[#09142B]">
              <img
                src={HERO_STUDIO_IMG}
                alt="Monarch Video architectural editing suite in royal navy blue with satin gold accents and timeline display"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09142B]/85 via-[#09142B]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6 text-white">
                <div>
                  <p className="text-xs font-medium text-[#D4AF37]">
                    Canonical Timeline Compilation
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold leading-snug">
                    One structured JSON timeline. Two deterministic renderers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenStudio({ openTab: 'composer' })}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-white/95 px-4 text-xs font-semibold text-[#102D69] transition-colors hover:bg-white whitespace-nowrap shrink-0"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Preview Live Cut</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS — Imagio 3-Step Visual Progression */}
      <section id="how-it-works" className="border-y border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#9A7B1C]">Workflow</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
              From a single sentence to an editable studio timeline in three checkpoints
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Every consequential stage pauses for your sign-off—eliminating wasted generative
              credits and preserving creative control from treatment to final master.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="border-t border-slate-200 pt-6">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">01.</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Describe & Compile PAL Intent
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Enter your brief, brand colors, aspect ratio, and duration. The 4-stage PAL
                compiler extracts explicit constraints, selects HyperFrames, Remotion, or Hybrid
                Veo 3.1, and estimates cost before spending a single render credit.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">02.</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Direct Treatment, Storyboard & Script
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Review a complete artistic pre-production package: project brief, brand template
                selection, 1-page director treatment, shot-by-shot scene cards, and a time-coded
                voiceover, caption, and music cue sheet.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">03.</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Render & Patch Non-Destructively
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Approve compilation into Universal Video Timeline JSON plus runnable HyperFrames
                HTML/GSAP and Remotion TSX code. Iterate conversationally—patching only the scene
                you mention while untouched scenes remain locked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BEFORE / AFTER & PRODUCTION SHOWCASE */}
      <section id="showcase" className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-[#9A7B1C]">Before & After</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
              See how one prompt compiles into structured scenes
            </h2>
          </div>

          {/* Interactive Format Tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {SHOWCASE_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedShowcase(item.id)}
                className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedShowcase === item.id
                    ? 'bg-white text-[#102D69] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-12">
          {/* Left Cinema Still */}
          <div className="lg:col-span-7">
            <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-[#09142B]">
              <img
                src={activeShowcase.image}
                alt={activeShowcase.imageAlt}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09142B]/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="font-mono text-xs text-[#D4AF37] tabular-nums">
                  {activeShowcase.aspect}
                </p>
                <p className="mt-1 font-display text-xl font-semibold">{activeShowcase.label}</p>
              </div>
            </div>
          </div>

          {/* Right Prompt -> Compiled Scene Breakdown */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-slate-500">Before · Natural Language Input</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  “{activeShowcase.prompt}”
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs font-medium text-[#102D69]">
                  After · Compiled Timeline Scenes
                </p>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
                  {activeShowcase.scenes.map((scene) => (
                    <li key={scene} className="font-mono text-[11.5px] text-slate-700 tabular-nums">
                      {scene}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs font-medium text-[#9A7B1C]">Conversational Diff Example</p>
                <p className="mt-1.5 text-xs italic leading-relaxed text-slate-600">
                  “{activeShowcase.editExample}”
                </p>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={() =>
                  onOpenStudio({ initialPrompt: activeShowcase.prompt, openTab: 'composer' })
                }
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#102D69] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap"
              >
                <span>Direct This Concept in Studio</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE SKILLS & GOOGLE ADK + ROSTR ARCHITECTURE BENTO */}
      <section id="architecture" className="border-y border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#9A7B1C]">Core Agent Architecture</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
                Four strengthened video skills on Google ADK & ROSTR open protocols
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                No vendor lock-in. Every video runs through modular sub-skills backed by Google ADK
                services, hybrid RAG DAL brand memory, stateless MCP 2026-07-28, and ACP 1.0 handoffs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenStudio({ openTab: 'inspector' })}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <span>Inspect Live ADK & ROSTR Stack</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Asymmetric Bento Grid */}
          <div className="mt-10 grid gap-5 lg:grid-cols-12">
            <div className="rounded-2xl border border-slate-200 bg-[#FAFBFD] p-6 lg:col-span-7">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#102D69]">Sub-Skill A · video-env-bootstrap</span>
                <Cpu className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">
                Smart Library & 2026 Model Runtime Selection
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Automatically checks and selects the right open-source programmatic renderer—defaulting
                to Apache-2.0 HyperFrames (HTML/CSS/GSAP/Lottie/Three.js), routing React data-chart
                reels to Remotion with commercial seat checks, and wiring active generative adapters
                (Google Veo 3.1, Runway Gen-4.5, Kling 4.0, LTX-2.5) while strictly blocking retired
                Sora endpoints.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-4 text-xs text-slate-600 sm:grid-cols-4">
                <div>
                  <p className="font-semibold text-slate-900">HyperFrames</p>
                  <p className="mt-0.5 text-slate-500">Primary Apache 2.0</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Remotion</p>
                  <p className="mt-0.5 text-slate-500">React / TSX target</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">OpenMontage</p>
                  <p className="mt-0.5 text-slate-500">CLIP stock router</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">FFmpeg</p>
                  <p className="mt-0.5 text-slate-500">Audio & MP4 master</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#102D69] p-6 text-white lg:col-span-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#D4AF37]">Sub-Skill B · pal-video-compiler</span>
                <SlidersHorizontal className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold">
                4-Stage PAL Intent Extraction
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                Parses explicit assets, analyzes audience pacing, selects the optimal render runtime
                with a transparent USD/credit estimate, and compiles a deterministic Master Creative
                Prompt before any artistic drafting begins.
              </p>
              <div className="mt-5 space-y-1.5 border-t border-white/15 pt-4 font-mono text-xs text-slate-200">
                <p>01. Parse Data & Brand Tokens</p>
                <p>02. Semantic Arc & Pacing Analysis</p>
                <p>03. Runtime Hypothesis & Cost Gate</p>
                <p>04. Master Creative Prompt Lock</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#FAFBFD] p-6 lg:col-span-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#102D69]">Sub-Skill C · artistic-director-suite</span>
                <Clapperboard className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">
                Full Studio Pre-Production Suite
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Generates six versioned artifacts stored in Google ADK ArtifactService: Project
                Brief, Template & Brand Kit binding, 1-page Director’s Treatment, Shot-by-Shot
                Storyboard, Aligned Script & Cue Sheet, and Final Production Prompt.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#FAFBFD] p-6 lg:col-span-7">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#102D69]">Sub-Skill D · editor-json-translator</span>
                <Code2 className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">
                Universal Timeline JSON & Bi-Directional Diff Edits
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Validates every scene against the canonical <code className="font-mono text-xs">UniversalVideoTimeline</code>{' '}
                schema and compiles deterministically to runnable HyperFrames HTML/GSAP and Remotion
                TSX. Follow-up chat requests emit scoped <code className="font-mono text-xs">TimelinePatch</code>{' '}
                diffs that mutate only the targeted scene while preserving untouched cuts.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-200/80 pt-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                  <Layers className="h-3.5 w-3.5 text-[#102D69]" />
                  Google ADK Runner + Session / Artifact / Memory Services
                </span>
                <span aria-hidden="true">·</span>
                <span>Composio MCP (`composio-*`)</span>
                <span aria-hidden="true">·</span>
                <span>ACP 1.0 + A2A Discovery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. USE CASES & ATTRIBUTABLE PROOF */}
      <section className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#9A7B1C]">Built For Real Production Teams</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Creative clarity for solo founders, growth teams, and studios
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-xs font-medium text-[#102D69]">Solo Creators & Founders</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                Launch films in an afternoon
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Start from product release notes, lock your logo and palette once in ContextEngine
                brand memory, and export 16:9 and 9:16 cuts from the same Timeline JSON.
              </p>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">
                4.2 hrs → 28 mins per product launch reel
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                “Approving the treatment and storyboard before rendering saved us three rounds of
                agency revisions on our Series A announcement.”
              </p>
              <p className="mt-2 text-xs font-medium text-slate-900">
                Hannah Lindholm · Co-Founder, Nordkapp Ledger
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-xs font-medium text-[#102D69]">Product Marketing Teams</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                On-brand variations without drift
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Enforce exact typography, lower-thirds, and legal copy across dozens of paid social
                cuts using deterministic HyperFrames templates and non-destructive scene patches.
              </p>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">
                18 localized campaign cuts · 0 brand regressions
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                “When legal changed one claim in scene three, we patched that single JSON node and
                re-rendered all six aspect ratios cleanly.”
              </p>
              <p className="mt-2 text-xs font-medium text-slate-900">
                Marcus Alvarez · VP Brand Marketing, Veridian Pay
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-xs font-medium text-[#102D69]">Technical & Motion Studios</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                Open code, BYOK keys, full traces
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Export clean Remotion TSX or HyperFrames HTML bundles straight into GitHub via
                Composio MCP, run on your own server API keys, and audit every ADK & NPAO span.
              </p>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">
                62% lower generative spend via approval gates
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                “Having a real Universal Timeline JSON and native MCP endpoint lets our engineers
                automate weekly client recaps without leaving Git.”
              </p>
              <p className="mt-2 text-xs font-medium text-slate-900">
                Devon Takahashi · Principal Creative Technologist, Atelier Kanso
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING (BYOK vs MANAGED AI GATEWAY) + FAQ */}
      <section id="pricing" className="border-t border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-xs font-medium text-[#9A7B1C]">Transparent Monetization</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
                Run through our Managed Gateway or connect server-side BYOK keys
              </h2>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setBillingMode('managed')}
                className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  billingMode === 'managed'
                    ? 'bg-white text-[#102D69] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Managed AI Gateway
              </button>
              <button
                type="button"
                onClick={() => setBillingMode('byok')}
                className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  billingMode === 'byok'
                    ? 'bg-white text-[#102D69] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                BYOK Server Keys
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Free Tier */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#FAFBFD] p-6">
              <div>
                <p className="text-xs font-medium text-slate-500">For solo exploration</p>
                <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Free</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                    $0
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <dl className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Pipeline quota</dt>
                    <dd className="font-medium text-slate-900 tabular-nums">
                      {billingMode === 'managed' ? '60 gateway credits / mo' : 'Unlimited BYOK local runs'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Render targets</dt>
                    <dd className="font-medium text-slate-900">HyperFrames HTML + JSON</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Brand kits</dt>
                    <dd className="font-medium text-slate-900 tabular-nums">1 brand kit</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Max resolution</dt>
                    <dd className="font-medium text-slate-900 tabular-nums">1080p · 30 fps</dd>
                  </div>
                </dl>
              </div>
              <button
                type="button"
                onClick={() => onOpenStudio({ openTab: 'composer' })}
                className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50"
              >
                Open Free Studio
              </button>
            </div>

            {/* Creator Tier */}
            <div className="flex flex-col justify-between rounded-2xl border-2 border-[#102D69] bg-white p-6">
              <div>
                <p className="text-xs font-medium text-[#9A7B1C]">For active creators & marketers</p>
                <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Creator</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {billingMode === 'managed' ? '$39' : '$19'}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <dl className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Pipeline quota</dt>
                    <dd className="font-medium text-slate-900 tabular-nums">
                      {billingMode === 'managed'
                        ? '650 gateway credits / mo'
                        : 'Direct pass-through BYOK'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Render targets</dt>
                    <dd className="font-medium text-slate-900">HyperFrames + Remotion TSX</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Generative video</dt>
                    <dd className="font-medium text-slate-900">Veo 3.1 · Runway · Kling</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Brand memory</dt>
                    <dd className="font-medium text-slate-900 tabular-nums">10 brand kits + RAG DAL</dd>
                  </div>
                </dl>
              </div>
              <button
                type="button"
                onClick={() => onOpenStudio({ openTab: 'composer' })}
                className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#102D69] text-xs font-semibold text-white transition-colors hover:bg-[#091A3E]"
              >
                Launch Creator Workspace
              </button>
            </div>

            {/* Studio Tier */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#FAFBFD] p-6">
              <div>
                <p className="text-xs font-medium text-slate-500">For multi-brand production teams</p>
                <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Studio</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {billingMode === 'managed' ? '$149' : '$79'}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <dl className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Pipeline quota</dt>
                    <dd className="font-medium text-slate-900 tabular-nums">
                      {billingMode === 'managed'
                        ? '3,000 gateway credits / mo'
                        : 'Dedicated BYOK + AWS Lambda'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Open protocols</dt>
                    <dd className="font-medium text-slate-900">MCP 2026-07-28 + ACP 1.0</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Connectors</dt>
                    <dd className="font-medium text-slate-900">GitHub · Drive · YouTube · Slack</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Max resolution</dt>
                    <dd className="font-medium text-slate-900 tabular-nums">4K · 60 fps + Trace Audit</dd>
                  </div>
                </dl>
              </div>
              <button
                type="button"
                onClick={() => onOpenStudio({ openTab: 'inspector' })}
                className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50"
              >
                Explore ADK & MCP Architecture
              </button>
            </div>
          </div>

          {/* FAQ Section directly beneath Pricing (Imagio Layout Pattern) */}
          <div className="mt-20 border-t border-slate-200 pt-16">
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="text-xs font-medium text-[#9A7B1C]">Questions & Answers</p>
                <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
                  Architecture, keys, and rendering clarity
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Everything you need to know about running Monarch as a consumer studio or an
                  open-protocol video agent backend.
                </p>
              </div>

              <div className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-8">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={item.q} className="py-4">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                        className="flex w-full items-center justify-between gap-4 text-left"
                      >
                        <span className="font-display text-sm font-semibold text-slate-900">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-[#102D69]' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-3 pr-8 text-sm leading-relaxed text-slate-600">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. QUIET REGAL FOOTER */}
      <footer className="border-t border-slate-200 bg-[#FAFBFD] py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-8 px-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <MonarchLogo size={26} />
            <span className="font-display text-base font-bold tracking-tight text-[#102D69]">
              Monarch
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              Agentic Programmatic Video Studio
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How It Works
            </a>
            <a href="#showcase" className="hover:text-slate-900 transition-colors">
              Showcase
            </a>
            <a href="#architecture" className="hover:text-slate-900 transition-colors">
              Architecture
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">
              Pricing
            </a>
            <a
              href="/.well-known/agent.json"
              target="_blank"
              rel="noreferrer"
              className="font-mono hover:text-[#102D69] transition-colors"
            >
              /.well-known/agent.json
            </a>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Monarch Video
          </p>
        </div>
      </footer>
    </div>
  );
};
