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

interface StoryFormat {
  id: string;
  category: 'launch' | 'brand' | 'explainer' | 'social';
  categoryLabel: string;
  title: string;
  meta: string;
  narrator: string;
  image: string;
  description: string;
  storyBeats: string[];
  prompt: string;
}

const STORY_FORMATS: StoryFormat[] = [
  {
    id: 'format-product-launch',
    category: 'launch',
    categoryLabel: 'Product Launch',
    title: 'Flagship Product Launch Film',
    meta: '16:9 · 24 sec · Fast-paced cuts',
    narrator: 'Confident Executive Voice',
    image: SHOWCASE_LAUNCH_IMG,
    description:
      'Built for launch days and hero landing pages. Opens with an eye-catching close-up hook, moves into crisp benefit highlights, and closes with a strong call to action.',
    storyBeats: [
      '01. Opening Hook · Dramatic close-up B-roll cuts that stop the scroll',
      '02. Product Proof · Bold on-screen callouts timed to studio narration',
      '03. Brand Finale · Your logo lockup and early-access call to action',
    ],
    prompt:
      'Create a 24-second product launch video for our 50mm T1.5 brushed-brass cinema lens. Pair fast-paced B-roll cuts with bold product highlights and end with a Batch 01 reservation call to action.',
  },
  {
    id: 'format-brand-story',
    category: 'brand',
    categoryLabel: 'Brand Story',
    title: 'Founder Manifesto & Brand Film',
    meta: '16:9 · 30 sec · Warm editorial pace',
    narrator: 'Warm Documentary Voice',
    image: SHOWCASE_BRAND_IMG,
    description:
      'Crafted for storytellers, design studios, and founders who want audiences to feel the craft behind their brand—without sounding like a generic ad.',
    storyBeats: [
      '01. World Building · Sunlit daylight footage paired with an unhurried opening line',
      '02. Founder Perspective · Heartfelt narration layered over subtle cello music',
      '03. Signature Ending · Clean brand sign-off tailored to your colors and font',
    ],
    prompt:
      'Produce a 30-second brand story film for a Copenhagen industrial design studio. Pair calm daylight B-roll footage with warm narration and an understated cello score.',
  },
  {
    id: 'format-product-explainer',
    category: 'explainer',
    categoryLabel: 'Product Explainer',
    title: 'Clear Product Walkthrough & Demo',
    meta: '16:9 · 20 sec · Crisp rhythm',
    narrator: 'Clear & Friendly Guide',
    image: SHOWCASE_EXPLAINER_IMG,
    description:
      'Turn a complex product or service into a 20-second story any buyer immediately understands. Ideal for homepages, LinkedIn posts, and sales decks.',
    storyBeats: [
      '01. The Friction · Name the exact headache your customer feels today',
      '02. The Shift · Walk through your solution with clean stats and visual proof',
      '03. Next Step · High-contrast closing frame inviting viewers to book a demo',
    ],
    prompt:
      'Build a 20-second explainer introducing our global treasury platform. Use crisp headlines, engaging B-roll footage, and clear customer speed results.',
  },
  {
    id: 'format-social-reel',
    category: 'social',
    categoryLabel: 'Social Reel',
    title: 'Vertical Reels, TikTok & Shorts Cut',
    meta: '9:16 · 15 sec · High-energy cuts',
    narrator: 'Bright & Energetic Host',
    image: HERO_STUDIO_IMG,
    description:
      'Designed to hold attention on mobile feeds. Snappy visual changes every second and a half, readable center-safe captions, and an immediate hook.',
    storyBeats: [
      '01. Pattern Interrupt · Instant visual hook with bold mobile-safe captions',
      '02. Rapid Highlights · Three punchy proof clips pulled from stock or your camera roll',
      '03. Swipe & Save · Branded vertical closer built to drive clicks and shares',
    ],
    prompt:
      'Create a 15-second 9:16 vertical launch reel for our productivity workspace with snappy B-roll cuts, energetic narration, and bold centered captions.',
  },
];

