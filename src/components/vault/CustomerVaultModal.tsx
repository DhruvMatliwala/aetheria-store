'use client';

import React, { useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/client';
import {
  Key,
  Copy,
  Check,
  Clock,
  Smartphone,
  RefreshCw,
  X,
  Mail,
  Shield,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DISCORD_URL, REDDIT_URL, TELEGRAM_URL, PLAN_MAP } from '@/lib/constants';

interface CustomerKeyItem {
  order_id: string;
  plan_type: string;
  amount: number;
  currency: string;
  delivered_key: string;
  payment_gateway: string;
  gateway_order_id: string;
  slots_assigned: number;
  created_at: string;
  due_date: string;
  days_remaining: number;
}

interface CustomerVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerVaultModal({ isOpen, onClose }: CustomerVaultModalProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [keys, setKeys] = useState<CustomerKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [activeAuthTab, setActiveAuthTab] = useState<'signin' | 'register'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Listen to Auth State
  useEffect(() => {
    try {
      const auth = getClientAuth();
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          fetchUserKeys(currentUser);
        } else {
          setKeys([]);
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.error('[CustomerVault] Auth listener setup error:', err);
    }
  }, []);

  // Fetch Keys with ID Token
  async function fetchUserKeys(currentUser: FirebaseUser) {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken(true);
      const res = await fetch('/api/user/keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeys(data.keys || []);
      } else {
        toast.error(data.error || 'Failed to fetch license keys.');
      }
    } catch (err) {
      console.error('[CustomerVault] Error fetching keys:', err);
      toast.error('Network error fetching keys. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  // Google Sign In
  async function handleGoogleSignIn() {
    setAuthLoading(true);
    try {
      const auth = getClientAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      toast.success('Successfully logged into Customer Vault!');
    } catch (err: any) {
      console.error('[CustomerVault] Google Sign-In error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        toast.error('Google Sign-In is not enabled yet in Firebase Console. Enable it under Authentication > Sign-in method.');
      } else if (err.code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized in Firebase. Add it in Firebase Console > Authentication > Settings > Authorized domains.');
      } else if (err.code === 'auth/popup-blocked') {
        toast.error('Popup blocked by browser. Please allow popups for this site.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Google sign-in failed.');
      }
    } finally {
      setAuthLoading(false);
    }
  }

  // Email / Password Auth
  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      toast.error('Please enter both email and password.');
      return;
    }
    setAuthLoading(true);
    try {
      const auth = getClientAuth();
      if (activeAuthTab === 'signin') {
        await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
        toast.success('Welcome back to your Vault!');
      } else {
        await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
        toast.success('Account created and Vault synchronized!');
      }
      setEmailInput('');
      setPasswordInput('');
    } catch (err: any) {
      console.error('[CustomerVault] Email auth error:', err);
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. If you purchased as a guest, create an account with that email to see your keys.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email already has an account. Please switch to Sign In.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  }

  // Sign Out
  async function handleSignOut() {
    try {
      const auth = getClientAuth();
      await signOut(auth);
      setUser(null);
      setKeys([]);
      toast.success('Signed out of Customer Vault.');
    } catch (err) {
      console.error('[CustomerVault] Sign-out error:', err);
    }
  }

  // Copy Key
  function handleCopy(key: string, orderId: string) {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(orderId);
    toast.success('License Key copied to clipboard!');
    setTimeout(() => setCopiedKeyId(null), 2500);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#090605] border border-white/15 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_25px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Glowing Header Bar */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-surface-900/60 to-surface-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Key size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-bold text-base tracking-wider text-white uppercase">
                  CUSTOMER VAULT
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
                  LIVE SYNC
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">
                Access your purchased license keys & active hardware slots
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Vault"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {!user ? (
            /* ─────────────────────────────────────────────────────────── */
            /* LOGGED OUT STATE (Suggestion 1: Clean & Friendly)          */
            /* ─────────────────────────────────────────────────────────── */
            <div className="space-y-6 py-2">
              {/* Friendly Header */}
              <div className="text-center max-w-md mx-auto space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-1 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  <Key size={26} className="animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-wide">
                  Find Your License Keys
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                  Instantly access all your active PGSharp keys, device slots, and remaining days in one place.
                </p>
              </div>

              {/* 1-Click Google Sign In (Primary Action) */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono text-cyan-400 font-medium">⚡ FASTEST METHOD</span>
                  <span className="text-[10px] font-mono text-neutral-500">1-CLICK LOGIN</span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-3 hover:bg-neutral-100 transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{authLoading ? 'Connecting...' : 'Continue with Google'}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative max-w-md mx-auto flex items-center justify-center">
                <div className="w-full border-t border-white/10"></div>
                <span className="absolute px-3 bg-[#090605] text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  OR SIGN IN WITH EMAIL
                </span>
              </div>

              {/* Clean Email Form */}
              <form onSubmit={handleEmailAuth} className="max-w-md mx-auto space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                    Checkout Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/60 font-mono transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveAuthTab(activeAuthTab === 'signin' ? 'register' : 'signin')}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {activeAuthTab === 'signin' ? 'Need an account? Register' : 'Have an account? Sign In'}
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/60 font-mono transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{authLoading ? 'Verifying...' : activeAuthTab === 'signin' ? 'Unlock My Keys →' : 'Create Account & Unlock Keys →'}</span>
                </button>
              </form>

              {/* Help & Auto-sync Note */}
              <div className="max-w-md mx-auto p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <p className="text-[11px] font-mono text-neutral-400">
                  💡 <span className="text-white font-medium">Automatic Key Sync:</span> All past guest purchases matching your email will appear automatically.
                </p>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────── */
            /* LOGGED IN STATE: KEY VAULT                                  */
            /* ─────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              {/* Profile Bar */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold font-mono text-sm flex-shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white font-mono truncate">{user.email}</p>
                    <p className="text-[11px] font-mono text-slate-400">
                      {loading
                        ? 'Synchronizing inventory...'
                        : keys.length > 0
                        ? `${keys.length} License Key${keys.length === 1 ? '' : 's'} Found`
                        : '0 License Keys Found'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => fetchUserKeys(user)}
                    disabled={loading}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                    title="Refresh Licenses"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/50 text-rose-300 hover:text-rose-200 text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              </div>

              {/* License Cards List */}
              {loading ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw size={28} className="animate-spin text-cyan-400 mx-auto" />
                  <p className="text-xs font-mono text-neutral-400">Scanning Aetheria Vault Database...</p>
                </div>
              ) : keys.length === 0 ? (
                <div className="p-8 rounded-2xl bg-neutral-950/60 border border-dashed border-white/15 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto mb-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <Key size={20} className="opacity-75" />
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-wide">No License Keys Found in this Account</h4>
                  <p className="text-xs text-neutral-400 font-sans max-w-md mx-auto leading-relaxed">
                    We didn&apos;t find any completed orders under this account. If you used a different email during checkout, please sign in with that address below.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-white transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut size={13} className="text-slate-400" />
                      <span>Sign In with Different Email</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {keys.map((item, index) => {
                    const plan = PLAN_MAP[item.plan_type];
                    const planName = plan ? `${plan.name} (${plan.device_slots} Device${plan.device_slots > 1 ? 's' : ''})` : item.plan_type;
                    const isCopied = copiedKeyId === item.order_id;
                    const isExpanded = expandedKey === item.order_id;

                    return (
                      <div
                        key={item.order_id}
                        className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all space-y-4"
                      >
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold">
                              {planName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                            <Clock size={13} className="text-cyan-400" />
                            <span>
                              Due: <strong className="text-white">{item.due_date}</strong> ({item.days_remaining} Days Left)
                            </span>
                          </div>
                        </div>

                        {/* Monospace Key Display + Copy Button */}
                        <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-3">
                          <div className="font-mono text-sm sm:text-base font-bold text-white tracking-widest select-all break-all text-cyan-300">
                            {item.delivered_key}
                          </div>
                          <button
                            onClick={() => handleCopy(item.delivered_key, item.order_id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 ${
                              isCopied
                                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check size={14} />
                                <span>COPIED</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>COPY KEY</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Expandable Activation & Details Bar */}
                        <div className="border-t border-white/5 pt-3">
                          <button
                            type="button"
                            onClick={() => setExpandedKey(isExpanded ? null : item.order_id)}
                            className="w-full flex items-center justify-between text-xs font-mono text-neutral-400 hover:text-white transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              <Smartphone size={13} className="text-cyan-400" />
                              <span>Order #{item.order_id.slice(-8)} • Activation Guide</span>
                            </span>
                            <ChevronDown
                              size={14}
                              className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="mt-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs font-mono text-neutral-300 animate-fade-in">
                              <p className="font-semibold text-white">🚀 Quick Activation Steps:</p>
                              <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                                <li>Download & install latest PGSharp APK from <a href="https://www.pgsharp.com" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">pgsharp.com</a></li>
                                <li>Open PGSharp on your Android device.</li>
                                <li>Tap on the floating <strong>Star icon ➔ Settings ➔ License Key</strong>.</li>
                                <li>Paste this exact key string and click <strong>Activate</strong>.</li>
                              </ol>
                              <div className="pt-2 text-[11px] text-neutral-500">
                                Order ID: {item.order_id} | Ref: {item.gateway_order_id || 'Direct'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Support Info */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-black/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400" />
            <span>Need order assistance or manual sync?</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <span>Discord</span>
              <ExternalLink size={11} />
            </a>
            <span className="text-white/20">•</span>
            <a
              href={REDDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <span>Reddit</span>
              <ExternalLink size={11} />
            </a>
            <span className="text-white/20">•</span>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <span>Telegram</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
