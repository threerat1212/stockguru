'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Bot, User, Sparkles, Lock, TrendingUp, ShieldAlert, Newspaper, BarChart3, Target, Zap, AlertTriangle } from 'lucide-react'
import type { ChatMessage } from '@/types/stock'
import { cn } from '@/lib/utils/format'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscription } from '@/lib/hooks/use-subscription'
import AuthModal from '@/components/auth/AuthModal'

const quickPrompts = [
  { label: 'สรุป SET วันนี้', prompt: 'สรุปภาพรวม SET วันนี้ พร้อมข้อมูลที่ใช้และความเสี่ยงที่ควรตรวจต่อ', icon: <BarChart3 size={12} /> },
  { label: 'ความเสี่ยงธนาคาร', prompt: 'หุ้นกลุ่มธนาคารควรตรวจปัจจัยเสี่ยงอะไรบ้าง', icon: <ShieldAlert size={12} /> },
  { label: 'ตรวจ PTT', prompt: 'ช่วยสรุปมุมมอง PTT แบบให้ข้อมูล ไม่ใช่คำแนะนำซื้อขาย', icon: <Target size={12} /> },
  { label: 'ข่าวที่ควรดู', prompt: 'ข่าวตลาดวันนี้มีประเด็นอะไรที่ควรติดตามต่อ', icon: <Newspaper size={12} /> },
]

function buildSuggestions(topic: string) {
  return [
    { label: 'เช็กความเสี่ยง', prompt: `สรุปความเสี่ยงของ ${topic} ที่ควรตรวจต่อ`, icon: <ShieldAlert size={13} /> },
    { label: 'ดูบริบทเทคนิค', prompt: `สรุปบริบททางเทคนิคของ ${topic} แบบ bullish/bearish/neutral`, icon: <BarChart3 size={13} /> },
    { label: 'เทียบกลุ่ม', prompt: `เปรียบเทียบ ${topic} กับหุ้นหรือกลุ่มที่เกี่ยวข้อง`, icon: <TrendingUp size={13} /> },
  ]
}

function detectTopic(text: string) {
  const upper = text.toUpperCase()
  const symbols = ['PTT', 'SCB', 'KBANK', 'CPALL', 'AOT', 'ADVANC', 'NVDA', 'AAPL', 'MSFT', 'TSLA']
  const symbol = symbols.find((sym) => upper.includes(sym))
  if (symbol) return symbol
  if (text.includes('ธนาคาร') || upper.includes('BANK')) return 'กลุ่มธนาคาร'
  if (upper.includes('SET') || text.includes('ตลาด')) return 'SET'
  return null
}

export default function AIChat() {
  const { isAuthenticated } = useAuth()
  const { plan, usage, limits } = useSubscription()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'สวัสดีครับ ผมช่วยสรุปหุ้นไทย ข่าว บริบทเทคนิค และความเสี่ยงที่ควรตรวจต่อได้\n\nทุกคำตอบเป็นข้อมูลเพื่อการศึกษา ไม่ใช่คำแนะนำซื้อขายหรือการรับประกันผลตอบแทน',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Array<{ label: string; prompt: string; icon: React.ReactNode }>>([])
  const hasInteractedRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hasInteractedRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [messages, isLoading])

  const aiUsed = plan === 'free' ? (usage?.aiQuestionsToday ?? 0) : (usage?.aiQuestionsMonth ?? 0)
  const aiLimit = plan === 'free' ? limits.aiQuestionsDay : limits.aiQuestionsMonth
  const statusText = isAuthenticated
    ? `${plan.toUpperCase()}: ใช้ AI ${aiUsed}/${aiLimit}`
    : 'เข้าสู่ระบบเพื่อใช้ AI ฟรี 3 คำถาม/วัน'

  async function handleSend(prompt?: string) {
    const content = (prompt ?? input).trim()
    if (!content || isLoading) return

    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }

    hasInteractedRef.current = true
    const topic = detectTopic(content)
    setSuggestions(topic ? buildSuggestions(topic) : [])

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-8) }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error ?? 'AI ใช้งานไม่ได้ชั่วคราว')
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: payload.data?.response ?? 'ยังไม่มีคำตอบจาก AI',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${(err as Error).message}\n\nหากใช้ฟรีครบแล้ว ให้ไปที่หน้า Pricing เพื่ออัพเกรดแผน Pro`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[500px] flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-card">
      <div className="flex items-center gap-3 border-b border-brand-border bg-brand-bg-secondary/50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-accent/30 bg-brand-accent/10">
          <Sparkles size={16} className="text-brand-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-brand-text-primary">AI แชท</h3>
          <p className="text-xs text-brand-text-secondary">{statusText}</p>
        </div>
        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1.5 text-xs text-brand-primary transition-colors hover:bg-brand-primary/20"
          >
            <Lock size={13} />
            เข้าสู่ระบบ
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', msg.role === 'user' ? 'bg-brand-primary/10' : 'bg-brand-accent/10')}>
              {msg.role === 'user' ? <User size={16} className="text-brand-primary" /> : <Bot size={16} className="text-brand-accent" />}
            </div>
            <div className={cn('max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed', msg.role === 'user' ? 'rounded-br-none bg-brand-primary text-slate-950' : 'rounded-bl-none bg-brand-bg-secondary text-brand-text-primary')}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-accent/10">
              <Bot size={16} className="text-brand-accent" />
            </div>
            <div className="rounded-xl rounded-bl-none bg-brand-bg-secondary px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-brand-primary" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-brand-primary [animation-delay:0.1s]" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-brand-primary [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-brand-border p-3">
        {suggestions.length > 0 && (
          <div className="mb-3 rounded-lg border border-brand-primary/20 bg-brand-primary/5 p-2">
            <p className="mb-2 text-xs font-medium text-brand-text-primary flex items-center gap-1.5">
              <Zap size={13} className="text-brand-primary" /> สิ่งที่ควรตรวจต่อ
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button key={item.label} onClick={() => handleSend(item.prompt)} disabled={isLoading} className="inline-flex items-center gap-1.5 rounded-md border border-brand-primary/30 bg-brand-card px-2.5 py-1.5 text-left text-xs text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-50">
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mb-3 flex flex-wrap gap-2">
          {quickPrompts.map((item) => (
            <button key={item.label} onClick={() => handleSend(item.prompt)} disabled={isLoading} className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-brand-bg-secondary px-2.5 py-1.5 text-left text-xs text-brand-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-text-primary disabled:cursor-not-allowed disabled:opacity-50">
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        <div className="mb-2 flex items-center gap-1.5 text-xs text-brand-text-muted">
          <AlertTriangle size={12} />
          <span>ผลลัพธ์จาก AI เป็นการจำลองเพื่อการศึกษา ไม่ใช่คำแนะนำซื้อขาย</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={isAuthenticated ? 'พิมพ์คำถามเกี่ยวกับหุ้น...' : 'เข้าสู่ระบบเพื่อถาม AI'} className="flex-1 rounded-lg border border-brand-border bg-brand-bg-secondary px-4 py-2.5 text-sm text-brand-text-primary outline-none placeholder:text-brand-text-secondary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30" disabled={isLoading} />
          <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} aria-label="ส่งคำถาม" className="rounded-lg bg-brand-primary p-2.5 text-slate-950 transition-colors hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
            <Send size={18} />
          </button>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
