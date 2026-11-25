import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import { MarketingSite } from './components/MarketingSite';
import { AuthView } from './components/AuthView';
import { StudioWorkspace } from './components/StudioWorkspace';
import { AgentInspectorView } from './components/AgentInspectorView';
import { MonarchLogo } from './components/MonarchLogo';
import { signOutUser, subscribeToAuth } from './lib/firebase';

type AppView = 'marketing' | 'auth' | 'workspace' | 'inspector';

export function App() {
  const [view, setView] = useState<AppView>('marketing');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success' || params.get('checkout') === 'cancelled') {
      setView('workspace');
    }
  }, []);

  const handleStartCreating = (options?: {
    initialPrompt?: string;
    authMode?: 'signin' | 'signup';
  }) => {
    if (options?.initialPrompt) {
      setPendingPrompt(options.initialPrompt);
    }
    if (user) {
      setView('workspace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setAuthMode(options?.authMode || 'signup');
    setView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    await signOutUser();
    setView('marketing');
  };

  if (view === 'auth') {
    return (
      <AuthView
        initialMode={authMode}
        pendingPrompt={pendingPrompt}
        onBackToSite={() => setView('marketing')}
        onContinueAsGuest={() => setView('workspace')}
        onAuthSuccess={() => setView('workspace')}
      />
    );
  }

  if (view === 'workspace') {
    return (
      <StudioWorkspace
        user={user}
        initialPrompt={pendingPrompt}
        onRequestAuth={(mode) => {
          setAuthMode(mode);
          setView('auth');
        }}
        onSignOut={() => void handleSignOut()}
        onBackToMarketing={() => {
          setPendingPrompt('');
          setView('marketing');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#0B0F19]">
      {/* Lexio Framer Template 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#E6E8F0] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => setView('marketing')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0"
          >
            <MonarchLogo size={28} />
            <span className="font-display text-lg font-bold tracking-tight text-[#0B0F19]">
              Monarch
            </span>
          </button>

          {/* Zone 2: Primary Navigation (5 concise single-line links in Lexio style) */}
          {view === 'marketing' ? (
            <nav
              aria-label="Primary navigation"
              className="hidden items-center gap-8 text-xs font-medium text-[#475569] md:flex"
            >
              <a
                href="#programs"
                className="transition-colors hover:text-[#0B0F19] whitespace-nowrap shrink-0"
              >
                Programs
              </a>
              <a
                href="#features"
                className="transition-colors hover:text-[#0B0F19] whitespace-nowrap shrink-0"
              >
                Capabilities
              </a>
              <a
                href="#showcase"
                className="transition-colors hover:text-[#0B0F19] whitespace-nowrap shrink-0"
              >
                Showcase
              </a>
              <a
                href="#reviews"
                className="transition-colors hover:text-[#0B0F19] whitespace-nowrap shrink-0"
              >
                Reviews
              </a>
              <a
                href="#pricing"
                className="transition-colors hover:text-[#0B0F19] whitespace-nowrap shrink-0"
              >
                Pricing
              </a>
            </nav>
          ) : (
            <nav
              aria-label="Workspace navigation"
              className="hidden items-center gap-7 text-xs font-medium text-[#475569] md:flex"
            >
              <button
                type="button"
                onClick={() => setView('marketing')}
                className="transition-colors hover:text-[#0B0F19] whitespace-nowrap shrink-0"
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setView('workspace')}
                className="text-[#475569] transition-colors hover:text-[#0B0F19] whitespace-nowrap shrink-0"
              >
                Video Studio
              </button>
              <button
                type="button"
                onClick={() => setView('inspector')}
                className="font-semibold text-[#0B0F19] transition-colors whitespace-nowrap shrink-0"
              >
                Agent Soul & Covenant
              </button>
            </nav>
          )}

          {/* Zone 3: Actions (Max 2 interactive controls) */}
          <div className="flex items-center gap-3 shrink-0">
            {authReady && user ? (
              <>
                <button
                  type="button"
                  onClick={() => setView('workspace')}
                  className="inline-flex h-10 items-center rounded-xl bg-[#0B0F19] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1E293B] whitespace-nowrap shrink-0"
                >
                  Open Video Studio
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  title={`Sign out (${user.email || user.displayName || 'Creator'})`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#E6E8F0] bg-white px-3.5 text-xs font-medium text-[#475569] transition-colors hover:bg-slate-50 hover:text-[#0B0F19] whitespace-nowrap shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setView('auth');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-[#475569] transition-colors hover:text-[#0B0F19] whitespace-nowrap shrink-0"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleStartCreating({ authMode: 'signup' })}
                  className="inline-flex h-10 items-center rounded-xl bg-[#0B0F19] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1E293B] whitespace-nowrap shrink-0"
                >
                  Start Free Trial
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {view === 'marketing' ? (
          <MarketingSite onStartCreating={handleStartCreating} />
        ) : (
          <AgentInspectorView />
        )}
      </main>
    </div>
  );
}

export default App;
