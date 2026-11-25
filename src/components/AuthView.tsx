import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
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
        setError('Google sign-in window was closed. Please try again or use your email below.');
      } else {
        setError('Unable to sign in with Google right now. Please try email below.');
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
      setError('Enter your email address above first, then select Forgot password.');
      return;
    }
    setBusy('reset');
    setError(null);
    setResetSuccess(null);
    try {
      await sendPasswordReset(email.trim());
      setResetSuccess(`We sent password reset instructions for ${email.trim()}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.replace(/^Firebase:\s*/i, ''));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#0B0F19] lg:grid lg:grid-cols-12">
      {/* Left Editorial Brand Panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0B0F19] p-12 text-white lg:col-span-5 lg:flex">
        <img
          src={AUTH_VISUAL}
          alt="Monarch Video creative studio"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/75 to-[#0B0F19]/45" />

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
            <span>Back to overview</span>
          </button>
        </div>

        <div className="relative z-10 max-w-md space-y-5">
          <p className="text-xs font-semibold text-[#D4AF37]">
            Built for Marketers, Creators & Storytellers
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-balance">
            Turn rough ideas into scroll-stopping brand videos in minutes.
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Keep your brand colors, logos, B-roll footage, and finished cuts together in one calm
            studio—so you can ship campaigns without waiting on an agency queue.
          </p>

          <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-5 text-xs">
            <div>
              <p className="font-display text-lg font-bold text-white tabular-nums">3 Min</p>
              <p className="text-slate-400">Brief to first cut</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white">Every Ratio</p>
              <p className="text-slate-400">16:9, 9:16 & 1:1</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white">MP4 Ready</p>
              <p className="text-slate-400">Post anywhere</p>
            </div>
          </div>

          {pendingPrompt && (
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
              <p className="text-[11px] font-semibold text-[#D4AF37]">Your story brief is ready</p>
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

      {/* Right Sign In / Sign Up Card */}
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:col-span-7 lg:px-16">
        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <MonarchLogo size={26} />
              <span className="font-display text-base font-bold text-[#0B0F19]">Monarch</span>
            </div>
            <button
              type="button"
              onClick={onBackToSite}
              className="text-xs font-medium text-[#475569] hover:text-[#0B0F19]"
            >
              Back to site
            </button>
          </div>

          <div className="rounded-[24px] border border-[#E6E8F0] bg-white p-7 sm:p-8">
            <div>
              <p className="text-xs font-semibold text-[#102D69]">
                {mode === 'signin' ? 'Welcome back' : 'Start creating for free'}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#0B0F19]">
                {mode === 'signin' ? 'Sign in to your studio' : 'Create your Monarch account'}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                {mode === 'signin'
                  ? 'Pick up right where you left off with your saved drafts, brand kits, and videos.'
                  : 'Save your brand style, organize your clips, and download ready-to-post MP4s.'}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-[#F1F4F9] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setResetSuccess(null);
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                  mode === 'signin'
                    ? 'bg-white text-[#0B0F19] shadow-2xs'
                    : 'text-[#475569] hover:text-[#0B0F19]'
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
                className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                  mode === 'signup'
                    ? 'bg-white text-[#0B0F19] shadow-2xs'
                    : 'text-[#475569] hover:text-[#0B0F19]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void handleGoogleAuth()}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#E6E8F0] bg-white px-4 text-xs font-semibold text-[#0B0F19] transition-colors hover:bg-[#F8F9FC] disabled:opacity-60"
            >
              {busy === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#0B0F19]" />
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
              <div className="h-px flex-1 bg-[#E6E8F0]" />
              <span className="text-[11px] text-slate-400">or use your email</span>
              <div className="h-px flex-1 bg-[#E6E8F0]" />
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
                  <label className="block text-xs font-semibold text-[#0B0F19]">Your name</label>
                  <div className="relative mt-1.5">
                    <UserIcon className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="h-10 w-full rounded-xl border border-[#E6E8F0] bg-[#F8F9FC] pr-3 pl-9 text-sm text-[#0B0F19] outline-none transition-colors focus:border-[#0B0F19] focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0B0F19]">Work or creator email</label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@brand.com"
                    className="h-10 w-full rounded-xl border border-[#E6E8F0] bg-[#F8F9FC] pr-3 pl-9 text-sm text-[#0B0F19] outline-none transition-colors focus:border-[#0B0F19] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#0B0F19]">Password</label>
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
                    className="h-10 w-full rounded-xl border border-[#E6E8F0] bg-[#F8F9FC] pr-3 pl-9 text-sm text-[#0B0F19] outline-none transition-colors focus:border-[#0B0F19] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={Boolean(busy)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-60"
              >
                {busy === 'email' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Enter Your Studio' : 'Start Creating Free'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-[#E6E8F0] pt-4 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-medium text-[#475569] underline-offset-4 transition-colors hover:text-[#0B0F19] hover:underline"
              >
                Explore the studio first as a guest
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
