export interface Review {
  id?: string;
  orderId: string;
  rating: number; // 1 - 5
  comment: string;
  trainerName: string;
  planId?: string;
  planName?: string;
  paymentMethod?: string;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CreateReviewInput {
  orderId: string;
  rating: number;
  comment?: string;
  trainerName?: string;
}
