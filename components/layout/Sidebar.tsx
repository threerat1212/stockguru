'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Briefcase,
  Crown,
  Home,
  Newspaper,
  NotebookPen,
  RefreshCw,
  Search,
  Settings,
  Star,
  TrendingUp,
  X,
} from 'lucide-react'
import { useAppStore } from '@/lib/store/stockStore'
import { cn } from '@/lib/utils/format'

const sidebarLinks = [
  { href: '/', label: 'หน้าแรก', icon: Home },
  { href: '/market', label: 'ภาพรวมตลาด', icon: Activity },
  { href: '/trending', label: 'ตลาดร้อน', icon: BarChart3 },
  { href: '/screener', label: 'สแกนหุ้น', icon: Search },
  { href: '/ai', label: 'AI วิเคราะห์', icon: Brain },
  { href: '/news', label: 'ข่าวสาร', icon: Newspaper },
  { href: '/watchlist', label: 'วอตช์ลิสต์', icon: Star },
  { href: '/portfolio', label: 'พอร์ตการลงทุน', icon: Briefcase },
  { href: '/alerts', label: 'แจ้งเตือน', icon: Bell },
  { href: '/journal', label: 'บันทึกเทรด', icon: NotebookPen },
  { href: '/learn', label: 'การตั้งค่า', icon: Settings },
]

const marketRows = [
  ['SET', 'เปิด'],
  ['mai', 'เปิด'],
  ['US', 'เปิด'],
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      {sidebarOpen && (
        <button
          aria-label="ปิดเมนูนำทาง"
          className="fixed inset-0 z-sidebar-backdrop bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-sidebar w-64 sidebar-emerald',
          'transform transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4">
          {/* Logo */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-brand-primary/40 bg-brand-primary/15">
                <TrendingUp size={20} className="text-brand-primary" />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-primary shadow-sm shadow-emerald-500/50" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-brand-text-primary">StockGuru</p>
                <p className="text-[10px] leading-tight text-brand-text-muted">สต็อกกูรู</p>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-brand-text-secondary transition-colors hover:bg-brand-card hover:text-brand-text-primary lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-0.5">
            {sidebarLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'sidebar-item-active bg-brand-primary/10 text-brand-primary'
                      : 'sidebar-item text-brand-text-secondary hover:bg-brand-primary/5 hover:text-brand-text-primary'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-primary shadow-sm shadow-emerald-500/50" />
                  )}
                  <Icon size={18} className={cn(
                    'transition-colors',
                    isActive ? 'text-brand-primary' : 'text-brand-text-muted group-hover:text-brand-text-secondary'
                  )} />
                  <span className="truncate">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom cards */}
          <div className="mt-auto space-y-3 pt-5">
            {/* Pro Plan */}
            <div className="card-modern rounded-xl p-4">
              <div className="mb-3 flex items-center gap-2">
                <Crown size={16} className="text-brand-warning" />
                <p className="font-semibold text-brand-text-primary">Pro Plan</p>
              </div>
              <p className="text-xs text-brand-text-secondary">ต่ออายุ 12 ก.ค. 2026</p>
              <div className="mt-3 h-1.5 rounded-full bg-brand-bg-secondary overflow-hidden">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-brand-text-muted">ใช้ฟีเจอร์</span>
                <span className="font-mono-nums text-brand-primary">78%</span>
              </div>
              <Link
                href="/pricing"
                onClick={() => setSidebarOpen(false)}
                className="mt-3 flex h-9 items-center justify-center rounded-lg border border-brand-border bg-brand-bg-secondary text-xs font-semibold text-brand-text-primary transition-colors hover:border-brand-primary/40 hover:bg-brand-surface-hover"
              >
                จัดการแผน
              </Link>
            </div>

            {/* Market Status */}
            <div className="card-modern rounded-xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-brand-text-primary">สถานะตลาด</p>
                <Activity size={16} className="text-brand-primary" />
              </div>
              <div className="space-y-2">
                {marketRows.map(([label, status]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-brand-text-secondary">{label}</span>
                    <span className="text-brand-primary font-medium">{status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-brand-text-muted">
                <span>ข้อมูลล่าช้า 15 นาที</span>
                <RefreshCw size={13} className="text-brand-text-muted" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
