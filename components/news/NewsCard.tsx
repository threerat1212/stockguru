'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BarChart3, Clock, ExternalLink } from 'lucide-react'
import type { NewsArticle } from '@/types/stock'
import { newsDetailPath } from '@/lib/news/normalize'
import { timeAgo } from '@/lib/utils/format'
import Badge from '@/components/ui/Badge'

interface NewsCardProps {
  article: NewsArticle
  variant?: 'default' | 'compact'
}

const categoryLabels: Record<NewsArticle['category'], string> = {
  market: 'ตลาด',
  sector: 'กลุ่มอุตสาหกรรม',
  company: 'บริษัท',
  global: 'โลก',
  crypto: 'คริปโต',
}

const categoryVariants: Record<NewsArticle['category'], 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  market: 'info',
  sector: 'success',
  company: 'warning',
  global: 'danger',
  crypto: 'default',
}

export default function NewsCard({ article, variant = 'default' }: NewsCardProps) {
  if (variant === 'compact') {
    return (
      <Link href={newsDetailPath(article)} className="block group">
        <div className="flex gap-3 p-3 rounded-lg hover:bg-brand-bg-secondary transition-colors">
          {article.imageUrl && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-bg-secondary">
              <Image src={article.imageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-brand-text-primary group-hover:text-brand-primary transition-colors line-clamp-2">
              {article.title}
            </h4>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant={categoryVariants[article.category]} size="sm">
                {categoryLabels[article.category]}
              </Badge>
              <span className="text-xs text-brand-text-secondary">{timeAgo(article.publishedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={newsDetailPath(article)} className="group block overflow-hidden rounded-lg border border-brand-border bg-brand-card transition-colors duration-200 hover:border-brand-primary/30">
        {article.imageUrl && (
          <div className="relative aspect-video overflow-hidden bg-brand-bg-secondary">
            <Image src={article.imageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={categoryVariants[article.category]} size="sm">
              {categoryLabels[article.category]}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-brand-text-secondary">
              <Clock size={12} />
              <span>{timeAgo(article.publishedAt)}</span>
            </div>
          </div>

          <h3 className="text-base font-semibold text-brand-text-primary group-hover:text-brand-primary transition-colors mb-2 line-clamp-2">
            {article.title}
          </h3>

          <p className="text-sm text-brand-text-secondary line-clamp-3 mb-3">
            {article.summary}
          </p>

          {article.references && article.references.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-brand-text-secondary">
              <ExternalLink size={12} />
              <span>{article.references.length} แหล่งอ้างอิง</span>
            </div>
          )}
          {article.marketImpactScore != null && (
            <div className="mt-3 flex items-center gap-2 text-xs text-brand-warning">
              <BarChart3 size={12} />
              <span>Impact {article.marketImpactScore}/100</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs text-brand-primary">อ่านรายละเอียด <ArrowRight size={12} /></span>
            {article.relatedSymbols && article.relatedSymbols.length > 0 && (
              <div className="flex items-center gap-1.5">
                {article.relatedSymbols.map((sym) => (
                  <span key={sym} className="text-xs text-brand-primary">
                    {sym.replace('.BK', '')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
    </Link>
  )
}
