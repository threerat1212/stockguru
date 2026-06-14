'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Fish,
  Briefcase,
  Cpu,
  Crown,
  Home,
  MessageSquare,
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
import { useSubscription } from '@/lib/hooks/use-subscription'
import { cn } from '@/lib/utils/format'

const sidebarLinks = [
  { href: '/', label: 'หน้าแรก', icon: Home },
  { href: '/market', label: 'ภาพรวมตลาด', icon: Activity },
  { href: '/trending', label: 'หุ้นเคลื่อนไหว', icon: BarChart3 },
  { href: '/screener', label: 'สแกนหุ้น', icon: Search },
  { href: '/ai', label: 'AI วิเคราะห์', icon: Brain },
  { href: '/agent-loop', label: 'Agent Loop', icon: Cpu },
  { href: '/war-room', label: 'MiroFish Debate', icon: MessageSquare },
  { href: '/mirofish', label: 'MiroFish Swarm', icon: Fish },
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
  const { subscription, plan, isTrader, isPro } = useSubscription()
  const planTitle = isTrader ? 'Trader Lifetime' : isPro ? 'Pro Plan' : 'Free Plan'
  const planStatus = isTrader && !subscription?.currentPeriodEnd
    ? 'ไม่มีวันหมดอายุ'
    : subscription?.currentPeriodEnd
      ? `ต่ออายุ ${new Date(subscription.currentPeriodEnd).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : 'ยังไม่ได้อัปเกรด'
  const usageLabel = isTrader ? 'Unlimited' : isPro ? '78%' : 'Free'
  const usageWidth = isTrader ? '100%' : isPro ? '78%' : '18%'

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
          'fixed bottom-0 left-0 top-0 z-sidebar w-[220px] sidebar-emerald',
          'transform transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4">
          {/* Logo */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link href="/" onClick={() => setSidebarOpen(false)} className="flex min-h-11 items-center gap-3 rounded-lg pr-2">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-brand-primary/40 bg-brand-primary/15">
                <TrendingUp size={20} className="text-brand-primary" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-brand-text-primary">StockGuru</p>
                <p className="text-[10px] leading-tight text-brand-text-muted">สต็อกกูรู</p>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-text-secondary transition-colors hover:bg-brand-card hover:text-brand-text-primary lg:hidden"
              aria-label="ปิดเมนูนำทาง"
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
                <p className="font-semibold text-brand-text-primary">{planTitle}</p>
              </div>
              <p className="text-xs text-brand-text-secondary">{planStatus}</p>
              <div className="mt-3 h-1.5 rounded-full bg-brand-bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: usageWidth }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-brand-text-muted">แผนปัจจุบัน</span>
                <span className="font-mono-nums text-brand-primary">{usageLabel}</span>
              </div>
              <Link
                href="/pricing"
                onClick={() => setSidebarOpen(false)}
                className="mt-3 flex min-h-11 items-center justify-center rounded-lg border border-brand-border bg-brand-bg-secondary px-3 text-xs font-semibold text-brand-text-primary transition-colors hover:border-brand-primary/40 hover:bg-brand-surface-hover"
              >
                {plan === 'free' ? 'อัปเกรดแผน' : 'จัดการแผน'}
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
