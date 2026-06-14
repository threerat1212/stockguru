import { describe, expect, it } from 'vitest'
import { getOpenRouterApiKeys, getOpenRouterModel } from '@/lib/agent-loop/providers/openrouter-provider'

describe('openrouter provider policy', () => {
  it('rejects paid or non-allowlisted OpenRouter model overrides before network call', () => {
    const originalModel = process.env.OPENROUTER_MODEL
    const originalAgentModel = process.env.AGENT_LOOP_LLM_MODEL
    process.env.AGENT_LOOP_LLM_MODEL = ''
    process.env.OPENROUTER_MODEL = 'openai/gpt-4.1'

    try {
      expect(() => getOpenRouterModel()).toThrow('OpenRouter model is not allowed')
    } finally {
      if (originalAgentModel === undefined) {
        delete process.env.AGENT_LOOP_LLM_MODEL
      } else {
        process.env.AGENT_LOOP_LLM_MODEL = originalAgentModel
      }
      if (originalModel === undefined) {
        delete process.env.OPENROUTER_MODEL
      } else {
        process.env.OPENROUTER_MODEL = originalModel
      }
    }
  })

  it('accepts allowlisted free OpenRouter model ids', () => {
    const originalModel = process.env.OPENROUTER_MODEL
    process.env.OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'

    try {
      expect(getOpenRouterModel()).toBe('nvidia/nemotron-3-super-120b-a12b:free')
    } finally {
      if (originalModel === undefined) {
        delete process.env.OPENROUTER_MODEL
      } else {
        process.env.OPENROUTER_MODEL = originalModel
      }
    }
  })

  it('collects OpenRouter keys from primary, numbered, and pooled env vars', () => {
    const originals = {
      primary: process.env.OPENROUTER_API_KEY,
      second: process.env.OPENROUTER_API_KEY_2,
      pooled: process.env.OPENROUTER_API_KEYS,
    }

    process.env.OPENROUTER_API_KEY = 'key-1'
    process.env.OPENROUTER_API_KEY_2 = 'key-2'
    process.env.OPENROUTER_API_KEYS = 'key-3,key-2'

    try {
      expect(getOpenRouterApiKeys()).toEqual(['key-1', 'key-2', 'key-3'])
    } finally {
      for (const [key, value] of Object.entries(originals)) {
        const envName = key === 'primary' ? 'OPENROUTER_API_KEY' : key === 'second' ? 'OPENROUTER_API_KEY_2' : 'OPENROUTER_API_KEYS'
        if (value === undefined) delete process.env[envName]
        else process.env[envName] = value
      }
    }
  })
})
