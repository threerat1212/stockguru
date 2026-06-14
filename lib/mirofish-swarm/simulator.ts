import { getSwarmAgentProfiles } from './profiles'
import type {
  SwarmAgentProfile,
  SwarmBeliefUpdate,
  SwarmEvent,
  SwarmEventInput,
  SwarmPost,
  SwarmScenario,
  SwarmSentiment,
  SwarmSentimentSummary,
  SwarmSimulationResult,
} from './types'

const POSITIVE_WORDS = ['ดี', 'บวก', 'กำไร', 'โต', 'beat', 'launch', 'เปิดตัว', 'ลดต้นทุน', 'partnership', 'partnership', ' viral', 'ไวรัล', 'สนใจ', 'demand', 'ดีมานด์']
const NEGATIVE_WORDS = ['เสี่ยง', 'ดราม่า', 'ขาดทุน', 'ร้องเรียน', 'ผิด', 'ช้า', 'แพง', 'เลิกใช้', 'cancel', 'regulation', 'regulatory', 'guidance ต่ำ', 'sell on fact']
const HIGH_RISK_WORDS = ['ขาดทุน', 'ร้องเรียน', 'ดราม่า', 'ผิดกฎหมาย', 'regulatory', 'guidance', 'debt', 'หนี้']

const ROUND_LABELS = [
  { round: 1, label: 'Round 1 — First Reaction', description: 'แต่ละ agent ตอบสนองทันทีจากบุคลิก ความเชื่อ และความทรงจำเดิม' },
  { round: 2, label: 'Round 2 — Social Contagion', description: 'agent อ่านปฏิกิริยาของคนกลุ่มอื่น แล้วขยาย/โต้แย้ง/เปลี่ยนน้ำเสียง' },
  { round: 3, label: 'Round 3 — Second-Order Thinking', description: 'agent มองผลกระทบต่อเนื่อง จุดพัง และโอกาสที่คนอาจมองข้าม' },
]

function createEventId(event: SwarmEventInput) {
  const seed = `${event.title}|${event.description}|${Date.now()}`
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return `swarm-${hash.toString(16).slice(0, 8)}`
}

function normalizeDomain(input?: string) {
  const value = (input ?? '').toLowerCase()
  if (value.includes('marketing') || value.includes('campaign') || value.includes('แคมเปญ') || value.includes('การตลาด')) return 'marketing'
  if (value.includes('product') || value.includes('feature') || value.includes('ฟีเจอร์') || value.includes('สินค้า')) return 'product'
  if (value.includes('social') || value.includes('กระแส') || value.includes('ดราม่า')) return 'social'
  if (value.includes('stock') || value.includes('หุ้น') || value.includes('market') || value.includes('ตลาด') || value.includes('earnings')) return 'stock'
  return 'general'
}

function normalizeTimeframe(input?: string) {
  const value = (input ?? '').toUpperCase()
  if (['1D', '1W', '1M', '3M', '6M', '1Y', 'LONGER'].includes(value)) return value as SwarmEvent['timeframe']
  return '1M'
}

function extractActors(description: string, actors?: string[]) {
  const known = actors?.map((item) => item.trim()).filter(Boolean) ?? []
  const regex = /\b[A-Z]{2,6}\b|[ก-ฮA-Za-z0-9]{2,40}/g
  const matches = Array.from(new Set(description.match(regex) ?? []))
    .filter((item) => !['และ', 'หรือ', 'ถ้า', 'จะ', 'มี', 'ข่าว', 'แคมเปญ', 'ฟีเจอร์', 'หุ้น', 'ตลาด'].includes(item))
    .slice(0, 8)
  return Array.from(new Set([...known, ...matches])).slice(0, 10)
}

function buildEvent(input: SwarmEventInput): SwarmEvent {
  return {
    id: createEventId(input),
    title: input.title.trim() || 'Event simulation',
    description: input.description.trim() || input.title.trim() || 'ไม่มีรายละเอียดเหตุการณ์',
    domain: normalizeDomain(input.domain),
    timeframe: normalizeTimeframe(input.timeframe),
    actors: extractActors(`${input.title} ${input.description}`, input.actors),
    assumptions: input.assumptions?.filter(Boolean) ?? [],
  }
}

