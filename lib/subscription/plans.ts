export type Plan = 'free' | 'pro' | 'founding_pro' | 'trader'

export interface PlanLimits {
  aiQuestionsDay: number
  aiQuestionsMonth: number
  watchlist: number
  alerts: number
  features: Record<string, boolean>
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    aiQuestionsDay: 3,
    aiQuestionsMonth: 90,
    watchlist: 10,
    alerts: 3,
    features: {
      advancedScreener: false,
      compare: false,
      portfolio: false,
      newsImpact: false,
      exportCsv: false,
      agentLoop: false,
    },
  },
  pro: {
    aiQuestionsDay: 9999,
    aiQuestionsMonth: 300,
    watchlist: 200,
    alerts: 100,
    features: {
      advancedScreener: true,
      compare: true,
      portfolio: true,
      newsImpact: true,
      exportCsv: true,
      agentLoop: true,
    },
  },
  founding_pro: {
    aiQuestionsDay: 9999,
    aiQuestionsMonth: 300,
    watchlist: 200,
    alerts: 100,
    features: {
      advancedScreener: true,
      compare: true,
      portfolio: true,
      newsImpact: true,
      exportCsv: true,
      agentLoop: true,
    },
  },
  trader: {
    aiQuestionsDay: 9999,
    aiQuestionsMonth: 999999,
    watchlist: 999999,
    alerts: 999999,
    features: {
      advancedScreener: true,
      compare: true,
      portfolio: true,
      newsImpact: true,
      exportCsv: true,
      agentLoop: true,
    },
  },
}
