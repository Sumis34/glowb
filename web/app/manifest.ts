import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Glowb',
    short_name: 'Glowb',
    description: 'Glowb is an ESP32-powered smart lamp designed in the form of a glowing globe, ideal for bedside use. It offers adjustable lighting and smart connectivity.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  }
}