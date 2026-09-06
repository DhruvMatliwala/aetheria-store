import { NextRequest, NextResponse } from 'next/server';
import { getPokemonEvents } from '@/lib/pokemon/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const refresh = request.nextUrl.searchParams.get('refresh') === 'true';
    const events = await getPokemonEvents(refresh);

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (err: any) {
    console.error('[api/pokemon/events] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Pokemon GO events.',
      },
      { status: 500 }
    );
  }
}
