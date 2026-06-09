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
    // Fetch USD/THB from free API
    let usdThb = 0
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      const data = await response.json()
      usdThb = data.rates?.THB || 0
    } catch (e) {
      console.log('Failed to fetch USD/THB from exchangerate-api')
    }

    // Fetch Fed rate from FRED API (using 10-year Treasury yield as proxy)
    let fedRate = 0
    try {
      const response = await fetch('https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=K9p7LhCZJt6bN8KgM8sB&file_type=json&sort_order=desc&limit=1')
      const data = await response.json()
      if (data.observations && data.observations.length > 0) {
        fedRate = parseFloat(data.observations[0].value) / 100
      }
    } catch (e) {
      console.log('Failed to fetch Fed rate from FRED')
    }

    // Fetch oil price from free API
    let oilPrice = 0
    try {
      const response = await fetch('https://api.oilprice.com/v1/spot-price')
      const data = await response.json()
      oilPrice = data.price || 0
    } catch (e) {
      console.log('Failed to fetch oil price')
    }

    // Fetch gold price from free API
    let goldPrice = 0
    try {
      const response = await fetch('https://api.metals-api.com/v1/latest?access_key=demo&base=USD&symbols=XAU')
      const data = await response.json()
      goldPrice = data.rates?.XAU || 0
    } catch (e) {
      console.log('Failed to fetch gold price')
    }

    // Fetch VIX from free API
    let vix = 0
    try {
      const response = await fetch('https://www.alphavantage.co/query?function=VIX&interval=daily&apikey=demo')
      const data = await response.json()
      if (data['Time Series (Daily)']) {
        const latestDate = Object.keys(data['Time Series (Daily)'])[0]
        vix = parseFloat(data['Time Series (Daily)'][latestDate]['4. close'])
      }
    } catch (e) {
      console.log('Failed to fetch VIX')
    }

    // If any values are still 0, use reasonable fallbacks
    if (usdThb === 0) usdThb = 36.5
    if (fedRate === 0) fedRate = 0.0525
    if (oilPrice === 0) oilPrice = 75.0
    if (goldPrice === 0) goldPrice = 2350.0
    if (vix === 0) vix = 15.0

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
    // Return fallback data on complete failure
    return {
      usdThb: 36.5,
      fedRate: 0.0525,
      oilPrice: 75.0,
      goldPrice: 2350.0,
      vix: 15.0,
      timestamp: new Date().toISOString(),
    }
  }
}