const SHOWCASE_ITEMS = [
  {
    id: 'launch',
    label: 'Product Launch',
    aspect: '16:9 · 24s · Campaign Film',
    image: SHOWCASE_LAUNCH_IMG,
    imageAlt: 'Brushed brass cinema lens photographed for a product launch film',
    prompt:
      'Create a 24-second product launch video for our 50mm T1.5 brushed-brass cinema lens. Pair rapid B-roll cuts with bold feature callouts and end with a Batch 01 reservation invite.',
    scenes: [
      '00:00–00:06 · Close-up B-roll montage with warm gold reveal',
      '00:06–00:12 · Precision workshop footage paired with key optical specs',
      '00:12–00:18 · Crisp headlines timed naturally to studio narration',
      '00:18–00:24 · Your logo lockup & Batch 01 reservation call to action',
    ],
    editExample:
      'Make scene 2 feel punchier, switch the background to deep navy, and hold our logo on screen a second longer.',
  },
  {
    id: 'brandfilm',
    label: 'Brand Story',
    aspect: '4:3 · 30s · Editorial Story',
    image: SHOWCASE_BRAND_IMG,
    imageAlt: 'Sunlit design studio table with warm brass tools and creative storyboard',
    prompt:
      'Produce a 30-second brand film for a Copenhagen industrial design studio. Pair calm daylight footage with warm narration and an understated cello score.',
    scenes: [
      '00:00–00:08 · Sunlit studio B-roll with gentle opening title',
      '00:08–00:16 · Founder vision statement with warm human narration',
      '00:16–00:23 · Split-frame craft details and clean lower-third captions',
      '00:23–00:30 · Brand logo sign-off on warm alabaster',
    ],
    editExample:
      'Keep scenes 1 and 4 exactly as they are, tighten the voiceover in scene 2, and soften the transition.',
  },
  {
    id: 'explainer',
    label: 'Product Explainer',
    aspect: '16:9 · 20s · Homepage Video',
    image: SHOWCASE_EXPLAINER_IMG,
    imageAlt: 'Optical glass prisms and warm gold bars representing clarity and speed',
    prompt:
      'Build a 20-second explainer introducing our global treasury platform. Use crisp headlines, engaging B-roll, and clear customer speed results.',
    scenes: [
      '00:00–00:05 · Relatable problem hook on a bright clean frame',
      '00:05–00:11 · Simple three-step walkthrough with studio voiceover',
      '00:11–00:16 · Clear speed benchmark proof with upbeat pacing',
      '00:16–00:20 · Deep navy closing card inviting viewers to try it free',
    ],
    editExample:
      'Use a smoother gold transition into scene 3 and highlight the speed result in warm gold.',
  },
];

