import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ChevronDown,
  Clapperboard,
  FolderUp,
  Mic,
  Play,
  SlidersHorizontal,
  Video,
  X,
} from 'lucide-react';
import { MonarchLogo } from './MonarchLogo';

const HERO_STUDIO_IMG = '/src/assets/images/monarch_hero_studio_1795058371767.jpg';
const SHOWCASE_LAUNCH_IMG = '/src/assets/images/monarch_showcase_launch_1795058373184.jpg';
const SHOWCASE_BRAND_IMG = '/src/assets/images/monarch_showcase_brandfilm_1795058372638.jpg';
const SHOWCASE_EXPLAINER_IMG = '/src/assets/images/monarch_showcase_explainer_1795058371907.jpg';
const LOOM_EMBED_URL = 'https://www.loom.com/embed/bc62e599848648bf933ad3c06727a091';

interface MarketingSiteProps {
  onStartCreating: (options?: { initialPrompt?: string; authMode?: 'signin' | 'signup' }) => void;
}

const SHOWCASE_ITEMS = [
  {
    id: 'launch',
    label: 'Product Launch Montage',
    aspect: '16:9 · 24s · B-Roll Montage + H.264 MP4',
    image: SHOWCASE_LAUNCH_IMG,
    imageAlt: 'Matte royal blue and brushed brass cinema camera lens resting on dark slate',
    prompt:
      'Create a 24-second product launch video for our 50mm T1.5 brushed-brass cinema lens. Pair rapid 1.8s B-roll sub-cuts with kinetic specs and end with a Batch 01 reservation CTA.',
    scenes: [
      '00:00–00:06 · Macro optical B-roll sub-cuts (1.8s cadence) + warm gold reveal',
      '00:06–00:12 · Precision robotics B-roll cut + optical clarity spec plate',
      '00:12–00:18 · Crisp kinetic callouts synchronized to Fenrir studio narration',
      '00:18–00:24 · Brand logo lockup & Batch 01 reservation CTA',
    ],
    editExample: 'Make scene 2 cuts sharper at 1.5s, switch its plate to royal blue, and slow the logo outro by 1.5s.',
  },
  {
    id: 'brandfilm',
    label: 'Brand Film',
    aspect: '4:3 · 30s · Editorial Story',
    image: SHOWCASE_BRAND_IMG,
    imageAlt: 'Sunlit European architectural design atelier with brass drafting tools and storyboard script',
    prompt:
      'Produce a 30-second architectural brand film for a Copenhagen industrial design studio. Pair calm daylight B-roll footage with understated narration and warm cello underscore.',
    scenes: [
      '00:00–00:08 · Sunlit architectural studio B-roll with subtle title rise',
      '00:08–00:16 · Founder vision headline paired with synced Kore voiceover',
      '00:16–00:23 · Split-frame craft details with clean lower-third captions',
      '00:23–00:30 · Auto-synced brand logo lockup in warm alabaster',
    ],
    editExample: 'Keep scenes 1 and 4 untouched, tighten the narration in scene 2, and soften the transition.',
  },
  {
    id: 'explainer',
    label: 'Product Explainer',
    aspect: '16:9 · 20s · SaaS Walkthrough',
    image: SHOWCASE_EXPLAINER_IMG,
    imageAlt: 'Sapphire optical glass prisms and slender brushed gold bars on crisp alabaster stone',
    prompt:
      'Build a 20-second explainer introducing our global treasury platform. Use crisp typography, high-contrast B-roll montages, and clear latency proof points.',
    scenes: [
      '00:00–00:05 · Clear problem hook on bright alabaster canvas',
      '00:05–00:11 · Structured workflow visual with studio voiceover',
      '00:11–00:16 · Tabular speed benchmark showcase with sharp cut-on-beat pacing',
      '00:16–00:20 · Deep royal blue closing card with live demo CTA',
    ],
    editExample: 'Change the motion style to Satin Gold Wipe and highlight the 420ms speed figure in gold.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How is Monarch different from one-shot AI video generators?',
    a: 'Most AI video tools hand you a flat clip that breaks the moment you ask for a tweak. Monarch orchestrates a 7-sub-agent studio that builds an editable storyboard, multi-shot B-roll montage, timed script, and studio voiceover—so changing one headline, B-roll clip, or cut speed updates only that scene.',
  },
  {
    q: 'Where does Monarch source B-roll footage and can I upload my own brand docs?',
    a: 'Monarch combines 4 B-roll sources: curated HD studio footage, your own uploaded clips, live open-source & Composio media libraries (Pexels, Pixabay, Wikimedia Commons, Coverr, Openverse), and motion graphics plates. You can also drop any brand guideline doc or logo and Monarch auto-extracts your hex colors, fonts, and watermark across every scene.',
  },
  {
    q: 'Does Monarch improve its video editing style as my team uses it?',
    a: 'Yes. Every video uses a reusable JSON Cinema Style Blueprint that defines cut cadence, optical zoom curves, and transition physics. One-click feedback like “Sharper cuts” or “More cinematic” refines the blueprint and stores your preference in the Hermes self-improving memory loop.',
  },
  {
    q: 'Can I render universal H.264 .mp4 videos directly in the app?',
    a: 'Yes. Render universal H.264 .mp4 files directly inside the studio via our server-side FFmpeg pipeline, export instant .webm recordings in your browser, or download HyperFrames HTML5 and Remotion React bundles.',
  },
];

