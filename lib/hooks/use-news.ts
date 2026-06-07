'use client'

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { NewsArticle } from '@/types/stock'

interface NewsApiResponse {
  articles: NewsArticle[]
  total: number
  page: number
  limit: number
  totalPages: number
}

async function fetchNews({ category, page }: { category: string; page: number }): Promise<NewsApiResponse> {
  const res = await fetch(`/api/news?category=${category}&page=${page}&limit=12`)
  if (!res.ok) throw new Error('Failed to fetch news')
  return res.json()
}

export function useNews(category = 'all') {
  const { data, isLoading, error } = useQuery({
    queryKey: ['news', category, 1],
    queryFn: () => fetchNews({ category, page: 1 }),
    staleTime: 5 * 60 * 1000,
  })

  return {
    data: data?.articles ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  }
}

export function useNewsPaginated(category = 'all') {
  return useInfiniteQuery<NewsApiResponse, Error>({
    queryKey: ['news', 'infinite', category],
    queryFn: ({ pageParam = 1 }) => fetchNews({ category, page: pageParam as number }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) return undefined
      return lastPage.page + 1
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  })
}
