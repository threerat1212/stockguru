import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
    },
  })
}
