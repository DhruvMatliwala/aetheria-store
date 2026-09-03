'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Review } from '@/types/review';
import { Star, CheckCircle, XCircle, Clock, RefreshCw, MessageSquare, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewsManagerProps {
  adminToken: string;
}

export function ReviewsManager({ adminToken }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchReviews = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: {
          'x-admin-secret': adminToken,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch reviews');
      setReviews(data.reviews || []);
    } catch (err: any) {
      toast.error(err.message || 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleStatusUpdate = async (reviewId: string, status: 'approved' | 'rejected') => {
    if (updatingId) return;
    setUpdatingId(reviewId);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
        body: JSON.stringify({ reviewId, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update review status');

      toast.success(`Review ${status === 'approved' ? 'approved for website' : 'rejected'}.`);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
      );
    } catch (err: any) {
      toast.error(err.message || 'Could not update review.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const totalReviews = reviews.length;
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6">
      {/* ── Header Summary Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <p className="text-[10px] sm:text-xs font-mono text-neutral-400 uppercase tracking-wider">Total Reviews</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-mono">{totalReviews}</p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <p className="text-[10px] sm:text-xs font-mono text-neutral-400 uppercase tracking-wider">Average Rating</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <p className="text-xl sm:text-2xl font-bold text-amber-300 font-mono">{avgRating} / 5</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <p className="text-[10px] sm:text-xs font-mono text-neutral-400 uppercase tracking-wider">Pending Moderation</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">{pendingCount}</p>
            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <p className="text-[10px] sm:text-xs font-mono text-neutral-400 uppercase tracking-wider">Approved Live</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 font-mono">{approvedCount}</p>
        </div>
      </div>

      {/* ── Controls Strip (Filter Tabs + Refresh) ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                filter === tab
                  ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab} {tab === 'pending' && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>

        <button
          onClick={fetchReviews}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Review Cards List ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-16 text-neutral-500 font-mono text-xs flex flex-col items-center gap-2">
          <RefreshCw size={20} className="animate-spin text-cyan-400" />
          <span>Loading buyer reviews from database...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-neutral-900/30 border border-neutral-800/60 p-6 space-y-2">
          <MessageSquare size={32} className="text-neutral-600 mx-auto" />
          <p className="text-sm font-semibold text-white font-sans">No reviews found</p>
          <p className="text-xs text-neutral-400 font-sans max-w-sm mx-auto">
            {filter === 'pending'
              ? 'All incoming reviews have been reviewed.'
              : 'As customers complete purchases and leave delivery feedback, their verified reviews will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredReviews.map((r) => {
            const isUpdating = updatingId === r.id;
            return (
              <div
                key={r.id}
                className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  {/* Top Row: Stars + Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={
                            s <= (r.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-700'
                          }
                        />
                      ))}
                      <span className="text-xs font-mono font-bold text-amber-400 ml-1">
                        {r.rating}/5
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider border ${
                        r.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : r.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                      }`}
                    >
                      ● {r.status}
                    </span>
                  </div>

                  {/* Comment Quote */}
                  <p className="text-xs sm:text-sm text-neutral-200 font-sans italic leading-relaxed">
                    {r.comment ? `“${r.comment}”` : <span className="text-neutral-500 not-italic">(No written comment)</span>}
                  </p>

                  {/* Metadata Row */}
                  <div className="pt-2 border-t border-neutral-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <Shield size={12} className="text-cyan-400" />
                      <span className="text-neutral-300 font-medium">{r.trainerName}</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-400">{r.planName || 'Key'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="uppercase text-neutral-500">Order #{r.orderId.slice(-6)}</span>
                      <span>•</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="pt-2 flex items-center gap-2">
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => r.id && handleStatusUpdate(r.id, 'approved')}
                      disabled={isUpdating}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle size={13} />
                      <span>{isUpdating ? 'Updating...' : 'Approve for Storefront'}</span>
                    </button>
                  )}

                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => r.id && handleStatusUpdate(r.id, 'rejected')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Hide from public storefront"
                    >
                      <XCircle size={13} />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
