import { afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Use the Web Crypto API (available in both Node 18+ and jsdom) instead of
// `node:crypto`, which Vite externalizes for browser compatibility and breaks
// this suite's import even when the tests are skipped via describe.skipIf.
const randomUUID = () => globalThis.crypto.randomUUID()

type RlsUser = {
  id: string
  email: string
  password: string
}

const cleanupUsers: string[] = []

function hasRlsTestEnv() {
  return Boolean(process.env.RUN_SUPABASE_RLS_INTEGRATION === '1' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function createUser(client: SupabaseClient, suffix: string): Promise<RlsUser> {
  const password = `RlsIntegration-${suffix}-${randomUUID().slice(0, 8)}!`
  const email = `rls-${suffix}-${randomUUID()}@stockguru.local`
  const created = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { rls_integration_test: true },
  })

  if (created.error) throw created.error
  if (!created.data?.user) throw new Error('Supabase did not return created user')

  cleanupUsers.push(created.data.user.id)
  return { id: created.data.user.id, email, password }
}

async function signIn(client: SupabaseClient, user: RlsUser) {
  const signedIn = await client.auth.signInWithPassword({ email: user.email, password: user.password })
  if (signedIn.error) throw signedIn.error
  if (!signedIn.data.session?.access_token) throw new Error('Supabase sign in did not return session')
  return signedIn.data.session.access_token
}

describe.skipIf(!hasRlsTestEnv())('supabase RLS integration', () => {
  afterEach(async () => {
    if (!hasRlsTestEnv()) return
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await Promise.allSettled(cleanupUsers.map((userId) => admin.auth.admin.deleteUser(userId)))
    cleanupUsers.length = 0
  })

  it('isolates war room runs, usage logs, and subscriptions by authenticated user', async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(supabaseUrl, serviceRoleKey)
    const anonA = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
    const anonB = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })

    const userA = await createUser(admin, 'a')
    const userB = await createUser(admin, 'b')
    const tokenA = await signIn(anonA, userA)
    const tokenB = await signIn(anonB, userB)

    const runAId = `rls-a-${randomUUID()}`
    const runBId = `rls-b-${randomUUID()}`

    const wrongUserInsert = await anonA.from('war_room_debate_runs').insert({
      user_id: userB.id,
      run_id: `rls-wrong-${randomUUID()}`,
      question: 'should be blocked by RLS',
      symbols: ['PTT.BK'],
      scenario: 'RLS test',
      timeframe: '1W',
      mode: 'custom',
      summary: 'blocked',
      thesis: 'blocked',
      risks: [],
      suggested_checks: [],
      confidence: 50,
    })

    expect(wrongUserInsert.error?.code).toBe('42501')

    const runA = await anonA.from('war_room_debate_runs').insert({
      user_id: userA.id,
      run_id: runAId,
      question: 'user A question',
      symbols: ['PTT.BK'],
      scenario: 'RLS test A',
      timeframe: '1W',
      mode: 'custom',
      summary: 'A summary',
      thesis: 'A thesis',
      risks: [],
      suggested_checks: [],
      confidence: 50,
    }).select()
    expect(runA.error).toBeNull()
    const runIdA = (runA.data as Array<{ id: string }> | null)?.[0]?.id ?? ''
    if (!runIdA) throw new Error('run A was not inserted')

    const runB = await anonB.from('war_room_debate_runs').insert({
      user_id: userB.id,
      run_id: runBId,
      question: 'user B question',
      symbols: ['BBL.BK'],
      scenario: 'RLS test B',
      timeframe: '1W',
      mode: 'custom',
      summary: 'B summary',
      thesis: 'B thesis',
      risks: [],
      suggested_checks: [],
      confidence: 50,
    }).select()
    expect(runB.error).toBeNull()
    const runIdB = (runB.data as Array<{ id: string }> | null)?.[0]?.id ?? ''
    if (!runIdB) throw new Error('run B was not inserted')

    await anonA.from('war_room_debate_messages').insert({
      user_id: userA.id,
      run_id: runIdA,
      external_run_id: runAId,
      agent_id: 'data',
      agent_label: 'Data Agent',
      round: 1,
      phase: 'observation',
      message: 'A message',
      status: 'pass',
      confidence: 80,
      evidence_count: 1,
    })

    await anonB.from('war_room_debate_evidence').insert({
      user_id: userB.id,
      run_id: runIdB,
      external_run_id: runBId,
      agent_id: 'data',
      label: 'price',
      value: '168.50',
      source: 'market_data',
    })

    await anonA.from('war_room_debate_verifications').insert({
      user_id: userA.id,
      run_id: runIdA,
      external_run_id: runAId,
      status: 'pass',
      confidence: 80,
      checks: [],
      issues: [],
    })

    await anonA.from('ai_usage_logs').insert({
      user_id: userA.id,
      feature: 'war_room_debate',
      prompt: 'A prompt',
      response: 'A response',
      prompt_length: 8,
      response_length: 9,
      latency_ms: 1,
    })

    await anonB.from('ai_usage_logs').insert({
      user_id: userB.id,
      feature: 'war_room_debate',
      prompt: 'B prompt',
      response: 'B response',
      prompt_length: 8,
      response_length: 9,
      latency_ms: 1,
    })

    await admin.from('subscriptions').upsert({ user_id: userA.id, plan: 'pro', status: 'active' }, { onConflict: 'user_id' })
    await admin.from('subscriptions').upsert({ user_id: userB.id, plan: 'free', status: 'active' }, { onConflict: 'user_id' })

    const ownRunA = await anonA.from('war_room_debate_runs').select('run_id').eq('run_id', runAId)
    const otherRunAFromB = await anonB.from('war_room_debate_runs').select('run_id').eq('run_id', runAId)
    const ownRunB = await anonB.from('war_room_debate_runs').select('run_id').eq('run_id', runBId)
    const otherRunBFromA = await anonA.from('war_room_debate_runs').select('run_id').eq('run_id', runBId)

    expect(ownRunA.error).toBeNull()
    expect(ownRunA.data).toHaveLength(1)
    expect(otherRunAFromB.error).toBeNull()
    expect(otherRunAFromB.data).toHaveLength(0)
    expect(ownRunB.error).toBeNull()
    expect(ownRunB.data).toHaveLength(1)
    expect(otherRunBFromA.error).toBeNull()
    expect(otherRunBFromA.data).toHaveLength(0)

    const ownMessageA = await anonA.from('war_room_debate_messages').select('message').eq('external_run_id', runAId)
    const otherMessageAFromB = await anonB.from('war_room_debate_messages').select('message').eq('external_run_id', runAId)
    const ownEvidenceB = await anonB.from('war_room_debate_evidence').select('value').eq('external_run_id', runBId)
    const otherEvidenceBFromA = await anonA.from('war_room_debate_evidence').select('value').eq('external_run_id', runBId)
    const ownVerificationA = await anonA.from('war_room_debate_verifications').select('status').eq('external_run_id', runAId)
    const otherVerificationAFromB = await anonB.from('war_room_debate_verifications').select('status').eq('external_run_id', runAId)

    expect(ownMessageA.data).toHaveLength(1)
    expect(otherMessageAFromB.data).toHaveLength(0)
    expect(ownEvidenceB.data).toHaveLength(1)
    expect(otherEvidenceBFromA.data).toHaveLength(0)
    expect(ownVerificationA.data).toHaveLength(1)
    expect(otherVerificationAFromB.data).toHaveLength(0)

    const ownUsageA = await anonA.from('ai_usage_logs').select('feature').eq('prompt', 'A prompt')
    const otherUsageAFromB = await anonB.from('ai_usage_logs').select('feature').eq('prompt', 'A prompt')
    const ownUsageB = await anonB.from('ai_usage_logs').select('feature').eq('prompt', 'B prompt')
    const otherUsageBFromA = await anonA.from('ai_usage_logs').select('feature').eq('prompt', 'B prompt')

    expect(ownUsageA.data).toHaveLength(1)
    expect(otherUsageAFromB.data).toHaveLength(0)
    expect(ownUsageB.data).toHaveLength(1)
    expect(otherUsageBFromA.data).toHaveLength(0)

    const ownSubscriptionA = await anonA.from('subscriptions').select('plan').eq('user_id', userA.id)
    const otherSubscriptionAFromB = await anonB.from('subscriptions').select('plan').eq('user_id', userA.id)
    const ownSubscriptionB = await anonB.from('subscriptions').select('plan').eq('user_id', userB.id)
    const otherSubscriptionBFromA = await anonA.from('subscriptions').select('plan').eq('user_id', userB.id)

    expect(ownSubscriptionA.data?.[0]?.plan).toBe('pro')
    expect(otherSubscriptionAFromB.data).toHaveLength(0)
    expect(ownSubscriptionB.data?.[0]?.plan).toBe('free')
    expect(otherSubscriptionBFromA.data).toHaveLength(0)
  }, 15000)
})
