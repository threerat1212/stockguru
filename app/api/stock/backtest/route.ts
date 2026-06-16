import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getHistory } from '@/lib/services/stock-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'
import { rateLimit } from '@/lib/middleware/rate-limit'
import { requireAuth } from '@/lib/subscription/server'
import type { BacktestRequest, BacktestResult, BacktestTrade, StockCandle } from '@/types/stock'

const DISCLAIMER = 'Backtest results are historical simulations for research only. They are not investment advice, forecasts, or buy/sell signals.'

const backtestRequestSchema = z.object({
  symbol: z.string().trim().min(1).max(30),
  strategy: z.enum(['sma_crossover', 'buy_and_hold']).default('sma_crossover'),
  period: z.enum(['3M', '6M', '1Y', '3m', '3month', '3months', '6m', '6month', '6months', '1y', '1year', '1years']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  params: z.object({
    initialCapital: z.number().positive().finite().optional(),
    fastPeriod: z.number().int().positive().finite().optional(),
    slowPeriod: z.number().int().positive().finite().optional(),
    rsiPeriod: z.number().int().positive().finite().optional(),
    rsiOverbought: z.number().finite().optional(),
    rsiOversold: z.number().finite().optional(),
    macdFast: z.number().int().positive().finite().optional(),
    macdSlow: z.number().int().positive().finite().optional(),
    macdSignal: z.number().int().positive().finite().optional(),
  }).optional(),
})

export async function GET() {
  return apiBadRequest('Use POST method. Body: { symbol, strategy, period }')
}

export async function POST(request: NextRequest) {
  let userId: string

  try {
    const auth = await requireAuth()
    userId = auth.userId
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return apiError(message === 'UNAUTHORIZED' ? 'กรุณาเข้าสู่ระบบก่อนใช้ backtest' : message, message === 'UPGRADE_REQUIRED' ? 403 : 401)
  }

  const rate = rateLimit(`backtest:${userId}`, { limit: 5, windowMs: 60_000 })
  if (!rate.allowed) {
    return apiError('Backtest rate limit exceeded', 429)
  }

  const body = await request.json().catch(() => null)
  const parse = backtestRequestSchema.safeParse(body)

  if (!parse.success) {
    return apiBadRequest(parse.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '))
  }

  const { symbol, strategy, period, params } = parse.data
  const upperSymbol = symbol.toUpperCase()
  const timeframe = normalizeTimeframe(period)

  try {
    const history = await getHistory(upperSymbol, timeframe)
    const candles = history.data

    if (candles.length < 30) {
      return apiBadRequest('Insufficient historical data for backtesting (need at least 30 data points)')
    }

    const result = runBacktest(candles, upperSymbol, strategy, timeframe, params as BacktestRequest['params'])
    return apiSuccess(result, { meta: history.meta })
  } catch (error) {
    return apiError((error as Error).message)
  }
}

function normalizeTimeframe(period: string | undefined): '3M' | '6M' | '1Y' {
  const normalized = (period ?? '1Y').toUpperCase()
  if (normalized.startsWith('3')) return '3M'
  if (normalized.startsWith('6')) return '6M'
  return '1Y'
}

function runBacktest(
  candles: StockCandle[],
  symbol: string,
  strategy: 'sma_crossover' | 'buy_and_hold',
  timeframe: '3M' | '6M' | '1Y',
  params?: BacktestRequest['params'],
): BacktestResult {
  const initialCapital = params?.initialCapital ?? 10000
  const fastPeriod = params?.fastPeriod ?? 10
  const slowPeriod = params?.slowPeriod ?? 30

  const trades: BacktestTrade[] = []
  const equityCurve: { date: string; value: number }[] = []

  const closes = candles.map((c) => c.close)
  const dates = candles.map((c) => c.time)

  const smaFast = computeSMA(closes, fastPeriod)
  const smaSlow = computeSMA(closes, slowPeriod)

  let cash = initialCapital
  let shares = 0
  let inPosition = false
  let peakValue = initialCapital
  let maxDrawdown = 0
  let maxDrawdownPercent = 0

  const dailyReturns: number[] = []
  let prevEquity = initialCapital

  const startIdx = Math.max(slowPeriod, 1)

  for (let i = startIdx; i < candles.length; i++) {
    const price = closes[i]
    const date = dates[i]
    let signal: 'ENTRY' | 'EXIT' | null = null
    let reason = ''

    if (strategy === 'sma_crossover') {
      if (smaFast[i] != null && smaSlow[i] != null) {
        const prevFast = smaFast[i - 1]
        const prevSlow = smaSlow[i - 1]
        if (
          !inPosition &&
          prevFast != null &&
          prevSlow != null &&
          prevFast <= prevSlow &&
          smaFast[i]! > smaSlow[i]!
        ) {
          signal = 'ENTRY'
          reason = `SMA${fastPeriod} crossed above SMA${slowPeriod}`
        }
        if (
          inPosition &&
          prevFast != null &&
          prevSlow != null &&
          prevFast >= prevSlow &&
          smaFast[i]! < smaSlow[i]!
        ) {
          signal = 'EXIT'
          reason = `SMA${fastPeriod} crossed below SMA${slowPeriod}`
        }
      }
    } else if (!inPosition && i === startIdx) {
      signal = 'ENTRY'
      reason = 'Buy-and-hold simulation entry'
    }

    if (signal === 'ENTRY' && !inPosition) {
      shares = Math.floor(cash / price)
      if (shares > 0) {
        const cost = shares * price
        cash -= cost
        inPosition = true
        trades.push({ date, action: 'ENTRY', price, shares, value: cost, reason })
      }
    } else if ((signal === 'EXIT' || (strategy === 'buy_and_hold' && i === candles.length - 1)) && inPosition) {
      const proceeds = shares * price
      cash += proceeds
      trades.push({
        date,
        action: 'EXIT',
        price,
        shares,
        value: proceeds,
        reason: signal === 'EXIT' ? reason : 'Simulation exit at end of period',
      })
      shares = 0
      inPosition = false
    }

    const equity = cash + shares * price
    equityCurve.push({ date, value: parseFloat(equity.toFixed(2)) })

    const dailyReturn = (equity - prevEquity) / prevEquity
    dailyReturns.push(dailyReturn)
    prevEquity = equity

    if (equity > peakValue) peakValue = equity
    const drawdown = peakValue - equity
    const drawdownPct = drawdown / peakValue
    if (drawdownPct > maxDrawdownPercent) {
      maxDrawdownPercent = drawdownPct
      maxDrawdown = drawdown
    }
  }

  const finalValue = cash
  const totalReturn = finalValue - initialCapital
  const totalReturnPercent = (totalReturn / initialCapital) * 100

  const numDays = candles.length
  const years = numDays / 252
  const annualizedReturn =
    years > 0 ? (Math.pow(finalValue / initialCapital, 1 / years) - 1) * 100 : 0

  const avgReturn = dailyReturns.reduce((sum, value) => sum + value, 0) / (dailyReturns.length || 1)
  const variance =
    dailyReturns.reduce((sum, value) => sum + Math.pow(value - avgReturn, 2), 0) /
    (dailyReturns.length || 1)
  const dailyVol = Math.sqrt(variance)
  const volatility = dailyVol * Math.sqrt(252) * 100
  const sharpeRatio = dailyVol > 0 ? (avgReturn * 252) / dailyVol : 0

  const entryTrades = trades.filter((trade) => trade.action === 'ENTRY')
  const exitTrades = trades.filter((trade) => trade.action === 'EXIT')
  const totalTradePairs = Math.min(entryTrades.length, exitTrades.length)

  let winningTrades = 0
  let losingTrades = 0
  let totalWinAmount = 0
  let totalLossAmount = 0

  for (let i = 0; i < totalTradePairs; i++) {
    const pnl = exitTrades[i].value - entryTrades[i].value
    if (pnl > 0) {
      winningTrades++
      totalWinAmount += pnl
    } else {
      losingTrades++
      totalLossAmount += Math.abs(pnl)
    }
  }

  const winRate = totalTradePairs > 0 ? (winningTrades / totalTradePairs) * 100 : 0
  const averageWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0
  const averageLoss = losingTrades > 0 ? totalLossAmount / losingTrades : 0
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? Infinity : 0

  const buyAndHoldStart = closes[startIdx]
  const buyAndHoldEnd = closes[closes.length - 1]
  const buyAndHoldReturn = ((buyAndHoldEnd - buyAndHoldStart) / buyAndHoldStart) * 100
  const alpha = totalReturnPercent - buyAndHoldReturn

  return {
    symbol,
    strategy,
    timeframe,
    startDate: dates[startIdx] || '',
    endDate: dates[dates.length - 1] || '',
    initialCapital,
    finalValue: parseFloat(finalValue.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    totalReturnPercent: parseFloat(totalReturnPercent.toFixed(2)),
    annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: parseFloat((maxDrawdownPercent * 100).toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(4)),
    volatility: parseFloat(volatility.toFixed(2)),
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRate: parseFloat(winRate.toFixed(2)),
    averageWin: parseFloat(averageWin.toFixed(2)),
    averageLoss: parseFloat(averageLoss.toFixed(2)),
    profitFactor: profitFactor === Infinity ? 999999 : parseFloat(profitFactor.toFixed(2)),
    buyAndHoldReturn: parseFloat(buyAndHoldReturn.toFixed(2)),
    alpha: parseFloat(alpha.toFixed(2)),
    trades,
    equityCurve,
    disclaimer: DISCLAIMER,
    isSimulation: true,
  }
}

function computeSMA(data: number[], period: number): (number | null)[] {
  const sma: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null)
    } else {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j]
      }
      sma.push(sum / period)
    }
  }
  return sma
}
