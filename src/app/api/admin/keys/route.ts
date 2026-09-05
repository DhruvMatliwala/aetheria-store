import { NextRequest, NextResponse } from 'next/server';
import { bulkInsertKeys } from '@/lib/firestore/keys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRequest(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
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
    };

    const { keys, patreonEmail } = body;
    const source = body.source || body.planType || 'patreon_2slot';

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { error: 'A valid list of keys[] is required.' },
        { status: 400 }
      );
    }

    const result = await bulkInsertKeys(source, keys, patreonEmail);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[admin/keys]', err);
    return NextResponse.json({ error: 'Failed to insert keys.' }, { status: 500 });
  }
}
