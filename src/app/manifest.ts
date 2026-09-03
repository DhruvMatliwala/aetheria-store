import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AETHERIA — PGSharp Store',
    short_name: 'AETHERIA',
    description:
      'Official PGSharp Standard Edition 30-Day license keys with instant automated dispatch. Buy via UPI & PayPal.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070b13',
    theme_color: '#070b13',
    orientation: 'portrait-primary',
    categories: ['games', 'shopping', 'utilities'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
