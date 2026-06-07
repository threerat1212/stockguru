import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StockGuru - วิเคราะห์หุ้นไทยด้วย AI',
    short_name: 'StockGuru',
    description: 'เว็บไซต์วิเคราะห์หุ้นไทยด้วย AI ครบครันด้วยกราฟเทคนิค ข่าวสาร และเครื่องมือวิเคราะห์',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0E1A',
    theme_color: '#0A0E1A',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
