'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Crown, LogOut, Menu, Search, TrendingUp, User, X } from 'lucide-react'
import { useSearch } from '@/lib/hooks/use-stock'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { useAppStore } from '@/lib/store/stockStore'
import { cn } from '@/lib/utils/format'
import Button from '@/components/ui/Button'
import AuthModal from '@/components/auth/AuthModal'

export default function Header() {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [clock, setClock] = useState('')
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

  useEffect(() => {
    function tick() {
      setClock(
        new Intl.DateTimeFormat('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date())
      )
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  function handleSelectSymbol(symbol: string) {
    const nextSymbol = symbol.trim().replace(/\s+/g, '').toUpperCase()
    if (!nextSymbol) return
    addSearchHistory(nextSymbol)
    setSearchOpen(false)
    setSearchQuery('')
    router.push(`/stock/${encodeURIComponent(nextSymbol)}`)
  }

  return (
    <header className="sticky top-0 z-header border-b border-brand-border/60 bg-brand-bg/90 backdrop-blur-md lg:ml-64">
      <div className="mx-auto max-w-[1680px] px-3 sm:px-4 lg:px-6">
        <div className="flex h-16 items-center gap-3">
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
            className="rounded-lg border border-brand-border bg-brand-card/80 p-2 text-brand-text-secondary transition-all hover:border-brand-primary/50 hover:text-brand-text-primary lg:hidden"
          >
            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-primary/40 bg-brand-primary/15">
              <TrendingUp size={18} className="text-brand-primary" />
            </div>
            <span className="hidden text-base font-bold text-brand-text-primary sm:inline">StockGuru</span>
          </Link>

          <div ref={searchRef} className="relative min-w-0 flex-1 lg:max-w-[720px]">
            <div
              className={cn(
                'flex h-11 items-center rounded-xl border bg-brand-bg-secondary/80 backdrop-blur-sm transition-[border-color,box-shadow] duration-200',
                searchOpen ? 'border-brand-primary/60 ring-2 ring-brand-primary/20' : 'border-brand-border/80'
              )}
            >
              <Search size={17} className="ml-3 shrink-0 text-brand-text-muted" />
              <input
                ref={inputRef}
                type="text"
                placeholder="ค้นหาหุ้น, ดัชนี, กลยุทธ์, ข่าว..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSelectSymbol(searchQuery)
                  }
                }}
                onFocus={() => setSearchOpen(true)}
                className="w-full bg-transparent px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-muted outline-none"
              />
              <span className="mr-2 hidden rounded-md border border-brand-border bg-brand-card px-2 py-1 font-mono text-xs text-brand-text-muted sm:inline">
                /
              </span>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    inputRef.current?.focus()
                  }}
                  aria-label="ล้างคำค้นหา"
                  className="mr-2 rounded-md p-1 text-brand-text-secondary hover:bg-brand-card hover:text-brand-text-primary sm:mr-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {searchOpen && (
              <div className="absolute left-0 right-0 top-full z-dropdown mt-2 max-h-80 overflow-hidden overflow-y-auto rounded-xl border border-brand-border bg-brand-bg-secondary shadow-[0_18px_60px_rgba(0,0,0,0.4)]">
                {searchQuery.length === 0 && searchHistory.length > 0 && (
                  <div className="p-3">
                    <p className="mb-2 text-xs text-brand-text-secondary">ค้นหาล่าสุด</p>
                    <div className="flex flex-wrap gap-1.5">
                      {searchHistory.map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => handleSelectSymbol(symbol)}
                          className="rounded-md border border-brand-border bg-brand-card px-2.5 py-1 text-xs text-brand-text-secondary transition-colors hover:border-brand-primary/50 hover:text-brand-text-primary"
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchLoading && searchQuery.length > 0 && (
                  <div className="p-4 text-center text-sm text-brand-text-secondary">กำลังค้นหา...</div>
                )}

                {!searchLoading && searchQuery.length > 0 && results?.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-brand-text-secondary">ไม่พบผลลัพธ์</p>
                    <button
                      type="button"
                      onClick={() => handleSelectSymbol(searchQuery)}
                      className="mt-2 text-sm font-medium text-brand-primary hover:text-emerald-300"
                    >
                      เปิดกราฟ {searchQuery.trim().replace(/\s+/g, '').toUpperCase()}
                    </button>
                  </div>
                )}

                {results?.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelectSymbol(result.symbol)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-card"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-primary/25 bg-brand-primary/10">
                      <span className="text-xs font-bold text-brand-primary">{result.symbol.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-text-primary">{result.symbol}</p>
                      <p className="truncate text-xs text-brand-text-secondary">{result.name}</p>
                    </div>
                    <span className="text-xs text-brand-text-muted">{result.exchange}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden h-11 items-center gap-3 rounded-xl border border-brand-border bg-brand-card/60 px-4 backdrop-blur-sm lg:flex">
              <span className="font-mono text-sm text-brand-text-secondary">{clock}</span>
              <span className="h-4 w-px bg-brand-border" />
              <span className="text-xs text-brand-text-muted">GMT+7</span>
            </div>

            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-card/60 text-brand-text-secondary transition-all hover:border-brand-primary/50 hover:text-brand-text-primary">
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-danger shadow-sm shadow-red-500/50" />
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {isPro && (
                  <span className="hidden items-center gap-1 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary sm:inline-flex">
                    <Crown size={12} />
                    PRO
                  </span>
                )}
                <div className="group relative">
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-card/60 text-brand-text-secondary transition-all hover:border-brand-primary/50 hover:text-brand-text-primary">
                    <User size={19} />
                  </button>
                  <div className="absolute right-0 top-full z-dropdown mt-2 hidden w-56 overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary shadow-[0_18px_60px_rgba(0,0,0,0.4)] group-hover:block">
                    <div className="border-b border-brand-border p-4">
                      <p className="text-sm font-medium text-brand-text-primary">{user?.email}</p>
                      <p className="mt-0.5 text-xs text-brand-text-secondary">แผน {plan}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-text-secondary transition-colors hover:bg-brand-card hover:text-brand-danger"
                      >
                        <LogOut size={16} />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Button size="sm" onClick={() => setAuthModalOpen(true)}>
                เข้าสู่ระบบ
              </Button>
            )}
          </div>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  )
}
