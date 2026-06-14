import { createClient } from '@/lib/supabase/server'
import type { PersistWarRoomDebateInput } from './types'

export async function persistWarRoomDebate(input: PersistWarRoomDebateInput) {
  const supabase = createClient()
  const { result } = input

  try {
    const { data: runRow, error: runError } = await supabase
      .from('war_room_debate_runs')
      .insert({
        user_id: input.userId,
        run_id: result.runId,
        question: result.seed.question,
        symbols: result.seed.symbols,
        scenario: result.seed.scenario,
        timeframe: result.seed.timeframe,
        mode: result.seed.mode,
        summary: result.summary,
        thesis: result.thesis,
        risks: result.risks,
        suggested_checks: result.suggestedChecks,
        confidence: result.confidence,
        is_demo: result.isDemo,
        latency_ms: result.latencyMs,
      })
      .select('id')
      .single()

    if (runError || !runRow) return { persisted: false, error: runError?.message ?? 'no run row' }

    const runId = runRow.id
    const messages = result.transcript.map((message) => ({
      user_id: input.userId,
      run_id: runId,
      external_run_id: result.runId,
      agent_id: message.agentId,
      agent_label: message.agentLabel,
      round: message.round,
      phase: message.phase,
      message: message.message,
      status: message.status,
      confidence: message.confidence,
      evidence_count: message.evidenceCount,
    }))

    if (messages.length) {
      await supabase.from('war_room_debate_messages').insert(messages)
    }

    const evidence = result.agents.flatMap((agent) =>
      agent.evidence.map((item) => ({
        user_id: input.userId,
        run_id: runId,
        external_run_id: result.runId,
        agent_id: agent.id,
        label: item.label,
        value: item.value,
        source: item.source,
      }))
    )

    if (evidence.length) {
      await supabase.from('war_room_debate_evidence').insert(evidence)
    }

    await supabase.from('war_room_debate_verifications').insert({
      user_id: input.userId,
      run_id: runId,
      external_run_id: result.runId,
      status: result.verifier.status,
      confidence: result.verifier.confidence,
      checks: result.verifier.checks,
      issues: result.verifier.issues,
    })

    return { persisted: true }
  } catch (error) {
    return { persisted: false, error: (error as Error).message }
  }
}
