'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Newspaper, Star, X, TrendingUp, Zap, Brain, Briefcase, Bell, Calendar, PieChart, GitCompare, BookOpen, NotebookPen } from 'lucide-react'
import { useAppStore } from '@/lib/store/stockStore'
import { cn } from '@/lib/utils/format'

const sidebarLinks = [
  { href: '/', label: 'หน้าแรก', icon: Home },
  { href: '/trending', label: 'หุ้นมาแรง', icon: TrendingUp },
  { href: '/screener', label: 'Screener', icon: BarChart3 },
  { href: '/portfolio', label: 'พอร์ตการลงทุน', icon: Briefcase },
  { href: '/journal', label: 'Trading Journal', icon: NotebookPen },
  { href: '/watchlist', label: 'รายการโปรด', icon: Star },
  { href: '/alerts', label: 'แจ้งเตือนราคา', icon: Bell },
  { href: '/news', label: 'AI Brief', icon: Newspaper },
  { href: '/earnings', label: 'ปฏิทินงบ', icon: Calendar },
  { href: '/sector', label: 'วิเคราะห์กลุ่ม', icon: PieChart },
  { href: '/compare', label: 'เปรียบเทียบหุ้น', icon: GitCompare },
  { href: '/ai', label: 'AI วิเคราะห์', icon: Brain },
  { href: '/learn', label: 'ความรู้', icon: BookOpen },
]

const quickLinks = [
  { symbol: 'PTT.BK', name: 'ปตท.' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'CPALL.BK', name: 'ซีพี ออลล์' },
  { symbol: 'MSFT', name: 'Microsoft' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-sidebar-backdrop bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 z-sidebar w-64 bg-brand-bg-secondary border-r border-brand-border',
          'transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto p-4">
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden self-end p-1.5 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-card transition-colors mb-2"
          >
            <X size={18} />
          </button>

          {/* Navigation */}
          <nav className="space-y-1 mb-6">
            {sidebarLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-card'
                  )}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Quick access */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider px-3 mb-2">
              เข้าถึงด่วน
            </h3>
            <div className="space-y-0.5">
              {quickLinks.map((item) => (
                <Link
                  key={item.symbol}
                  href={`/stock/${encodeURIComponent(item.symbol)}`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-card transition-colors"
                >
                  <div className="w-6 h-6 bg-brand-primary/10 rounded flex items-center justify-center">
                    <span className="text-[10px] font-bold text-brand-primary">{item.symbol.charAt(0)}</span>
                  </div>
                  <span>{item.name}</span>
                  <span className="ml-auto text-xs text-brand-text-secondary/60">{item.symbol.replace('.BK', '')}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider px-3 mb-2">
              เครื่องมือ
            </h3>
            <div className="space-y-0.5">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-brand-text-secondary">
                <Zap size={16} className="text-brand-warning" />
                <span>อัปเดตทุก ~30 วินาที</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-brand-text-secondary">
                <Brain size={16} className="text-brand-accent" />
                <span>AI วิเคราะห์</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-brand-text-secondary">
                <TrendingUp size={16} className="text-brand-success" />
                <span>Technical Analysis</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-brand-border">
            <p className="text-xs text-brand-text-secondary text-center">
              StockGuru v1.0
            </p>
            <p className="text-[10px] text-brand-text-secondary/60 text-center mt-1">
              ข้อมูลเพื่อการศึกษาเท่านั้น
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
