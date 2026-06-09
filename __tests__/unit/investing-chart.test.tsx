import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getInvestingSetChart, normalizeInvestingSetSymbol } from '@/components/stock/InvestingChartWidget'
import InvestingChartWidget from '@/components/stock/InvestingChartWidget'

const projectSetPairs: Record<string, string> = {
  ADVANC: '102396',
  AOT: '102401',
  BA: '942605',
  BANPU: '102439',
  BBL: '102427',
  BDMS: '102447',
  BEM: '986147',
  BJC: '102442',
  CHG: '102467',
  CPALL: '102475',
  CPF: '102461',
  CPN: '102455',
  DELTA: '102484',
  EGCO: '102499',
  GULF: '1229046',
  HMPRO: '102535',
  INTUCH: '965376',
  IVL: '102540',
  KBANK: '102560',
  KCE: '102561',
  MINT: '102616',
  PSH: '994065',
  PTT: '102672',
  SCB: '1192265',
  SCC: '102725',
  SCCC: '102726',
  TISCO: '102835',
  TMB: '996219',
  TOP: '102790',
  TRUE: '102846',
  TU: '986220',
}

describe('normalizeInvestingSetSymbol', () => {
  it('maps SET route and Yahoo symbols to Investing tickers', () => {
    expect(normalizeInvestingSetSymbol('SET:PTT')).toBe('PTT')
    expect(normalizeInvestingSetSymbol('ptt.bk')).toBe('PTT')
    expect(normalizeInvestingSetSymbol('ADVANC', 'SET')).toBe('ADVANC')
  })

  it('ignores non-SET symbols', () => {
    expect(normalizeInvestingSetSymbol('NASDAQ:NVDA')).toBeNull()
    expect(normalizeInvestingSetSymbol('NVDA', 'NASDAQ')).toBeNull()
  })
})

describe('getInvestingSetChart', () => {
  it('returns Investing pair IDs for mapped Thai stocks', () => {
    expect(getInvestingSetChart('PTT.BK')?.pairId).toBe('102672')
    expect(getInvestingSetChart('SET:CPALL')?.pairId).toBe('102475')
    expect(getInvestingSetChart('AOT', 'SET')?.pairId).toBe('102401')
  })

  it('covers SET symbols referenced by the project', () => {
    for (const [symbol, pairId] of Object.entries(projectSetPairs)) {
      expect(getInvestingSetChart(`${symbol}.BK`)?.pairId).toBe(pairId)
    }
  })
})

describe('InvestingChartWidget', () => {
  it('renders the official Investing technical chart iframe', () => {
    render(<InvestingChartWidget symbol="PTT.BK" height={520} />)

    const iframe = screen.getByTestId('investing-chart')
    expect(iframe).toHaveAttribute('data-symbol', 'PTT')
    expect(iframe).toHaveAttribute('data-pair-id', '102672')

    const src = iframe.getAttribute('src') ?? ''
    expect(src).toContain('https://ssltvc.investing.com/?')
    expect(src).toContain('pair_ID=102672')
    expect(src).toContain('interval=86400')
    expect(src).toContain('plotStyle=candles')
    expect(src).toContain('timezone_ID=21')
  })
})
