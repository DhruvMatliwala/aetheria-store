'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.getElementById('razorpay-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Failed to load Razorpay checkout script.');
    document.head.appendChild(script);
  }, []);

  const openCheckout = (options: RazorpayOptions): void => {
    if (!isLoaded || !window.Razorpay) {
      throw new Error('Razorpay script not loaded yet.');
    }
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return { isLoaded, error, openCheckout };
}
