import { NextRequest, NextResponse } from 'next/server';
import { createReview, getApprovedReviews } from '@/lib/firestore/reviews';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const reviews = await getApprovedReviews(10);
    return NextResponse.json(
      { reviews },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, rating, comment, trainerName } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid orderId' }, { status: 400 });
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }

    const result = await createReview({
      orderId,
      rating,
      comment: typeof comment === 'string' ? comment : '',
      trainerName: typeof trainerName === 'string' ? trainerName : '',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Review submitted successfully!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
