'use client'

import { useTrending } from '@/lib/hooks/use-stock'
import StockCard from './StockCard'
import { LoadingCard } from '@/components/ui/Loading'

interface TrendingStocksProps {
  limit?: number
}

export default function TrendingStocks({ limit = 6 }: TrendingStocksProps) {
  const { data: stocks = [], isLoading: loading } = useTrending()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stocks.slice(0, limit).map((stock, index) => (
        <StockCard key={stock.symbol} stock={stock} rank={index + 1} />
      ))}
    </div>
  )
}
