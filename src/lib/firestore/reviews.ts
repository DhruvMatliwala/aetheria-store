import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { Review, CreateReviewInput } from '@/types/review';
import { PLANS } from '@/lib/constants';

const COLLECTION = 'reviews';

export async function createReview(input: CreateReviewInput): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminFirestore();

    // 1. Validate that the order exists and is paid
    const orderDoc = await db.collection('orders').doc(input.orderId).get();
    if (!orderDoc.exists) {
      return { success: false, error: 'Order not found.' };
    }

    const orderData = orderDoc.data();
    if (!orderData || orderData.payment_status !== 'paid') {
      return { success: false, error: 'Reviews can only be submitted for completed orders.' };
    }

    // 2. Prevent duplicate reviews for the same order
    const existingReviews = await db.collection(COLLECTION).where('orderId', '==', input.orderId).get();
    if (!existingReviews.empty) {
      return { success: false, error: 'A review has already been submitted for this order.' };
    }

    // 3. Clean and sanitize input
    const rating = Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5)));
    const comment = (input.comment || '').trim().slice(0, 300);
    const trainerName = (input.trainerName || '').trim().slice(0, 30) || 'Verified Trainer';
    const planId = orderData.plan_type || '';
    const matchedPlan = PLANS.find((p) => p.id === planId);

    const newReview = {
      orderId: input.orderId,
      rating,
      comment,
      trainerName,
      planId,
      planName: matchedPlan?.name || (planId === 'standard_2device' ? '2 Devices' : '1 Device'),
      paymentMethod: orderData.payment_gateway || 'upi',
      verified: true,
      status: 'pending', // Pending admin approval
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection(COLLECTION).add(newReview);
    return { success: true };
  } catch (err: any) {
    console.error('[createReview] Error:', err);
    return { success: false, error: err.message || 'Failed to submit review' };
  }
}

export async function getApprovedReviews(limitCount = 10): Promise<Review[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection(COLLECTION)
      .where('status', '==', 'approved')
      .limit(50)
      .get();

    const reviews: Review[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        orderId: d.orderId,
        rating: d.rating,
        comment: d.comment,
        trainerName: d.trainerName,
        planId: d.planId,
        planName: d.planName,
        paymentMethod: d.paymentMethod,
        verified: d.verified ?? true,
        status: d.status,
        createdAt: d.created_at?.toDate ? d.created_at.toDate().toISOString() : new Date().toISOString(),
      };
    });

    // In-memory sort by newest first (eliminates Firestore composite index requirement)
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reviews.slice(0, limitCount);
  } catch (err) {
    console.error('[getApprovedReviews] Error:', err);
    return [];
  }
}

export async function getAllReviewsForAdmin(): Promise<Review[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection(COLLECTION)
      .limit(100)
      .get();

    const reviews: Review[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        orderId: d.orderId,
        rating: d.rating,
        comment: d.comment,
        trainerName: d.trainerName,
        planId: d.planId,
        planName: d.planName,
        paymentMethod: d.paymentMethod,
        verified: d.verified ?? true,
        status: d.status,
        createdAt: d.created_at?.toDate ? d.created_at.toDate().toISOString() : new Date().toISOString(),
      };
    });

    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reviews;
  } catch (err) {
    console.error('[getAllReviewsForAdmin] Error:', err);
    return [];
  }
}

export async function updateReviewStatus(reviewId: string, status: 'approved' | 'rejected'): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    await db.collection(COLLECTION).doc(reviewId).update({
      status,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('[updateReviewStatus] Error:', err);
    return false;
  }
}
