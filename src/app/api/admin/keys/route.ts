import { NextRequest, NextResponse } from 'next/server';
import { bulkInsertKeys } from '@/lib/firestore/keys';
import { broadcastRestockAlert } from '@/lib/telegram/proofs';

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
    const body = (await request.json()) as {
      source?: string;
      planType?: string;
      keys: string[];
      patreonEmail?: string;
      announceInChannel?: boolean;
    };

    const { keys, patreonEmail, announceInChannel } = body;
    const source = body.source || body.planType || 'patreon_2slot';

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { error: 'A valid list of keys[] is required.' },
        { status: 400 }
      );
    }

    const result = await bulkInsertKeys(source, keys, patreonEmail);

    // Broadcast flashy restock alert to Telegram channel
    let announced = false;
    if (result.inserted > 0 && announceInChannel !== false) {
      broadcastRestockAlert(result.inserted).catch((err) =>
        console.error('[admin/keys] Failed to broadcast restock alert:', err)
      );
      announced = true;
    }

    return NextResponse.json({ ...result, restockAnnounced: announced });
  } catch (err) {
    console.error('[admin/keys]', err);
    return NextResponse.json({ error: 'Failed to insert keys.' }, { status: 500 });
  }
}

// Allow manual trigger of restock announcement via GET ?action=announce
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get('action');
  if (action === 'announce') {
    const success = await broadcastRestockAlert();
    return NextResponse.json({ success, message: 'Restock alert sent to channel!' });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}