function eventScore(event: SwarmEvent) {
  const text = `${event.title} ${event.description} ${event.actors.join(' ')} ${event.assumptions.join(' ')}`.toLowerCase()
  let score = 0
  POSITIVE_WORDS.forEach((word) => {
    if (text.includes(word.toLowerCase())) score += 1
  })
  NEGATIVE_WORDS.forEach((word) => {
    if (text.includes(word.toLowerCase())) score -= 1
  })
  HIGH_RISK_WORDS.forEach((word) => {
    if (text.includes(word.toLowerCase())) score -= 1.5
  })
  return score
}

function sentimentFor(agent: SwarmAgentProfile, score: number, round: number): SwarmSentiment {
  const adjusted = score + (agent.riskTolerance - 0.5) * 1.4 + (round - 2) * 0.18
  if (adjusted > 0.75) return 'positive'
  if (adjusted < -0.75) return 'negative'
  return 'neutral'
}

function intensityFor(agent: SwarmAgentProfile, sentiment: SwarmSentiment, round: number) {
  const base = sentiment === 'neutral' ? 0.38 : sentiment === 'positive' ? 0.62 : 0.7
  return Math.max(0.2, Math.min(1, base + agent.influence * 0.25 + round * 0.04))
}

function topicFor(agent: SwarmAgentProfile, event: SwarmEvent, sentiment: SwarmSentiment) {
  const base = agent.expertise.slice(0, 2)
  if (sentiment === 'negative') return [...base, 'downside risk', 'blind spot'].slice(0, 4)
  if (sentiment === 'positive') return [...base, 'catalyst', 'opportunity'].slice(0, 4)
  return [...base, 'evidence needed'].slice(0, 4)
}

function makePost(agent: SwarmAgentProfile, event: SwarmEvent, round: number, previousPosts: SwarmPost[]): SwarmPost {
  const score = eventScore(event)
  const sentiment = sentimentFor(agent, score, round)
  const intensity = intensityFor(agent, sentiment, round)
  const topics = topicFor(agent, event, sentiment)
  const channelText = agent.preferredChannel === 'twitter'
    ? `${agent.name}: ${compactReaction(agent, event, sentiment, intensity)}`
    : `${agent.name}: ${longerReaction(agent, event, sentiment, round)}`

  const previous = previousPosts.slice(-Math.min(3, previousPosts.length))
  const reaction = previous.length > 0
    ? ` เห็นแย้ง/เสริมจากมุม ${previous.map((post) => post.agentName).join(', ')}`
    : ''

  return {
    id: `${event.id}-${round}-${agent.id}`,
    round,
    channelId: agent.preferredChannel,
    agentId: agent.id,
    agentName: agent.name,
    agentRole: agent.role,
    text: `${channelText}${reaction}`,
    sentiment,
    topics,
    intensity: Number(intensity.toFixed(2)),
    evidenceOrAssumption: sentiment === 'negative' ? 'risk' : sentiment === 'positive' ? 'assumption' : 'evidence',
  }
}

function compactReaction(agent: SwarmAgentProfile, event: SwarmEvent, sentiment: SwarmSentiment, intensity: number) {
  if (sentiment === 'positive') return `${agent.archetype} มองว่าเรื่องนี้มี narrative ชัด และอาจมีแรงซื้อ/แรงสนใจต่อ ถ้ามี evidence ตามมา`
  if (sentiment === 'negative') return `${agent.archetype} มองว่า red flag ชัด ต้องระวัง downside, ดราม่า หรือสิ่งที่ตลาดยังไม่ price in`
  return `${agent.archetype} ยังไม่ฟันธง ขอดู evidence, timeline และ reaction ของคนกลุ่มอื่นก่อน`
}

function longerReaction(agent: SwarmAgentProfile, event: SwarmEvent, sentiment: SwarmSentiment, round: number) {
  const first = agent.beliefs[0]
  const memory = agent.memory[0]
  if (sentiment === 'positive') {
    return `จาก worldview ที่ว่า ${agent.worldview} ผมมองบวกแบบมีเงื่อนไข เพราะ ${first} สิ่งที่ควรเช็กคือ catalyst, evidence และว่า upside ถูก priced in ไปแล้วหรือยัง`
  }
  if (sentiment === 'negative') {
    return `จาก memory ว่า ${memory} ผมมองว่า ${first} ดังนั้นควรรีบหา downside case, trigger ที่ทำให้ thesis ผิด และ contingency ก่อนเชื่อ narrative`
  }
  return `ผมยังไม่เปลี่ยนมุมมอง แค่ตั้งสมมติฐานจาก ${agent.expertise.join(', ')} และรอดูว่ารอบถัดไป social signal จะไปทางไหน`
}

