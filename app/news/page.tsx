'use client'

import { useState } from 'react'
import {
  Newspaper,
  Globe,
  Building2,
  BarChart3,
  TrendingUp,
  Layers,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { useNewsPaginated } from '@/lib/hooks/use-news'
import { cn } from '@/lib/utils/format'
import NewsCard from '@/components/news/NewsCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { LoadingCard } from '@/components/ui/Loading'

const categories = [
  { value: 'all', label: 'ทั้งหมด', icon: Layers },
  { value: 'market', label: 'ตลาด', icon: BarChart3 },
  { value: 'company', label: 'บริษัท', icon: Building2 },
  { value: 'sector', label: 'กลุ่มอุตสาหกรรม', icon: TrendingUp },
  { value: 'global', label: 'โลก', icon: Globe },
  { value: 'crypto', label: 'คริปโต', icon: TrendingUp },
] as const

type Category = typeof categories[number]['value']

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useNewsPaginated(activeCategory)

  const allArticles = data?.pages.flatMap((p) => p.articles) ?? []
  const total = data?.pages[0]?.total ?? 0

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-primary/25 bg-brand-primary/10">
            <Newspaper size={20} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">AI Market Brief</h1>
            <p className="text-sm text-brand-text-secondary">
              สรุปแนวโน้มตลาดโดย AI อัปเดตทุก ~30 นาที — ไม่ใช่ข่าวจากสำนักข่าว
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1">
          <RefreshCw size={14} /> รีเฟรช
        </Button>
      </div>

      {/* AI Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-brand-warning/5 border border-brand-warning/20 rounded-lg">
        <AlertTriangle size={16} className="text-brand-warning shrink-0 mt-0.5" />
        <p className="text-xs text-brand-text-secondary leading-relaxed">
          บทความเหล่านี้สร้างโดย AI เพื่อสรุปแนวโน้มตลาด ไม่ใช่ข่าวจริงจากสำนักข่าว ใช้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 bg-brand-bg-secondary rounded-lg p-1 overflow-x-auto">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'flex min-h-10 items-center gap-2 px-3 text-sm font-medium rounded-md transition-all whitespace-nowrap',
                activeCategory === cat.value
                  ? 'bg-brand-card text-brand-text-primary shadow-sm'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              )}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* News Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Newspaper size={40} className="text-brand-text-secondary" />
            <p className="text-sm text-brand-danger">{(error as Error)?.message ?? 'โหลดข่าวไม่สำเร็จ'}</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>ลองใหม่</Button>
          </div>
        </Card>
      ) : allArticles.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Newspaper size={40} className="text-brand-text-secondary" />
            <p className="text-sm text-brand-text-secondary">ไม่พบข่าวในหมวดนี้</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-2"
              >
                {isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : null}
                โหลดเพิ่มเติม
              </Button>
            </div>
          )}

          <p className="text-xs text-brand-text-muted text-center">
            แสดง {allArticles.length} จาก {total} บทความ
          </p>
        </>
      )}
    </div>
  )
}
