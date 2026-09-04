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
      <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-neutral-950/80 backdrop-blur-xl border border-emerald-500/30 shadow-xl text-center space-y-1.5">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle size={16} />
        </div>
        <h4 className="text-xs font-bold text-white font-sans">Verified Feedback Submitted</h4>
        <p className="text-[11px] text-neutral-400 font-sans max-w-md mx-auto leading-relaxed">
          Thank you for supporting AETHERIA! Your review helps other trainers buy with confidence.
        </p>
      </div>
    );
  }

  const ratingDescriptions: Record<number, string> = {
    5: '⭐ Flawless & Fast Delivery',
    4: '⭐ Very Fast Delivery',
    3: '⭐ Average Delivery',
    2: '⭐ Slower Than Expected',
    1: '⭐ Had Issues',
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-[#0c1424]/90 backdrop-blur-xl border border-cyan-500/30 shadow-xl space-y-3 text-left">
      <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
        <Sparkles size={15} className="text-cyan-400" />
        <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
          How was your delivery experience?
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Star Rating Row */}
        <div>
          <label className="block text-[11px] font-mono text-neutral-400 mb-1">
            Rating: <span className="text-amber-400 font-medium">{ratingDescriptions[activeRating]}</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 transition-transform hover:scale-125 focus:outline-none"
                aria-label={`Rate ${star} star`}
              >
                <Star
                  size={20}
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
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Quick note (optional): e.g. Instant key delivery via UPI! Worked on 1st try."
            className="w-full px-3 py-2 rounded-xl bg-neutral-900/90 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-cyan-400 transition-colors font-sans resize-none"
          />
        </div>

        {/* Trainer Name & Submit Button in Responsive Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-0.5">
          <input
            type="text"
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
            maxLength={30}
            placeholder="Trainer Name / Discord (Optional)"
            className="w-full sm:w-2/3 px-3 py-2 rounded-xl bg-neutral-900/90 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
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
                <span>Submit Review</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
