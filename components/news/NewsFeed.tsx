'use client'

import { useNews } from '@/lib/hooks/useStock'
import NewsCard from './NewsCard'
import { LoadingCard } from '@/components/ui/Loading'

interface NewsFeedProps {
  variant?: 'default' | 'compact'
  limit?: number
}

export default function NewsFeed({ variant = 'default', limit }: NewsFeedProps) {
  const { data: articles, loading } = useNews()

  if (loading) {
    return (
      <div className={variant === 'compact' ? 'space-y-1' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
        {Array.from({ length: limit ?? 6 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    )
  }

  const displayArticles = limit ? articles.slice(0, limit) : articles

  if (variant === 'compact') {
    return (
      <div className="space-y-1">
        {displayArticles.map((article) => (
          <NewsCard key={article.id} article={article} variant="compact" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayArticles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  )
}
