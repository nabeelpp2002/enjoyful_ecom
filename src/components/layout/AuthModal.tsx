'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, KeyRound, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useData } from '@/context/DataContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Title override when the modal is opened from a contextual action like "Write a review". */
  title?: string;
  subtitle?: string;
}

type Mode = 'otp' | 'password' | 'register';
type OtpStep = 'enter-email' | 'enter-code';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// Minimal typings for the Google Identity Services library that we lazy-load.
type CredentialResponse = { credential?: string; clientId?: string };
type GsiNamespace = {
  accounts?: {
    id?: {
      initialize: (opts: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        auto_select?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        opts: {
          type?: 'standard' | 'icon';
          theme?: 'outline' | 'filled_blue' | 'filled_black';
          size?: 'small' | 'medium' | 'large';
          shape?: 'rectangular' | 'pill' | 'circle' | 'square';
          text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
          width?: number;
        },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GsiNamespace;
  }
}

const cardCls = 'bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 shadow-2xl relative';
const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)] focus:border-transparent transition';

export function AuthModal({ isOpen, onClose, title, subtitle }: Props) {
  const { login, register, requestOtp, verifyOtp, loginWithGoogle } = useData();
  const [mode, setMode] = useState<Mode>('otp');

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP
  const [otpStep, setOtpStep] = useState<OtpStep>('enter-email');
  const [code, setCode] = useState('');
  const [ttlMinutes, setTtlMinutes] = useState(10);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Register
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setOtpStep('enter-email');
      setCode('');
    }
  }, [isOpen]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Google Identity Services — lazy-inject script and render the button.
  useEffect(() => {
    if (!isOpen || !GOOGLE_CLIENT_ID) return;

    const renderButton = () => {
      const gsi = window.google?.accounts?.id;
      if (!gsi || !googleButtonRef.current) return;
      try {
        gsi.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: CredentialResponse) => {
            if (!response.credential) return;
            try {
              setLoading(true);
              setError('');
              await loginWithGoogle(response.credential);
              onClose();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setLoading(false);
            }
          },
        });
        googleButtonRef.current.innerHTML = '';
        gsi.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 320,
        });
      } catch {
        // Silent — fall back to message shown elsewhere
      }
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    document.head.appendChild(script);
    return () => { script.onload = null; };
  }, [isOpen, loginWithGoogle, onClose]);

  if (!isOpen) return null;

  const reset = () => {
    setEmail(''); setPassword(''); setCode('');
    setOtpStep('enter-email'); setError('');
  };

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try { await login(email, password); onClose(); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try { await register({ email, password, firstName, lastName }); onClose(); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const result = await requestOtp(email);
      setTtlMinutes(result.ttlMinutes);
      setOtpStep('enter-code');
      setResendCooldown(60);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await verifyOtp(email, code);
      onClose();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true); setError('');
    try {
      const result = await requestOtp(email);
      setTtlMinutes(result.ttlMinutes);
      setCode('');
      setResendCooldown(60);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  const heading =
    title ??
    (mode === 'register' ? 'Create your account' : 'Sign in to enJoyful Life');
  const sub =
    subtitle ??
    (mode === 'register'
      ? 'Just a few details to get you started.'
      : 'Cart and wishlist work without an account — sign in to checkout, sync across devices, or leave a review.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cardCls}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 text-[var(--color-brand-purple)] mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-medium tracking-wide uppercase">enJoyful Life</span>
        </div>
        <h2 className="font-heading font-bold text-2xl text-[var(--color-brand-onyx)]">{heading}</h2>
        <p className="text-sm text-[var(--color-brand-onyx)]/55 mt-1 mb-6">{sub}</p>

        {/* Google */}
        <div className="space-y-3 mb-5">
          {GOOGLE_CLIENT_ID ? (
            <div ref={googleButtonRef} className="flex justify-center" />
          ) : (
            <div className="text-xs text-[var(--color-brand-onyx)]/40 text-center py-2 px-3 border border-dashed border-gray-200 rounded-xl">
              Google sign-in unavailable — set <code className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in <code className="font-mono">.env.local</code>.
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] tracking-wide uppercase text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
          {([
            { k: 'otp' as Mode, label: 'Email code', icon: KeyRound },
            { k: 'password' as Mode, label: 'Password', icon: Lock },
            { k: 'register' as Mode, label: 'Sign up', icon: Mail },
          ]).map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.k}
                onClick={() => { setMode(t.k); reset(); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  mode === t.k
                    ? 'bg-white shadow-sm text-[var(--color-brand-onyx)]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3 h-3" />
                {t.label}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* OTP flow */}
        {mode === 'otp' && otpStep === 'enter-email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" required autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                We&apos;ll email you a 6-digit code. No password needed.
              </p>
            </div>
            <button type="submit" disabled={loading || !email}
              className="w-full bg-[var(--color-brand-purple)] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#5e4580] transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : 'Send code'}
            </button>
          </form>
        )}

        {mode === 'otp' && otpStep === 'enter-code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <button
              type="button"
              onClick={() => { setOtpStep('enter-email'); setCode(''); setError(''); }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[var(--color-brand-onyx)]"
            >
              <ArrowLeft className="w-3 h-3" /> Use a different email
            </button>
            <p className="text-sm text-[var(--color-brand-onyx)]/70">
              We sent a 6-digit code to <span className="font-semibold text-[var(--color-brand-onyx)]">{email}</span>.
              It expires in {ttlMinutes} minutes.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required autoFocus
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className={`${inputCls} font-mono text-center text-xl tracking-[0.4em]`}
              />
            </div>
            <button type="submit" disabled={loading || code.length !== 6}
              className="w-full bg-[var(--color-brand-purple)] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#5e4580] transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying…</> : 'Verify & sign in'}
            </button>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Didn&apos;t get it?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="text-[var(--color-brand-purple)] hover:underline disabled:text-gray-300 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {/* Password login */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[var(--color-brand-onyx)] text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : 'Sign in'}
            </button>
          </form>
        )}

        {/* Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[var(--color-brand-onyx)] text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</> : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
