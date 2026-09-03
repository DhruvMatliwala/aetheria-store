'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/storefront/Header';
import { Preloader } from '@/components/storefront/Preloader';
import { CinematicScrollExperience } from '@/components/CinematicScrollExperience';
import { CheckoutModal } from '@/components/storefront/CheckoutModal';
import { RestockNotifyModal } from '@/components/storefront/RestockNotifyModal';
import { PLANS } from '@/lib/constants';
import { Plan } from '@/types/plan';

function useStockCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/stock');
        if (res.ok) {
          const data = (await res.json()) as { stock?: Record<string, number> };
          if (data.stock) {
            setCounts(data.stock);
            setLoading(false);
            return;
          }
        }

        // Fallback per-plan query
        const results = await Promise.allSettled(
          PLANS.map(async (plan) => {
            const r = await fetch(`/api/stock/${plan.id}`);
            if (!r.ok) return { planId: plan.id, count: 0 };
            const d = (await r.json()) as { available: number };
            return { planId: plan.id, count: d.available };
          })
        );

        const countsMap: Record<string, number> = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            countsMap[r.value.planId] = r.value.count;
          }
        });
        setCounts(countsMap);
      } catch {
        // Fallback: empty counts
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, []);

  return { counts, loading };
}

export default function HomePage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [notifyPlan, setNotifyPlan] = useState<Plan | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [waitlistedPlans, setWaitlistedPlans] = useState<Record<string, boolean>>({});
  const { counts } = useStockCounts();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const waitlistMap: Record<string, boolean> = {};
      PLANS.forEach((p) => {
        const hasStock = (counts && counts[p.id]) ? counts[p.id] > 0 : false;
        if (hasStock) {
          localStorage.removeItem(`restock_requested_${p.id}`);
        } else if (localStorage.getItem(`restock_requested_${p.id}`) === 'true') {
          waitlistMap[p.id] = true;
        }
      });
      setWaitlistedPlans(waitlistMap);

      // Auto-restore active checkout session if user returned from external UPI app or browser reloaded
      try {
        const saved = localStorage.getItem('aetheria_active_checkout');
        if (saved) {
          const parsed = JSON.parse(saved);
          const age = Date.now() - (parsed.timestamp || 0);
          if (age < 30 * 60 * 1000 && parsed.orderId) {
            fetch(`/api/order/${parsed.orderId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.payment_status === 'paid') {
                  localStorage.removeItem('aetheria_active_checkout');
                  window.location.href = `/order-success/${parsed.orderId}`;
                } else if (data.payment_status === 'pending' || data.payment_status === 'verifying') {
                  const matchingPlan = PLANS.find((p) => p.id === parsed.planId) || PLANS[0];
                  setSelectedPlan(matchingPlan);
                  setIsCheckoutModalOpen(true);
                }
              })
              .catch(() => {});
          } else {
            localStorage.removeItem('aetheria_active_checkout');
          }
        }
      } catch {}
    }
  }, [counts]);

  function handleBuyClick(plan: Plan) {
    setSelectedPlan(plan);
    setIsCheckoutModalOpen(true);
  }

  function handleNotifyClick(plan: Plan) {
    setNotifyPlan(plan);
    setIsNotifyModalOpen(true);
  }

  function handleWaitlistSuccess(planId: string) {
    setWaitlistedPlans((prev) => ({ ...prev, [planId]: true }));
  }

  return (
    <main className="min-h-screen w-full max-w-[100vw] overflow-x-clip bg-[#070b13] text-[#ece7e0] selection:bg-cyan-500/30 selection:text-white">
      {/* Preloader / Cinematic Splash Screen */}
      <Preloader />

      {/* Top Glassmorphic Navigation */}
      <Header />

      {/* High-Performance Canvas Image-Sequence Scrollytelling Experience */}
      <CinematicScrollExperience
        stockCounts={counts}
        onBuyClick={handleBuyClick}
        onNotifyClick={handleNotifyClick}
        waitlistedPlans={waitlistedPlans}
      />

      {/* Checkout Modal (100% existing UPI/PayPal & key allocation logic) */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => {
          setIsCheckoutModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
      />

      {/* Restock Notification Modal */}
      <RestockNotifyModal
        isOpen={isNotifyModalOpen}
        onClose={() => {
          setIsNotifyModalOpen(false);
          setNotifyPlan(null);
        }}
        plan={notifyPlan}
        onSuccess={handleWaitlistSuccess}
      />
    </main>
  );
}
