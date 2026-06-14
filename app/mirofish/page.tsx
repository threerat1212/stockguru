'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, BrainCircuit, CheckCircle2, Fish, MessageCircle, Share2, Sparkles, Target, Users } from 'lucide-react'
import ResearchModeChooser from '@/components/agent/ResearchModeChooser'
import FeatureGate from '@/components/auth/FeatureGate'
import Button from '@/components/ui/Button'
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import type { SwarmPost, SwarmScenario, SwarmSimulationResult } from '@/lib/mirofish-swarm/types'
import type { MiroFishSwarmRequest } from '@/lib/mirofish-swarm/schema'

const defaultRequest: MiroFishSwarmRequest = {
  title: 'PTT งบออกดี แต่ราคาน้ำมันโลกอ่อนและบาทแข็ง',
  description: 'จำลองว่าสังคมตลาดหุ้นไทยจะตีความข่าวนี้ยังไง: นักลงทุนระยะสั้น, นักลงทุนพื้นฐาน, รายย่อย FOMO, นักบริหารความเสี่ยง, analyst, influencer และลูกค้า/คู่แข่ง จะโต้แย้งกันอย่างไร และ scenario ต่อไปใน 1 เดือนอาจเป็นแบบไหน',
  domain: 'stock',
  timeframe: '1M',
  actors: ['PTT', 'นักลงทุนรายย่อย', 'นักวิเคราะห์สถาบัน', 'คู่แข่งพลังงาน'],
  assumptions: ['ข่าวอาจทำให้คนมองบวกก่อน', 'ตลาดอาจกังวล sell on fact', 'รายย่อยอาจ FOMO ถ้ากราฟวิ่ง'],
}

function sentimentTone(sentiment: string) {
  if (sentiment === 'positive') return 'border-brand-success/25 bg-brand-success/5 text-brand-success'
  if (sentiment === 'negative') return 'border-brand-danger/25 bg-brand-danger/5 text-brand-danger'
  return 'border-brand-warning/25 bg-brand-warning/5 text-brand-warning'
}

function probabilityTone(probability: SwarmScenario['probability']) {
  if (probability === 'high') return 'border-brand-success/25 bg-brand-success/5 text-brand-success'
  if (probability === 'low') return 'border-brand-danger/25 bg-brand-danger/5 text-brand-danger'
  return 'border-brand-warning/25 bg-brand-warning/5 text-brand-warning'
}

