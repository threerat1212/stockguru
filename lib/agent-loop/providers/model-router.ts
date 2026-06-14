import type { DebateIntent, DebateSeed } from '../mirofish/types'

export type WarRoomModelProvider = 'openrouter' | 'mimo' | 'deepseek'

export type WarRoomModelPhase = 'research' | 'reasoning' | 'quant' | 'thai' | 'fast' | 'reporter' | 'verifier'

export interface WarRoomModelProfile {
  id: string
  provider: WarRoomModelProvider
  phase: WarRoomModelPhase
  label: string
  strengths: string[]
  cautions: string[]
  bestFor: DebateIntent[]
}

export interface WarRoomModelSelection {
  phase: WarRoomModelPhase
  agentId: string
  agentLabel: string
  modelId: string
  provider: WarRoomModelProvider
  reason: string
}

export const WAR_ROOM_MODEL_PROFILES: WarRoomModelProfile[] = [
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: 'openrouter',
    phase: 'research',
    label: 'Nemotron 3 Ultra',
    strengths: ['deep reasoning', 'long context', 'research planning', 'multi-step analysis'],
    cautions: ['free quota/latency อาจไม่เสถียร', 'ไม่ควรใช้ทุก agent เพื่อคุม cost'],
    bestFor: ['fundamental', 'risk', 'general'],
  },
  {
    id: 'nex-agi/nex-n2-pro:free',
    provider: 'openrouter',
    phase: 'reasoning',
    label: 'Nex-N2-Pro',
    strengths: ['agentic workflow', 'structured output', 'tool/reasoning coverage', 'Thai/Qwen base'],
    cautions: ['model ใหม่ ต้อง validate กับคำถามจริง', 'free availability อาจเปลี่ยน'],
    bestFor: ['general', 'news', 'portfolio', 'technical'],
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    provider: 'openrouter',
    phase: 'reporter',
    label: 'Nemotron 3 Super',
    strengths: ['balanced multi-agent reasoning', 'long context', 'better throughput than Ultra'],
    cautions: ['คุณภาพอาจรอง Ultra ในงานยาวมาก', 'ยังต้อง verifier gate'],
    bestFor: ['general', 'technical', 'news', 'portfolio'],
  },
  {
    id: 'google/gemma-4-31b-it:free',
    provider: 'openrouter',
    phase: 'thai',
    label: 'Gemma 4 31B IT',
    strengths: ['multilingual', 'Thai-friendly rewrite', 'balanced reasoning', 'document understanding'],
    cautions: ['deep financial research อาจไม่เท่า Ultra/Nex', 'ควรใช้สรุป/ปรับภาษา ไม่ใช้ฟันธง'],
    bestFor: ['general', 'news', 'risk'],
  },
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    phase: 'quant',
    label: 'DeepSeek Chat',
    strengths: ['reasoning', 'structured calculation', 'risk math', 'concise analysis'],
    cautions: ['ใช้ DeepSeek API key แยกจาก OpenRouter', 'ไม่ใช่ข้อมูลตลาดไทยโดยตรง'],
    bestFor: ['portfolio', 'risk', 'technical'],
  },
  {
    id: 'mimo-v2.5-pro',
    provider: 'mimo',
    phase: 'thai',
    label: 'Xiaomi MiMo',
    strengths: ['Thai explanation', 'concise business writing', 'disclaimer/risk wording', 'low-latency assistant'],
    cautions: ['ไม่ควรถือเป็น market-data source', 'ต้องใช้ evidence จาก StockGuru/data agents'],
    bestFor: ['general', 'news', 'risk'],
  },
  {
    id: 'poolside/laguna-m.1:free',
    provider: 'openrouter',
    phase: 'fast',
    label: 'Laguna M.1',
    strengths: ['coding agent', 'software engineering', 'tool calling'],
    cautions: ['ไม่เหมาะเป็น default สำหรับ market debate', 'ภาษาไทย/finance อาจไม่บาลานซ์'],
    bestFor: [],
  },
  {
    id: 'poolside/laguna-xs.2:free',
    provider: 'openrouter',
    phase: 'fast',
    label: 'Laguna XS.2',
    strengths: ['light coding agent', 'fast/cheap coding assist'],
    cautions: ['คุณภาพน่าจะรอง Laguna M.1', 'ไม่ใช้กับ financial debate เป็นหลัก'],
    bestFor: [],
  },
  {
    id: 'openai/gpt-oss-120b:free',
    provider: 'openrouter',
    phase: 'reasoning',
    label: 'GPT OSS 120B',
    strengths: ['general reasoning', 'structured output', 'agentic/general purpose'],
    cautions: ['knowledge cutoff Jun 2024 ถ้าไม่มี browsing/tool', 'ไม่เหมาะกับข้อมูลใหม่แบบสด'],
    bestFor: ['general', 'technical'],
  },
  {
    id: 'openai/gpt-oss-20b:free',
    provider: 'openrouter',
    phase: 'fast',
    label: 'GPT OSS 20B',
    strengths: ['low latency', 'lightweight reasoning', 'structured output'],
    cautions: ['งานซับซ้อนควรใช้รุ่นใหญ่กว่า', 'ไม่เหมาะกับ long research'],
    bestFor: ['general'],
  },
]

