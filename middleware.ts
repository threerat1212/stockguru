import { type NextRequest, NextResponse } from 'next/server'
import { canAccessFeature, type FeatureKey } from '@/lib/subscription/plan-utils'

const PROTECTED_ROUTES = ['/portfolio', '/compare', '/journal']
const PAID_ROUTE_FEATURES: Record<string, FeatureKey> = {
  '/compare': 'compare',
  '/portfolio': 'portfolio',
}

export async function middleware(request: NextRequest) {
  // Skip if Supabase env vars are not set (build time or local dev without auth)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  const { updateSession } = await import('@/lib/supabase/middleware')
  const { response, session, plan: sessionPlan } = await updateSession(request)

  // Auth gate: protected routes require login
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_ROUTES.some((route) => path.startsWith(route))

  if (isProtected && !session?.user) {
    const redirect = new URL('/pricing', request.url)
    redirect.searchParams.set('reason', 'auth_required')
    return NextResponse.redirect(redirect)
  }

  const paidFeature = Object.entries(PAID_ROUTE_FEATURES).find(([route]) => path.startsWith(route))?.[1]
  if (paidFeature && !canAccessFeature(sessionPlan ?? 'free', paidFeature)) {
    const redirect = new URL('/pricing', request.url)
    redirect.searchParams.set('reason', `${paidFeature}_required`)
    return NextResponse.redirect(redirect)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
