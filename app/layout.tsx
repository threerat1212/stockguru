import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import { QueryProvider } from '@/lib/providers/query-provider'
import { SITE_URL, SITE_NAME } from '@/lib/site'

const TITLE = 'StockGuru - วิเคราะห์หุ้นไทยด้วย AI'
const DESCRIPTION = 'เว็บไซต์วิเคราะห์หุ้นไทยด้วย AI ครบครันด้วยกราฟเทคนิค ข่าวสาร และเครื่องมือวิเคราะห์'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: ['หุ้นไทย', 'SET', 'วิเคราะห์หุ้น', 'AI', 'StockGuru', 'สต็อกกูรู'],
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
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
          <Header />
          <div className="flex min-w-0">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-64">
              <div className="mx-auto min-w-0 max-w-[1600px] px-4 py-6 sm:px-6">
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
