import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Synthetic math-based radar spawn generation has been disabled in favor of verified 100% accurate global hotspots.
  return NextResponse.json({
    status: 'hotspots_active',
    message: 'Synthetic random coordinates disabled to ensure 100% accurate player experience.',
    timestamp: new Date().toISOString(),
  });
}
