import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Session } from '@supabase/supabase-js'
import { canAccessFeature, effectivePlan, type FeatureKey } from '@/lib/subscription/plan-utils'
import type { Plan } from '@/lib/subscription/plans'

export interface SessionResult {
  response: NextResponse
  session: Session | null
  plan: Plan | null
}

export async function updateSession(request: NextRequest): Promise<SessionResult> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return { response, session: null, plan: null }
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  let plan: Plan | null = null

  if (session?.user) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', session.user.id)
      .single()

    plan = effectivePlan(subscription?.plan, subscription?.status)
  }

  return { response, session, plan }
}