function summarizeSentiment(posts: SwarmPost[]): SwarmSentimentSummary {
  const counts = posts.reduce((acc, post) => {
    acc[post.sentiment] += 1
    return acc
  }, { positive: 0, neutral: 0, negative: 0 } as Record<SwarmSentiment, number>)
  const total = posts.length || 1
  const positiveRatio = counts.positive / total
  const negativeRatio = counts.negative / total
  let dominant: SwarmSentiment = 'neutral'
  if (counts.positive > counts.negative && counts.positive >= counts.neutral) dominant = 'positive'
  if (counts.negative > counts.positive && counts.negative >= counts.neutral) dominant = 'negative'
  const polarization = Math.abs(positiveRatio - negativeRatio) < 0.2 ? 'low' : Math.abs(positiveRatio - negativeRatio) < 0.45 ? 'medium' : 'high'
  return { ...counts, dominant, polarization }
}

function createBeliefUpdates(agents: SwarmAgentProfile[], posts: SwarmPost[], round: number, score: number): SwarmBeliefUpdate[] {
  const updates: SwarmBeliefUpdate[] = []
  agents.forEach((agent, index) => {
    if ((index + round) % 4 !== 0) return
    const sentiment = sentimentFor(agent, score, round)
    const before = agent.beliefs[0]
    const after = sentiment === 'positive'
      ? `${before} — เห็นโอกาสเพิ่มขึ้นถ้า evidence และ momentum ยืนยัน`
      : sentiment === 'negative'
        ? `${before} — เพิ่มน้ำหนัก downside และต้องมีเงื่อนไขเปลี่ยนใจ`
        : `${before} — ยังเป็น neutral จนกว่าจะมีข้อมูลเพิ่ม`
    updates.push({
      id: `${agent.id}-update-${round}`,
      round,
      agentId: agent.id,
      agentName: agent.name,
      before,
      after,
      reason: `social signal ใน round ${round} เป็น ${sentiment} และ polarization อยู่ที่ ${summarizeSentiment(posts).polarization}`,
    })
  })
  return updates
}

