export type SwarmChannel = 'twitter' | 'reddit'
export type SwarmDomain = 'stock' | 'marketing' | 'product' | 'social' | 'general'
export type SwarmSentiment = 'positive' | 'neutral' | 'negative'

export interface SwarmAgentProfile {
  id: string
  name: string
  role: string
  archetype: string
  worldview: string
  memory: string[]
  beliefs: string[]
  riskTolerance: number
  influence: number
  expertise: string[]
  tone: string
  preferredChannel: SwarmChannel
}

export interface SwarmEventInput {
  title: string
  description: string
  domain?: SwarmDomain
  timeframe?: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'longer'
  actors?: string[]
  assumptions?: string[]
}

export interface SwarmEvent extends SwarmEventInput {
  id: string
  domain: SwarmDomain
  timeframe: NonNullable<SwarmEventInput['timeframe']>
  actors: string[]
  assumptions: string[]
}

export interface SwarmPost {
  id: string
  round: number
  channelId: SwarmChannel
  agentId: string
  agentName: string
  agentRole: string
  text: string
  sentiment: SwarmSentiment
  topics: string[]
  intensity: number
  evidenceOrAssumption: 'evidence' | 'assumption' | 'risk'
}

export interface SwarmBeliefUpdate {
  id: string
  round: number
  agentId: string
  agentName: string
  before: string
  after: string
  reason: string
}

export interface SwarmScenario {
  id: string
  label: string
  probability: 'low' | 'medium' | 'high'
  outcome: string
  triggers: string[]
  whoWins: string[]
  whoLoses: string[]
  blindSpots: string[]
  risks: string[]
  opportunities: string[]
}

export interface SwarmSentimentSummary {
  positive: number
  neutral: number
  negative: number
  dominant: SwarmSentiment
  polarization: 'low' | 'medium' | 'high'
}

export interface SwarmSimulationResult {
  runId: string
  event: SwarmEvent
  agents: SwarmAgentProfile[]
  rounds: Array<{ round: number; label: string; description: string }>
  posts: SwarmPost[]
  beliefUpdates: SwarmBeliefUpdate[]
  sentiment: SwarmSentimentSummary
  scenarios: SwarmScenario[]
  risks: string[]
  opportunities: string[]
  blindSpots: string[]
  suggestedChecks: string[]
  modelPolicy: {
    mode: 'deterministic-swarm'
    paidOpenRouterModelsUsed: false
    note: string
  }
  disclaimer: string
  updatedAt: string
}
