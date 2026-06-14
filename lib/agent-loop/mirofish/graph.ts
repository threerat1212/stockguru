import type { DebateGraph } from './types'

const BASE_NODES = [
  { id: 'seed', label: 'Seed Extractor', role: 'seed' as const },
  { id: 'moderator', label: 'Moderator Agent', role: 'agent' as const },
  { id: 'data', label: 'Market Data Agent', role: 'agent' as const },
  { id: 'technical', label: 'Technical Agent', role: 'agent' as const },
  { id: 'fundamental', label: 'Fundamental Agent', role: 'agent' as const },
  { id: 'news', label: 'News Agent', role: 'agent' as const },
  { id: 'portfolio', label: 'Portfolio Agent', role: 'agent' as const },
  { id: 'risk', label: 'Risk Agent', role: 'agent' as const },
  { id: 'contrarian', label: 'Contrarian Agent', role: 'agent' as const },
  { id: 'reporter', label: 'Reporter Agent', role: 'synthesis' as const },
  { id: 'verifier', label: 'Verifier Gate', role: 'gate' as const },
]

export function buildDebateGraph() {
  const edges: DebateGraph['edges'] = [
    { from: 'seed', to: 'moderator', label: 'question → debate brief' },
    { from: 'moderator', to: 'data', label: 'assign data scope' },
    { from: 'moderator', to: 'technical', label: 'assign technical scope' },
    { from: 'moderator', to: 'fundamental', label: 'assign fundamental scope' },
    { from: 'moderator', to: 'news', label: 'assign news scope' },
    { from: 'moderator', to: 'portfolio', label: 'assign portfolio scope' },
    { from: 'data', to: 'risk', label: 'data gaps → risk' },
    { from: 'technical', to: 'risk', label: 'technical risk → risk' },
    { from: 'fundamental', to: 'risk', label: 'valuation/liquidity risk → risk' },
    { from: 'news', to: 'risk', label: 'catalyst risk → risk' },
    { from: 'portfolio', to: 'risk', label: 'holding gap → risk' },
    { from: 'data', to: 'contrarian', label: 'challenge data coverage' },
    { from: 'technical', to: 'contrarian', label: 'challenge chart interpretation' },
    { from: 'fundamental', to: 'contrarian', label: 'challenge valuation assumptions' },
    { from: 'news', to: 'contrarian', label: 'challenge news narrative' },
    { from: 'risk', to: 'reporter', label: 'risk checklist → report' },
    { from: 'contrarian', to: 'reporter', label: 'counterpoints → report' },
    { from: 'reporter', to: 'verifier', label: 'draft answer → safety gate' },
  ]

  return { nodes: BASE_NODES, edges } satisfies DebateGraph
}