function buildScenarios(event: SwarmEvent, posts: SwarmPost[], sentiment: SwarmSentimentSummary): SwarmScenario[] {
  const baseScenario: SwarmScenario = {
    id: 'base-case',
    label: 'Base Case — ตลาดตีความตาม evidence ที่มี',
    probability: sentiment.dominant === 'neutral' ? 'medium' : sentiment.dominant === 'positive' ? 'high' : 'medium',
    outcome: 'คนส่วนใหญ่รอ evidence เพิ่ม แต่ถ้า narrative ชัดและไม่มี red flag ใหญ่ จะค่อย ๆ ถูก price in ตามข้อมูลจริง',
    triggers: ['มีข้อมูลยืนยัน', 'volume/sentiment คงที่', 'ไม่มีดราม่าหรือ claim เกินจริง'],
    whoWins: ['คนที่เตรียม scenario ล่วงหน้า', 'คนที่แยก evidence กับ assumption ได้'],
    whoLoses: ['คนที่เชื่อ headline อย่างเดียว', 'คนที่เข้าช้าหลัง narrative กระจาย'],
    blindSpots: ['ตลาดอาจ price in เร็วกว่าที่คิด', 'ข้อมูลเชิงคุณภาพอาจไม่สะท้อนในตัวเลขทันที'],
    risks: ['evidence ไม่พอ', 'sentiment เปลี่ยนเร็ว', 'competitor ตอบโต้'],
    opportunities: ['ใช้ scenario นี้ทำ checklist ก่อนตัดสินใจ', 'หาจุดที่ consensus ยังไม่พูดถึง'],
  }

  const upsideScenario: SwarmScenario = {
    id: 'upside-case',
    label: 'Upside Case — narrative ถูกขยายต่อ',
    probability: sentiment.positive > sentiment.negative ? 'medium' : 'low',
    outcome: 'ถ้า hook ชัด คนเข้าใจง่าย และมี social proof ต่อเนื่อง เรื่องนี้อาจกลายเป็นกระแสหรือ catalyst ระยะสั้น',
    triggers: ['มี influencer ขยายเรื่อง', 'volume/sentiment เพิ่ม', 'มี peer หรือลูกค้าออกมาสนับสนุน'],
    whoWins: ['คนที่เข้าใจ narrative และ risk limit ชัด', 'คนที่เข้าได้ก่อน consensus เต็มตัว'],
    whoLoses: ['คนที่รอจนทุกคนรู้แล้ว', 'คนที่ไม่มีแผน exit'],
    blindSpots: ['viral อาจทำให้คนมองข้าม valuation หรือ unit economics'],
    risks: ['hype เกินจริง', 'sell on fact', 'drama ตามหลัง'],
    opportunities: ['ใช้ momentum เพื่อทดสอบสมมติฐาน ไม่ใช่เพื่อฟันธง'],
  }

  const downsideScenario: SwarmScenario = {
    id: 'downside-case',
    label: 'Downside Case — คนตีความผิดหรือเจอ red flag',
    probability: sentiment.negative > sentiment.positive ? 'medium' : 'low',
    outcome: 'ถ้ามี claim เกินจริง, evidence อ่อน, หรือ competitor/regulator ตอบโต้ สังคมอาจเปลี่ยนจากสนใจเป็นต่อต้านเร็ว',
    triggers: ['มีร้องเรียนหรือ claim ผิด', 'ข้อมูลไม่ตรงกัน', 'คู่แข่งตอบโต้แรง', 'sentiment กลับตัว'],
    whoWins: ['คนที่ตั้ง stop condition และ downside case ไว้ก่อน', 'คนที่แยก risk กับ noise ได้'],
    whoLoses: ['คนที่เข้าเพราะ FOMO', 'คนที่ไม่มี contingency'],
    blindSpots: ['ความเสี่ยงที่ดูเล็กอาจถูกขยายผ่าน social media'],
    risks: ['ดราม่า', 'regulatory scrutiny', 'loss of trust', 'liquidity drop'],
    opportunities: ['เปลี่ยน red flag เป็น checklist ก่อนลงมือจริง'],
  }

  const controversyScenario: SwarmScenario = {
    id: 'controversy-case',
    label: 'Controversy Case — แบ่งข้างและตีความคนละแบบ',
    probability: sentiment.polarization === 'high' ? 'medium' : 'low',
    outcome: 'สังคมอาจแตกเป็นสองฝั่ง: ฝ่ายเห็นด้วยมองว่าเป็นโอกาส อีกฝ่ายมองว่าเป็น red flag หรือ overhype',
    triggers: ['มีคำที่ตีความได้หลายแบบ', 'มีกลุ่มได้/เสียประโยชน์ชัด', 'มี influencer ดึงประเด็น'],
    whoWins: ['คนที่สื่อสารขอบเขตชัด', 'คนที่เตรียม FAQ และ evidence'],
    whoLoses: ['คนที่ใช้ภาษาคลุมเครือ', 'คนที่มองมุมเดียว'],
    blindSpots: ['คนละกลุ่มได้ยินคนละเรื่องจากข้อความเดียวกัน'],
    risks: ['misinterpretation', 'polarization', 'trust erosion'],
    opportunities: ['ทดสอบ messaging หลายมุมก่อนปล่อยจริง'],
  }

  return [baseScenario, upsideScenario, downsideScenario, controversyScenario]
}

function buildRisks(event: SwarmEvent, posts: SwarmPost[]) {
  const risks = [
    'confusing claim หรือ message ที่ตีความได้หลายแบบ',
    'evidence ไม่พอแยก assumption กับ fact',
    'social sentiment เปลี่ยนเร็วถ้ามีดราม่าหรือ competitor ตอบโต้',
    'ถ้าเป็นหุ้น: อาจมี sell on fact, valuation stretched, guidance risk หรือ liquidity risk',
    'ถ้าเป็นแคมเปญ: อาจเกิด backlash, low conversion หรือ support load สูง',
  ]
  if (event.domain === 'stock') {
    risks.push('market อาจ price in เร็วกว่าข้อมูลจริง')
    risks.push('รายย่อยอาจ FOMO เข้าช้า')
  }
  if (event.domain === 'marketing' || event.domain === 'product') {
    risks.push('customer อาจไม่เข้าใจ value proposition ภายในไม่กี่วินาที')
    risks.push('support/sales อาจเจอ objection เดิมซ้ำ ๆ')
  }
  return Array.from(new Set(risks)).slice(0, 8)
}

