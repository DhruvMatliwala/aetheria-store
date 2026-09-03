import { NextRequest, NextResponse } from 'next/server';
import { getAllReviewsForAdmin, updateReviewStatus } from '@/lib/firestore/reviews';

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

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const reviews = await getAllReviewsForAdmin();
    return NextResponse.json({ reviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { reviewId, status } = body;

    if (!reviewId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid reviewId or status' }, { status: 400 });
    }

    const success = await updateReviewStatus(reviewId, status as 'approved' | 'rejected');
    if (!success) {
      return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
