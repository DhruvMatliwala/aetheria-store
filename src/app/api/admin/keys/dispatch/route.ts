import { NextRequest, NextResponse } from 'next/server';
import { dispatchManualKey } from '@/lib/services/manualAllocation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRequest(request: NextRequest): boolean {
  const adminSecret =
    request.headers.get('x-admin-secret') ||
    request.nextUrl.searchParams.get('secret');
  return Boolean(
    adminSecret &&
    process.env.ADMIN_API_SECRET &&
    adminSecret.trim() === process.env.ADMIN_API_SECRET.trim()
  );
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { recipient, slots, note } = body;

    const slotNumber = Number(slots);
    if (slotNumber !== 1 && slotNumber !== 2 && slotNumber !== 3) {
      return NextResponse.json(
        { error: 'Invalid slot selection. Must be 1, 2, or 3 device slots.' },
        { status: 400 }
      );
    }

    const result = await dispatchManualKey({
      recipient: recipient ? String(recipient).trim() : 'Direct Customer',
      slots: slotNumber as 1 | 2 | 3,
      note: note ? String(note).trim() : undefined,
      adminIdentifier: 'Admin Dashboard',
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('[admin/keys/dispatch]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to dispatch license key.' },
      { status: 400 }
    );
  }
}
