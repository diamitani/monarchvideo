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
} from 'lucide-react';
import { MonarchLogo } from './MonarchLogo';

const HERO_STUDIO_IMG = '/src/assets/images/monarch_hero_studio_1795058371767.jpg';
const SHOWCASE_LAUNCH_IMG = '/src/assets/images/monarch_showcase_launch_1795058373184.jpg';
const SHOWCASE_BRAND_IMG = '/src/assets/images/monarch_showcase_brandfilm_1795058372638.jpg';
const SHOWCASE_EXPLAINER_IMG = '/src/assets/images/monarch_showcase_explainer_1795058371907.jpg';

interface MarketingSiteProps {
  onStartCreating: (options?: { initialPrompt?: string; authMode?: 'signin' | 'signup' }) => void;
}

const SHOWCASE_ITEMS = [
  {
    id: 'launch',
    label: 'Product Launch',
    aspect: '16:9 · 24s · Launch Reel',
    image: SHOWCASE_LAUNCH_IMG,
    imageAlt: 'Matte royal blue and brushed brass cinema camera lens resting on dark slate',
    prompt:
      'Create a 24-second product launch video for our 50mm T1.5 brushed-brass cinema lens. Keep typography refined, pace cuts cleanly, and end with a Batch 01 reservation call to action.',
    scenes: [
      '00:00–00:06 · Opening product reveal with warm gold highlight',
      '00:06–00:12 · Clean light spec plate highlighting optical clarity',
      '00:12–00:18 · Crisp kinetic callouts synchronized to voiceover',
      '00:18–00:24 · Brand logo lockup & Batch 01 reservation CTA',
    ],
    editExample: 'Make scene 2 punchier, switch its background to royal blue, and slow the logo outro by 1.5s.',
  },
  {
    id: 'brandfilm',
    label: 'Brand Film',
    aspect: '4:3 · 30s · Editorial Story',
    image: SHOWCASE_BRAND_IMG,
    imageAlt: 'Sunlit European architectural design atelier with brass drafting tools and storyboard script',
    prompt:
      'Produce a 30-second architectural brand film for a Copenhagen industrial design studio. Pair calm daylight framing with understated narration and warm cello underscore.',
    scenes: [
      '00:00–00:08 · Calm daylight studio opening with subtle title rise',
      '00:08–00:16 · Founder vision headline paired with synced voiceover',
      '00:16–00:23 · Split-frame craft details with clean lower-third captions',
      '00:23–00:30 · Minimalist wordmark lockup in warm alabaster',
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
      'Build a 20-second explainer introducing our global treasury platform. Use crisp typography, clean motion graphics, and clear latency proof points.',
    scenes: [
      '00:00–00:05 · Clear problem hook on bright alabaster canvas',
      '00:05–00:11 · Structured workflow visual with studio voiceover',
      '00:11–00:16 · Tabular speed benchmark showcase',
      '00:16–00:20 · Deep royal blue closing card with live demo CTA',
    ],
    editExample: 'Change the motion style to Satin Gold Wipe and highlight the 420ms speed figure in gold.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How is Monarch different from one-shot AI video generators?',
    a: 'Most AI video tools hand you a flat clip that breaks the moment you ask for a tweak. Monarch turns your idea into an editable storyboard, timed script, voiceover, and scene-by-scene cut—so changing one headline, color, or beat updates only that scene while keeping the rest intact.',
  },
  {
    q: 'Do I get natural-sounding voiceovers and background music included?',
    a: 'Yes. Choose from multiple studio narrator voices and delivery tones, audition voices right in your workspace, and pair them with royalty-free background scores that automatically duck beneath your narration.',
  },
  {
    q: 'Can I upload my own brand logos, product photos, and colors?',
    a: 'Every account includes a Content & Files vault where you can upload logos, product imagery, and audio assets, set your exact brand palette, and attach them straight to any draft or published video.',
  },
  {
    q: 'What formats can I export and publish to?',
    a: 'Export playable .webm videos directly from your browser, download clean motion bundles for your team, and connect YouTube, Instagram Reels, TikTok, LinkedIn, or Google Drive from your Integrations hub.',
  },
];

export const MarketingSite: React.FC<MarketingSiteProps> = ({ onStartCreating }) => {
  const [heroPrompt, setHeroPrompt] = useState(
    'Create a 24-second 16:9 launch film for our fintech treasury platform in Royal Blue and Satin Gold—calm editorial pacing, warm studio narration, and crisp headlines.'
  );
  const [selectedShowcase, setSelectedShowcase] = useState(SHOWCASE_ITEMS[0].id);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number>(0);

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
                Brand Video Creation Studio
              </p>
              <h1
                className="mt-4 font-display font-bold tracking-tight text-[#0F172A] text-balance"
                style={{ fontSize: 'clamp(2.3rem, 4.1vw, 3.75rem)', lineHeight: 1.06 }}
              >
                Turn one sentence into a finished brand video.
              </h1>
              <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-slate-600">
                Describe what you want to launch, explain, or promote. Monarch drafts your
                storyboard, writes the script, records natural studio narration, and lets you
                refine any scene in plain English before exporting.
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
                    Storyboard · Studio Voiceover · Scene-by-Scene Editing
                  </span>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#102D69] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap shrink-0"
                  >
                    <span>Start Creating Free</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200/80 pt-5 text-xs text-slate-500">
              <span>16:9, 9:16 & 1:1 ready</span>
              <span aria-hidden="true">·</span>
              <span>Human-sounding narration included</span>
              <span aria-hidden="true">·</span>
              <span>Upload your logos & brand media</span>
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
                  <p className="text-xs font-medium text-[#D4AF37]">Live Studio Workspace</p>
                  <p className="mt-1 font-display text-lg font-semibold leading-snug">
                    Edit a headline, voice, or scene without re-rendering from scratch.
                  </p>
                </div>
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
          </motion.div>
        </div>
      </section>

      {/* 2. HOW IT WORKS — 3 Simple Creator Steps */}
      <section id="how-it-works" className="border-y border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#9A7B1C]">How It Works</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
              From rough idea to publish-ready video in three calm steps
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Review every stage before moving forward—so your brand voice, timing, and visuals
              match your exact expectations on the very first export.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="border-t border-slate-200 pt-6">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">01.</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Describe your goal & brand look
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Type your brief in plain English, pick your format (16:9 widescreen, 9:16 Reels, or
                1:1 square), apply your brand colors, and attach logos or product stills from your
                asset vault.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">02.</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Approve storyboard, script & voice
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Review each scene card, refine your timed narration, audition natural studio
                voices, and pair your cut with royalty-free background music that automatically
                balances beneath speech.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <p className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">03.</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Tweak any scene & publish
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Ask for changes like “make scene 2 punchier” or “slow the logo outro by 2 seconds.”
                Only the scene you mention updates—then export your video or publish straight from
                your dashboard.
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
                Precision scene editing—never start over
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Every headline, caption, color plate, and transition lives on a clean scene track.
                Swap a background, tighten your opening hook, or switch from widescreen to vertical
                in seconds while every other scene stays untouched.
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
                Your logos, photos & drafts in one vault
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Upload logos, product stills, and audio clips into Content & Files, organize drafts
                versus published releases, and sync your workspace across devices with your account.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#FAFBFD] p-6 lg:col-span-7">
              <SlidersHorizontal className="h-5 w-5 text-[#102D69]" />
              <h3 className="mt-4 font-display text-xl font-semibold text-slate-900">
                One dashboard from first draft to published channel
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Pick your motion choreography and visual grade, export playable video files in a
                single click, and connect YouTube, Instagram Reels, TikTok, LinkedIn, or Google
                Drive as your publishing workflow grows.
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
              Start free, scale when your team ships weekly
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
              <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Starter</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                  $0
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Monthly exports</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">10 videos / mo</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Studio voices</dt>
                  <dd className="font-medium text-slate-900">5 human-sounding voices</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Asset storage</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">1 GB brand vault</dd>
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
              <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Creator</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {billingCycle === 'monthly' ? '$39' : '$31'}
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Monthly exports</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">Unlimited HD exports</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Brand kits</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">10 custom brand kits</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Asset storage</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">25 GB cloud vault</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={() => onStartCreating({ authMode: 'signup' })}
              className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#102D69] text-xs font-semibold text-white transition-colors hover:bg-[#091A3E]"
            >
              Get Started
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-xs font-medium text-slate-500">For growing marketing teams</p>
              <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Studio</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {billingCycle === 'monthly' ? '$129' : '$99'}
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Team seats</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">Up to 10 collaborators</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Publishing connectors</dt>
                  <dd className="font-medium text-slate-900">YouTube · Reels · TikTok · Drive</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Export quality</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">4K · 60 fps + Code export</dd>
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
                Everything you need to go from a rough brief to a finished video your team can
                publish today.
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
          </div>

          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Monarch Video</p>
        </div>
      </footer>
    </div>
  );
};
