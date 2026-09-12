import { NextRequest, NextResponse } from 'next/server';
import { dispatchManualKey } from '@/lib/services/manualAllocation';
import { verifyAdminSecret } from '@/lib/admin/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
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