const CREATOR_STORIES = [
  {
    quote:
      'We used to wait three weeks and spend thousands with a motion agency for every launch video. With Monarch, I dropped in our brand guide PDF, picked our voice, and shipped a launch film before lunch.',
    author: 'Elena Rostova',
    role: 'VP of Brand Marketing',
    company: 'Kinetix Optics',
    metric: '14 campaign videos shipped in 30 days',
  },
  {
    quote:
      'Most AI video tools force you to start over when one word is off. Here I can ask to tighten scene two or swap a single clip while keeping our narrator timing and brand look completely locked.',
    author: 'Marcus Vance',
    role: 'Head of Product Storytelling',
    company: 'Aurelia Treasury',
    metric: '3.4x higher viewer completion rate',
  },
  {
    quote:
      'Having stock clips from Pexels and Pixabay right beside our own camera-roll product shots—plus instant MP4 downloads for Reels and YouTube—gave our small creative team 25 hours back every week.',
    author: 'Soren Lindqvist',
    role: 'Creative Director',
    company: 'Nordic Atelier Studio',
    metric: '25+ creative hours saved weekly',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How is Monarch different from typical one-shot AI video generators?',
    a: 'Most AI tools give you a single locked clip that falls apart the second you need a change. Monarch builds a real multi-scene storyboard with timed narration, captions, and B-roll—so changing a headline, swapping a clip, or adjusting the pace only updates that scene.',
  },
  {
    q: 'Can I use my own brand colors, logo, and product footage?',
    a: 'Yes. Drop in your brand guideline PDF, logo image, or your own product video clips. Monarch automatically matches your brand colors, fonts, and logo across every scene, and lets you blend your footage with royalty-free B-roll from Pexels, Pixabay, and our curated studio library.',
  },
  {
    q: 'Does Monarch learn the pacing and visual style my audience responds to?',
    a: 'Yes. With one click—like “Sharper cuts” or “More cinematic”—Monarch refines your cut rhythm and saves your preferred visual style so every future campaign feels unmistakably yours.',
  },
  {
    q: 'Where can I publish the videos I create?',
    a: 'Download a ready-to-share MP4 straight from the studio in widescreen (16:9) for YouTube and websites, vertical (9:16) for Reels, TikTok, and Shorts, or square (1:1) for LinkedIn and social feeds.',
  },
];

