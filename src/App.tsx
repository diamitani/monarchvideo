import React, { useState } from 'react';
import { MarketingSite } from './components/MarketingSite';
import { MonarchLogo } from './components/MonarchLogo';
import { StudioWorkspace } from './components/StudioWorkspace';

export default function App() {
  const [view, setView] = useState<'marketing' | 'studio'>('marketing');
  const [studioPrompt, setStudioPrompt] = useState<string>('');
  const [studioTab, setStudioTab] = useState<'composer' | 'inspector'>('composer');

  const openStudio = (options?: { initialPrompt?: string; openTab?: 'composer' | 'inspector' }) => {
    if (options?.initialPrompt !== undefined) {
      setStudioPrompt(options.initialPrompt);
    }
    setStudioTab(options?.openTab || 'composer');
    setView('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSection = (sectionId: string) => {
    if (view !== 'marketing') {
      setView('marketing');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setView('marketing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102D69] rounded-md"
          >
            <MonarchLogo size={28} />
            <span className="font-display text-lg font-bold tracking-tight text-[#102D69]">
              Monarch
            </span>
          </button>

          {/* Zone 2: 5 Concise Single-Line Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"
          >
            <button
              type="button"
              onClick={() => navigateToSection('how-it-works')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#102D69]"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('showcase')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#102D69]"
            >
              Showcase
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('architecture')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#102D69]"
            >
              Architecture
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('pricing')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#102D69]"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => openStudio({ openTab: 'inspector' })}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#102D69] ${
                view === 'studio' && studioTab === 'inspector' ? 'text-[#102D69] underline underline-offset-4' : ''
              }`}
            >
              ADK Stack
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action CTA */}
          <div className="shrink-0">
            {view === 'marketing' ? (
              <button
                type="button"
                onClick={() => openStudio({ openTab: 'composer' })}
                className="inline-flex h-9 items-center rounded-lg bg-[#102D69] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap shrink-0"
              >
                Open Studio
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView('marketing')}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                Marketing Site
              </button>
            )}
          </div>
        </div>
      </header>

      {view === 'marketing' ? (
        <MarketingSite onOpenStudio={openStudio} />
      ) : (
        <StudioWorkspace initialPrompt={studioPrompt} initialTab={studioTab} />
      )}
    </div>
  );
}
