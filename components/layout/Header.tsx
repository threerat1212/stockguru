'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Menu, X, TrendingUp, Star, Bell, LogOut, Crown, User } from 'lucide-react'
import { useSearch } from '@/lib/hooks/use-stock'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { useAppStore } from '@/lib/store/stockStore'
import { cn } from '@/lib/utils/format'
import Button from '@/components/ui/Button'
import AuthModal from '@/components/auth/AuthModal'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { data: results, isLoading: searchLoading } = useSearch(searchQuery)
  const { sidebarOpen, toggleSidebar, searchHistory, addSearchHistory } = useAppStore()
  const { user, isAuthenticated, signOut } = useAuth()
  const { isPro, plan } = useSubscription()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectSymbol(symbol: string) {
    addSearchHistory(symbol)
    setSearchOpen(false)
    setSearchQuery('')
    router.push(`/stock/${encodeURIComponent(symbol)}`)
  }

  const navLinks = [
    { href: '/', label: 'หน้าแรก' },
    { href: '/screener', label: 'Screener' },
    { href: '/news', label: 'ข่าวสาร' },
    { href: '/watchlist', label: 'รายการโปรด' },
  ]

  return (
    <header className="sticky top-0 z-header bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <button
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
              className="lg:hidden p-2 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-card transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-accent rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-brand-text-primary leading-tight">StockGuru</h1>
                <p className="text-[10px] text-brand-text-secondary leading-tight">สต็อกกูรู</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    pathname === link.href
                      ? 'text-brand-primary bg-brand-primary/10'
                      : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-card'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search */}
          <div ref={searchRef} className="relative flex-1 max-w-md mx-4">
            <div
              className={cn(
                'flex items-center bg-brand-bg-secondary border rounded-lg transition-all duration-200',
                searchOpen ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-brand-border'
              )}
            >
              <Search size={16} className="ml-3 text-brand-text-secondary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="ค้นหาหุ้น เช่น PTT, AAPL, NVDA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                className="w-full bg-transparent px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-secondary outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); inputRef.current?.focus() }}
                  aria-label="ล้างคำค้นหา"
                  className="mr-2 p-1 text-brand-text-secondary hover:text-brand-text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Search dropdown */}
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-brand-card border border-brand-border rounded-lg shadow-xl shadow-black/30 overflow-hidden max-h-80 overflow-y-auto z-dropdown">
                {searchQuery.length === 0 && searchHistory.length > 0 && (
                  <div className="p-3">
                    <p className="text-xs text-brand-text-secondary mb-2">ค้นหาล่าสุด</p>
                    <div className="flex flex-wrap gap-1.5">
                      {searchHistory.map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => handleSelectSymbol(symbol)}
                          className="px-2.5 py-1 text-xs bg-brand-bg-secondary text-brand-text-secondary hover:text-brand-text-primary rounded-md transition-colors"
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchLoading && searchQuery.length > 0 && (
                  <div className="p-4 text-center text-brand-text-secondary text-sm">กำลังค้นหา...</div>
                )}

                {!searchLoading && searchQuery.length > 0 && results?.length === 0 && (
                  <div className="p-4 text-center text-brand-text-secondary text-sm">ไม่พบผลลัพธ์</div>
                )}

                {results?.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelectSymbol(result.symbol)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-bg-secondary transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-brand-primary">{result.symbol.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-text-primary">{result.symbol}</p>
                      <p className="text-xs text-brand-text-secondary truncate">{result.name}</p>
                    </div>
                    <span className="text-xs text-brand-text-secondary">{result.exchange}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <Button size="sm" variant="secondary" onClick={() => setAuthModalOpen(true)}>
                เข้าสู่ระบบ
              </Button>
            ) : (
              <>
                {plan !== 'trader' && (
                  <Link href="/pricing">
                    <Button size="sm" variant={isPro ? 'secondary' : 'primary'} className="gap-1">
                      <Crown size={14} />
                      {isPro ? 'Trader' : 'อัพเกรด'}
                    </Button>
                  </Link>
                )}
                <div className="group relative">
                  <button className="p-2 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-card transition-colors">
                    <User size={20} />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-brand-card border border-brand-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-dropdown">
                    <div className="p-3 border-b border-brand-border">
                      <p className="text-sm font-medium text-brand-text-primary truncate">{user?.email}</p>
                      <p className="text-xs text-brand-text-secondary">{plan === 'trader' ? 'Trader' : isPro ? 'Pro' : 'Free'}</p>
                    </div>
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-text-secondary hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
                    >
                      <LogOut size={14} />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  )
}
