import { NextRequest } from 'next/server'
import { getHistory } from '@/lib/services/stock-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'
import type { BacktestRequest, BacktestResult, BacktestTrade, StockCandle } from '@/types/stock'

/**
 * POST /api/stock/backtest
 * Body: { symbol, strategy, period }
 *
 * Implements SMA crossover backtest:
 *   - Fetches historical data
 *   - Calculates SMA(short) vs SMA(long)
 *   - Simulates buy/sell signals
 *   - Returns P&L statistics
 *
 * Supported strategies: sma_crossover (default), buy_and_hold
 */
export async function GET() {
  return apiBadRequest('Use POST method. Body: { symbol, strategy, period }')
}

export async function POST(request: NextRequest) {
  let body: BacktestRequest

  try {
    body = await request.json()
  } catch {
    return apiBadRequest('Invalid JSON body')
  }

  const { symbol, strategy, startDate, endDate, params } = body

  if (!symbol || typeof symbol !== 'string') {
    return apiBadRequest('Missing required field: symbol')
  }

  const validStrategies = ['sma_crossover', 'rsi', 'macd', 'buy_and_hold']
  const selectedStrategy = strategy || 'sma_crossover'
  if (!validStrategies.includes(selectedStrategy)) {
    return apiBadRequest(`Invalid strategy. Must be one of: ${validStrategies.join(', ')}`)
  }

  // Determine period — either from explicit dates or a shorthand
  let timeframe: '6M' | '1Y' | '3M' = '1Y'

  // Accept either startDate/endDate or period shorthand
  const period = (body as any).period as string | undefined
  if (period) {
    switch (period.toLowerCase()) {
      case '3m': case '3month': case '3months': timeframe = '3M'; break
      case '6m': case '6month': case '6months': timeframe = '6M'; break
      case '1y': case '1year': case '1years': timeframe = '1Y'; break
      default: timeframe = '1Y'
    }
  }

  try {
    const candles = await getHistory(symbol.trim().toUpperCase(), timeframe)

    if (candles.length < 30) {
      return apiBadRequest('Insufficient historical data for backtesting (need at least 30 data points)')
    }

    const result = runBacktest(candles, selectedStrategy, params)
    return apiSuccess(result)
  } catch (error) {
    return apiError((error as Error).message)
  }
}

// ─── Backtest Engine ─────────────────────────────────────────────

