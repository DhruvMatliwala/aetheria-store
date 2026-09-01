import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AmbientAudioProvider } from '@/context/AmbientAudioContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'AETHERIA — Buy PGSharp Standard Key | Instant Delivery (UPI & Cards)',
  description:
    'Official PGSharp Standard Edition 30-Day license keys dispatched in under 10 seconds. Buy PGSharp keys in India via UPI, GPay, Paytm, PhonePe, Cards & PayPal with instant automated delivery.',
  keywords: [
    // Core Brand & Store
    'AETHERIA',
    'Aetheria store',
    'aetheria pgsharp',
    'aetheria keys',
    'aetheria store pgsharp',
    'aetheria pgsharp store',
    'aetheria key store',
    // High-Volume Product Searches (Direct from search trends)
    'pgsharp',
    'pgsharp key',
    'pgsharp keys',
    'pgsharp free key',
    'pgsharp key free',
    'pgsharp key generator',
    'pgsharp key generator apk',
    'pgsharp update today',
    'pgsharp for pc',
    'pgsharp pokemon go',
    'pgsharp ios',
    'pgsharp apk',
    'pgsharp download',
    'pgsharp arm64',
    'pgsharp ipa',
    'pgsharp reddit',
    'pgsharp standard key',
    'pgsharp standard edition',
    'pgsharp standard key cheap',
    'pgsharp 30 day key',
    'pgsharp activation key',
    'pgsharp license key',
    'buy pgsharp',
    'buy pgsharp key',
    'buy pgsharp standard key',
    'cheap pgsharp key',
    'pgsharp 1 device key',
    'pgsharp 2 devices key',
    // India & Payment Method Specific
    'buy pgsharp key india',
    'pgsharp key buy india',
    'pgsharp key india',
    'pgsharp upi',
    'pgsharp upi payment',
    'pgsharp buy with upi',
    'pgsharp gpay',
    'pgsharp paytm',
    'pgsharp phonepe',
    'pgsharp indian payment method',
    'how to buy pgsharp key in india',
    'pgsharp key in rupees',
    'pgsharp price in india',
    'pgsharp 180 inr',
    'pgsharp 350 inr',
    // Feature & Spoofer Keywords
    'pokemon go spoofing key',
    'pokemon go joystick key',
    'pokemon go teleport key',
    'pgsharp instant delivery',
    'pgsharp automatic key dispatch',
  ],
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://aetheria-store.vercel.app',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'AETHERIA — Buy PGSharp Standard Key | Instant Delivery (UPI & Cards)',
    description:
      'Official PGSharp Standard Edition 30-Day license keys dispatched in under 10 seconds. Buy PGSharp in India via UPI, GPay, Paytm & Cards.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://aetheria-store.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AETHERIA — Buy PGSharp Standard Key | Instant Delivery',
    description:
      'Official PGSharp Standard Edition 30-Day license keys dispatched in under 10 seconds. Fast UPI & Card checkout.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'OnlineStore',
      '@id': 'https://aetheria-store.vercel.app/#store',
      name: 'AETHERIA',
      alternateName: ['Aetheria Store', 'AETHERIA PGSharp Key Store', 'Aetheria Keys', 'Aetheria Storefront'],
      url: 'https://aetheria-store.vercel.app',
      description:
        'Official PGSharp Standard Edition 30-Day license keys with instant automated delivery. Buy PGSharp keys in India via UPI, GPay, Paytm, Cards, and PayPal.',
      currenciesAccepted: 'INR, USD',
      paymentAccepted: 'UPI, Google Pay, PhonePe, Paytm, Credit Card, Debit Card, NetBanking, PayPal',
      priceRange: '₹180 - ₹350',
    },
    {
      '@type': 'Product',
      '@id': 'https://aetheria-store.vercel.app/#product-1device',
      name: 'PGSharp Standard Key (1 Device)',
      description: 'Official 30-Day PGSharp Standard Edition license key for 1 Android device. Instant automated activation code delivery.',
      offers: {
        '@type': 'Offer',
        price: '180.00',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: 'https://aetheria-store.vercel.app/#plans',
      },
    },
    {
      '@type': 'Product',
      '@id': 'https://aetheria-store.vercel.app/#product-2devices',
      name: 'PGSharp Standard Key (2 Devices)',
      description: 'Official 30-Day PGSharp Standard Edition license key for 2 Android devices simultaneously. Instant automated activation code delivery.',
      offers: {
        '@type': 'Offer',
        price: '350.00',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: 'https://aetheria-store.vercel.app/#plans',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How to buy PGSharp key in India using UPI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Select your PGSharp plan on AETHERIA, select UPI, scan the QR code using Google Pay, PhonePe, Paytm, or CRED, and your license key is revealed on screen instantly in under 10 seconds.',
          },
        },
        {
          '@type': 'Question',
          name: 'How fast is PGSharp key delivery on AETHERIA?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Delivery is 100% automated and instant. As soon as your payment confirms, your key appears directly on your screen and is emailed to you.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is included in the PGSharp Standard Edition key?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PGSharp Standard keys unlock teleportation, GPS joystick, auto-walking, 100 IV feeds, shiny scanner, quick catch, and raid radar for 30 days on Android.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#080403" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-surface-950 text-[#ece7e0] antialiased">
        <AmbientAudioProvider>
          {children}
        </AmbientAudioProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1b0b08',
              color: '#ece7e0',
              border: '1px solid #4a1c14',
              borderRadius: '16px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#ffbc09', secondary: '#080403' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
