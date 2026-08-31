'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth } from '@/lib/firebase/client';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { Key, Lock, Copy, Check, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS ?? '')
  .split(',')
  .map((u) => u.trim())
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
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    // Check if previously authorized via secret key in sessionStorage
    const savedSecret = typeof window !== 'undefined' ? sessionStorage.getItem('pgsharp_admin_secret') : null;
    if (savedSecret) {
      setSecretAuthorized(true);
    }

    try {
      const auth = getClientAuth();
      const unsubscribe = auth.onAuthStateChanged((u: User | null) => {
        setUser(u);
        if (u) {
          console.log('[Admin Auth] Logged in Firebase user UID:', u.uid);
          console.log('[Admin Auth] Configured NEXT_PUBLIC_ADMIN_UIDS:', ADMIN_UIDS);
        }
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      console.warn('[Admin Auth] Firebase Auth initialization notice:', err);
      setLoading(false);
    }
  }, []);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setGoogleError(null);
    try {
      const auth = getClientAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      console.log('[Admin Auth] Google sign-in success. User UID:', result.user.uid);
      toast.success('Signed in with Google');
    } catch (err: any) {
      console.error('[Admin Auth] Google sign-in error:', err);
      const code = err?.code || 'auth/unknown';
      const message = err?.message || 'Failed to sign in with Google.';
      setGoogleError(`${code}: ${message}`);
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
        throw new Error(data.error || 'Invalid admin passcode / secret key.');
      }

      sessionStorage.setItem('pgsharp_admin_secret', adminSecretInput.trim());
      setSecretAuthorized(true);
      toast.success('Admin access granted!');
    } catch (err: any) {
      setSecretError(err.message || 'Authentication failed.');
      toast.error('Invalid passcode');
    } finally {
      setSecretLoading(false);
    }
  }

  async function handleSignOut() {
    sessionStorage.removeItem('pgsharp_admin_secret');
    setSecretAuthorized(false);
    try {
      const auth = getClientAuth();
      await auth.signOut();
    } catch (err) {
      // ignore
    }
    setUser(null);
    router.push('/');
  }

  async function handleCopyUid(uid: string) {
    try {
      await navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      toast.success('UID copied to clipboard!');
      setTimeout(() => setCopiedUid(false), 2500);
    } catch {
      toast.error('Failed to copy UID.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isGoogleAuthorized = Boolean(user && ADMIN_UIDS.includes(user.uid));
  const isAuthorized = isGoogleAuthorized || secretAuthorized;

  // Render Login Screen if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-surface-800 border border-surface-600 rounded-2xl p-8 shadow-card">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-900/60 border border-brand-700/50 flex items-center justify-center mx-auto mb-3">
              <Lock size={26} className="text-brand-400" />
            </div>
            <h1 className="text-2xl font-black text-white">Admin Portal</h1>
            <p className="text-gray-400 text-sm mt-1">
              Sign in with your authorized Google account or Admin Passcode
            </p>
          </div>

          {/* Option 1: Admin Passcode / Secret Key (Instant & Reliable) */}
          <div className="mb-6 p-4 bg-surface-900/90 border border-surface-600 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Key size={16} className="text-brand-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Option 1: Admin Passcode
              </h2>
            </div>
            <form onSubmit={handleSecretLogin} className="space-y-3">
              <div>
                <input
                  type="password"
                  placeholder="Enter ADMIN_API_SECRET..."
                  value={adminSecretInput}
                  onChange={(e) => setAdminSecretInput(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Matches <code className="text-brand-300">ADMIN_API_SECRET</code> in your .env.local
                </p>
              </div>

              {secretError && (
                <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-lg p-2.5 text-xs text-red-300">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  {secretError}
                </div>
              )}

              <button
                type="submit"
                disabled={secretLoading || !adminSecretInput.trim()}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-sm"
              >
                {secretLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Unlock with Passcode</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-surface-600" />
            <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase font-medium">
              Or
            </span>
            <div className="flex-grow border-t border-surface-600" />
          </div>

          {/* Option 2: Google Sign-in */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 text-center">
              Option 2: Google Account
            </h2>

            {googleError && (
              <div className="mb-3 flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-lg p-2.5 text-xs text-red-300">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{googleError}</span>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold px-5 py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm shadow-md"
            >
              {signingIn ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Sign in with Google
            </button>

            {/* If user is signed in with Google but not in allowlist, display UID for convenience */}
            {user && !isGoogleAuthorized && (
              <div className="mt-4 p-3.5 bg-amber-900/30 border border-amber-700/50 rounded-xl text-left">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-300">
                    Signed In as {user.email}
                  </span>
                  <button
                    onClick={() => handleCopyUid(user.uid)}
                    className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
                  >
                    {copiedUid ? <Check size={12} /> : <Copy size={12} />}
                    {copiedUid ? 'Copied' : 'Copy UID'}
                  </button>
                </div>
                <p className="text-xs text-gray-300 font-mono break-all bg-black/40 p-1.5 rounded">
                  {user.uid}
                </p>
                <p className="text-xs text-amber-400/80 mt-2">
                  To authorize this account, add the UID above to{' '}
                  <code className="text-white bg-surface-900 px-1 py-0.5 rounded">
                    NEXT_PUBLIC_ADMIN_UIDS
                  </code>{' '}
                  in your <code className="text-white">.env.local</code>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Authorized Admin View
  return (
    <div className="min-h-screen bg-surface-900">
      {/* Admin Navbar */}
      <nav className="bg-surface-800 border-b border-surface-600 px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎮</span>
          <span className="text-white font-bold">PGSharp Admin</span>
          <span className="bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-xs hidden sm:inline">
            {user?.email ? user.email : 'Authenticated via Passcode'}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs font-medium text-gray-400 hover:text-white bg-surface-700 hover:bg-surface-600 px-3 py-1.5 rounded-lg transition-colors border border-surface-600"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
