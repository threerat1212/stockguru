import { describe, expect, it } from 'vitest'
import {
  SEGA_CORE_VALUES,
  SEGA_GLOBAL_FAILURE_MODES,
  SEGA_GLOBAL_HEURISTICS,
  SEGA_PERSONA_IDS,
  SEGA_PERSONA_REGISTRY,
  SEGA_PERSONAS,
  SEGA_NON_DUPLICATION_BOUNDARY,
  getSegaPersona,
  personaLabel,
} from '@/lib/agent-loop/sega/persona'

describe('sega persona registry', () => {
  it('registers deterministic SEGA personas', () => {
    expect(SEGA_PERSONA_IDS).toEqual(['steward', 'thesis', 'evidence', 'risk', 'contrarian', 'governance'])
    expect(SEGA_PERSONAS.map((persona) => persona.id)).toEqual(SEGA_PERSONA_IDS)
    expect(new Set(SEGA_PERSONA_IDS).size).toBe(SEGA_PERSONA_IDS.length)
    expect(SEGA_PERSONA_REGISTRY.personas).toBe(SEGA_PERSONAS)
  })

  it('exports shared values, heuristics, failure modes and boundary', () => {
    expect(SEGA_CORE_VALUES).toContain('evidence-over-opinion')
    expect(SEGA_CORE_VALUES).toContain('bounded-decision-support')
    expect(SEGA_GLOBAL_HEURISTICS.some((item) => item.includes('evidence'))).toBe(true)
    expect(SEGA_GLOBAL_FAILURE_MODES).toContain('recommendation-leakage')
    expect(SEGA_NON_DUPLICATION_BOUNDARY).toContain('ไม่ดึง market data ใหม่')
  })

  it('returns persona metadata by id', () => {
    expect(getSegaPersona('governance')).toMatchObject({
      id: 'governance',
      role: 'governance_gate',
      label: 'Governance Gate',
    })
    expect(getSegaPersona('unknown')).toBeUndefined()
    expect(personaLabel('risk')).toBe('Risk Auditor')
    expect(personaLabel('unknown')).toBe('unknown')
  })
})
