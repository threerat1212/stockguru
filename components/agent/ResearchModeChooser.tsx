'use client'

import Link from 'next/link'
import { Bot, Fish, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils/format'

export type ResearchModeId = 'agent-loop' | 'mirofish-debate' | 'mirofish-swarm'

const researchModes = [
  {
    id: 'agent-loop',
    href: '/agent-loop',
    icon: Bot,
    label: 'Agent Loop',
    summary: 'วิเคราะห์หุ้นหรือพอร์ตเป็นขั้นตอน แล้วสรุป risk และ next checks',
    bestFor: 'เหมาะเมื่อมีรายการหุ้นอยู่แล้ว และอยากได้ภาพรวมเร็ว',
  },
  {
    id: 'mirofish-debate',
    href: '/war-room',
    icon: MessageSquare,
    label: 'MiroFish Debate',
    summary: 'โยนคำถามให้หลายบทบาทโต้แย้ง ก่อน Reporter และ Verifier สรุป',
    bestFor: 'เหมาะเมื่อประเด็นมีหลายมุม และต้องการอ่านเหตุผลฝั่งค้าน',
  },
  {
    id: 'mirofish-swarm',
    href: '/mirofish',
    icon: Fish,
    label: 'Swarm Intelligence',
    summary: 'จำลองว่า persona หลายกลุ่มจะตีความข่าวหรือไอเดียอย่างไร',
    bestFor: 'เหมาะเมื่ออยากดู sentiment, narrative, blind spots และ scenario map',
  },
].map((mode) => ({ ...mode, id: mode.id as ResearchModeId }))

export default function ResearchModeChooser({
  activeMode,
  className,
}: {
  activeMode: ResearchModeId
  className?: string
}) {
  return (
    <section className={cn('rounded-xl border border-brand-border bg-brand-card p-3', className)} aria-label="เลือกโหมดวิจัย AI">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-brand-text-primary">เลือกโหมดวิจัย</h2>
          <p className="text-xs text-brand-text-secondary">คนละหน้า คนละงาน เลือกตามชนิดคำถามที่อยากตอบ</p>
        </div>
        <span className="text-xs text-brand-text-muted">Decision support only</span>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        {researchModes.map((mode) => {
          const Icon = mode.icon
          const active = mode.id === activeMode

          return (
            <Link
              key={mode.id}
              href={mode.href}
              className={cn(
                'group rounded-lg border p-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/40',
                active
                  ? 'border-brand-primary/40 bg-brand-primary/10'
                  : 'border-brand-border bg-brand-bg-secondary hover:border-brand-primary/30 hover:bg-brand-surface-hover'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                    active
                      ? 'border-brand-primary/30 bg-brand-primary/10 text-brand-primary'
                      : 'border-brand-border text-brand-text-secondary group-hover:text-brand-primary'
                  )}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text-primary">{mode.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-brand-text-secondary">{mode.summary}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-brand-text-muted">{mode.bestFor}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