function SwarmAgentCard({ result }: { result: SwarmSimulationResult }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Agent Swarm Personas</CardTitle>
          <CardDescription>{result.agents.length} personas มีบุคลิก ความเชื่อ ความทรงจำ และมุมมองต่างกัน</CardDescription>
        </div>
      </CardHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {result.agents.map((agent) => (
          <div key={agent.id} className="rounded-xl border border-brand-border bg-brand-bg-secondary p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-brand-text-primary">{agent.name}</p>
                <p className="text-xs text-brand-text-muted">{agent.role} · {agent.archetype}</p>
              </div>
              <Users size={15} className="text-brand-accent shrink-0" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-brand-text-secondary">{agent.worldview}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {agent.expertise.slice(0, 3).map((item) => (
                <span key={item} className="rounded-md border border-brand-primary/15 bg-brand-primary/5 px-1.5 py-0.5 text-[10px] text-brand-primary">{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function SocialFeed({ posts }: { posts: SwarmPost[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Simulated Social Feed</CardTitle>
          <CardDescription>Twitter + Reddit จำลอง: agent ตอบโต้กันเป็นรอบ ไม่ใช่ prediction</CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-4">
        {[1, 2, 3].map((round) => (
          <div key={round} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-brand-accent/20 bg-brand-accent/10 px-2 py-1 text-xs font-semibold text-brand-accent">Round {round}</span>
              <p className="text-xs text-brand-text-muted">{round === 1 ? 'First Reaction' : round === 2 ? 'Social Contagion' : 'Second-Order Thinking'}</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
              {posts.filter((post) => post.round === round).slice(0, 8).map((post) => (
                <div key={post.id} className="rounded-xl border border-brand-border bg-brand-bg p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary">{post.agentName}</p>
                      <p className="text-[11px] text-brand-text-muted">{post.agentRole} · {post.channelId}</p>
                    </div>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${sentimentTone(post.sentiment)}`}>{post.sentiment}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-brand-text-secondary">{post.text}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.topics.slice(0, 3).map((topic) => (
                      <span key={topic} className="rounded-md border border-brand-border bg-brand-card px-1.5 py-0.5 text-[10px] text-brand-text-muted">{topic}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ScenarioCards({ result }: { result: SwarmSimulationResult }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Scenario Map</CardTitle>
          <CardDescription>ภาพว่าอนาคตอาจแตกออกเป็นกี่ทาง พร้อม trigger, risk และ opportunity</CardDescription>
        </div>
      </CardHeader>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {result.scenarios.map((scenario) => (
          <div key={scenario.id} className="rounded-xl border border-brand-border bg-brand-bg-secondary p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-text-primary">{scenario.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-brand-text-secondary">{scenario.outcome}</p>
              </div>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${probabilityTone(scenario.probability)}`}>{scenario.probability}</span>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <p className="mb-1 font-semibold text-brand-text-primary">Triggers</p>
                <ul className="space-y-1 text-brand-text-secondary">{scenario.triggers.map((item) => <li key={item}>• {item}</li>)}</ul>
              </div>
              <div>
                <p className="mb-1 font-semibold text-brand-text-primary">Blind Spots</p>
                <ul className="space-y-1 text-brand-text-secondary">{scenario.blindSpots.map((item) => <li key={item}>• {item}</li>)}</ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ResultPanel({ result }: { result: SwarmSimulationResult }) {
  const event = result.event ?? {
    id: result.runId,
    title: 'MiroFish Swarm Simulation',
    description: '',
    domain: 'stock',
    timeframe: '1M',
    actors: [],
    assumptions: [],
  }
  const domain = event.domain ?? 'stock'
  const timeframe = event.timeframe ?? '1M'
  const title = event.title ?? 'MiroFish Swarm Simulation'
  const description = event.description ?? ''

  return (
    <div className="space-y-5">
      <section className="market-frame rounded-xl border border-brand-border p-4 lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-brand-accent/20 bg-brand-accent/10 px-2.5 py-1 text-xs font-semibold text-brand-accent">swarm {result.runId}</span>
              <span className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">{domain}</span>
              <span className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">{timeframe}</span>
            </div>
            <h2 className="text-lg font-semibold text-brand-text-primary">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{description}</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-bg/60 p-4 text-center min-w-[160px]">
            <p className="text-xs text-brand-text-muted">dominant sentiment</p>
            <p className={`mt-1 text-3xl font-bold ${result.sentiment.dominant === 'positive' ? 'text-brand-success' : result.sentiment.dominant === 'negative' ? 'text-brand-danger' : 'text-brand-warning'}`}>{result.sentiment.dominant}</p>
            <p className="mt-1 text-xs text-brand-text-secondary">polarization {result.sentiment.polarization}</p>
          </div>
        </div>
      </section>

      <SwarmAgentCard result={result} />
      <SocialFeed posts={result.posts} />
      <ScenarioCards result={result} />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="border-brand-danger/20 bg-brand-danger/5">
          <CardHeader>
            <div>
              <CardTitle>Risks</CardTitle>
              <CardDescription>สิ่งที่อาจพังหรือถูกตีความผิด</CardDescription>
            </div>
          </CardHeader>
          <ul className="space-y-2 text-sm text-brand-text-secondary">
            {result.risks.map((risk) => <li key={risk} className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 text-brand-danger shrink-0" /><span>{risk}</span></li>)}
          </ul>
        </Card>
        <Card className="border-brand-success/20 bg-brand-success/5">
          <CardHeader>
            <div>
              <CardTitle>Opportunities</CardTitle>
              <CardDescription>โอกาสหรือมุมที่อาจมีประโยชน์</CardDescription>
            </div>
          </CardHeader>
          <ul className="space-y-2 text-sm text-brand-text-secondary">
            {result.opportunities.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 text-brand-success shrink-0" /><span>{item}</span></li>)}
          </ul>
        </Card>
        <Card className="border-brand-warning/20 bg-brand-warning/5">
          <CardHeader>
            <div>
              <CardTitle>Blind Spots / Checks</CardTitle>
              <CardDescription>สิ่งที่ต้องเช็กก่อนลงมือจริง</CardDescription>
            </div>
          </CardHeader>
          <ul className="space-y-2 text-sm text-brand-text-secondary">
            {result.suggestedChecks.slice(0, 6).map((item) => <li key={item} className="flex gap-2"><Target size={15} className="mt-0.5 text-brand-warning shrink-0" /><span>{item}</span></li>)}
          </ul>
        </Card>
      </section>

      <Card className="border-brand-border/60">
        <CardHeader>
          <div>
            <CardTitle>Model Policy</CardTitle>
            <CardDescription>นโยบายการใช้ model สำหรับ MiroFish Swarm</CardDescription>
          </div>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-2 text-sm text-brand-text-secondary">
          <span className="rounded-md border border-brand-success/25 bg-brand-success/5 px-2.5 py-1 text-xs font-semibold text-brand-success">paid OpenRouter models: not used</span>
          <span>mode: {result.modelPolicy.mode}</span>
          <span>{result.modelPolicy.note}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-brand-text-muted">{result.disclaimer}</p>
      </Card>
    </div>
  )
}

export default function MiroFishSwarmPage() {
  const [request, setRequest] = useState<MiroFishSwarmRequest>(defaultRequest)
  const [result, setResult] = useState<SwarmSimulationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => request.title.trim().length >= 3 && request.description.trim().length >= 10, [request])

  async function runSimulation() {
    if (!canSubmit) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/mirofish/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Simulation failed')
      setResult(data.data ?? data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FeatureGate feature="agentLoop">
      <main className="mx-auto max-w-[1680px] px-3 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-xl border border-brand-border bg-brand-bg-secondary p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-brand-accent">
                <Fish size={20} />
                <span className="text-sm font-semibold">MiroFish Swarm Intelligence</span>
              </div>
              <h1 className="text-2xl font-bold text-brand-text-primary">จำลอง social reaction จากหลาย persona</h1>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-brand-text-secondary">
                ใช้เมื่อต้องการอ่าน sentiment, blind spots และ scenario map จากมุมมองหลายกลุ่ม ไม่ใช่คำทำนายหรือคำแนะนำลงทุน
              </p>
            </div>
            <div className="hidden lg:flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
              <BrainCircuit size={26} />
            </div>
          </div>
        </div>

        <ResearchModeChooser activeMode="mirofish-swarm" className="mb-5" />

        <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-5">
          <div className="space-y-5">
            <Card id="swarm-simulation">
              <CardHeader>
                <div>
                  <CardTitle>ตั้งเหตุการณ์จำลอง</CardTitle>
                  <CardDescription>ใส่ข่าว ไอเดีย หุ้น แคมเปญ หรือฟีเจอร์ที่อยากทดสอบกับ persona หลายมุม</CardDescription>
                </div>
              </CardHeader>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-brand-text-primary">หัวข้อ</label>
                <input
                  value={request.title}
                  onChange={(event) => setRequest({ ...request, title: event.target.value })}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-primary/60"
                />
                <label className="block text-sm font-medium text-brand-text-primary">รายละเอียดเหตุการณ์</label>
                <textarea
                  value={request.description}
                  onChange={(event) => setRequest({ ...request, description: event.target.value })}
                  rows={7}
                  className="w-full resize-none rounded-xl border border-brand-border bg-brand-bg-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-primary/60"
                />
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-brand-text-primary">ประเภท</label>
                  <label className="block text-sm font-medium text-brand-text-primary">ช่วงเวลา</label>
                  <select
                    value={request.domain ?? 'general'}
                    onChange={(event) => setRequest({ ...request, domain: event.target.value as MiroFishSwarmRequest['domain'] })}
                    className="rounded-xl border border-brand-border bg-brand-bg-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-primary/60"
                  >
                    <option value="stock">stock / market</option>
                    <option value="marketing">marketing / campaign</option>
                    <option value="product">product / feature</option>
                    <option value="social">social / trend</option>
                    <option value="general">general</option>
                  </select>
                  <select
                    value={request.timeframe ?? '1M'}
                    onChange={(event) => setRequest({ ...request, timeframe: event.target.value as MiroFishSwarmRequest['timeframe'] })}
                    className="rounded-xl border border-brand-border bg-brand-bg-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-primary/60"
                  >
                    <option value="1D">1D</option>
                    <option value="1W">1W</option>
                    <option value="1M">1M</option>
                    <option value="3M">3M</option>
                    <option value="6M">6M</option>
                    <option value="1Y">1Y</option>
                    <option value="longer">longer</option>
                  </select>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-brand-text-primary">ผู้เกี่ยวข้อง</p>
                  <input
                    value={(request.actors ?? []).join(', ')}
                    onChange={(event) => setRequest({ ...request, actors: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-primary/60"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-brand-text-primary">สมมติฐาน</p>
                  <textarea
                    value={(request.assumptions ?? []).join('\n')}
                    onChange={(event) => setRequest({ ...request, assumptions: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-brand-border bg-brand-bg-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-primary/60"
                  />
                </div>
                {error && <p className="rounded-xl border border-brand-danger/25 bg-brand-danger/5 p-3 text-sm text-brand-danger">{error}</p>}
                <Button onClick={runSimulation} disabled={!canSubmit || isLoading} isLoading={isLoading}>
                  <Sparkles size={16} />
                  Run Swarm Simulation
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>อ่านผลลัพธ์ยังไง</CardTitle>
                  <CardDescription>เริ่มจาก scenario map แล้วค่อยอ่าน feed เมื่ออยากดูเหตุผล</CardDescription>
                </div>
              </CardHeader>
              <div className="space-y-2 text-sm text-brand-text-secondary">
                <p className="flex gap-2"><MessageCircle size={15} className="mt-0.5 text-brand-accent shrink-0" />Scenario Map บอกเส้นทางที่ควรตรวจต่อ</p>
                <p className="flex gap-2"><Share2 size={15} className="mt-0.5 text-brand-accent shrink-0" />Social Feed ใช้ดูว่า persona ไหนตีความต่างกัน</p>
                <p className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 text-brand-danger shrink-0" />ไม่การันตีอนาคต ไม่ใช้แทนข้อมูลจริง และไม่ใช้ตัดสินใจแทนคน</p>
                <Link href="/war-room" className="inline-flex text-sm font-semibold text-brand-primary hover:text-emerald-300">
                  ไปหน้า MiroFish Debate สำหรับคำถามที่ต้องให้ agents โต้แย้ง
                </Link>
              </div>
            </Card>
          </div>

          <div>
            {result ? <ResultPanel result={result} /> : (
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>No simulation yet</CardTitle>
                    <CardDescription>กด Run Swarm Simulation เพื่อดู persona, feed และ scenario map</CardDescription>
                  </div>
                </CardHeader>
                <div className="rounded-xl border border-dashed border-brand-border bg-brand-bg-secondary p-6 text-center text-sm text-brand-text-secondary">
                  <Activity size={32} className="mx-auto mb-3 text-brand-accent" />
                  ผลลัพธ์จะแสดงที่นี่ โดยเริ่มจาก sentiment และ scenario ที่ควรตรวจต่อ
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </FeatureGate>
  )
}
