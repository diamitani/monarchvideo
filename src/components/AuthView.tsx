import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import {
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../lib/firebase';
import { MonarchLogo } from './MonarchLogo';

const AUTH_VISUAL = '/src/assets/images/monarch_hero_studio_1795058371767.jpg';

interface AuthViewProps {
  initialMode?: 'signin' | 'signup';
  pendingPrompt?: string;
  onBackToSite: () => void;
  onContinueAsGuest: () => void;
  onAuthSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'signin',
  pendingPrompt,
  onBackToSite,
  onContinueAsGuest,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [showProdGuide, setShowProdGuide] = useState(false);

  const handleGoogleAuth = async () => {
    setBusy('google');
    setError(null);
    setResetSuccess(null);
    try {
      await signInWithGoogle();
      onAuthSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user')) {
        setError('Google sign-in window was closed. Please try again or use email below.');
      } else if (msg.includes('unauthorized-domain')) {
        setError(
          'This domain is not yet authorized in Firebase Auth. Open the Production Auth Setup guide below to whitelist your Vercel domain.'
        );
        setShowProdGuide(true);
      } else {
        setError(msg.replace(/^Firebase:\s*/i, ''));
      }
    } finally {
      setBusy(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setBusy('email');
    setError(null);
    setResetSuccess(null);
    try {
      if (mode === 'signup') {
        await signUpWithEmail({
          name: name.trim() || email.split('@')[0],
          email: email.trim(),
          password,
        });
      } else {
        await signInWithEmail({ email: email.trim(), password });
      }
      onAuthSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.replace(/^Firebase:\s*/i, ''));
    } finally {
      setBusy(null);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Enter your email address above first, then click Forgot password.');
      return;
    }
    setBusy('reset');
    setError(null);
    setResetSuccess(null);
    try {
      await sendPasswordReset(email.trim());
      setResetSuccess(`Password reset link sent to ${email.trim()}. Check your inbox.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.replace(/^Firebase:\s*/i, ''));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] lg:grid lg:grid-cols-12">
      {/* Left Brand & Editorial Visual Column */}
      <div className="relative hidden flex-col justify-between bg-[#09142B] p-10 text-white lg:col-span-5 lg:flex">
        <img
          src={AUTH_VISUAL}
          alt="Monarch Video editing suite"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09142B] via-[#09142B]/70 to-[#09142B]/50" />

        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToSite}
            className="inline-flex items-center gap-2.5 text-left"
          >
            <MonarchLogo size={30} variant="gold" />
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Monarch
            </span>
          </button>
          <button
            type="button"
            onClick={onBackToSite}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to website</span>
          </button>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <p className="text-xs font-medium text-[#D4AF37]">Creator Workspace</p>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-balance">
            Direct B-roll montages, auto-sync brand kits, and render H.264 MP4s in one studio.
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Save drafts and published cuts to your cloud library, upload brand guidelines or logos
            for instant extraction, and edit any scene in plain English.
          </p>
          {pendingPrompt && (
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
              <p className="text-[11px] font-medium text-[#D4AF37]">Your draft idea is queued</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-100">
                “{pendingPrompt}”
              </p>
            </div>
          )}
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} Monarch Video
        </p>
      </div>

      {/* Right Sign In / Sign Up Form */}
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:col-span-7 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <MonarchLogo size={26} />
              <span className="font-display text-base font-bold text-[#102D69]">Monarch</span>
            </div>
            <button
              type="button"
              onClick={onBackToSite}
              className="text-xs font-medium text-slate-600 hover:text-[#102D69]"
            >
              Back to site
            </button>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {mode === 'signin' ? 'Sign in to your studio' : 'Create your Monarch account'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              {mode === 'signin'
                ? 'Access your saved projects, brand kits, B-roll library, and billing.'
                : 'Start directing B-roll montages with synced voiceover and H.264 MP4 exports.'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setResetSuccess(null);
              }}
              className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                mode === 'signin'
                  ? 'bg-white text-[#102D69] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setResetSuccess(null);
              }}
              className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-[#102D69] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void handleGoogleAuth()}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {busy === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#102D69]" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.54-5.17 3.54-8.88Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.96H1.28v3.11A12 12 0 0 0 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.27V6.62H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4-3.11Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.77c1.76 0 3.34.61 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.11C6.23 6.88 8.88 4.77 12 4.77Z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or with email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          {resetSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{resetSuccess}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-700">Full name</label>
                <div className="relative mt-1.5">
                  <UserIcon className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 outline-none focus:border-[#102D69]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700">Email address</label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 outline-none focus:border-[#102D69]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void handlePasswordReset()}
                    className="text-xs font-medium text-[#102D69] hover:underline"
                  >
                    {busy === 'reset' ? 'Sending...' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 outline-none focus:border-[#102D69]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={Boolean(busy)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#102D69] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#091A3E] disabled:opacity-60"
            >
              {busy === 'email' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs font-medium text-slate-600 underline-offset-4 transition-colors hover:text-[#102D69] hover:underline"
            >
              Continue in guest workspace without signing in
            </button>
          </div>

          {/* Production Auth Setup Guide for Vercel + GitHub Deployments */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3.5">
            <button
              type="button"
              onClick={() => setShowProdGuide((prev) => !prev)}
              className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-700"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#102D69]" />
                <span>Deployed on Vercel? Enable Production Sign-In (2 steps)</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  showProdGuide ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showProdGuide && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-600">
                <p>
                  <strong className="text-slate-900">1. Enable Providers:</strong> In Firebase
                  Console (<code className="font-mono text-[#102D69]">elite-rider-459015-b2</code>)
                  → <strong>Authentication → Sign-in method</strong>, toggle on{' '}
                  <strong>Email/Password</strong> and <strong>Google</strong>.
                </p>
                <p>
                  <strong className="text-slate-900">2. Whitelist Vercel Domain:</strong> Go to{' '}
                  <strong>Authentication → Settings → Authorized domains</strong> and add your{' '}
                  <code className="font-mono text-[#102D69]">*.vercel.app</code> or custom domain.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
