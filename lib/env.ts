import { z } from 'zod'

const envSchema = z.object({
  // AI Provider
  MIMO_API_KEY: z.string().min(1).optional(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  STRIPE_PRICE_PRO: z.string().startsWith('price_').optional(),
  STRIPE_PRICE_FOUNDING_PRO: z.string().startsWith('price_').optional(),
  STRIPE_PRICE_TRADER: z.string().startsWith('price_').optional(),

  // Cron
  CRON_SECRET: z.string().min(16).optional(),

  // Optional proxy
  YAHOO_FINANCE_PROXY: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

let parsedEnv: Env | null = null

export function getEnv(): Env {
  if (parsedEnv) return parsedEnv

  const result = envSchema.safeParse({
    MIMO_API_KEY: process.env.MIMO_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
    STRIPE_PRICE_FOUNDING_PRO: process.env.STRIPE_PRICE_FOUNDING_PRO,
    STRIPE_PRICE_TRADER: process.env.STRIPE_PRICE_TRADER,
    CRON_SECRET: process.env.CRON_SECRET,
    YAHOO_FINANCE_PROXY: process.env.YAHOO_FINANCE_PROXY,
  })

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    console.error('Environment validation failed:', issues)
    // Don't throw in browser/build to avoid breaking stub mode
    if (typeof window === 'undefined') {
      // Server-side: log but don't crash for missing optional vars
    }
  }

  parsedEnv = result.data ?? {}
  return parsedEnv
}
