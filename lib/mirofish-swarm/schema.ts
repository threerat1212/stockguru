import { z } from 'zod'

export const miroFishSwarmRequestSchema = z.object({
  title: z.string().min(3).max(240),
  description: z.string().min(10).max(4000),
  domain: z.enum(['stock', 'marketing', 'product', 'social', 'general']).optional(),
  timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'longer']).optional(),
  actors: z.array(z.string().max(80)).max(12).optional(),
  assumptions: z.array(z.string().max(240)).max(12).optional(),
})

export type MiroFishSwarmRequest = z.infer<typeof miroFishSwarmRequestSchema>
