import { NextRequest } from 'next/server';
import { timingSafeEqual, createHash } from 'crypto';

/**
 * Anti-Brute-Force Rate Limiting In-Memory Store
 * Tracks failed login attempts per client IP.
 */
interface RateLimitEntry {
  failedAttempts: number;
  lockedUntil: number;
  firstAttemptAt: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;   // 15 minutes rolling window

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Extracts client IP from standard Next.js request headers.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Checks if a client IP is currently allowed to attempt authentication.
 */
export function checkAdminRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Check if IP is currently locked out
  if (entry.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // Reset window if expired
  if (now - entry.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    rateLimitStore.delete(ip);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - entry.failedAttempts);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

/**
 * Records a failed authentication attempt for the IP.
 */
export function recordFailedAdminAttempt(ip: string): {
  remainingAttempts: number;
  lockedUntil?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || {
    failedAttempts: 0,
    lockedUntil: 0,
    firstAttemptAt: now,
  };

  entry.failedAttempts += 1;

  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    rateLimitStore.set(ip, entry);
    return { remainingAttempts: 0, lockedUntil: entry.lockedUntil };
  }

  rateLimitStore.set(ip, entry);
  const remaining = MAX_FAILED_ATTEMPTS - entry.failedAttempts;
  return { remainingAttempts: remaining };
}

/**
 * Clears failed attempts upon successful authentication.
 */
export function recordSuccessfulAdminAttempt(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Cryptographic constant-time verification of the admin secret.
 * Accepts either a raw secret string or a NextRequest object (extracting from header or query param).
 */
export function verifyAdminSecret(secretOrRequest: string | NextRequest | null | undefined): boolean {
  const expectedSecret = process.env.ADMIN_API_SECRET;
  if (!expectedSecret || !expectedSecret.trim()) {
    return false;
  }

  let providedSecret: string | null = null;

  if (typeof secretOrRequest === 'string') {
    providedSecret = secretOrRequest;
  } else if (secretOrRequest && 'headers' in secretOrRequest) {
    providedSecret =
      secretOrRequest.headers.get('x-admin-secret') ||
      secretOrRequest.nextUrl.searchParams.get('secret');
  }

  if (!providedSecret || typeof providedSecret !== 'string') {
    return false;
  }

  const cleanProvided = providedSecret.trim();
  const cleanExpected = expectedSecret.trim();

  if (!cleanProvided || !cleanExpected) {
    return false;
  }

  try {
    // Hash both to SHA-256 to ensure exact equal length before constant-time comparison
    const hashProvided = createHash('sha256').update(cleanProvided).digest();
    const hashExpected = createHash('sha256').update(cleanExpected).digest();
    return timingSafeEqual(hashProvided, hashExpected);
  } catch {
    return false;
  }
}