export const MarketingSite: React.FC<MarketingSiteProps> = ({ onStartCreating }) => {
  const [heroPrompt, setHeroPrompt] = useState(
    'Create a 24-second launch film for our new treasury platform in royal navy and warm gold—fast B-roll cuts, natural studio narration, and crisp headlines.'
  );
  const [formatFilter, setFormatFilter] = useState<'all' | 'launch' | 'brand' | 'explainer' | 'social'>('all');
  const [selectedShowcase, setSelectedShowcase] = useState(SHOWCASE_ITEMS[0].id);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [loomModalOpen, setLoomModalOpen] = useState(false);

  const activeShowcase =
    SHOWCASE_ITEMS.find((item) => item.id === selectedShowcase) || SHOWCASE_ITEMS[0];

  const filteredFormats =
    formatFilter === 'all'
      ? STORY_FORMATS
      : STORY_FORMATS.filter((item) => item.category === formatFilter);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartCreating({ initialPrompt: heroPrompt.trim(), authMode: 'signup' });
  };

  return (
    <div className="bg-[#F8F9FC] text-[#0B0F19]">
      {/* 1. SPLIT-SCREEN HERO */}
      <section className="mx-auto max-w-[1240px] px-6 pt-12 pb-16 lg:pt-18 lg:pb-22">
        <div className="grid items-stretch gap-10 lg:grid-cols-12">
          {/* Left Narrative & Interactive Story Brief */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="flex flex-col justify-between lg:col-span-6"
          >
            <div>
              <p className="text-xs font-semibold text-[#102D69]">
                For Marketers, Creators & Storytellers
              </p>

              <h1
                className="mt-4 font-display font-bold tracking-tight text-[#0B0F19] text-balance"
                style={{ fontSize: 'clamp(2.4rem, 4.2vw, 3.85rem)', lineHeight: 1.05 }}
              >
                Turn one idea into a story your audience watches to the end.
              </h1>

              <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-[#475569]">
                Write a short brief or drop in your brand guide. Monarch matches your colors and
                logo, cuts engaging B-roll with studio voiceover, and exports a crisp MP4 ready to
                publish.
              </p>

              {/* Story Brief Composer Card */}
              <form
                onSubmit={handleHeroSubmit}
                className="mt-8 rounded-[24px] border border-[#E6E8F0] bg-white p-4 transition-colors focus-within:border-[#0B0F19]"
              >
                <div className="flex items-center justify-between border-b border-[#F1F4F9] pb-2.5 text-xs">
                  <span className="font-semibold text-[#0B0F19]">Describe your video idea</span>
                  <span className="font-mono text-[11px] text-[#475569] tabular-nums">
                    YouTube · Reels · TikTok · Ads
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
                  placeholder="Tell us what you're launching, explaining, or sharing—and the mood you want..."
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F4F9] pt-3">
                  <span className="text-xs text-[#475569]">
                    Matched to your brand · Editable scene by scene · Instant MP4
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
                      <span>Create My Video</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Creator Proof & Outcome Strip */}
            <div className="mt-8 grid grid-cols-3 gap-4 rounded-[20px] border border-[#E6E8F0] bg-white p-4">
              <div>
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-display text-sm font-bold text-[#0B0F19] tabular-nums">
                    4.9 / 5.0
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#475569]">1,400+ Marketers & Creators</p>
              </div>
              <div className="border-l border-[#E6E8F0] pl-4">
                <p className="font-display text-sm font-bold text-[#0B0F19] tabular-nums">
                  Under 3 min
                </p>
                <p className="mt-0.5 text-[11px] text-[#475569]">From brief to first cut</p>
              </div>
              <div className="border-l border-[#E6E8F0] pl-4">
                <p className="font-display text-sm font-bold text-[#0B0F19]">Ready to post</p>
                <p className="mt-0.5 text-[11px] text-[#475569]">MP4 for every channel</p>
              </div>
            </div>
          </motion.div>

          {/* Right Layered Studio Preview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.06 }}
            className="lg:col-span-6"
          >
            <div className="relative flex h-full min-h-[420px] flex-col justify-between overflow-hidden rounded-[28px] border border-[#E6E8F0] bg-[#0B0F19] p-6 text-white">
              <img
                src={HERO_STUDIO_IMG}
                alt="Monarch Video editing suite preview with warm brass and navy palette"
                referrerPolicy="no-referrer"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/35 to-[#0B0F19]/30" />

              {/* Top Floating Story Header */}
              <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/15 pb-4 text-xs">
                <span className="font-medium text-white">Campaign Film · Brand Launch</span>
                <span className="font-mono text-[11px] text-[#D4AF37] tabular-nums">
                  4 Scenes · 0:24 · Studio Voiceover
                </span>
              </div>

              {/* Bottom Floating Scene Control Card */}
              <div className="relative z-10 space-y-4">
                <div className="rounded-2xl border border-white/15 bg-[#0B0F19]/85 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Scene 02 · Product Reveal & B-Roll Cuts</span>
                    <span className="font-mono text-[#D4AF37] tabular-nums">00:06 – 00:12</span>
                  </div>
                  <p className="mt-1.5 font-display text-base font-semibold text-white">
                    Tweak a headline, swap a clip, or change the narrator voice—without starting
                    from scratch.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <span className="text-[11px] text-slate-300">
                      Your clips · Pexels & Pixabay B-Roll · Studio Voices
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLoomModalOpen(true)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/20 whitespace-nowrap shrink-0"
                      >
                        <Video className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Watch Demo</span>
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

      {/* 2. CHANNEL & MEDIA ECOSYSTEM STRIP */}
      <section className="border-y border-[#E6E8F0] bg-white py-5">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 text-xs text-[#475569]">
          <span className="font-semibold text-[#0B0F19]">
            Made for every channel your audience watches
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-medium">
            <span>YouTube & Widescreen</span>
            <span aria-hidden="true">·</span>
            <span>Instagram Reels</span>
            <span aria-hidden="true">·</span>
            <span>TikTok & Shorts</span>
            <span aria-hidden="true">·</span>
            <span>LinkedIn Campaigns</span>
            <span aria-hidden="true">·</span>
            <span>Website Heroes</span>
            <span aria-hidden="true">·</span>
            <span>Pexels & Pixabay Stock</span>
          </div>
        </div>
      </section>

      {/* 3. STORY FORMATS CATALOG (#formats) */}
      <section id="formats" className="mx-auto max-w-[1240px] px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#102D69]">Story Formats & Templates</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B0F19] text-balance">
              Start with a proven format built for launches, brand stories, and social feeds
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
              Pick the story structure that fits your goal. Monarch sets the pacing, voice tone,
              and visual flow—then adapts every scene to your message and brand identity.
            </p>
          </div>

          {/* Interactive Format Filter */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#E6E8F0] bg-white p-1">
            {[
              { id: 'all', label: 'All Formats' },
              { id: 'launch', label: 'Product Launch' },
              { id: 'brand', label: 'Brand Story' },
              { id: 'explainer', label: 'Explainer' },
              { id: 'social', label: 'Social Reels' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setFormatFilter(tab.id as 'all' | 'launch' | 'brand' | 'explainer' | 'social')
                }
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  formatFilter === tab.id
                    ? 'bg-[#0B0F19] text-white'
                    : 'text-[#475569] hover:text-[#0B0F19]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2x2 Story Format Cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {filteredFormats.map((format) => (
            <div
              key={format.id}
              className="flex flex-col justify-between overflow-hidden rounded-[24px] border border-[#E6E8F0] bg-white transition-shadow hover:shadow-md"
            >
              <div>
                <div className="relative h-52 w-full overflow-hidden bg-[#0B0F19]">
                  <img
                    src={format.image}
                    alt={format.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover opacity-90"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19]/85 via-[#0B0F19]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
                    <div>
                      <p className="text-[11px] font-semibold text-[#D4AF37]">
                        {format.categoryLabel} · {format.narrator}
                      </p>
                      <h3 className="mt-0.5 font-display text-xl font-bold">{format.title}</h3>
                    </div>
                    <span className="font-mono text-xs text-slate-200 tabular-nums shrink-0">
                      {format.meta}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-sm leading-relaxed text-[#475569]">{format.description}</p>

                  <div className="mt-5 border-t border-[#F1F4F9] pt-4">
                    <p className="text-xs font-semibold text-[#0B0F19]">What’s inside this cut</p>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-[#475569]">
                      {format.storyBeats.map((beat) => (
                        <li key={beat} className="leading-relaxed">
                          {beat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#F1F4F9] bg-[#F8F9FC] px-6 py-4">
                <span className="text-xs font-medium text-[#475569]">
                  Includes Brand Match & MP4 Download
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onStartCreating({ initialPrompt: format.prompt, authMode: 'signup' })
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0B0F19] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1E293B] whitespace-nowrap shrink-0"
                >
                  <span>Use This Format</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. BENTO CAPABILITIES GRID (#why-monarch) */}
      <section id="why-monarch" className="border-y border-[#E6E8F0] bg-white py-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#102D69]">Why Storytellers Choose Monarch</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B0F19] text-balance">
              Everything your team needs to publish studio-grade video every week
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-[24px] border border-[#E6E8F0] bg-[#F8F9FC] p-7 lg:col-span-7">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">
                    01. Rhythmic B-Roll Editing
                  </span>
                  <Clapperboard className="h-5 w-5 text-[#102D69]" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-[#0B0F19]">
                  Dynamic B-roll montages that keep viewers watching
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
                  No more static slides or awkward AI warps. Monarch cuts every scene with crisp
                  visual movement—blending your own product shots with royalty-free footage from
                  Pexels, Pixabay, and our curated studio vault.
                </p>
              </div>
              <div className="mt-6 border-t border-[#E6E8F0] pt-4 text-xs font-medium text-[#0B0F19]">
                Your Uploads · Curated Studio Clips · Pexels & Pixabay Stock · Clean Motion Titles
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[24px] border border-[#0B0F19] bg-[#0B0F19] p-7 text-white lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#D4AF37] tabular-nums">
                    02. Voice & Soundtrack
                  </span>
                  <Mic className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold">
                  Natural studio narration & balanced music
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                  Audition expressive human-sounding narrators—from warm documentary tones to
                  energetic launch hosts—paired with original background music that automatically
                  softens whenever your narrator speaks.
                </p>
              </div>
              <div className="mt-6 border-t border-white/15 pt-4 text-xs text-[#D4AF37]">
                5 Expressive Studio Voices · Auto-Ducked Background Scores
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[24px] border border-[#E6E8F0] bg-[#F8F9FC] p-7 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">
                    03. Effortless Brand Match
                  </span>
                  <FolderUp className="h-5 w-5 text-[#102D69]" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-[#0B0F19]">
                  Drop your brand guide once, stay on-brand forever
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
                  Upload your brand PDF, style sheet, or logo. Monarch automatically pulls in your
                  brand colors, typography, and logo mark so every headline and end-card looks like
                  your in-house design team made it.
                </p>
              </div>
              <div className="mt-6 border-t border-[#E6E8F0] pt-4 text-xs font-medium text-[#0B0F19]">
                Auto-Extracted Brand Colors · Typography Pairing · Logo End-Cards
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[24px] border border-[#E6E8F0] bg-[#F8F9FC] p-7 lg:col-span-7">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#102D69] tabular-nums">
                    04. Direct Like a Conversation
                  </span>
                  <SlidersHorizontal className="h-5 w-5 text-[#102D69]" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-[#0B0F19]">
                  Edit any scene in plain English & download an MP4
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
                  Click “Sharper cuts” or type a quick note like “make scene two warmer and slow the
                  ending.” Monarch updates only the scene you mentioned—then renders a universal
                  MP4 ready to post anywhere.
                </p>
              </div>
              <div className="mt-6 border-t border-[#E6E8F0] pt-4 text-xs font-medium text-[#0B0F19]">
                Single-Scene Edits · Saved Brand Pacing · 1-Click MP4 Downloads
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE SCENE REVISION SHOWCASE (#showcase) */}
      <section id="showcase" className="mx-auto max-w-[1240px] px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold text-[#102D69]">Made With Monarch</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B0F19] text-balance">
              See how one brief turns into a scene-by-scene story
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
                <p className="text-xs font-semibold text-[#475569]">The brief</p>
                <p className="mt-2 text-sm leading-relaxed text-[#0B0F19]">
                  “{activeShowcase.prompt}”
                </p>
              </div>

              <div className="border-t border-[#F1F4F9] pt-5">
                <p className="text-xs font-semibold text-[#102D69]">Your editable story beats</p>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#475569]">
                  {activeShowcase.scenes.map((scene) => (
                    <li key={scene} className="font-mono text-[11.5px] text-[#0B0F19] tabular-nums">
                      {scene}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[#F1F4F9] pt-5">
                <p className="text-xs font-semibold text-[#9A7B1C]">Instant plain-English tweak</p>
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
                <span>Create a Video Like This</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CREATOR & MARKETER STORIES (#stories) */}
      <section id="stories" className="border-y border-[#E6E8F0] bg-white py-20">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#102D69]">Customer Stories</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B0F19] text-balance">
              Loved by marketing leaders, solo creators, and brand storytellers
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {CREATOR_STORIES.map((item) => (
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
            <p className="text-xs font-semibold text-[#102D69]">Simple Plans</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0B0F19] text-balance">
              Start free today, upgrade whenever your storytelling scales
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
              Monthly
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
              <p className="text-xs font-semibold text-[#475569]">For trying your first videos</p>
              <h3 className="mt-1 font-display text-xl font-bold text-[#0B0F19]">Starter Free</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-[#0B0F19] tabular-nums">
                  $0
                </span>
                <span className="text-xs text-[#475569]">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-[#F1F4F9] pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Monthly downloads</dt>
                  <dd className="font-semibold text-[#0B0F19] tabular-nums">3 MP4 videos</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Studio voices</dt>
                  <dd className="font-semibold text-[#0B0F19]">5 natural voices</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Stock footage</dt>
                  <dd className="font-semibold text-[#0B0F19]">Curated + Pexels & Pixabay</dd>
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

          <div className="flex flex-col justify-between rounded-[24px] border-2 border-[#0B0F19] bg-white p-7">
            <div>
              <p className="text-xs font-semibold text-[#102D69]">Most Popular · Creators & Marketers</p>
              <h3 className="mt-1 font-display text-xl font-bold text-[#0B0F19]">Creator Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-[#0B0F19] tabular-nums">
                  {billingCycle === 'monthly' ? '$29' : '$23'}
                </span>
                <span className="text-xs text-[#475569]">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-[#F1F4F9] pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Monthly downloads</dt>
                  <dd className="font-semibold text-[#0B0F19]">Unlimited MP4 videos</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Brand kits</dt>
                  <dd className="font-semibold text-[#0B0F19] tabular-nums">10 saved brand kits</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Custom video styles</dt>
                  <dd className="font-semibold text-[#0B0F19]">Saved pacing & visual looks</dd>
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
              <p className="text-xs font-semibold text-[#475569]">For brand & marketing teams</p>
              <h3 className="mt-1 font-display text-xl font-bold text-[#0B0F19]">
                Studio Team
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight text-[#0B0F19] tabular-nums">
                  {billingCycle === 'monthly' ? '$99' : '$79'}
                </span>
                <span className="text-xs text-[#475569]">/ month</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-[#F1F4F9] pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Collaborators</dt>
                  <dd className="font-semibold text-[#0B0F19] tabular-nums">Up to 10 team seats</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Connected channels</dt>
                  <dd className="font-semibold text-[#0B0F19]">YouTube · Reels · Drive</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#475569]">Export formats</dt>
                  <dd className="font-semibold text-[#0B0F19]">4K MP4 & Shared Libraries</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={() => onStartCreating({ authMode: 'signup' })}
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#E6E8F0] bg-[#F8F9FC] text-xs font-semibold text-[#0B0F19] transition-colors hover:bg-slate-100"
            >
              Start Studio Team
            </button>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div id="faq" className="mt-20 border-t border-[#E6E8F0] pt-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold text-[#102D69]">Questions</p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0B0F19]">
                Everything you need to know before your first cut
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                Go from a rough note or brand guide to a finished MP4 video your audience will
                remember.
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

      {/* 8. BOTTOM CONVERSION BANNER */}
      <section className="mx-auto max-w-[1240px] px-6 pb-16">
        <div className="flex flex-col items-start justify-between gap-8 rounded-[28px] bg-[#0B0F19] p-10 text-white md:flex-row md:items-center lg:p-12">
          <div className="max-w-xl">
            <p className="text-xs font-semibold text-[#D4AF37]">Ready to tell your next story?</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance">
              Turn your next launch, campaign, or idea into a finished video in minutes.
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
              <span>Start Creating Free</span>
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
            <span className="text-xs text-[#475569]">Brand Video & Storytelling Studio</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#475569]">
            <a href="#formats" className="transition-colors hover:text-[#0B0F19]">
              Formats
            </a>
            <a href="#why-monarch" className="transition-colors hover:text-[#0B0F19]">
              Why Monarch
            </a>
            <a href="#showcase" className="transition-colors hover:text-[#0B0F19]">
              Showcase
            </a>
            <a href="#stories" className="transition-colors hover:text-[#0B0F19]">
              Stories
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

      {/* Product Walkthrough Modal */}
      {loomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[24px] border border-[#E6E8F0] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6E8F0] px-6 py-4">
              <div>
                <p className="font-display text-sm font-bold text-[#0B0F19]">
                  Monarch Video Studio — 2-Minute Walkthrough
                </p>
                <p className="text-[11px] text-[#475569]">
                  See how marketers and creators go from a brief to a finished brand video
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
                title="Monarch Video Studio Walkthrough"
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
