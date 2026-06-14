import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import { QueryProvider } from '@/lib/providers/query-provider'
import PwaPushManager from '@/components/pwa/PwaPushManager'

export const metadata: Metadata = {
  title: 'StockGuru - วิเคราะห์หุ้นไทยด้วย AI',
  description: 'เว็บไซต์วิเคราะห์หุ้นไทยด้วย AI ครบครันด้วยกราฟเทคนิค ข่าวสาร และเครื่องมือวิเคราะห์',
  keywords: ['หุ้นไทย', 'SET', 'วิเคราะห์หุ้น', 'AI', 'StockGuru', 'สต็อกกูรู'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'StockGuru',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0E1A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className="dark">
      <body className="min-h-screen bg-brand-bg text-brand-text-primary antialiased">
        <QueryProvider>
          <PwaPushManager />
          <Header />
          <div className="flex min-w-0">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-[220px]">
              <div className="mx-auto min-w-0 max-w-[1680px] px-3 py-4 sm:px-4 lg:px-6">
                {children}
              </div>
              <Footer />
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}
