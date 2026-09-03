'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Send, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewSubmissionWidgetProps {
  orderId: string;
  planName: string;
}

export function ReviewSubmissionWidget({ orderId, planName }: ReviewSubmissionWidgetProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`reviewed_${orderId}`);
      if (saved === 'true') {
        setHasSubmitted(true);
      }
    }
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          rating,
          comment: comment.trim(),
          trainerName: trainerName.trim() || 'Verified Trainer',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setHasSubmitted(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`reviewed_${orderId}`, 'true');
      }
      toast.success('Thank you! Your verified feedback was submitted.');
    } catch (err: any) {
      toast.error(err.message || 'Could not submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="mt-6 p-6 rounded-3xl bg-neutral-950/80 backdrop-blur-xl border border-emerald-500/30 shadow-2xl text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle size={20} />
        </div>
        <h4 className="text-sm font-bold text-white font-sans">Verified Feedback Submitted</h4>
        <p className="text-xs text-neutral-400 font-sans max-w-md mx-auto leading-relaxed">
          Thank you for supporting AETHERIA! Your review helps other trainers buy with confidence.
        </p>
      </div>
    );
  }

  const ratingDescriptions: Record<number, string> = {
    5: '⭐ Flawless & Instant Delivery',
    4: '⭐ Very Fast Delivery',
    3: '⭐ Average Delivery',
    2: '⭐ Slower Than Expected',
    1: '⭐ Had Issues',
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="mt-6 p-6 rounded-3xl bg-neutral-950/80 backdrop-blur-xl border border-cyan-500/30 shadow-2xl space-y-4 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
            How was your delivery experience?
          </span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
          Verified Order
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Star Rating Row */}
        <div>
          <label className="block text-[11px] font-mono text-neutral-400 mb-1.5">
            Rating: <span className="text-amber-400 font-medium">{ratingDescriptions[activeRating]}</span>
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                aria-label={`Rate ${star} star`}
              >
                <Star
                  size={24}
                  className={
                    star <= activeRating
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'text-neutral-600'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Short Review Comment */}
        <div>
          <label className="block text-[11px] font-mono text-neutral-400 mb-1">
            Quick Review <span className="text-neutral-500">(Optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="e.g. Got key in 5 seconds via UPI! Both slots working perfectly on our phones."
            className="w-full px-3.5 py-2 rounded-xl bg-neutral-900/90 border border-white/10 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400 transition-colors font-sans resize-none"
          />
        </div>

        {/* Trainer Name & Submit Button in Responsive Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <input
            type="text"
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
            maxLength={30}
            placeholder="Trainer Name / Discord Handle (Optional)"
            className="w-full sm:w-2/3 px-3.5 py-2 rounded-xl bg-neutral-900/90 border border-white/10 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-1/3 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Sending...</span>
            ) : (
              <>
                <Send size={12} />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