function runBacktest(
  candles: StockCandle[],
  strategy: string,
  params?: BacktestRequest['params'],
): BacktestResult {
  const initialCapital = params?.initialCapital ?? 10000
  const fastPeriod = params?.fastPeriod ?? 10
  const slowPeriod = params?.slowPeriod ?? 30

  const trades: BacktestTrade[] = []
  const equityCurve: { date: string; value: number }[] = []

  const closes = candles.map((c) => c.close)
  const dates = candles.map((c) => c.time)

  // Pre-compute SMAs for crossover strategy
  const smaFast = computeSMA(closes, fastPeriod)
  const smaSlow = computeSMA(closes, slowPeriod)

  let cash = initialCapital
  let shares = 0
  let inPosition = false
  let peakValue = initialCapital
  let maxDrawdown = 0
  let maxDrawdownPercent = 0

  // Track returns for Sharpe/volatility
  const dailyReturns: number[] = []
  let prevEquity = initialCapital

  const startIdx = Math.max(slowPeriod, 1) // need enough data for SMA

  for (let i = startIdx; i < candles.length; i++) {
    const price = closes[i]
    const date = dates[i]
    let signal: 'BUY' | 'SELL' | null = null
    let reason = ''

    if (strategy === 'sma_crossover') {
      if (smaFast[i] != null && smaSlow[i] != null) {
        const prevFast = smaFast[i - 1]
        const prevSlow = smaSlow[i - 1]
        // Golden cross: fast crosses above slow → BUY
        if (
          !inPosition &&
          prevFast != null &&
          prevSlow != null &&
          prevFast <= prevSlow &&
          smaFast[i]! > smaSlow[i]!
        ) {
          signal = 'BUY'
          reason = `Golden cross: SMA${fastPeriod} (${smaFast[i]!.toFixed(2)}) crossed above SMA${slowPeriod} (${smaSlow[i]!.toFixed(2)})`
        }
        // Death cross: fast crosses below slow → SELL
        if (
          inPosition &&
          prevFast != null &&
          prevSlow != null &&
          prevFast >= prevSlow &&
          smaFast[i]! < smaSlow[i]!
        ) {
          signal = 'SELL'
          reason = `Death cross: SMA${fastPeriod} (${smaFast[i]!.toFixed(2)}) crossed below SMA${slowPeriod} (${smaSlow[i]!.toFixed(2)})`
        }
      }
    } else if (strategy === 'buy_and_hold') {
      if (!inPosition && i === startIdx) {
        signal = 'BUY'
        reason = 'Buy and hold entry'
      }
      if (inPosition && i === candles.length - 1) {
        signal = 'SELL'
        reason = 'Buy and hold exit (end of period)'
      }
    } else {
      // Default to buy_and_hold for unrecognized strategies
      if (!inPosition && i === startIdx) {
        signal = 'BUY'
        reason = 'Default strategy entry'
      }
      if (inPosition && i === candles.length - 1) {
        signal = 'SELL'
        reason = 'Default strategy exit (end of period)'
      }
    }

    // Execute signals
    if (signal === 'BUY' && !inPosition) {
      shares = Math.floor(cash / price)
      if (shares > 0) {
        const cost = shares * price
        cash -= cost
        inPosition = true
        trades.push({ date, action: 'BUY', price, shares, value: cost, reason })
      }
    } else if (signal === 'SELL' && inPosition) {
      const proceeds = shares * price
      cash += proceeds
      trades.push({ date, action: 'SELL', price, shares, value: proceeds, reason })
      shares = 0
      inPosition = false
    }

    // Track equity
    const equity = cash + shares * price
    equityCurve.push({ date, value: parseFloat(equity.toFixed(2)) })

    // Daily return
    const dailyReturn = (equity - prevEquity) / prevEquity
    dailyReturns.push(dailyReturn)
    prevEquity = equity

    // Max drawdown
    if (equity > peakValue) peakValue = equity
    const drawdown = peakValue - equity
    const drawdownPct = drawdown / peakValue
    if (drawdownPct > maxDrawdownPercent) {
      maxDrawdownPercent = drawdownPct
      maxDrawdown = drawdown
    }
  }

  // Close any open position at the last price
  if (inPosition && shares > 0) {
    const lastPrice = closes[closes.length - 1]
    const lastDate = dates[dates.length - 1]
    const proceeds = shares * lastPrice
    cash += proceeds
    trades.push({
      date: lastDate,
      action: 'SELL',
      price: lastPrice,
      shares,
      value: proceeds,
      reason: 'Position closed at end of backtest',
    })
    shares = 0
    inPosition = false
  }

  const finalValue = cash
  const totalReturn = finalValue - initialCapital
  const totalReturnPercent = (totalReturn / initialCapital) * 100

  // Annualized return
  const numDays = candles.length
  const years = numDays / 252 // trading days
  const annualizedReturn =
    years > 0 ? (Math.pow(finalValue / initialCapital, 1 / years) - 1) * 100 : 0

  // Volatility (annualized)
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1)
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    (dailyReturns.length || 1)
  const dailyVol = Math.sqrt(variance)
  const volatility = dailyVol * Math.sqrt(252) * 100

  // Sharpe ratio (assuming 0% risk-free rate for simplicity)
  const annualizedDailyReturn = avgReturn * 252
  const sharpeRatio = dailyVol > 0 ? annualizedDailyReturn / dailyVol : 0

  // Trade statistics
  const buyTrades = trades.filter((t) => t.action === 'BUY')
  const sellTrades = trades.filter((t) => t.action === 'SELL')
  const totalTradePairs = Math.min(buyTrades.length, sellTrades.length)

  let winningTrades = 0
  let losingTrades = 0
  let totalWinAmount = 0
  let totalLossAmount = 0

  for (let i = 0; i < totalTradePairs; i++) {
    const pnl = sellTrades[i].value - buyTrades[i].value
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

  // Buy-and-hold benchmark
  const buyAndHoldStart = closes[startIdx]
  const buyAndHoldEnd = closes[closes.length - 1]
  const buyAndHoldReturn = ((buyAndHoldEnd - buyAndHoldStart) / buyAndHoldStart) * 100
  const alpha = totalReturnPercent - buyAndHoldReturn

  return {
    symbol: candles[0]?.time ? 'N/A' : 'N/A', // symbol not in candle data
    strategy,
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
  }
}

/** Compute Simple Moving Average for a series */
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
