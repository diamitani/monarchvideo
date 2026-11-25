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
  Star,
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

interface VideoProgramTrack {
  id: string;
  category: 'launch' | 'brand' | 'saas' | 'vertical';
  categoryLabel: string;
  title: string;
  meta: string;
  narrator: string;
  image: string;
  description: string;
  curriculum: string[];
  prompt: string;
}

const LEXIO_PROGRAM_TRACKS: VideoProgramTrack[] = [
  {
    id: 'track-kinetic-launch',
    category: 'launch',
    categoryLabel: 'Product Launch',
    title: 'Kinetic Hardware & Flagship Launch',
    meta: '16:9 · 24s · 1.8s Cut Cadence',
    narrator: 'Fenrir Studio Voice',
    image: SHOWCASE_LAUNCH_IMG,
    description:
      'High-contrast product launch track combining macro optical B-roll sub-cuts, tabular engineering callouts, and an editorial reservation outro.',
    curriculum: [
      'Module 01 · Macro B-roll hook (1.8s rapid montage + gold light sweep)',
      'Module 02 · Precision engineering specs synchronized to studio voiceover',
      'Module 03 · Auto-synced brand logo lockup & reservation CTA plate',
    ],
    prompt:
      'Create a 24-second product launch video for our 50mm T1.5 brushed-brass cinema lens. Pair rapid 1.8s B-roll sub-cuts with kinetic specs and end with a Batch 01 reservation CTA.',
  },
  {
    id: 'track-editorial-atelier',
    category: 'brand',
    categoryLabel: 'Brand Film',
    title: 'Architectural & Founder Documentary',
    meta: '16:9 · 30s · 2.8s Cut Cadence',
    narrator: 'Kore Editorial Voice',
    image: SHOWCASE_BRAND_IMG,
    description:
      'Warm daylight documentary track designed for design studios, luxury hardware, and founder manifestos with subtle lower-third captions.',
    curriculum: [
      'Module 01 · Sunlit studio B-roll sequence with calm title elevation',
      'Module 02 · Founder philosophy paired with ducked cello underscore',
      'Module 03 · Split-frame craft montage and alabaster brand signature',
    ],
    prompt:
      'Produce a 30-second architectural brand film for a Copenhagen industrial design studio. Pair calm daylight B-roll footage with understated narration and warm cello underscore.',
  },
  {
    id: 'track-fintech-explainer',
    category: 'saas',
    categoryLabel: 'SaaS Explainer',
    title: 'Enterprise SaaS & Treasury Walkthrough',
    meta: '16:9 · 20s · 2.0s Cut Cadence',
    narrator: 'Charon Authority Voice',
    image: SHOWCASE_EXPLAINER_IMG,
    description:
      'Crisp software and infrastructure explainer blueprint featuring benchmark data callouts, multi-source tech B-roll, and clear conversion framing.',
    curriculum: [
      'Module 01 · Problem statement hook on high-contrast porcelain frame',
      'Module 02 · Architecture walkthrough with 420ms latency benchmark proof',
      'Module 03 · Deep obsidian closing card with interactive demo trigger',
    ],
    prompt:
      'Build a 20-second explainer introducing our global treasury platform. Use crisp typography, high-contrast B-roll montages, and clear latency proof points.',
  },
  {
    id: 'track-vertical-reel',
    category: 'vertical',
    categoryLabel: 'Vertical Reel',
    title: 'Social Growth Reel & Shorts Montage',
    meta: '9:16 · 15s · 1.5s Cut Cadence',
    narrator: 'Aoede Dynamic Voice',
    image: HERO_STUDIO_IMG,
    description:
      'Fast-paced 9:16 vertical montage built for Reels, Shorts, and TikTok with 1.5-second Pexels & Pixabay B-roll sub-cuts and bold kinetic captions.',
    curriculum: [
      'Module 01 · 1.5s pattern-interrupt visual hook with synced caption',
      'Module 02 · 3 rapid proof cuts sourced from open-media B-roll hub',
      'Module 03 · Full-bleed vertical CTA frame with auto-extracted brand hex',
    ],
    prompt:
      'Create a 15-second 9:16 vertical launch reel for our AI productivity workspace with 1.5s B-roll sub-cuts, energetic narration, and bold centered captions.',
  },
];

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
    editExample:
      'Make scene 2 cuts sharper at 1.5s, switch its plate to royal blue, and slow the logo outro by 1.5s.',
  },
  {
    id: 'brandfilm',
    label: 'Brand Film',
    aspect: '4:3 · 30s · Editorial Story',
    image: SHOWCASE_BRAND_IMG,
    imageAlt:
      'Sunlit European architectural design atelier with brass drafting tools and storyboard script',
    prompt:
      'Produce a 30-second architectural brand film for a Copenhagen industrial design studio. Pair calm daylight B-roll footage with understated narration and warm cello underscore.',
    scenes: [
      '00:00–00:08 · Sunlit architectural studio B-roll with subtle title rise',
      '00:08–00:16 · Founder vision headline paired with synced Kore voiceover',
      '00:16–00:23 · Split-frame craft details with clean lower-third captions',
      '00:23–00:30 · Auto-synced brand logo lockup in warm alabaster',
    ],
    editExample:
      'Keep scenes 1 and 4 untouched, tighten the narration in scene 2, and soften the transition.',
  },
  {
    id: 'explainer',
    label: 'Product Explainer',
    aspect: '16:9 · 20s · SaaS Walkthrough',
    image: SHOWCASE_EXPLAINER_IMG,
    imageAlt:
      'Sapphire optical glass prisms and slender brushed gold bars on crisp alabaster stone',
    prompt:
      'Build a 20-second explainer introducing our global treasury platform. Use crisp typography, high-contrast B-roll montages, and clear latency proof points.',
    scenes: [
      '00:00–00:05 · Clear problem hook on bright alabaster canvas',
      '00:05–00:11 · Structured workflow visual with studio voiceover',
      '00:11–00:16 · Tabular speed benchmark showcase with sharp cut-on-beat pacing',
      '00:16–00:20 · Deep royal blue closing card with live demo CTA',
    ],
    editExample:
      'Change the motion style to Satin Gold Wipe and highlight the 420ms speed figure in gold.',
  },
];

