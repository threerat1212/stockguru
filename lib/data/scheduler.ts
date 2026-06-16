import { fetchSetIndexData } from './fetchers/set-index'
import { fetchThaiStocksData } from './fetchers/thai-stocks'
import { fetchCryptoData, fetchFearGreedData } from './fetchers/crypto'
import { fetchMacroData } from './fetchers/macro'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const CACHE_DIR = join(process.cwd(), 'lib', 'data', 'cache')

// Derive the value type each fetcher resolves to, without exporting the
// fetchers' private interfaces. | null marks the "fetch failed / not run" slot.
type SetIndexResult = Awaited<ReturnType<typeof fetchSetIndexData>> | null
type ThaiStocksResult = Awaited<ReturnType<typeof fetchThaiStocksData>> | null
type CryptoResult = Awaited<ReturnType<typeof fetchCryptoData>> | null
type FearGreedResult = Awaited<ReturnType<typeof fetchFearGreedData>> | null
type MacroResult = Awaited<ReturnType<typeof fetchMacroData>> | null

export interface FetchAllResults {
  setIndex: SetIndexResult
  thaiStocks: ThaiStocksResult
  crypto: CryptoResult
  fearGreed: FearGreedResult
  macro: MacroResult
  timestamp: string
}

// Ensure cache directory exists
async function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true })
  }
}

export async function fetchAllData(): Promise<FetchAllResults> {
  await ensureCacheDir()

  const results: FetchAllResults = {
    setIndex: null,
    thaiStocks: null,
    crypto: null,
    fearGreed: null,
    macro: null,
    timestamp: new Date().toISOString(),
  }

  try {
    results.setIndex = await fetchSetIndexData()
    await writeFile(join(CACHE_DIR, 'set-index.json'), JSON.stringify(results.setIndex, null, 2))
  } catch (error) {
    console.error('Error fetching SET index:', error)
  }

  try {
    results.thaiStocks = await fetchThaiStocksData()
    await writeFile(join(CACHE_DIR, 'thai-stocks.json'), JSON.stringify(results.thaiStocks, null, 2))
  } catch (error) {
    console.error('Error fetching Thai stocks:', error)
  }

  try {
    results.crypto = await fetchCryptoData()
    await writeFile(join(CACHE_DIR, 'crypto.json'), JSON.stringify(results.crypto, null, 2))
  } catch (error) {
    console.error('Error fetching crypto data:', error)
  }

  try {
    results.fearGreed = await fetchFearGreedData()
    await writeFile(join(CACHE_DIR, 'fear-greed.json'), JSON.stringify(results.fearGreed, null, 2))
  } catch (error) {
    console.error('Error fetching fear & greed data:', error)
  }

  try {
    results.macro = await fetchMacroData()
    await writeFile(join(CACHE_DIR, 'macro.json'), JSON.stringify(results.macro, null, 2))
  } catch (error) {
    console.error('Error fetching macro data:', error)
  }

  // Save summary
  await writeFile(join(CACHE_DIR, 'summary.json'), JSON.stringify(results, null, 2))

  return results
}
