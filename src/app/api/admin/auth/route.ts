import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIp,
  checkAdminRateLimit,
  recordFailedAdminAttempt,
  recordSuccessfulAdminAttempt,
  verifyAdminSecret,
} from '@/lib/admin/adminAuth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // 1. Check Rate Limiter (Anti-Brute-Force Guard)
  const rateLimitStatus = checkAdminRateLimit(clientIp);
  if (!rateLimitStatus.allowed) {
    return NextResponse.json(
      {
        error: `Security Lockout: Too many failed attempts. Please wait ${rateLimitStatus.retryAfterSeconds || 900} seconds.`,
        locked: true,
        retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitStatus.retryAfterSeconds || 900),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as { adminSecret?: string };
    const { adminSecret } = body;

    // 2. Constant-Time Verification
    const isValid = verifyAdminSecret(adminSecret);

    if (!isValid) {
      const { remainingAttempts, lockedUntil } = recordFailedAdminAttempt(clientIp);

      if (lockedUntil) {
        return NextResponse.json(
          {
            error: 'Security Lockout: Too many failed passcode attempts. Locked for 15 minutes.',
            locked: true,
            remainingAttempts: 0,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid admin passcode. ${remainingAttempts} attempt(s) remaining before lockout.`,
          remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 3. Reset rate limiter upon successful authentication
    recordSuccessfulAdminAttempt(clientIp);

    return NextResponse.json({
      success: true,
      message: 'Authenticated successfully.',
    });
  } catch (err) {
    console.error('[api/admin/auth]', err);
    return NextResponse.json({ error: 'Authentication request failed.' }, { status: 500 });
  }
}
