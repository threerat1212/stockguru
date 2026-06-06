import type { StockCandle } from '@/types/stock'

export function calculateSMA(data: StockCandle[], period: number): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = []
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    result.push({ time: data[i].time, value: sum / period })
  }
  return result
}

export function calculateEMA(data: StockCandle[], period: number): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = []
  const multiplier = 2 / (period + 1)

  // First EMA = SMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i].close
  }
  let ema = sum / period
  result.push({ time: data[period - 1].time, value: ema })

  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema
    result.push({ time: data[i].time, value: ema })
  }
  return result
}

export function calculateRSI(data: StockCandle[], period = 14): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = []
  const changes: number[] = []

  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close)
  }

  for (let i = period; i < changes.length; i++) {
    let gains = 0
    let losses = 0
    for (let j = 0; j < period; j++) {
      if (changes[i - j] > 0) gains += changes[i - j]
      else losses += Math.abs(changes[i - j])
    }
    const avgGain = gains / period
    const avgLoss = losses / period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsi = 100 - 100 / (1 + rs)
    result.push({ time: data[i + 1].time, value: rsi })
  }
  return result
}

export function calculateMACD(
  data: StockCandle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: { time: string; value: number }[]; signal: { time: string; value: number }[]; histogram: { time: string; value: number }[] } {
  const fastEMA = calculateEMA(data, fastPeriod)
  const slowEMA = calculateEMA(data, slowPeriod)

  const macdLine: { time: string; value: number }[] = []
  const slowStart = slowPeriod - fastPeriod

  for (let i = 0; i < slowEMA.length; i++) {
    const fastVal = fastEMA[i + slowStart]?.value
    if (fastVal !== undefined) {
      macdLine.push({ time: slowEMA[i].time, value: fastVal - slowEMA[i].value })
    }
  }

  // Signal line = EMA of MACD
  const signal: { time: string; value: number }[] = []
  if (macdLine.length >= signalPeriod) {
    let sum = 0
    for (let i = 0; i < signalPeriod; i++) {
      sum += macdLine[i].value
    }
    let ema = sum / signalPeriod
    signal.push({ time: macdLine[signalPeriod - 1].time, value: ema })

    const multiplier = 2 / (signalPeriod + 1)
    for (let i = signalPeriod; i < macdLine.length; i++) {
      ema = (macdLine[i].value - ema) * multiplier + ema
      signal.push({ time: macdLine[i].time, value: ema })
    }
  }

  // Histogram
  const histogram: { time: string; value: number }[] = []
  for (let i = 0; i < signal.length; i++) {
    const macdVal = macdLine.find(m => m.time === signal[i].time)?.value ?? 0
    histogram.push({ time: signal[i].time, value: macdVal - signal[i].value })
  }

  return { macd: macdLine, signal, histogram }
}

/**
 * Bollinger Bands (20-period SMA ± 2 standard deviations)
 */
export function calculateBollingerBands(
  data: StockCandle[],
  period = 20,
  stdDevMultiplier = 2
): {
  upper: { time: string; value: number }[]
  middle: { time: string; value: number }[]
  lower: { time: string; value: number }[]
} {
  const upper: { time: string; value: number }[] = []
  const middle: { time: string; value: number }[] = []
  const lower: { time: string; value: number }[] = []

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    const sma = sum / period

    let sumSqDiff = 0
    for (let j = 0; j < period; j++) {
      sumSqDiff += (data[i - j].close - sma) ** 2
    }
    const stdDev = Math.sqrt(sumSqDiff / period)

    const time = data[i].time
    middle.push({ time, value: sma })
    upper.push({ time, value: sma + stdDevMultiplier * stdDev })
    lower.push({ time, value: sma - stdDevMultiplier * stdDev })
  }

  return { upper, middle, lower }
}
