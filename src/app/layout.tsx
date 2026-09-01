import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AmbientAudioProvider } from '@/context/AmbientAudioContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'AETHERIA — Buy PGSharp Standard Key | Instant Delivery (UPI & Cards)',
  description:
    'Official PGSharp Standard Edition 30-Day license keys dispatched in under 10 seconds. Secure UPI & PayPal checkout with automated instant key delivery and 24/7 support.',
  keywords: [
    'AETHERIA',
    'PGSharp',
    'PGSharp key',
    'PGSharp license',
    'buy PGSharp',
    'PGSharp activation key',
    'PGSharp UPI',
    'PGSharp India',
    'GPS joystick',
    'Pokemon GO spoofing',
  ],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'AETHERIA — Buy PGSharp Standard Key | Instant Delivery',
    description:
      'Official PGSharp Standard Edition 30-Day license keys dispatched in under 10 seconds. Secure UPI & PayPal checkout with automated instant delivery.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
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
