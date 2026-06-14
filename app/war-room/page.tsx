'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  Database,
  FileCheck,
  LineChart,
  MessageSquare,
  Newspaper,
  Play,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react'
import ResearchModeChooser from '@/components/agent/ResearchModeChooser'
import FeatureGate from '@/components/auth/FeatureGate'
import Button from '@/components/ui/Button'
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { useHoldings } from '@/lib/hooks/use-holdings'
import { useWatchlist } from '@/lib/hooks/use-watchlist'
import { DEFAULT_AGENT_LOOP_SYMBOLS, type AgentLoopRunResult, type AgentResult } from '@/lib/agent-loop/types'
import { type MiroFishDebateRunResult } from '@/lib/agent-loop/mirofish/types'
import { type SegaApprovalResult } from '@/lib/agent-loop/sega/types'
import { SEGA_PERSONA_REGISTRY, type SegaPersona } from '@/lib/agent-loop/sega/persona'
import { renderSegaStorycraft } from '@/lib/agent-loop/sega/storycraft'
import type { SegaStorycraftNarrative } from '@/lib/agent-loop/sega/types'

type AgentLoopMode = 'watchlist' | 'portfolio' | 'market' | 'custom'

type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'

type SegaReviewPayload = {
  approval: SegaApprovalResult
  story: SegaStorycraftNarrative
  persona: {
    coreValues: readonly string[]
    heuristics: readonly string[]
    failureModes: readonly string[]
    personas: SegaPersona[]
  }
}

const modeOptions: Array<{ value: AgentLoopMode; label: string; description: string; icon: ReactNode }> = [

  { value: 'watchlist', label: 'Watchlist', description: 'ใช้หุ้นในรายการโปรด', icon: <Target size={15} /> },
  { value: 'portfolio', label: 'Portfolio', description: 'ใช้ holding ที่มีอยู่', icon: <Wallet size={15} /> },
  { value: 'market', label: 'Market Preset', description: 'SET50 proxy และหุ้นใหญ่', icon: <LineChart size={15} /> },
  { value: 'custom', label: 'Custom', description: 'พิมพ์สัญลักษณ์เอง', icon: <Cpu size={15} /> },
]

const timeframeOptions: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']

const defaultScenario = 'เช็กว่าหุ้นใน watchlist มีประเด็นเทคนิค ข่าว valuation และความเสี่ยงอะไรที่ต้องตรวจต่อ'

function normalizeSymbol(symbol: string) {
  const clean = symbol.trim().toUpperCase().replace(/^@/, '').replace(/\s+/g, '')
  if (!clean) return ''
  if (clean.includes('.')) return clean
  const foreign = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'JPM', 'BABA'])
  return foreign.has(clean) ? clean : `${clean}.BK`
}

function splitSymbols(value: string) {
  return Array.from(new Set(value.split(/[\s,]+/).map(normalizeSymbol).filter(Boolean))).slice(0, 8)
}

function displaySymbol(symbol: string) {
  return symbol.replace(/\.BK$/i, '')
}

function displaySymbols(symbols: string[]) {
  return symbols.map(displaySymbol).join(', ')
}

function agentTone(agent: AgentResult) {
  if (agent.status === 'pass') return 'border-brand-success/25 bg-brand-success/5 text-brand-success'
  if (agent.status === 'blocked') return 'border-brand-danger/25 bg-brand-danger/5 text-brand-danger'
  return 'border-brand-warning/25 bg-brand-warning/5 text-brand-warning'
}

function verifierTone(result: AgentLoopRunResult) {
  if (result.verifier.status === 'pass') return 'border-brand-success/25 bg-brand-success/5 text-brand-success'
  if (result.verifier.status === 'blocked') return 'border-brand-danger/25 bg-brand-danger/5 text-brand-danger'
  return 'border-brand-warning/25 bg-brand-warning/5 text-brand-warning'
}

