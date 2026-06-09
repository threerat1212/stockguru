interface CryptoData {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  marketCap: number
  volume24h: number
  timestamp: string
}

interface FearGreedData {
  value: number
  classification: string
  timestamp: string
}

export async function fetchCryptoData(): Promise<CryptoData[]> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'
    )
    const data = await response.json()

    const cryptoMap: Record<string, { name: string; symbol: string }> = {
      bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
      ethereum: { name: 'Ethereum', symbol: 'ETH' },
      solana: { name: 'Solana', symbol: 'SOL' },
    }

    return Object.entries(data).map(([id, coin]: [string, any]) => ({
      symbol: cryptoMap[id].symbol,
      name: cryptoMap[id].name,
      price: coin.usd,
      change24h: coin.usd_24h_change,
      changePercent24h: coin.usd_24h_change,
      marketCap: coin.usd_market_cap,
      volume24h: coin.usd_24h_vol,
      timestamp: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('Error fetching crypto data:', error)
    throw error
  }
}

export async function fetchFearGreedData(): Promise<FearGreedData> {
  try {
    const response = await fetch('https://api.alternative.me/fng/')
    const data = await response.json()

    return {
      value: data.data[0].value,
      classification: data.data[0].value_classification,
      timestamp: data.data[0].timestamp,
    }
  } catch (error) {
    console.error('Error fetching fear & greed data:', error)
    throw error
  }
}