function profile(id: string) {
  return WAR_ROOM_MODEL_PROFILES.find((profile) => profile.id === id) ?? WAR_ROOM_MODEL_PROFILES[2]
}

function defaultSelection(seed: DebateSeed, phase: WarRoomModelPhase, agentId: string, agentLabel: string): WarRoomModelSelection {
  const model = profile('nvidia/nemotron-3-super-120b-a12b:free')
  return {
    phase,
    agentId,
    agentLabel,
    modelId: model.id,
    provider: model.provider,
    reason: 'balanced default for War Room debate reporter/verifier assist',
  }
}

export function resolveWarRoomModel(seed: DebateSeed, phase: WarRoomModelPhase): WarRoomModelProfile {
  if (phase === 'research') return profile('nvidia/nemotron-3-ultra-550b-a55b:free')
  if (phase === 'quant') return profile('deepseek-chat')
  if (phase === 'thai') return seed.intent === 'risk' ? profile('mimo-v2.5-pro') : profile('google/gemma-4-31b-it:free')
  if (phase === 'fast') return profile('openai/gpt-oss-20b:free')
  if (phase === 'reporter') {
    if (seed.intent === 'fundamental') return profile('nvidia/nemotron-3-ultra-550b-a55b:free')
    if (seed.intent === 'portfolio' || seed.intent === 'risk') return profile('deepseek-chat')
    if (seed.intent === 'news') return profile('google/gemma-4-31b-it:free')
    return profile('nex-agi/nex-n2-pro:free')
  }
  if (phase === 'verifier') return profile('nvidia/nemotron-3-super-120b-a12b:free')
  return profile('nvidia/nemotron-3-super-120b-a12b:free')
}

export function getWarRoomModelPlan(seed: DebateSeed): WarRoomModelSelection[] {
  const research = resolveWarRoomModel(seed, 'research')
  const reasoning = resolveWarRoomModel(seed, 'reasoning')
  const quant = resolveWarRoomModel(seed, 'quant')
  const thai = resolveWarRoomModel(seed, 'thai')
  const reporter = resolveWarRoomModel(seed, 'reporter')
  const verifier = resolveWarRoomModel(seed, 'verifier')

  return [
    {
      phase: 'research',
      agentId: 'fundamental/news',
      agentLabel: 'Fundamental / News Research',
      modelId: research.id,
      provider: research.provider,
      reason: research.strengths.join(', '),
    },
    {
      phase: 'reasoning',
      agentId: 'moderator/reporter',
      agentLabel: 'Moderator / Reporter Reasoning',
      modelId: reasoning.id,
      provider: reasoning.provider,
      reason: reasoning.strengths.join(', '),
    },
    {
      phase: 'quant',
      agentId: 'risk/portfolio',
      agentLabel: 'Risk / Portfolio Quant',
      modelId: quant.id,
      provider: quant.provider,
      reason: quant.strengths.join(', '),
    },
    {
      phase: 'thai',
      agentId: 'reporter',
      agentLabel: 'Thai Explanation',
      modelId: thai.id,
      provider: thai.provider,
      reason: thai.strengths.join(', '),
    },
    {
      phase: 'reporter',
      agentId: 'reporter',
      agentLabel: 'Reporter Agent',
      modelId: reporter.id,
      provider: reporter.provider,
      reason: reporter.strengths.join(', '),
    },
    {
      phase: 'verifier',
      agentId: 'verifier',
      agentLabel: 'Verifier Gate',
      modelId: verifier.id,
      provider: verifier.provider,
      reason: verifier.strengths.join(', '),
    },
  ]
}

export function getReporterModel(seed: DebateSeed) {
  return resolveWarRoomModel(seed, 'reporter')
}
