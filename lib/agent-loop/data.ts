import { getHistory, getQuote } from '@/lib/services/stock-service'
import { MARKET_NEWS } from '@/lib/data/news'
import type { AgentLoopContext, AgentLoopRequest } from './types'

export async function collectAgentLoopContext(input: AgentLoopRequest): Promise<AgentLoopContext> {
  const startedAt = Date.now()
  const symbols = input.symbols.slice(0, 8)

  const quoteResults = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const result = await getQuote(symbol)
        return { symbol, quote: result.data, error: undefined }
      } catch (error) {
        return { symbol, quote: null, error: (error as Error).message }
      }
    })
  )

  const historyResults = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const result = await getHistory(symbol, input.timeframe)
        return { symbol, candles: result.data, error: undefined }
      } catch (error) {
        return { symbol, candles: [], error: (error as Error).message }
      }
    })
  )

  const scenario = (input.scenario ?? '').toLowerCase()
  const relatedNews = MARKET_NEWS.filter((article) => {
    if (article.relatedSymbols?.some((symbol) => symbols.includes(symbol))) return true
    const haystack = `${article.title} ${article.summary} ${article.impact}`.toLowerCase()
    return scenario && haystack.includes(scenario.slice(0, 12))
  })

  return {
    symbols,
    scenario: input.scenario ?? '',
    timeframe: input.timeframe,
    mode: input.mode,
    holdings: input.holdings,
    quotes: quoteResults,
    histories: historyResults,
    news: relatedNews,
    isDemo: quoteResults.some((item) => item.error || !item.quote),
    updatedAt: new Date(startedAt).toISOString(),
  }
}
