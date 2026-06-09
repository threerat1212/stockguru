import yahooFinance from 'yahoo-finance2'

interface MacroData {
  usdThb: number
  fedRate: number
  oilPrice: number
  goldPrice: number
  vix: number
  timestamp: string
}

export async function fetchMacroData(): Promise<MacroData> {
  try {
    // Fetch USD/THB exchange rate
    let usdThb = 0
    try {
      const usdThbResult = await yahooFinance.quote('THB=X')
      usdThb = usdThbResult.regularMarketPrice || 0
    } catch (e) {
      console.log('Failed to fetch USD/THB')
    }

    // Fetch Fed rate (using 10-year Treasury yield as proxy)
    let fedRate = 0
    try {
      const fedRateResult = await yahooFinance.quote('^TNX')
      fedRate = (fedRateResult.regularMarketPrice || 0) / 100
    } catch (e) {
      console.log('Failed to fetch Fed rate')
    }

    // Fetch oil price (WTI)
    let oilPrice = 0
    try {
      const oilResult = await yahooFinance.quote('CL=F')
      oilPrice = oilResult.regularMarketPrice || 0
    } catch (e) {
      console.log('Failed to fetch oil price')
    }

    // Fetch gold price
    let goldPrice = 0
    try {
      const goldResult = await yahooFinance.quote('GC=F')
      goldPrice = goldResult.regularMarketPrice || 0
    } catch (e) {
      console.log('Failed to fetch gold price')
    }

    // Fetch VIX
    let vix = 0
    try {
      const vixResult = await yahooFinance.quote('^VIX')
      vix = vixResult.regularMarketPrice || 0
    } catch (e) {
      console.log('Failed to fetch VIX')
    }

    return {
      usdThb,
      fedRate,
      oilPrice,
      goldPrice,
      vix,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error fetching macro data:', error)
    throw error
  }
}
