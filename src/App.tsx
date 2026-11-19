import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { AuthView } from './components/AuthView';
import { MarketingSite } from './components/MarketingSite';
import { MonarchLogo } from './components/MonarchLogo';
import { StudioWorkspace } from './components/StudioWorkspace';
import { signOutUser, subscribeToAuth } from './lib/firebase';

export default function App() {
  const [view, setView] = useState<'marketing' | 'auth' | 'dashboard'>('marketing');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [studioPrompt, setStudioPrompt] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const handleStartCreating = (options?: {
    initialPrompt?: string;
    authMode?: 'signin' | 'signup';
  }) => {
    if (options?.initialPrompt !== undefined) {
      setStudioPrompt(options.initialPrompt);
    }
    if (user) {
      setView('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setAuthMode(options?.authMode || 'signup');
    setView('auth');
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

  const handleSignOut = async () => {
    await signOutUser();
    setView('marketing');
  };

  if (view === 'auth') {
    return (
      <AuthView
        initialMode={authMode}
        pendingPrompt={studioPrompt}
        onBackToSite={() => setView('marketing')}
        onContinueAsGuest={() => {
          setView('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAuthSuccess={() => {
          setView('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  if (view === 'dashboard') {
    return (
      <StudioWorkspace
        user={user}
        initialPrompt={studioPrompt}
        onRequestAuth={(mode) => {
          setAuthMode(mode);
          setView('auth');
        }}
        onSignOut={() => void handleSignOut()}
        onBackToMarketing={() => {
          setView('marketing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-slate-900">
      {/* Strict 3-Zone Marketing Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102D69]"
          >
            <MonarchLogo size={28} />
            <span className="font-display text-lg font-bold tracking-tight text-[#102D69]">
              Monarch
            </span>
          </button>

          {/* Zone 2: 4 Concise Creator Navigation Links */}
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
              onClick={() => navigateToSection('pricing')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#102D69]"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('faq')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#102D69]"
            >
              FAQ
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action CTA */}
          <div className="shrink-0">
            {authReady && user ? (
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="inline-flex h-9 items-center rounded-lg bg-[#102D69] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap shrink-0"
              >
                Open Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStartCreating({ authMode: 'signin' })}
                className="inline-flex h-9 items-center rounded-lg bg-[#102D69] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <MarketingSite onStartCreating={handleStartCreating} />
    </div>
  );
}