function debateMessageTone(status: AgentResult['status']) {
  if (status === 'pass') return 'border-brand-success/25 bg-brand-success/5 text-brand-success'
  if (status === 'blocked') return 'border-brand-danger/25 bg-brand-danger/5 text-brand-danger'
  return 'border-brand-warning/25 bg-brand-warning/5 text-brand-warning'
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function approvalTone(decision: SegaApprovalResult['decision']) {
  if (decision === 'Go') return 'border-brand-success/25 bg-brand-success/5 text-brand-success'
  if (decision === 'No-Go') return 'border-brand-danger/25 bg-brand-danger/5 text-brand-danger'
  return 'border-brand-warning/25 bg-brand-warning/5 text-brand-warning'
}

function SegaReviewPanel({ payload }: { payload: SegaReviewPayload }) {
  const { approval, story, persona } = payload

  return (
    <Card className={approvalTone(approval.decision)}>
      <CardHeader>
        <div>
          <CardTitle>SEGA Review Gate</CardTitle>
          <CardDescription>Finance Division / Capital Allocation & Risk Agent</CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${approvalTone(approval.decision)}`}>{approval.decision}</span>
          <span className="rounded-md border border-brand-border bg-brand-bg/60 px-2.5 py-1 text-xs text-brand-text-secondary">risk score {approval.riskScore}</span>
          <span className="rounded-md border border-brand-border bg-brand-bg/60 px-2.5 py-1 text-xs text-brand-text-secondary">position cap {approval.allocationEnvelope.maxPositionPercent}%</span>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3">
          <p className="mb-2 text-sm font-semibold text-brand-text-primary">Storycraft Brief</p>
          <p className="text-sm leading-relaxed text-brand-text-secondary">{story.text}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-text-primary">เหตุผล</p>
            <ul className="space-y-1 text-xs leading-relaxed text-brand-text-secondary">
              {approval.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-text-primary">เงื่อนไขก่อนใช้ต่อ</p>
            <ul className="space-y-1 text-xs leading-relaxed text-brand-text-secondary">
              {approval.mitigations.slice(0, 4).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-text-primary">Kill criteria</p>
            <ul className="space-y-1 text-xs leading-relaxed text-brand-text-secondary">
              {approval.killCriteria.slice(0, 4).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-text-primary">Persona layers</p>
            <ul className="space-y-1 text-xs leading-relaxed text-brand-text-secondary">
              {persona.personas.slice(0, 4).map((item) => <li key={item.id}>• {item.label}: {item.description}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  )
}

function AgentCard({ agent }: { agent: AgentResult }) {
  const Icon = agent.role === 'technical' ? LineChart : agent.role === 'fundamental' ? Target : agent.role === 'news' ? Newspaper : agent.role === 'risk' ? ShieldAlert : agent.role === 'portfolio' ? Wallet : agent.role === 'data' ? Database : Bot

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-primary/20 bg-brand-primary/10">
            <Icon size={15} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-text-primary">{agent.label}</h3>
            <p className="text-[11px] text-brand-text-muted">confidence {agent.confidence}%</p>
          </div>
        </div>
        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${agentTone(agent)}`}>
          {agent.status === 'pass' ? 'PASS' : 'REVIEW'}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-brand-text-secondary">{agent.summary}</p>
      {agent.findings.length > 0 && (
        <ul className="space-y-1">
          {agent.findings.slice(0, 3).map((finding) => (
            <li key={finding} className="flex gap-2 text-xs text-brand-text-secondary">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-brand-primary" />
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      )}
      {agent.risks.length > 0 && (
        <div className="rounded-lg border border-brand-warning/20 bg-brand-warning/5 p-2">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand-warning">
            <AlertTriangle size={12} /> เฝ้าระวัง
          </p>
          <ul className="space-y-1">
            {agent.risks.slice(0, 2).map((risk) => (
              <li key={risk} className="text-xs leading-relaxed text-brand-text-secondary">{risk}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function DebateTranscript({ result }: { result: MiroFishDebateRunResult }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>MiroFish Debate Transcript</CardTitle>
          <CardDescription>Agent คุยกันเป็นรอบก่อน Reporter สรุป และ Verifier ตรวจ safety gate</CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-5">
        {result.rounds.map((round) => (
          <div key={round.round} className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-bg-secondary p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-accent/10 text-sm font-bold text-brand-accent">{round.round}</div>
              <div>
                <p className="text-sm font-semibold text-brand-text-primary">{round.label}</p>
                <p className="text-xs text-brand-text-secondary">{round.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              {round.messages.map((message) => (
                <div key={message.id} className="rounded-xl border border-brand-border bg-brand-bg p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-brand-accent" />
                      <p className="text-xs font-semibold text-brand-text-primary">{message.agentLabel}</p>
                    </div>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${debateMessageTone(message.status)}`}>
                      {message.status === 'pass' ? 'PASS' : 'REVIEW'} · {message.confidence}% · evidence {message.evidenceCount}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-brand-text-secondary">{message.message}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function DebateResultPanel({ result }: { result: MiroFishDebateRunResult }) {
  return (
    <div className="space-y-5">
      <section className="market-frame rounded-xl border border-brand-border p-4 lg:p-5">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-4">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-brand-accent/20 bg-brand-accent/10 px-2.5 py-1 text-xs font-semibold text-brand-accent">
                debate {result.runId}
              </span>
              <span className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">
                {result.seed.intentLabel}
              </span>
              <span className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">
                {result.seed.timeframe} · {result.seed.symbols.length} symbols
              </span>
              {result.isDemo && (
                <span className="rounded-md border border-brand-warning/25 bg-brand-warning/10 px-2.5 py-1 text-xs font-semibold text-brand-warning">
                  demo/fallback data
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-brand-text-primary">{result.summary}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{result.thesis}</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-bg/60 p-4">
            <p className="text-xs text-brand-text-muted">debate confidence</p>
            <p className="mt-1 text-3xl font-bold text-brand-primary">{result.confidence}%</p>
            <p className="mt-2 text-xs text-brand-text-secondary">updated {formatDateTime(result.updatedAt)}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <DebateTranscript result={result} />
        <div className="space-y-4">
          <Card className={verifierTone({ ...result, mode: result.seed.mode, symbols: result.seed.symbols, scenario: result.seed.scenario, timeframe: result.seed.timeframe, iterations: [] })}>
            <CardHeader>
              <div>
                <CardTitle>Verifier Gate</CardTitle>
                <CardDescription>ตรวจหลังจาก agents คุยกันเสร็จ</CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-2">
              {result.verifier.checks.map((check) => (
                <div key={check.id} className="flex items-start gap-2 rounded-lg bg-brand-bg/40 p-2">
                  {check.passed ? <CheckCircle2 size={15} className="mt-0.5 text-brand-success" /> : <AlertTriangle size={15} className="mt-0.5 text-brand-warning" />}
                  <div>
                    <p className="text-xs font-semibold text-brand-text-primary">{check.label}</p>
                    <p className="text-xs text-brand-text-secondary">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Risk & Next Checks</CardTitle>
                <CardDescription>สิ่งที่ควรตรวจต่อ</CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-3">
              {result.risks.map((risk) => (
                <div key={risk} className="flex gap-2 rounded-lg border border-brand-warning/20 bg-brand-warning/5 p-2 text-xs leading-relaxed text-brand-text-secondary">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0 text-brand-warning" />
                  <span>{risk}</span>
                </div>
              ))}
              {result.suggestedChecks.map((check) => (
                <div key={check} className="flex gap-2 rounded-lg border border-brand-primary/20 bg-brand-primary/5 p-2 text-xs leading-relaxed text-brand-text-secondary">
                  <FileCheck size={14} className="mt-0.5 shrink-0 text-brand-primary" />
                  <span>{check}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Model Routing</CardTitle>
                <CardDescription>จับคู่จุดเด่นของแต่ละ model กับงาน debate</CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-2">
              {result.modelPlan.slice(0, 4).map((item) => (
                <div key={`${item.phase}-${item.agentId}`} className="rounded-lg border border-brand-border bg-brand-bg/40 p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-brand-text-primary">{item.agentLabel}</p>
                    <span className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary">
                      {item.provider}:{item.modelId}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-brand-text-secondary">{item.reason}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Debate Graph</CardTitle>
                <CardDescription>Seed → Agents → Risk/Contrarian → Reporter → Verifier</CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-2">
              {result.graph.edges.slice(0, 12).map((edge) => (
                <div key={`${edge.from}-${edge.to}-${edge.label}`} className="rounded-lg border border-brand-border bg-brand-bg-secondary p-2 text-xs leading-relaxed text-brand-text-secondary">
                  <span className="font-semibold text-brand-text-primary">{edge.from}</span> → <span className="font-semibold text-brand-text-primary">{edge.to}</span>
                  <span className="text-brand-text-muted"> · {edge.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default function WarRoomPage() {
  const pathname = usePathname()
  const isAgentLoopPage = pathname === '/agent-loop'
  const { watchlist } = useWatchlist()
  const { holdings } = useHoldings()
  const [mode, setMode] = useState<AgentLoopMode>('watchlist')
  const [symbolsInput, setSymbolsInput] = useState(DEFAULT_AGENT_LOOP_SYMBOLS.map(displaySymbol).join(', '))
  const [timeframe, setTimeframe] = useState<Timeframe>('3M')
  const [scenario, setScenario] = useState(defaultScenario)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AgentLoopRunResult | null>(null)
  const [questionInput, setQuestionInput] = useState('PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร')
  const [isDebateLoading, setIsDebateLoading] = useState(false)
  const [debateResult, setDebateResult] = useState<MiroFishDebateRunResult | null>(null)
  const [isSegaReviewLoading, setIsSegaReviewLoading] = useState(false)
  const [segaReview, setSegaReview] = useState<SegaReviewPayload | null>(null)
  const [segaError, setSegaError] = useState<string | null>(null)

  const watchlistSymbols = useMemo(() => watchlist.map((item) => item.symbol).slice(0, 8), [watchlist])
  const portfolioSymbols = useMemo(() => holdings.map((item) => item.symbol).slice(0, 8), [holdings])

  useEffect(() => {
    if (mode === 'watchlist' && watchlistSymbols.length > 0) {
      setSymbolsInput(displaySymbols(watchlistSymbols))
    }
    if (mode === 'portfolio' && portfolioSymbols.length > 0) {
      setSymbolsInput(displaySymbols(portfolioSymbols))
    }
    if (mode === 'market') {
      setSymbolsInput(displaySymbols(DEFAULT_AGENT_LOOP_SYMBOLS))
    }
  }, [mode, watchlistSymbols, portfolioSymbols])

  useEffect(() => {
    setSegaReview(null)
    setSegaError(null)
  }, [result, debateResult])

  const selectedSymbols = useMemo(() => {
    if (mode === 'watchlist' && watchlistSymbols.length > 0) return watchlistSymbols
    if (mode === 'portfolio' && portfolioSymbols.length > 0) return portfolioSymbols
    if (mode === 'market') return DEFAULT_AGENT_LOOP_SYMBOLS
    return splitSymbols(symbolsInput)
  }, [mode, symbolsInput, watchlistSymbols, portfolioSymbols])

  async function runSegaReview() {
    const context = debateResult ?? result
    if (!context) {
      setSegaError('ต้องรัน Agent Loop หรือ MiroFish Debate ก่อน')
      return
    }

    setSegaError(null)
    setIsSegaReviewLoading(true)
    setSegaReview(null)

    try {
      const res = await fetch('/api/sega/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debateResult ? { miroFishResult: debateResult } : { agentLoopResult: result }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error ?? 'SEGA Review ใช้งานไม่ได้ชั่วคราว')
      setSegaReview(payload.data as SegaReviewPayload)
    } catch (err) {
      setSegaError((err as Error).message)
    } finally {
      setIsSegaReviewLoading(false)
    }
  }
  async function runLoop() {
    const symbols = splitSymbols(symbolsInput)
    if (symbols.length === 0) {
      setError('ต้องมีหุ้นอย่างน้อย 1 ตัว')
      return
    }

    setError(null)
    setIsLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/agent-loop/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          symbols,
          scenario: scenario.trim(),
          timeframe,
          holdings: mode === 'portfolio' ? holdings.map((item) => ({ symbol: item.symbol, quantity: item.quantity, buyPrice: item.buyPrice })) : undefined,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error ?? 'Agent Loop ใช้งานไม่ได้ชั่วคราว')
      setResult(payload.data as AgentLoopRunResult)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  async function runDebate() {
    const question = questionInput.trim()
    if (!question) {
      setError('ต้องมีคำถามให้ agents คุยกัน')
      return
    }

    setError(null)
    setIsDebateLoading(true)
    setDebateResult(null)

    try {
      const res = await fetch('/api/war-room/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          symbols: splitSymbols(symbolsInput),
          scenario: scenario.trim(),
          timeframe,
          mode,
          holdings: mode === 'portfolio' ? holdings.map((item) => ({ symbol: item.symbol, quantity: item.quantity, buyPrice: item.buyPrice })) : undefined,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error ?? 'MiroFish Debate ใช้งานไม่ได้ชั่วคราว')
      setDebateResult(payload.data as MiroFishDebateRunResult)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsDebateLoading(false)
    }
  }

  return (
    <FeatureGate feature="agentLoop">
      <div className="space-y-6 fade-in">
        <section className="market-frame rounded-xl border border-brand-border p-4 lg:p-6">
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-accent/30 bg-brand-accent/10">
                <Cpu size={20} className="text-brand-accent" />
              </div>
              <div>
                <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">
                  {isAgentLoopPage ? 'Agent Loop' : 'MiroFish Debate War Room'}
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-brand-text-secondary">
                  {isAgentLoopPage
                    ? 'สรุปหุ้นหรือพอร์ตแบบ closed loop: ดึงข้อมูล, แยก agent ตามมุมวิเคราะห์, ตรวจ risk และบอกสิ่งที่ควรเช็กต่อ'
                    : 'โยนคำถามให้ agents หลายบทบาทโต้แย้งกันก่อน Reporter สรุป และ Verifier ตรวจ safety/evidence'}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-brand-primary/20 bg-brand-primary/10 px-3 py-2 text-xs text-brand-primary">
              Decision support only · ไม่ใช่คำแนะนำซื้อขาย
            </div>
          </div>
        </section>

        <ResearchModeChooser activeMode={isAgentLoopPage ? 'agent-loop' : 'mirofish-debate'} />

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
          <Card id="agent-loop">
            <CardHeader>
              <div>
                <CardTitle>{isAgentLoopPage ? 'ตั้งค่า Agent Loop' : 'ตั้งคำถาม Debate'}</CardTitle>
                <CardDescription>
                  {isAgentLoopPage
                    ? 'ใส่หุ้นแบบ PTT, SCB, CPALL ได้เลย ระบบจะจับคู่ตลาดไทยให้เอง'
                    : 'ตั้งคำถามหลัก แล้วเลือกหุ้นหรือบริบทที่อยากให้ agents โต้แย้งกัน'}
                </CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {modeOptions.map((option) => {
                  const active = mode === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${active ? 'border-brand-primary/50 bg-brand-primary/10' : 'border-brand-border bg-brand-bg-secondary hover:border-brand-primary/30 hover:bg-brand-surface-hover'}`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-text-primary">{option.icon}{option.label}</div>
                      <p className="hidden text-xs text-brand-text-secondary sm:block">{option.description}</p>
                    </button>
                  )
                })}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-brand-text-secondary">สัญลักษณ์</label>
                <Input
                  value={symbolsInput}
                  onChange={(event) => setSymbolsInput(event.target.value)}
                  placeholder="PTT, SCB, CPALL"
                  disabled={mode === 'market'}
                />
                <div className="flex flex-wrap gap-2">
                  {selectedSymbols.map((symbol) => (
                    <span key={symbol} className="rounded-md border border-brand-border bg-brand-bg-secondary px-2 py-1 text-xs font-mono-nums text-brand-text-primary">{displaySymbol(symbol)}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-text-secondary">Timeframe</label>
                  <select
                    value={timeframe}
                    onChange={(event) => setTimeframe(event.target.value as Timeframe)}
                    className="w-full rounded-lg border border-brand-border bg-brand-bg-secondary px-4 py-2.5 text-sm text-brand-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                  >
                    {timeframeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-text-secondary">Scope ที่เลือก</label>
                  <div className="rounded-lg border border-brand-border bg-brand-bg-secondary px-4 py-2.5 text-sm text-brand-text-primary">
                    {modeOptions.find((item) => item.value === mode)?.label ?? mode}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-text-secondary">Scenario</label>
                <textarea
                  value={scenario}
                  onChange={(event) => setScenario(event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg-secondary p-3 text-sm leading-relaxed text-brand-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-brand-danger/25 bg-brand-danger/5 p-3 text-sm text-brand-danger">
                  <XCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {isAgentLoopPage ? (
                  <section className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3">
                    <div className="mb-3 flex items-start gap-2">
                      <Play size={16} className="mt-0.5 text-brand-primary" />
                      <div>
                        <h2 className="text-sm font-semibold text-brand-text-primary">Agent Loop</h2>
                        <p className="text-xs leading-relaxed text-brand-text-secondary">เหมาะกับสรุปภาพรวม, agent findings, risk และสิ่งที่ควรตรวจต่อ</p>
                      </div>
                    </div>
                    <Button onClick={runLoop} isLoading={isLoading} className="w-full">
                      <Play size={16} />
                      {isLoading ? 'กำลังรัน Closed Loop...' : 'รัน Agent Loop'}
                    </Button>
                  </section>
                ) : (
                  <section id="mirofish-debate" className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-3">
                  <div className="mb-3 flex items-start gap-2">
                    <Sparkles size={16} className="mt-0.5 text-brand-accent" />
                    <div>
                      <h2 className="text-sm font-semibold text-brand-text-primary">MiroFish Debate</h2>
                      <p className="text-xs leading-relaxed text-brand-text-secondary">เหมาะกับคำถามที่ต้องเห็นมุมสนับสนุน มุมค้าน และข้อจำกัดก่อนอ่านสรุป</p>
                    </div>
                  </div>
                  <textarea
                    value={questionInput}
                    onChange={(event) => setQuestionInput(event.target.value)}
                    rows={3}
                    className="mb-3 w-full rounded-lg border border-brand-accent/20 bg-brand-bg-secondary p-3 text-sm leading-relaxed text-brand-text-primary outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30"
                    placeholder="เช่น PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร"
                  />
                  <Button onClick={runDebate} isLoading={isDebateLoading} className="w-full">
                    <MessageSquare size={16} />
                    {isDebateLoading ? 'กำลังให้ agents discuss...' : 'รัน MiroFish Debate'}
                  </Button>
                  </section>
                )}
              </div>

              <Button onClick={runSegaReview} isLoading={isSegaReviewLoading} disabled={!result && !debateResult} variant="secondary" className="w-full">
                <Wallet size={16} />
                {isSegaReviewLoading ? 'SEGA กำลัง review...' : 'รัน SEGA Review Gate'}
              </Button>

              {segaError && (
                <div className="flex items-start gap-2 rounded-lg border border-brand-danger/25 bg-brand-danger/5 p-3 text-sm text-brand-danger">
                  <XCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{segaError}</span>
                </div>
              )}

              {segaReview && <SegaReviewPanel payload={segaReview} />}

              <div className="rounded-lg border border-brand-warning/20 bg-brand-warning/5 p-3 text-xs leading-relaxed text-brand-text-secondary">
                <span className="font-semibold text-brand-warning">Safety:</span> ระบบไม่แนะนำซื้อ/ขาย ไม่การันตีผลตอบแทน และไม่เชื่อมคำสั่งซื้อขายอัตโนมัติ
              </div>
            </div>

          </Card>

          <Card className="h-fit">
            <CardHeader>
              <div>
                <CardTitle>อ่านผลลัพธ์ยังไง</CardTitle>
                <CardDescription>
                  {isAgentLoopPage ? 'เริ่มจาก summary แล้วค่อยอ่าน agent cards' : 'เริ่มจาก Reporter summary แล้วค่อยอ่าน transcript'}
                </CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-3">
              {(isAgentLoopPage
                ? [
                    { label: 'Summary', body: 'อ่าน thesis, confidence และข้อจำกัดก่อน' },
                    { label: 'Agent Cards', body: 'ดู Data, Technical, Fundamental, News และ Risk แยกกัน' },
                    { label: 'Risk Gate', body: 'ใช้ Risk, Next Checks และ SEGA ก่อนนำไปใช้ต่อ' },
                  ]
                : [
                    { label: 'Reporter Summary', body: 'อ่านคำตอบสุดท้ายหลัง agents โต้แย้งกันแล้ว' },
                    { label: 'Transcript', body: 'ดูว่าแต่ละ agent สนับสนุนหรือค้านด้วยเหตุผลอะไร' },
                    { label: 'Verifier Gate', body: 'ตรวจ safety, evidence และ next checks ก่อนนำไปใช้ต่อ' },
                  ]
              ).map((step, index) => (
                <div key={step.label} className="flex gap-3 rounded-xl border border-brand-border bg-brand-bg-secondary p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-sm font-bold text-brand-primary">{index + 1}</div>
                  <div>
                    <p className="text-sm font-semibold text-brand-text-primary">{step.label}</p>
                    <p className="text-xs text-brand-text-secondary">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {isDebateLoading && (
          <Card>
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="animate-pulse text-brand-accent" />
              <div>
                <p className="text-sm font-semibold text-brand-text-primary">MiroFish Debate กำลังรัน</p>
                <p className="text-xs text-brand-text-secondary">Moderator กำลังให้ agents discuss เป็นรอบก่อนสรุป</p>
              </div>
            </div>
          </Card>
        )}

        {isLoading && (
          <Card>
            <div className="flex items-center gap-3">
              <Bot size={18} className="animate-pulse text-brand-accent" />
              <div>
                <p className="text-sm font-semibold text-brand-text-primary">Agent Loop กำลังรัน</p>
                <p className="text-xs text-brand-text-secondary">กำลังดึงข้อมูล วิเคราะห์ และส่งผ่าน verifier</p>
              </div>
            </div>
          </Card>
        )}

        {debateResult && <DebateResultPanel result={debateResult} />}

        {result && (
          <div className="space-y-5">
            <section className="market-frame rounded-xl border border-brand-border p-4 lg:p-5">
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">
                      run {result.runId}
                    </span>
                    <span className="rounded-md border border-brand-accent/20 bg-brand-accent/10 px-2.5 py-1 text-xs font-semibold text-brand-accent">
                      {result.timeframe} · {result.symbols.length} symbols
                    </span>
                    {result.isDemo && (
                      <span className="rounded-md border border-brand-warning/25 bg-brand-warning/10 px-2.5 py-1 text-xs font-semibold text-brand-warning">
                        demo/fallback data
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-brand-text-primary">{result.summary}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{result.thesis}</p>
                </div>
                <div className="rounded-xl border border-brand-border bg-brand-bg/60 p-4">
                  <p className="text-xs text-brand-text-muted">confidence</p>
                  <p className="mt-1 text-3xl font-bold text-brand-primary">{result.confidence}%</p>
                  <p className="mt-2 text-xs text-brand-text-secondary">updated {formatDateTime(result.updatedAt)}</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
              </div>

              <div className="space-y-4">
                <Card className={verifierTone(result)}>
                  <CardHeader>
                    <div>
                      <CardTitle>Verifier</CardTitle>
                      <CardDescription>Closed-loop gate ก่อนส่งผลลัพธ์</CardDescription>
                    </div>
                  </CardHeader>
                  <div className="space-y-2">
                    {result.verifier.checks.map((check) => (
                      <div key={check.id} className="flex items-start gap-2 rounded-lg bg-brand-bg/40 p-2">
                        {check.passed ? <CheckCircle2 size={15} className="mt-0.5 text-brand-success" /> : <AlertTriangle size={15} className="mt-0.5 text-brand-warning" />}
                        <div>
                          <p className="text-xs font-semibold text-brand-text-primary">{check.label}</p>
                          <p className="text-xs text-brand-text-secondary">{check.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle>Risk & Next Checks</CardTitle>
                      <CardDescription>สิ่งที่ควรตรวจต่อ</CardDescription>
                    </div>
                  </CardHeader>
                  <div className="space-y-3">
                    {result.risks.map((risk) => (
                      <div key={risk} className="flex gap-2 rounded-lg border border-brand-warning/20 bg-brand-warning/5 p-2 text-xs leading-relaxed text-brand-text-secondary">
                        <ShieldAlert size={14} className="mt-0.5 shrink-0 text-brand-warning" />
                        <span>{risk}</span>
                      </div>
                    ))}
                    {result.suggestedChecks.map((check) => (
                      <div key={check} className="flex gap-2 rounded-lg border border-brand-primary/20 bg-brand-primary/5 p-2 text-xs leading-relaxed text-brand-text-secondary">
                        <FileCheck size={14} className="mt-0.5 shrink-0 text-brand-primary" />
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle>Loop Trace</CardTitle>
                      <CardDescription>หลักฐานว่ารอบนี้ผ่านเฟสอะไร</CardDescription>
                    </div>
                  </CardHeader>
                  <div className="space-y-2">
                    {result.iterations.map((iteration) => (
                      <div key={`${iteration.phase}-${iteration.message}`} className="flex gap-2 rounded-lg border border-brand-border bg-brand-bg-secondary p-2">
                        {iteration.passed ? <CheckCircle2 size={14} className="mt-0.5 text-brand-success" /> : <AlertTriangle size={14} className="mt-0.5 text-brand-warning" />}
                        <div>
                          <p className="text-xs font-semibold capitalize text-brand-text-primary">{iteration.phase}</p>
                          <p className="text-xs text-brand-text-secondary">{iteration.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </section>
          </div>
        )}
      </div>
    </FeatureGate>
  )
}