export const MarketingSite: React.FC<MarketingSiteProps> = ({ onStartCreating }) => {
  const [heroPrompt, setHeroPrompt] = useState(
    'Create a 24-second 16:9 launch film for our fintech treasury platform in Royal Blue and Satin Gold—sharp B-roll montage cuts, warm studio narration, and crisp headlines.'
  );
  const [selectedShowcase, setSelectedShowcase] = useState(SHOWCASE_ITEMS[0].id);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [loomModalOpen, setLoomModalOpen] = useState(false);

  const activeShowcase =
    SHOWCASE_ITEMS.find((item) => item.id === selectedShowcase) || SHOWCASE_ITEMS[0];

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartCreating({ initialPrompt: heroPrompt.trim(), authMode: 'signup' });
  };

  return (
    <div className="bg-[#FAFBFD] text-slate-900">
      {/* 1. HERO SECTION */}
      <section className="mx-auto max-w-[1200px] px-6 pt-14 pb-20 lg:pt-20 lg:pb-24">
        <div className="grid items-stretch gap-12 lg:grid-cols-12">
          {/* Left Narrative & Interactive Prompt Bar */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="flex flex-col justify-between lg:col-span-6"
          >
            <div>
              <p className="text-xs font-medium text-[#9A7B1C]">
                Brand Video & B-Roll Montage Studio
              </p>
              <h1
                className="mt-4 font-display font-bold tracking-tight text-[#0F172A] text-balance"
                style={{ fontSize: 'clamp(2.3rem, 4.1vw, 3.75rem)', lineHeight: 1.06 }}
              >
                Turn one sentence into a finished brand video.
              </h1>
              <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-slate-600">
                Describe what you want to launch, explain, or promote. Monarch auto-syncs your
                brand docs and logo, choreographs sharp multi-source B-roll montages, records
                studio narration, and renders H.264 MP4s.
              </p>

              {/* Interactive Prompt Box */}
              <form
                onSubmit={handleHeroSubmit}
                className="mt-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition-colors focus-within:border-[#102D69]"
              >
                <label htmlFor="hero-video-prompt" className="sr-only">
                  Describe the video you want to create
                </label>
                <textarea
                  id="hero-video-prompt"
                  rows={3}
                  value={heroPrompt}
                  onChange={(e) => setHeroPrompt(e.target.value)}
                  className="w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Describe your video concept, brand colors, length, and goal..."
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-1 pt-2.5">
                  <span className="text-xs text-slate-500">
                    B-Roll Montage · Brand Doc Auto-Sync · In-App MP4 Render
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLoomModalOpen(true)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                    >
                      <Video className="h-3.5 w-3.5 text-[#102D69]" />
                      <span>Watch Walkthrough</span>
                    </button>
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#102D69] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap shrink-0"
                    >
                      <span>Start Creating Free</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200/80 pt-5 text-xs text-slate-500">
              <span>16:9, 9:16 & 1:1 H.264 MP4</span>
              <span aria-hidden="true">·</span>
              <span>Pexels, Pixabay & Open Media B-Roll</span>
              <span aria-hidden="true">·</span>
              <span>Auto-sync logos & brand guidelines</span>
            </div>
          </motion.div>

          {/* Right Dominant Visual Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
            className="lg:col-span-6"
          >
            <div className="relative h-full min-h-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-[#09142B]">
              <img
                src={HERO_STUDIO_IMG}
                alt="Monarch Video studio preview showing royal blue and gold composition"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09142B]/85 via-[#09142B]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6 text-white">
                <div>
                  <p className="text-xs font-medium text-[#D4AF37]">Live B-Roll Montage Studio</p>
                  <p className="mt-1 font-display text-lg font-semibold leading-snug">
                    Edit a headline, B-roll cut, or voice without re-rendering from scratch.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLoomModalOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3.5 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20 whitespace-nowrap shrink-0"
                  >
                    <Video className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span>Founder Loom</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartCreating({ authMode: 'signin' })}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-white/95 px-4 text-xs font-semibold text-[#102D69] transition-colors hover:bg-white whitespace-nowrap shrink-0"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Open Workspace</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. HOW IT WORKS — 3 Simple Creator Steps */}
      <section id="how-it-works" className="border-y border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#9A7B1C]">How It Works</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
              From rough idea to publish-ready H.264 MP4 in three calm steps
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Review every stage before moving forward—so your brand voice, B-roll montage cadence,
              and visuals match your exact expectations on the very first export.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="border-t border-slate-200 pt-6">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">01.</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Drop your brief & brand docs
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Type your brief in plain English and upload any brand guideline PDF, markdown doc,
                or logo. Monarch automatically extracts your hex palette, font pairing, and logo
                watermark across every scene.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">02.</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Choreograph B-roll & studio voice
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Approve your storyboard, pair scenes with rapid B-roll sub-cuts from curated HD
                footage, Pexels, Pixabay, Wikimedia Commons, or your own uploads, and record
                natural studio voiceover.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">03.</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Sharpen cuts & render H.264 MP4
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Click “Sharper cuts” to tighten montage cadence via reusable JSON Cinema Style
                Blueprints, edit any single scene in plain English, and render a universal H.264
                .mp4 directly in the app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BEFORE / AFTER SHOWCASE */}
      <section id="showcase" className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-[#9A7B1C]">Made With Monarch</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
              See what one prompt creates across every format
            </h2>
          </div>

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

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-slate-500">Your brief</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  “{activeShowcase.prompt}”
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs font-medium text-[#102D69]">Your finished scene sequence</p>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
                  {activeShowcase.scenes.map((scene) => (
                    <li key={scene} className="font-mono text-[11.5px] text-slate-700 tabular-nums">
                      {scene}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs font-medium text-[#9A7B1C]">Instant revision</p>
                <p className="mt-1.5 text-xs italic leading-relaxed text-slate-600">
                  “{activeShowcase.editExample}”
                </p>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={() =>
                  onStartCreating({ initialPrompt: activeShowcase.prompt, authMode: 'signup' })
                }
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#102D69] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap"
              >
                <span>Create a Video Like This</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE JOBS-TO-BE-DONE CAPABILITIES */}
      <section className="border-y border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#9A7B1C]">Built For Creators & Teams</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Everything you need to produce on-brand videos without an agency queue
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-12">
            <div className="rounded-2xl border border-slate-200 bg-[#FAFBFD] p-6 lg:col-span-7">
              <Clapperboard className="h-5 w-5 text-[#102D69]" />
              <h3 className="mt-4 font-display text-xl font-semibold text-slate-900">
                4-Source B-Roll Montage & JSON Style Blueprints
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Every scene slices into rapid 1.5s–3.5s B-roll sub-cuts sourced from curated HD
                footage, your own uploads, Pexels/Pixabay/Wikimedia Commons via Composio, and
                motion plates—governed by self-improving JSON Cinema Style Blueprints.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#102D69] p-6 text-white lg:col-span-5">
              <Mic className="h-5 w-5 text-[#D4AF37]" />
              <h3 className="mt-4 font-display text-xl font-semibold">
                Natural studio narration & music
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                Audition expressive human-sounding narrator voices, dial in tone and cadence, and
                pair your video with original background scores that automatically duck while your
                narrator speaks.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#FAFBFD] p-6 lg:col-span-5">
              <FolderUp className="h-5 w-5 text-[#102D69]" />
              <h3 className="mt-4 font-display text-xl font-semibold text-slate-900">
                Smart Brand Doc & Logo Auto-Sync
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Drop any brand guideline PDF, markdown doc, or logo file. Monarch extracts your hex
                colors, typography, and watermark and syncs them straight into your video player
                and MP4 export.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#FAFBFD] p-6 lg:col-span-7">
              <SlidersHorizontal className="h-5 w-5 text-[#102D69]" />
              <h3 className="mt-4 font-display text-xl font-semibold text-slate-900">
                In-App H.264 MP4 Renderer & 7-Sub-Agent Architecture
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Render universal H.264 .mp4 video files directly in the studio, export .webm or
                Remotion React code, and inspect the complete Master Agent Soul, Covenant, and
                16-tool orchestration suite at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING + FAQ */}
      <section id="pricing" className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-[#9A7B1C]">Simple Plans</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Start free, scale with Stripe when your team ships weekly
            </h2>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#102D69] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                billingCycle === 'annual'
                  ? 'bg-white text-[#102D69] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-xs font-medium text-slate-500">For trying your first videos</p>
              <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Starter Free</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                  $0
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Monthly exports</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">3 MP4 / WebM exports</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Studio voices</dt>
                  <dd className="font-medium text-slate-900">5 human-sounding voices</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">B-roll library</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">Curated + Open Media</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={() => onStartCreating({ authMode: 'signup' })}
              className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              Start Free
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border-2 border-[#102D69] bg-white p-6">
            <div>
              <p className="text-xs font-medium text-[#9A7B1C]">For creators & founders</p>
              <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Creator Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {billingCycle === 'monthly' ? '$29' : '$23'}
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Monthly exports</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">Unlimited H.264 MP4</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Brand doc auto-sync</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">10 custom brand kits</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Style blueprints</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">Custom JSON styles</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={() => onStartCreating({ authMode: 'signup' })}
              className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#102D69] text-xs font-semibold text-white transition-colors hover:bg-[#091A3E]"
            >
              Start Creator Pro
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-xs font-medium text-slate-500">For growing marketing teams</p>
              <h3 className="mt-1 font-display text-xl font-bold text-slate-900">
                Studio Unlimited
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {billingCycle === 'monthly' ? '$99' : '$79'}
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Team seats</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">Up to 10 collaborators</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Composio & social</dt>
                  <dd className="font-medium text-slate-900">Pexels · YouTube · Reels · Drive</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Export quality</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">H.264 MP4 + Remotion TSX</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={() => onStartCreating({ authMode: 'signup' })}
              className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              Launch Studio Plan
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div id="faq" className="mt-20 border-t border-slate-200 pt-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium text-[#9A7B1C]">Questions</p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
                Common questions answered clearly
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Everything you need to go from a rough brief to a finished H.264 MP4 video your
                team can publish today.
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
                      <p className="mt-3 pr-8 text-sm leading-relaxed text-slate-600">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-8 px-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <MonarchLogo size={26} />
            <span className="font-display text-base font-bold tracking-tight text-[#102D69]">
              Monarch
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">Brand Video Studio</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <a href="#how-it-works" className="transition-colors hover:text-slate-900">
              How It Works
            </a>
            <a href="#showcase" className="transition-colors hover:text-slate-900">
              Showcase
            </a>
            <a href="#pricing" className="transition-colors hover:text-slate-900">
              Pricing
            </a>
            <a href="#faq" className="transition-colors hover:text-slate-900">
              FAQ
            </a>
            <button
              type="button"
              onClick={() => setLoomModalOpen(true)}
              className="font-medium text-[#102D69] transition-colors hover:underline"
            >
              Watch Walkthrough
            </button>
          </div>

          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Monarch Video</p>
        </div>
      </footer>

      {/* Founder Loom Walkthrough Modal */}
      {loomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div>
                <p className="font-display text-sm font-bold text-[#102D69]">
                  Monarch Video Studio — Product Walkthrough
                </p>
                <p className="text-[11px] text-slate-500">
                  B-Roll Montage Engine · Brand Doc Auto-Sync · In-App H.264 MP4 Rendering
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLoomModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Close walkthrough video"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-[#09142B]">
              <iframe
                src={LOOM_EMBED_URL}
                title="Monarch Video Studio Loom Walkthrough"
                frameBorder="0"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
