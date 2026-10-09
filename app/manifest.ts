import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Charity Coffee',
    short_name: 'Charity Coffee',
    description: 'Collect stamps. Get a free coffee.',
    start_url: '/',
    display: 'standalone',
    background_color: '#EFEEE9',
    theme_color: '#EFEEE9',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