const CREATOR_REVIEWS = [
  {
    quote:
      'We replaced a three-week motion agency turnaround with Monarch. Dropping our brand PDF auto-configured our hex palette and logo watermark, and the 1.8s B-roll sub-cuts look like a senior editor cut them by hand.',
    author: 'Elena Rostova',
    role: 'VP of Brand Marketing',
    company: 'Kinetix Optics',
    metric: '14 launch films shipped in 30 days',
  },
  {
    quote:
      'The JSON Cinema Style Blueprints changed how our growth team works. When we click “Sharper cuts,” only the montage cadence tightens while our voiceover timing and brand typography stay locked.',
    author: 'Marcus Vance',
    role: 'Head of Product Storytelling',
    company: 'Aurelia Treasury',
    metric: '3.4x higher completion on product explainers',
  },
  {
    quote:
      'Having Pexels, Pixabay, Wikimedia Commons, and our own uploaded product shots unified inside one timeline—with direct H.264 MP4 rendering in the browser—saved our studio over 25 hours a week.',
    author: 'Soren Lindqvist',
    role: 'Creative Director',
    company: 'Nordic Atelier Studio',
    metric: '25+ editing hours saved weekly',
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
  const [programFilter, setProgramFilter] = useState<'all' | 'launch' | 'brand' | 'saas' | 'vertical'>('all');
  const [selectedShowcase, setSelectedShowcase] = useState(SHOWCASE_ITEMS[0].id);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [loomModalOpen, setLoomModalOpen] = useState(false);

  const activeShowcase =
    SHOWCASE_ITEMS.find((item) => item.id === selectedShowcase) || SHOWCASE_ITEMS[0];

  const filteredPrograms =
    programFilter === 'all'
      ? LEXIO_PROGRAM_TRACKS
      : LEXIO_PROGRAM_TRACKS.filter((item) => item.category === programFilter);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartCreating({ initialPrompt: heroPrompt.trim(), authMode: 'signup' });
  };

  return (
    <div className="bg-[#F8F9FC] text-[#0B0F19]">
      {/* 1. LEXIO FRAMER SPLIT-SCREEN HERO */}
      <section className="mx-auto max-w-[1240px] px-6 pt-12 pb-16 lg:pt-18 lg:pb-22">
        <div className="grid items-stretch gap-10 lg:grid-cols-12">
          {/* Left Narrative & Prompt Composer Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="flex flex-col justify-between lg:col-span-6"
          >
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#102D69] uppercase">
                Monarch Video Studio · 7-Agent Cinema Architecture
              </p>

              <h1
                className="mt-4 font-display font-bold tracking-tight text-[#0B0F19] text-balance"
                style={{ fontSize: 'clamp(2.4rem, 4.2vw, 3.85rem)', lineHeight: 1.05 }}
              >
                Master brand video creation from a single brief.
              </h1>

              <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-[#475569]">
                Drop your brief and brand guidelines. Monarch auto-extracts your hex palette and
                logo, choreographs 4-source B-roll montages, records studio voiceover, and renders
                universal H.264 MP4s.
              </p>

              {/* Lexio Framer Prompt Composer Card */}
              <form
                onSubmit={handleHeroSubmit}
                className="mt-8 rounded-[24px] border border-[#E6E8F0] bg-white p-4 shadow-xs transition-colors focus-within:border-[#0B0F19]"
              >
                <div className="flex items-center justify-between border-b border-[#F1F4F9] pb-2.5 text-xs">
                  <span className="font-semibold text-[#0B0F19]">Direct Your Video Track</span>
                  <span className="font-mono text-[11px] text-[#475569] tabular-nums">
                    16:9 · 9:16 · 1:1 · H.264 MP4
                  </span>
                </div>
                <label htmlFor="hero-video-prompt" className="sr-only">
                  Describe the video you want to create
                </label>
                <textarea
                  id="hero-video-prompt"
                  rows={3}
                  value={heroPrompt}
                  onChange={(e) => setHeroPrompt(e.target.value)}
                  className="mt-2.5 w-full resize-none bg-transparent px-1 py-1 text-sm leading-relaxed text-[#0B0F19] outline-none placeholder:text-slate-400"
                  placeholder="Describe your video concept, brand colors, length, and goal..."
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F4F9] pt-3">
                  <span className="text-xs text-[#475569]">
                    4-Source B-Roll · Brand Doc Auto-Sync · FFmpeg MP4
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLoomModalOpen(true)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#E6E8F0] bg-[#F8F9FC] px-3.5 text-xs font-semibold text-[#0B0F19] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                    >
                      <Video className="h-3.5 w-3.5 text-[#102D69]" />
                      <span>Watch Walkthrough</span>
                    </button>
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0B0F19] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#1E293B] whitespace-nowrap shrink-0"
                    >
                      <span>Start Creating Free</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Lexio Creator Proof & Rating Strip */}
            <div className="mt-8 grid grid-cols-3 gap-4 rounded-[20px] border border-[#E6E8F0] bg-white p-4">
              <div>
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-display text-sm font-bold text-[#0B0F19] tabular-nums">
                    4.9 / 5.0
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#475569]">1,400+ Brand Directors</p>
              </div>
              <div className="border-l border-[#E6E8F0] pl-4">
                <p className="font-display text-sm font-bold text-[#0B0F19] tabular-nums">
                  1.5s–2.5s
                </p>
                <p className="mt-0.5 text-[11px] text-[#475569]">B-Roll Montage Cadence</p>
              </div>
              <div className="border-l border-[#E6E8F0] pl-4">
                <p className="font-display text-sm font-bold text-[#0B0F19] tabular-nums">
                  100% MP4
                </p>
                <p className="mt-0.5 text-[11px] text-[#475569]">In-App H.264 & Remotion</p>
              </div>
            </div>
          </motion.div>

          {/* Right Lexio Layered Framer Visual Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.06 }}
            className="lg:col-span-6"
          >
            <div className="relative flex h-full min-h-[420px] flex-col justify-between overflow-hidden rounded-[28px] border border-[#E6E8F0] bg-[#0B0F19] p-6 text-white shadow-sm">
              <img
                src={HERO_STUDIO_IMG}
                alt="Monarch Video studio preview showing royal blue and gold composition"
                referrerPolicy="no-referrer"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/35 to-[#0B0F19]/30" />

              {/* Top Floating Studio Header */}
              <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/15 pb-4 text-xs">
                <span className="font-medium text-white">
                  Active Blueprint · Kinetic B-Roll Montage
                </span>
                <span className="font-mono text-[11px] text-[#D4AF37] tabular-nums">
                  4 Scenes · 24.0s · H.264 Ready
                </span>
              </div>

              {/* Bottom Floating Lexio Course/Track Preview Card */}
              <div className="relative z-10 space-y-4">
                <div className="rounded-2xl border border-white/15 bg-[#0B0F19]/85 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Scene 02 · Optical B-Roll Sub-Cuts (1.8s cadence)</span>
                    <span className="font-mono text-[#D4AF37] tabular-nums">00:06 – 00:12</span>
                  </div>
                  <p className="mt-1.5 font-display text-base font-semibold text-white">
                    Edit any single headline, B-roll clip, or voiceover without re-rendering from
                    scratch.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <span className="text-[11px] text-slate-300">
                      Sources: Curated HD · Uploads · Pexels · Pixabay · Veo 3.1
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLoomModalOpen(true)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/20 whitespace-nowrap shrink-0"
                      >
                        <Video className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Founder Loom</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartCreating({ authMode: 'signin' })}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-[#0B0F19] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Open Studio</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. LEXIO ECOSYSTEM & OPEN-MEDIA PARTNER BAR */}
      <section className="border-y border-[#E6E8F0] bg-white py-5">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 text-xs text-[#475569]">
          <span className="font-semibold text-[#0B0F19]">
            Integrated Open-Media & Render Engines
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-medium">
            <span>HyperFrames HTML5</span>
            <span aria-hidden="true">·</span>
            <span>Remotion React TSX</span>
            <span aria-hidden="true">·</span>
            <span>Google Veo 3.1 & Lyria 3</span>
            <span aria-hidden="true">·</span>
            <span>Pexels & Pixabay Composio Hub</span>
            <span aria-hidden="true">·</span>
            <span>Wikimedia CC0 & Openverse</span>
            <span aria-hidden="true">·</span>
            <span>FFmpeg H.264 MP4</span>
          </div>
        </div>
      </section>

      {/* 3. LEXIO SIGNATURE SECTION: FEATURED VIDEO TRACKS & BLUEPRINTS CATALOG (#programs) */}
      <section id="programs" className="mx-auto max-w-[1240px] px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#102D69] uppercase">
              Video Tracks & Cinema Blueprints
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B0F19] text-balance">
              Explore structured production tracks built for instant customization
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
              Inspired by Lexio’s modular program catalog—select any production track to load its
              scene curriculum, B-roll cut cadence, and narrator voice directly into Monarch Studio.
            </p>
          </div>

          {/* Interactive Category Switcher */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#E6E8F0] bg-white p-1">
            {[
              { id: 'all', label: 'All Tracks' },
              { id: 'launch', label: 'Product Launch' },
              { id: 'brand', label: 'Brand Film' },
              { id: 'saas', label: 'SaaS Explainer' },
              { id: 'vertical', label: '9:16 Vertical' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setProgramFilter(tab.id as 'all' | 'launch' | 'brand' | 'saas' | 'vertical')
                }
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  programFilter === tab.id
                    ? 'bg-[#0B0F19] text-white'
                    : 'text-[#475569] hover:text-[#0B0F19]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lexio Framer 2x2 Bento Program Cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {filteredPrograms.map((track) => (
            <div
              key={track.id}
              className="flex flex-col justify-between overflow-hidden rounded-[24px] border border-[#E6E8F0] bg-white transition-shadow hover:shadow-md"
            >
              <div>
                <div className="relative h-52 w-full overflow-hidden bg-[#0B0F19]">
                  <img
                    src={track.image}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover opacity-90"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19]/85 via-[#0B0F19]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
                    <div>
                      <p className="text-[11px] font-semibold text-[#D4AF37]">
                        {track.categoryLabel} · {track.narrator}
                      </p>
                      <h3 className="mt-0.5 font-display text-xl font-bold">{track.title}</h3>
                    </div>
                    <span className="font-mono text-xs text-slate-200 tabular-nums shrink-0">
                      {track.meta}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-sm leading-relaxed text-[#475569]">{track.description}</p>

                  <div className="mt-5 border-t border-[#F1F4F9] pt-4">
                    <p className="text-xs font-semibold text-[#0B0F19]">
                      Scene Sequence & B-Roll Curriculum
                    </p>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-[#475569]">
                      {track.curriculum.map((step) => (
                        <li key={step} className="font-mono text-[11.5px] tabular-nums">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#F1F4F9] bg-[#F8F9FC] px-6 py-4">
                <span className="text-xs font-medium text-[#475569]">
                  Includes Brand Auto-Sync & H.264 MP4
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onStartCreating({ initialPrompt: track.prompt, authMode: 'signup' })
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0B0F19] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1E293B] whitespace-nowrap shrink-0"
                >
                  <span>Load Track in Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LEXIO BENTO CAPABILITIES GRID (#features) */}
      <section id="features" className="border-y border-[#E6E8F0] bg-white py-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#102D69] uppercase">
              Why Teams Switch To Monarch
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B0F19] text-balance">
              A complete multi-agent film studio engineered for precision and speed
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-[24px] border border-[#E6E8F0] bg-[#F8F9FC] p-7 lg:col-span-7">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">
                    01 · B-ROLL MONTAGE ENGINE
                  </span>
                  <Clapperboard className="h-5 w-5 text-[#102D69]" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-[#0B0F19]">
                  4-Source B-Roll Montage & JSON Cinema Style Blueprints
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
                  Every scene slices into rapid 1.5s–3.5s B-roll sub-cuts sourced from curated HD
                  footage, your own uploads, Pexels/Pixabay/Wikimedia Commons via Composio, and
                  motion plates—governed by self-improving JSON Cinema Style Blueprints.
                </p>
              </div>
              <div className="mt-6 border-t border-[#E6E8F0] pt-4 text-xs font-medium text-[#0B0F19]">
                Curated HD Library · User Uploads · Pexels & Pixabay Live Search · Motion Plates
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[24px] border border-[#0B0F19] bg-[#0B0F19] p-7 text-white lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#D4AF37] tabular-nums">
                    02 · AUDIO & VOICE DIRECTOR
                  </span>
                  <Mic className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold">
                  Studio Narration & Auto-Ducked Scores
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                  Audition expressive studio narrator voices (Kore, Charon, Fenrir, Aoede, Puck),
                  dial in pacing, and pair your montage with original background music that
                  automatically ducks under speech.
                </p>
              </div>
              <div className="mt-6 border-t border-white/15 pt-4 text-xs text-[#D4AF37]">
                24kHz Studio Voiceover · Lyria 3 Instrumental Underscore
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[24px] border border-[#E6E8F0] bg-[#F8F9FC] p-7 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">
                    03 · BRAND DOC AUTO-SYNC
                  </span>
                  <FolderUp className="h-5 w-5 text-[#102D69]" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-[#0B0F19]">
                  Instant Brand Kit & Logo Extraction
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
                  Drop any brand guideline PDF, markdown doc, or logo image. Monarch extracts your
                  exact hex colors, typography, and watermark and syncs them across every scene.
                </p>
              </div>
              <div className="mt-6 border-t border-[#E6E8F0] pt-4 text-xs font-medium text-[#0B0F19]">
                Auto-Extracts Primary/Secondary/Accent Hex · Display Fonts · Logo Bug
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[24px] border border-[#E6E8F0] bg-[#F8F9FC] p-7 lg:col-span-7">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">
                    04 · IN-APP H.264 MP4 & COVENANT
                  </span>
                  <SlidersHorizontal className="h-5 w-5 text-[#102D69]" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-[#0B0F19]">
                  In-App FFmpeg H.264 MP4 Renderer & 7-Sub-Agent Architecture
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
                  Render universal H.264 .mp4 video files directly in the studio, export instant
                  .webm or Remotion React code, and inspect the complete Master Agent Soul,
                  Covenant, and 16-tool orchestration suite at any time.
                </p>
              </div>
              <div className="mt-6 border-t border-[#E6E8F0] pt-4 text-xs font-medium text-[#0B0F19]">
                Server FFmpeg H.264 MP4 · Browser WebM · HyperFrames HTML5 · Remotion React
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE SCENE REVISION SHOWCASE (#showcase) */}
      <section id="showcase" className="mx-auto max-w-[1240px] px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-wide text-[#102D69] uppercase">
              Interactive Scene Revision
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B0F19] text-balance">
              See how one prompt builds an editable multi-scene timeline
            </h2>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-[#E6E8F0] bg-white p-1">
            {SHOWCASE_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedShowcase(item.id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedShowcase === item.id
                    ? 'bg-[#0B0F19] text-white'
                    : 'text-[#475569] hover:text-[#0B0F19]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="relative h-full min-h-[340px] overflow-hidden rounded-[24px] border border-[#E6E8F0] bg-[#0B0F19]">
              <img
                src={activeShowcase.image}
                alt={activeShowcase.imageAlt}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19]/85 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="font-mono text-xs text-[#D4AF37] tabular-nums">
                  {activeShowcase.aspect}
                </p>
                <p className="mt-1 font-display text-xl font-bold">{activeShowcase.label}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[24px] border border-[#E6E8F0] bg-white p-7 lg:col-span-5">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-[#475569]">Director Brief</p>
                <p className="mt-2 text-sm leading-relaxed text-[#0B0F19]">
                  “{activeShowcase.prompt}”
                </p>
              </div>

              <div className="border-t border-[#F1F4F9] pt-5">
                <p className="text-xs font-semibold text-[#102D69]">Generated Scene Timeline</p>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#475569]">
                  {activeShowcase.scenes.map((scene) => (
                    <li key={scene} className="font-mono text-[11.5px] text-[#0B0F19] tabular-nums">
                      {scene}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[#F1F4F9] pt-5">
                <p className="text-xs font-semibold text-[#9A7B1C]">Surgical Natural-Language Edit</p>
                <p className="mt-1.5 text-xs italic leading-relaxed text-[#475569]">
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
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1E293B] whitespace-nowrap"
              >
                <span>Open This Timeline in Studio</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LEXIO CREATOR SUCCESS STORIES (#reviews) */}
      <section id="reviews" className="border-y border-[#E6E8F0] bg-white py-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#102D69] uppercase">
              Creator & Brand Outcomes
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B0F19] text-balance">
              Trusted by product marketers, creative directors, and founders
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {CREATOR_REVIEWS.map((item) => (
              <div
                key={item.author}
                className="flex flex-col justify-between rounded-[24px] border border-[#E6E8F0] bg-[#F8F9FC] p-7"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#E6E8F0] pb-3.5">
                    <div className="flex items-center gap-1 text-[#D4AF37]">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-[#102D69] tabular-nums">
                      {item.metric}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[#0B0F19]">“{item.quote}”</p>
                </div>

                <div className="mt-6 border-t border-[#E6E8F0] pt-4">
                  <p className="font-display text-sm font-bold text-[#0B0F19]">{item.author}</p>
                  <p className="text-xs text-[#475569]">
                    {item.role} · {item.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRICING + FAQ (#pricing) */}
      <section id="pricing" className="mx-auto max-w-[1240px] px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-wide text-[#102D69] uppercase">
              Transparent Studio Plans
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B0F19] text-balance">
              Start free today, upgrade via Stripe as your production scales
            </h2>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-[#E6E8F0] bg-white p-1">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                billingCycle === 'monthly'
                  ? 'bg-[#0B0F19] text-white'
                  : 'text-[#475569] hover:text-[#0B0F19]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                billingCycle === 'annual'
                  ? 'bg-[#0B0F19] text-white'
                  : 'text-[#475569] hover:text-[#0B0F19]'
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-[24px] border border-[#E6E8F0] bg-white p-7">
            <div>
              <p className="text-xs font-semibold text-[#475569]">For exploring Monarch Studio</p>
              <h3 className="mt-1 font-display text-xl font-bold text-[#0B0F19]">Starter Free</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-[#0B0F19] tabular-nums">
                  $0
                </span>
                <span className="text-xs text-[#475569]">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-[#F1F4F9] pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Monthly exports</dt>
                  <dd className="font-semibold text-[#0B0F19] tabular-nums">3 MP4 / WebM exports</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Studio voices</dt>
                  <dd className="font-semibold text-[#0B0F19]">5 studio narrator voices</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">B-roll sources</dt>
                  <dd className="font-semibold text-[#0B0F19]">Curated + Open Media Hub</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={() => onStartCreating({ authMode: 'signup' })}
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#E6E8F0] bg-[#F8F9FC] text-xs font-semibold text-[#0B0F19] transition-colors hover:bg-slate-100"
            >
              Start Free
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-[24px] border-2 border-[#0B0F19] bg-white p-7 shadow-sm">
            <div>
              <p className="text-xs font-semibold text-[#102D69]">Most Popular · Creators & Founders</p>
              <h3 className="mt-1 font-display text-xl font-bold text-[#0B0F19]">Creator Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-[#0B0F19] tabular-nums">
                  {billingCycle === 'monthly' ? '$29' : '$23'}
                </span>
                <span className="text-xs text-[#475569]">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-[#F1F4F9] pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Monthly exports</dt>
                  <dd className="font-semibold text-[#0B0F19] tabular-nums">Unlimited H.264 MP4</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Brand doc auto-sync</dt>
                  <dd className="font-semibold text-[#0B0F19] tabular-nums">10 custom brand kits</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Style blueprints</dt>
                  <dd className="font-semibold text-[#0B0F19]">Self-improving JSON styles</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={() => onStartCreating({ authMode: 'signup' })}
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0B0F19] text-xs font-semibold text-white transition-colors hover:bg-[#1E293B]"
            >
              Start Creator Pro
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-[24px] border border-[#E6E8F0] bg-white p-7">
            <div>
              <p className="text-xs font-semibold text-[#475569]">For high-velocity brand teams</p>
              <h3 className="mt-1 font-display text-xl font-bold text-[#0B0F19]">
                Studio Unlimited
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-[#0B0F19] tabular-nums">
                  {billingCycle === 'monthly' ? '$99' : '$79'}
                </span>
                <span className="text-xs text-[#475569]">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-[#F1F4F9] pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Team seats</dt>
                  <dd className="font-semibold text-[#0B0F19] tabular-nums">Up to 10 collaborators</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Composio & social</dt>
                  <dd className="font-semibold text-[#0B0F19]">Pexels · YouTube · Reels · Drive</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Export bundles</dt>
                  <dd className="font-semibold text-[#0B0F19]">H.264 MP4 + Remotion TSX</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={() => onStartCreating({ authMode: 'signup' })}
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#E6E8F0] bg-[#F8F9FC] text-xs font-semibold text-[#0B0F19] transition-colors hover:bg-slate-100"
            >
              Launch Studio Plan
            </button>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div id="faq" className="mt-20 border-t border-[#E6E8F0] pt-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold tracking-wide text-[#102D69] uppercase">
                Frequently Asked Questions
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0B0F19]">
                Everything you need to know about Monarch Studio
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                Go from a single sentence or brand document to a finished H.264 MP4 video your team
                can ship today.
              </p>
            </div>

            <div className="divide-y divide-[#E6E8F0] rounded-[24px] border border-[#E6E8F0] bg-white px-6 lg:col-span-8">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q} className="py-5">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="flex w-full items-center justify-between gap-4 text-left"
                    >
                      <span className="font-display text-sm font-bold text-[#0B0F19]">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#475569] transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#0B0F19]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 pr-8 text-sm leading-relaxed text-[#475569]">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 8. LEXIO HIGH-CONTRAST BOTTOM CONVERSION BANNER */}
      <section className="mx-auto max-w-[1240px] px-6 pb-16">
        <div className="flex flex-col items-start justify-between gap-8 rounded-[28px] bg-[#0B0F19] p-10 text-white md:flex-row md:items-center lg:p-12">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-wide text-[#D4AF37] uppercase">
              Ready To Direct Your First Cut?
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance">
              Turn your next product launch or brand brief into an H.264 MP4 in minutes.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setLoomModalOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-xs font-semibold text-white transition-colors hover:bg-white/20 whitespace-nowrap"
            >
              <Video className="h-4 w-4 text-[#D4AF37]" />
              <span>Watch Walkthrough</span>
            </button>
            <button
              type="button"
              onClick={() => onStartCreating({ authMode: 'signup' })}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-xs font-semibold text-[#0B0F19] transition-colors hover:bg-slate-100 whitespace-nowrap"
            >
              <span>Start Free Studio Trial</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-[#E6E8F0] bg-white py-12">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-8 px-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <MonarchLogo size={26} />
            <span className="font-display text-base font-bold tracking-tight text-[#0B0F19]">
              Monarch
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-[#475569]">AI Brand Video & B-Roll Studio</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#475569]">
            <a href="#programs" className="transition-colors hover:text-[#0B0F19]">
              Programs
            </a>
            <a href="#features" className="transition-colors hover:text-[#0B0F19]">
              Capabilities
            </a>
            <a href="#showcase" className="transition-colors hover:text-[#0B0F19]">
              Showcase
            </a>
            <a href="#reviews" className="transition-colors hover:text-[#0B0F19]">
              Reviews
            </a>
            <a href="#pricing" className="transition-colors hover:text-[#0B0F19]">
              Pricing
            </a>
            <button
              type="button"
              onClick={() => setLoomModalOpen(true)}
              className="font-semibold text-[#102D69] transition-colors hover:underline"
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
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[24px] border border-[#E6E8F0] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6E8F0] px-6 py-4">
              <div>
                <p className="font-display text-sm font-bold text-[#0B0F19]">
                  Monarch Video Studio — Product Walkthrough
                </p>
                <p className="text-[11px] text-[#475569]">
                  B-Roll Montage Engine · Brand Doc Auto-Sync · In-App H.264 MP4 Rendering
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLoomModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#E6E8F0] text-[#475569] hover:bg-[#F8F9FC]"
                aria-label="Close walkthrough video"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-[#0B0F19]">
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