function buildOpportunities(event: SwarmEvent) {
  const base = [
    'ใช้ swarm เป็นห้องซ้อมตัดสินใจก่อนลงมือจริง',
    'แยก evidence / assumption / risk ให้ชัด',
    'ทดสอบ messaging กับ persona หลายกลุ่ม',
    'หา blind spot ที่ทีมอาจมองข้ามเพราะคิดจากมุมเดียว',
  ]
  if (event.domain === 'stock') {
    base.push('ดูว่าตลาดมองบวกจากพื้นฐานจริง หรือแค่ narrative ชั่วคราว')
    base.push('เตรียม scenario plan ถ้า sentiment เปลี่ยน')
  }
  if (event.domain === 'marketing' || event.domain === 'product') {
    base.push('ปรับ hook, FAQ และ objection handling ก่อน launch')
    base.push('หาจุดที่ลูกค้าจะเข้าใจผิดหรือรู้สึกไม่คุ้ม')
  }
  return Array.from(new Set(base)).slice(0, 8)
}

function buildBlindSpots(event: SwarmEvent, agents: SwarmAgentProfile[]) {
  const blindSpots = [
    'ทีมอาจคิดจากมุมเจ้าของมากเกินไป',
    'social signal อาจไม่เท่ากับข้อมูลจริง',
    'agent จำลองพฤติกรรมจาก persona ไม่ใช่การทำนายอนาคต',
  ]
  if (event.domain === 'stock') {
    blindSpots.push('อาจมองข้าม valuation, guidance, peer comparison หรือ liquidity')
  }
  if (event.domain === 'marketing' || event.domain === 'product') {
    blindSpots.push('อาจมองข้าม customer friction, support load และ competitor response')
  }
  agents.slice(0, 3).forEach((agent) => blindSpots.push(`${agent.name}: ${agent.beliefs[0]}`))
  return Array.from(new Set(blindSpots)).slice(0, 10)
}

function buildSuggestedChecks(event: SwarmEvent) {
  return [
    'แยก fact, assumption, risk และ unknown ให้ชัด',
    'เช็กว่า message หรือ thesis เข้าใจง่ายภายใน 10 วินาทีหรือไม่',
    'หา evidence ที่ทำให้ scenario เปลี่ยนจาก neutral เป็น positive/negative',
    'ตั้ง trigger ที่ทำให้ต้องเปลี่ยนใจหรือหยุดทำต่อ',
    'ทดสอบกับกลุ่มคนที่เห็นต่าง ไม่ใช่แค่คนที่เห็นด้วย',
  ].concat(event.domain === 'stock'
    ? ['เช็ก valuation, guidance, peer comparison, volume และ liquidity']
    : event.domain === 'marketing' || event.domain === 'product'
      ? ['เช็ก customer pain point, pricing, conversion friction, support load และ competitor response']
      : ['เช็ก stakeholder, timeline, evidence และ downside case'])
}

export function runMiroFishSwarmSimulation(input: SwarmEventInput): SwarmSimulationResult {
  const event = buildEvent(input)
  const agents = getSwarmAgentProfiles()
  const score = eventScore(event)
  const posts: SwarmPost[] = []
  const beliefUpdates: SwarmBeliefUpdate[] = []

  for (let round = 1; round <= 3; round += 1) {
    const roundPosts = agents.map((agent) => makePost(agent, event, round, posts))
    posts.push(...roundPosts)
    beliefUpdates.push(...createBeliefUpdates(agents, posts, round, score))
  }

  const sentiment = summarizeSentiment(posts)
  const scenarios = buildScenarios(event, posts, sentiment)
  const risks = buildRisks(event, posts)
  const opportunities = buildOpportunities(event)
  const blindSpots = buildBlindSpots(event, agents)
  const suggestedChecks = buildSuggestedChecks(event)

  return {
    runId: event.id,
    event,
    agents,
    rounds: ROUND_LABELS,
    posts,
    beliefUpdates,
    sentiment,
    scenarios,
    risks,
    opportunities,
    blindSpots,
    suggestedChecks,
    modelPolicy: {
      mode: 'deterministic-swarm',
      paidOpenRouterModelsUsed: false,
      note: 'ใช้ deterministic swarm personas, memory, beliefs และ simulated social channels เป็น default; ไม่ใช้ paid OpenRouter models',
    },
    disclaimer: 'ข้อมูลนี้เป็นเพียงการจำลองมุมมองของ agent เพื่อช่วยเปิดมุมคิด ไม่ใช่การทำนายอนาคต ไม่ใช่คำแนะนำการลงทุน และไม่ใช้แทนข้อมูลจริงหรือการตัดสินใจของคน',
    updatedAt: new Date().toISOString(),
  }
}
