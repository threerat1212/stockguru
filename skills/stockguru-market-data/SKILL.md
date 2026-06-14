---
name: stockguru-market-data
description: Use for StockGuru stock quotes, trending stocks, market indices, Yahoo fallback behavior, Thai SET data provider replacement, caches, and market-data production verification.
---

# StockGuru Market Data

## Scope

Use this for quote APIs, `/api/stock/trending`, market indices, stock search, historical candles, news refresh, cache behavior, and provider replacement.

## Current Important Behavior

- `/trending` uses `useTrending()` from `lib/hooks/use-stock.ts`.
- The home page also uses `useTrending()` and should not use mock `useTrendingStocks()`.
- `/api/stock/trending` calls `getTrending()` in `lib/services/stock-service.ts`.
- `getTrending()` currently tries Yahoo quote data first, then falls back to `FALLBACK_QUOTES`.
- If Yahoo returns 401 or fails, the API can still return 200 with fallback/static data.

Do not call fallback data "live" or "real-time".

## Current Known Risk

Yahoo Finance quote endpoint may return:

```text
401 Unauthorized
User is unable to access this feature
```

When this happens, StockGuru returns fallback prices. This is useful for demo stability but not acceptable as paid-beta market data.

## Product Requirement

For paid beta, trending data should make source status clear:

- live provider data
- stale cached provider data
- fallback demo data

Recommended future response shape:

```ts
{
  data: TrendingStock[]
  source: 'provider' | 'cache' | 'fallback'
  updatedAt: string
  provider?: string
}
```

## SiamChart Provenance Rules

Use these rules when working on SET/mai market data:

- SiamChart is the primary Thai provider for SET/mai data; Yahoo remains fallback metadata.
- Preserve source/fallback metadata through caches. Cache full `MarketDataResult` objects when `source: 'fallback'`, warnings, or `meta` must survive cache hits.
- `searchStocksWithMeta(query)` is the provenance-aware entry point; keep `searchStocks(query)` as a compatibility wrapper.
- `/api/stock/search` should return `meta`/`cached` so UI hooks like `useSearch` can show provider/cache/fallback state.
- `/api/market/summary` should return aggregate `MarketSummaryMeta` with nested `sources`, `trading`, and `warnings`; UI must collect nested source metadata before treating `meta` as a single `MarketDataMeta`.
- SET vs mai breadth is `summary.breadthByExchange`, not `summary.breadth.set` or `summary.breadth.mai`.
- SiamChart `/query/history` can return HTTP 200 with an empty body. Treat empty/non-JSON responses as clean provider errors, use stock-table close when available, and keep fallback provenance in metadata instead of noisy raw parser logs.
- The full Thai stock universe should be returned; do not reintroduce a hard `.slice(0, 80)` in `fetchThaiStocksData`.

## Provider Replacement Checklist

When replacing market data:

1. Pick provider coverage: SET symbols first, then US if needed.
2. Verify rate limits and paid usage rules.
3. Implement provider adapter in `lib/services/stock-service.ts` or a new provider module.
4. Preserve `TrendingStock`, `StockQuote`, `StockCandle` types.
5. Cache quotes briefly: 15-120 seconds depending on endpoint.
6. Return explicit source/fallback metadata.
7. Update home, `/trending`, `/screener`, `/watchlist`, `/alerts`, and stock detail pages if response shape changes.

## Verification

Check:

```text
GET /api/stock/trending
GET /api/stock/quote?symbol=PTT.BK
GET /api/stock/history?symbol=PTT.BK&timeframe=3M
GET /trending
GET /
```

Look for:

- status 200
- no silent fallback if paid feature claims live data
- updated timestamp/source shown where user trust matters
- no horizontal overflow after data changes
