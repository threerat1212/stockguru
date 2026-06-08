import { NextRequest } from 'next/server'
import WebSocket from 'ws'
import { getQuote } from '@/lib/services/stock-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RealtimeMarket = 'US' | 'SET' | 'GLOBAL'
type RealtimeSource = 'finnhub' | 'yahoo'

interface NormalizedRealtimeSymbol {
  symbol: string
  market: RealtimeMarket
  source: RealtimeSource
}

const encoder = new TextEncoder()
const US_EXCHANGES = new Set(['NASDAQ', 'NYSE', 'AMEX', 'ARCA', 'OTC'])

function normalizeRealtimeSymbol(value: string): NormalizedRealtimeSymbol | null {
  const raw = value.trim().toUpperCase()
  if (!raw) return null

  if (raw.includes(':')) {
    const [exchange, ...rest] = raw.split(':')
    const ticker = rest.join(':').trim()
    if (!ticker) return null
    if (exchange === 'SET') {
      return { symbol: `${ticker.replace(/\.BK$/, '')}.BK`, market: 'SET', source: 'yahoo' }
    }
    if (US_EXCHANGES.has(exchange)) {
      return { symbol: ticker, market: 'US', source: 'finnhub' }
    }
    return { symbol: raw, market: 'GLOBAL', source: 'finnhub' }
  }

  if (raw.endsWith('.BK')) {
    return { symbol: raw, market: 'SET', source: 'yahoo' }
  }

  return { symbol: raw, market: 'US', source: 'finnhub' }
}

function sse(payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
}

function streamYahooPolling(
  controller: ReadableStreamDefaultController<Uint8Array>,
  symbol: string,
  market: RealtimeMarket,
  closeState: { closed: boolean; timers: NodeJS.Timeout[] }
) {
  const poll = async () => {
    if (closeState.closed) return
    try {
      const result = await getQuote(symbol)
      controller.enqueue(
        sse({
          type: 'price',
          symbol: result.data.symbol,
          price: result.data.price,
          timestamp: result.data.timestamp,
          volume: result.data.volume,
          source: 'yahoo',
          market,
          isDemo: result.meta.isDemo,
        })
      )
    } catch (error) {
      controller.enqueue(
        sse({
          type: 'error',
          symbol,
          message: (error as Error).message,
          source: 'yahoo',
          market,
        })
      )
    }
  }

  poll()
  closeState.timers.push(setInterval(poll, market === 'SET' ? 5000 : 15000))
}

function streamFinnhub(
  controller: ReadableStreamDefaultController<Uint8Array>,
  symbol: string,
  market: RealtimeMarket,
  closeState: { closed: boolean; timers: NodeJS.Timeout[]; socket?: WebSocket }
) {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    controller.enqueue(
      sse({
        type: 'error',
        symbol,
        message: 'Missing FINNHUB_API_KEY',
        source: 'finnhub',
        market,
      })
    )
    streamYahooPolling(controller, symbol, market, closeState)
    return
  }

  const socket = new WebSocket(`wss://ws.finnhub.io?token=${encodeURIComponent(apiKey)}`)
  closeState.socket = socket

  socket.on('open', () => {
    socket.send(JSON.stringify({ type: 'subscribe', symbol }))
  })

  socket.on('message', (data) => {
    if (closeState.closed) return
    try {
      const message = JSON.parse(data.toString())
      if (message.type === 'error') {
        controller.enqueue(
          sse({
            type: 'error',
            symbol,
            message: String(message.msg ?? message.message ?? 'Finnhub stream error'),
            source: 'finnhub',
            market,
          })
        )
        socket.close()
        return
      }

      if (message.type !== 'trade' || !Array.isArray(message.data)) return

      for (const trade of message.data) {
        if (typeof trade.p !== 'number') continue
        controller.enqueue(
          sse({
            type: 'price',
            symbol: String(trade.s ?? symbol),
            price: trade.p,
            timestamp: typeof trade.t === 'number' ? trade.t : Date.now(),
            volume: typeof trade.v === 'number' ? trade.v : undefined,
            source: 'finnhub',
            market,
          })
        )
      }
    } catch (error) {
      controller.enqueue(
        sse({
          type: 'error',
          symbol,
          message: (error as Error).message,
          source: 'finnhub',
          market,
        })
      )
    }
  })

  socket.on('error', () => {
    if (closeState.closed) return
    controller.enqueue(
      sse({
        type: 'error',
        symbol,
        message: 'Finnhub WebSocket connection failed',
        source: 'finnhub',
        market,
      })
    )
  })

  socket.on('close', () => {
    if (closeState.closed) return
    streamYahooPolling(controller, symbol, market, closeState)
  })
}

export async function GET(request: NextRequest) {
  const rawSymbol = request.nextUrl.searchParams.get('symbol') ?? ''
  const normalized = normalizeRealtimeSymbol(rawSymbol)

  if (!normalized) {
    return new Response(JSON.stringify({ error: 'Missing symbol' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const closeState: { closed: boolean; timers: NodeJS.Timeout[]; socket?: WebSocket } = {
        closed: false,
        timers: [],
      }

      const close = () => {
        if (closeState.closed) return
        closeState.closed = true
        closeState.timers.forEach((timer) => clearInterval(timer))
        if (closeState.socket?.readyState === WebSocket.OPEN) {
          closeState.socket.send(JSON.stringify({ type: 'unsubscribe', symbol: normalized.symbol }))
        }
        closeState.socket?.close()
      }

      request.signal.addEventListener('abort', close)
      closeState.timers.push(
        setInterval(() => {
          if (!closeState.closed) controller.enqueue(sse({ type: 'heartbeat', timestamp: Date.now() }))
        }, 25000)
      )

      if (normalized.source === 'yahoo') {
        streamYahooPolling(controller, normalized.symbol, normalized.market, closeState)
      } else {
        streamFinnhub(controller, normalized.symbol, normalized.market, closeState)
      }
    },
    cancel() {
      // Cleanup is driven by the request abort signal in Next.js.
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
