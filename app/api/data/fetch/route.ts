import { NextResponse } from 'next/server'
import { fetchAllData } from '@/lib/data/scheduler'

export async function POST(request: Request) {
  try {
    const results = await fetchAllData()
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
