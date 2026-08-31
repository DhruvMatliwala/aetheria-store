import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { adminSecret?: string };
    const { adminSecret } = body;

    const expectedSecret = process.env.ADMIN_API_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'ADMIN_API_SECRET is not configured in server environment (.env.local).' },
        { status: 500 }
      );
    }

    if (!adminSecret || adminSecret.trim() !== expectedSecret.trim()) {
      return NextResponse.json(
        { error: 'Invalid admin passcode / secret key.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Authenticated successfully.',
    });
  } catch (err) {
    console.error('[api/admin/auth]', err);
    return NextResponse.json({ error: 'Authentication request failed.' }, { status: 500 });
  }
}
