'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getClientAuth } from '@/lib/firebase/client';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { Key, AlertCircle, ArrowRight, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Secret passcode login state
  const [adminSecretInput, setAdminSecretInput] = useState('');
  const [secretLoading, setSecretLoading] = useState(false);
  const [secretError, setSecretError] = useState<string | null>(null);
  const [secretAuthorized, setSecretAuthorized] = useState(false);

  // Stealth camouflage state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Check URL query parameter for ?key=... or ?pass=...
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = urlParams.get('key') || urlParams.get('pass');
      if (urlKey) {
        fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminSecret: urlKey.trim() }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success || !data.error) {
              localStorage.setItem('pgsharp_admin_secret', urlKey.trim());
              sessionStorage.setItem('pgsharp_admin_secret', urlKey.trim());
              setSecretAuthorized(true);
              toast.success('Admin device authorized!');
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            }
          })
          .catch(() => {});
      }

      // 2. Check persistent localStorage or sessionStorage
      const savedSecret =
        localStorage.getItem('pgsharp_admin_secret') ||
        sessionStorage.getItem('pgsharp_admin_secret');
      if (savedSecret) {
        setSecretAuthorized(true);
      }
    }

    try {
      const auth = getClientAuth();
      const unsubscribe = auth.onAuthStateChanged((u: User | null) => {
        setUser(u);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      setLoading(false);
    }
  }, []);

  // Secret keyboard trigger: Ctrl + Shift + A (or Cmd + Shift + A) toggles unlock modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowUnlockModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Triple-click on the 404 badge to trigger unlock modal
  const handle404BadgeClick = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        setShowUnlockModal(true);
        return 0;
      }
      return next;
    });
    setTimeout(() => setClickCount(0), 1800);
  };

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setGoogleError(null);
    try {
      const auth = getClientAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Google');
    } catch (err: any) {
      const message = err?.message || 'Failed to sign in with Google.';
      setGoogleError(message);
      toast.error('Google Sign-In failed');
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSecretLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminSecretInput.trim()) return;

    setSecretLoading(true);
    setSecretError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSecret: adminSecretInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your passcode.');
      }

      // Persist to localStorage so the admin is remembered on this device!
      localStorage.setItem('pgsharp_admin_secret', adminSecretInput.trim());
      sessionStorage.setItem('pgsharp_admin_secret', adminSecretInput.trim());
      setSecretAuthorized(true);
      setShowUnlockModal(false);
      toast.success('Device authorized! Welcome to Admin Command Center.');
    } catch (err: any) {
      setSecretError(err.message || 'Authentication failed.');
      toast.error(err.message || 'Invalid passcode');
    } finally {
      setSecretLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isGoogleAuthorized = Boolean(user && ADMIN_UIDS.includes(user.uid));
  const isAuthorized = secretAuthorized || isGoogleAuthorized;

  // ── Stealth Camouflage 404 Mode (Active for all unauthorized visitors) ───
  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen bg-[#070b13] text-slate-200 flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30 overflow-hidden">
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Convincing 404 Error Display */}
        <div className="relative z-10 max-w-md w-full text-center px-4">
          <div
            onClick={handle404BadgeClick}
            title="404"
            className="select-none cursor-pointer inline-block mb-4 transition-transform active:scale-95"
          >
            <span className="text-8xl md:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-slate-200 via-slate-400 to-slate-700 drop-shadow-sm font-mono">
              404
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-wide">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
            The page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </p>

          <div className="flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl border border-slate-700 transition-all shadow-sm hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-cyan-400">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>

        {/* ── Discrete Emergency Unlock Modal (Revealed by shortcut or triple-click) ── */}
        {showUnlockModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="max-w-md w-full bg-[#0c1424] border border-[#1b2b48] rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setSecretError(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Lock size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Terminal Authorization
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Enter master passcode to unlock this device.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSecretLogin} className="space-y-4 mb-4">
                <div>
                  <input
                    type="password"
                    placeholder="Enter authorization passcode..."
                    value={adminSecretInput}
                    onChange={(e) => setAdminSecretInput(e.target.value)}
                    autoFocus
                    className="w-full bg-[#080e1a] border border-[#1e2f4f] rounded-xl px-4 py-2.5 text-cyan-300 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>

                {secretError && (
                  <div className="flex items-start gap-2 bg-rose-950/40 border border-rose-800/60 rounded-lg p-2.5 text-xs text-rose-300">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{secretError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={secretLoading || !adminSecretInput.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                >
                  {secretLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Authorize Device</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              {ADMIN_UIDS.length > 0 && (
                <>
                  <div className="relative flex py-1 items-center mb-4">
                    <div className="flex-grow border-t border-[#16243d]" />
                    <span className="flex-shrink mx-3 text-slate-500 text-[10px] uppercase font-mono">
                      or
                    </span>
                    <div className="flex-grow border-t border-[#16243d]" />
                  </div>

                  <div>
                    {googleError && (
                      <div className="mb-3 flex items-start gap-2 bg-rose-950/40 border border-rose-800/60 rounded-lg p-2.5 text-xs text-rose-300">
                        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                        <span>{googleError}</span>
                      </div>
                    )}

                    <button
                      onClick={handleGoogleSignIn}
                      disabled={signingIn}
                      className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 text-xs shadow-md"
                    >
                      {signingIn ? (
                        <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
                      <span>Sign in with Google</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Authorized Admin View
  return (
    <div className="min-h-screen bg-[#070b13] text-white selection:bg-cyan-500/30">
      {children}
    </div>
  );
}
