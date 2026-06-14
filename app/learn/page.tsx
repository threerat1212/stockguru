'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BarChart3,
  Brain,
  HelpCircle,
  GraduationCap,
  Lightbulb,
  Target,
  PieChart,
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils/format'

interface AccordionSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}


function LearningVisual({ type }: { type: 'candles' | 'support' | 'volume' | 'indicators' }) {
  if (type === 'candles') {
    return (
      <div className="mt-3 grid grid-cols-4 items-end gap-3 rounded-xl border border-brand-border bg-brand-card p-4">
        {[52, 82, 44, 70].map((height, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div className="h-4 w-px bg-brand-text-secondary/40" />
            <div className={cn('w-8 rounded-sm', index === 2 ? 'bg-brand-danger' : 'bg-brand-success')} style={{ height }} />
            <div className="h-4 w-px bg-brand-text-secondary/40" />
          </div>
        ))}
        <p className="col-span-4 text-center text-xs text-brand-text-secondary">ภาพจำลอง Candlestick: ตัวแท่ง = เปิด/ปิด, ไส้เทียน = สูง/ต่ำ</p>
      </div>
    )
  }

  if (type === 'support') {
    return (
      <div className="mt-3 rounded-xl border border-brand-border bg-brand-card p-4">
        <div className="relative h-32 overflow-hidden rounded-lg bg-brand-bg-secondary">
          <div className="absolute left-0 right-0 top-8 border-t border-dashed border-brand-danger/70" />
          <div className="absolute left-0 right-0 bottom-8 border-t border-dashed border-brand-success/70" />
          <svg viewBox="0 0 320 120" className="h-full w-full" aria-hidden>
            <polyline points="0,82 45,64 90,78 135,42 180,58 225,28 270,44 320,22" fill="none" stroke="#3b82f6" strokeWidth="3" />
          </svg>
          <span className="absolute right-2 top-3 text-xs text-brand-danger">Resistance</span>
          <span className="absolute bottom-3 right-2 text-xs text-brand-success">Support</span>
        </div>
      </div>
    )
  }

  if (type === 'volume') {
    const bars = [
      { vol: 32, priceUp: true },
      { vol: 28, priceUp: false },
      { vol: 40, priceUp: true },
      { vol: 88, priceUp: true },
      { vol: 56, priceUp: false },
      { vol: 96, priceUp: true },
      { vol: 48, priceUp: false },
      { vol: 36, priceUp: true },
    ]
    const maxVol = 96
    return (
      <div className="mt-3 rounded-xl border border-brand-border bg-brand-card p-4">
        <div className="flex items-end justify-between gap-1 h-28">
          {bars.map((b, i) => (
            <div key={i} className="flex flex-col items-end flex-1 h-full">
              <div
                className={cn('w-full rounded-t-sm min-w-[12px]', b.priceUp ? 'bg-emerald-500' : 'bg-rose-500')}
                style={{ height: `${(b.vol / maxVol) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-brand-text-muted">
          <span>Day 1</span>
          <span>Day 8</span>
        </div>
        <p className="mt-2 text-center text-xs text-brand-text-secondary">Volume spike (แท่งสูง) ยืนยันแรงซื้อ/ขายจริง</p>
      </div>
    )
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {['SMA/EMA: แนวโน้ม', 'RSI: แรงซื้อขาย', 'MACD: Momentum'].map((label) => (
        <div key={label} className="rounded-xl border border-brand-border bg-brand-card p-4 text-center">
          <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-brand-primary/10" />
          <p className="text-xs font-medium text-brand-text-primary">{label}</p>
        </div>
      ))}
    </div>
  )
}

function AccordionSection({ title, icon, children, defaultOpen = false }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="group border border-brand-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-brand-card hover:bg-brand-surface-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="text-sm font-medium text-brand-text-secondary group-hover:text-brand-text-primary">{title}</span>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-brand-text-secondary shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-brand-text-secondary shrink-0" />
        )}
      </button>
      {open && (
        <div className="p-4 sm:p-5 border-t border-brand-border bg-brand-bg-secondary/30">
          <div className="space-y-4 text-sm text-brand-text-secondary leading-relaxed">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeading({
  icon,
  title,
  tone = 'primary',
}: {
  icon: React.ReactNode
  title: string
  tone?: 'primary' | 'success' | 'warning'
}) {
  const toneStyles = {
    primary: 'border-brand-primary/25 bg-brand-primary/5 text-brand-primary',
    success: 'border-brand-success/25 bg-brand-success/5 text-brand-success',
    warning: 'border-brand-warning/25 bg-brand-warning/5 text-brand-warning',
  }[tone]

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', toneStyles)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-current/10">
        {icon}
      </span>
      <h2 className="text-lg font-semibold text-brand-text-primary">{title}</h2>
    </div>
  )
}

export default function LearnPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
          <GraduationCap size={20} className="text-brand-primary" />
        </div>
        <div>
          <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">ความรู้การลงทุน</h1>
          <p className="text-sm text-brand-text-secondary">เรียนรู้พื้นฐานการวิเคราะห์หุ้นและการลงทุน</p>
        </div>
      </div>

      {/* Technical Analysis Basics */}
      <SectionHeading icon={<BarChart3 size={22} />} title="พื้นฐานการวิเคราะห์ทางเทคนิค" />

      <div className="space-y-3">
        <AccordionSection
          title="การวิเคราะห์ทางเทคนิคคืออะไร?"
          icon={<Lightbulb size={16} className="text-brand-warning" />}
          defaultOpen={true}
        >
          <p>
            <strong>การวิเคราะห์ทางเทคนิค (Technical Analysis)</strong> คือวิธีการประเมินหลักทรัพย์โดยการวิเคราะห์สถิติที่เกิดจากกิจกรรมการซื้อขาย 
            เช่น ราคาและปริมาณการซื้อขาย (Volume) ผ่านแผนภูมิ (Charts) และตัวชี้วัด (Indicators) ต่างๆ
          </p>
          <LearningVisual type="indicators" />
          <div className="relative aspect-[21/9] overflow-hidden rounded-xl border border-brand-border">
            <Image src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80" alt="กราฟหุ้นและการวิเคราะห์" fill className="object-cover" priority unoptimized />
          </div>
          <p>หลักการสำคัญ 3 ข้อ:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>ตลาดสะท้อนทุกสิ่ง</strong> — ราคาหุ้นรวมข้อมูลทุกอย่างไว้แล้ว ทั้งปัจจัยพื้นฐาน จิตวิทยาตลาด และข่าวสาร</li>
            <li><strong>ราคามีแนวโน้ม</strong> — ราคามักเคลื่อนไหวในทิศทางที่มีแนวโน้ม (Trend) ไม่ว่าจะขึ้น ลง หรือ Sideways</li>
            <li><strong>ประวัติศาสตร์ซ้ำรอย</strong> — รูปแบบราคาในอดีตมักเกิดซ้ำอีกในอนาคต เนื่องจากจิตวิทยามนุษย์ไม่เปลี่ยน</li>
          </ul>
        </AccordionSection>

        <AccordionSection
          title="กราฟแท่งเทียน (Candlestick Charts)"
          icon={<BarChart3 size={16} className="text-brand-success" />}
        >
          <p>
            <strong>กราฟแท่งเทียน (Candlestick)</strong> เป็นรูปแบบกราฟที่นิยมใช้มากที่สุด แสดงราคาเปิด ราคาปิด ราคาสูงสุด และราคาต่ำสุดในแต่ละช่วงเวลา
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="bg-brand-card rounded-lg p-3 border border-brand-border">
              <p className="font-semibold text-brand-success mb-1">🟢 แท่งเทียนสีเขียว (Bullish)</p>
              <p>ราคาปิด &gt; ราคาเปิด — แสดงว่าแรงซื้อมากกว่าแรงขาย ราคามีแนวโน้มขึ้น</p>
            </div>
            <div className="bg-brand-card rounded-lg p-3 border border-brand-border">
              <p className="font-semibold text-brand-danger mb-1">🔴 แท่งเทียนสีแดง (Bearish)</p>
              <p>ราคาปิด &lt; ราคาเปิด — แสดงว่าแรงขายมากกว่าแรงซื้อ ราคามีแนวโน้มลง</p>
            </div>
          </div>
          <LearningVisual type="candles" />
          <div className="relative aspect-[21/9] overflow-hidden rounded-xl border border-brand-border">
            <Image src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80" alt="Candlestick chart บนหน้าจอ" fill className="object-cover" unoptimized />
          </div>
          <p><strong>ส่วนประกอบ:</strong> Body (ตัวแท่ง) = ช่วงระหว่างราคาเปิด-ปิด, Shadow/Wick (เงา) = แสดงราคาสูงสุด-ต่ำสุด</p>
        </AccordionSection>

        <AccordionSection
          title="แนวรับและแนวต้าน (Support & Resistance)"
          icon={<Target size={16} className="text-brand-accent" />}
        >
          <p><strong>แนวรับ (Support)</strong> คือระดับราคาที่หุ้นมีแนวโน้มจะหยุดลงและเด้งขึ้น เนื่องจากมีแรงซื้อเข้ามาสนับสนุน</p>
          <p><strong>แนวต้าน (Resistance)</strong> คือระดับราคาที่หุ้นมีแนวโน้มจะหยุดขึ้นและปรับตัวลง เนื่องจากมีแรงขายเข้ามา</p>
          <LearningVisual type="support" />
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 360" className="h-full w-full" aria-label="กราฟแสดงแนวรับและแนวต้าน">
              {/* Grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27354F" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="640" height="360" fill="#0B1120" />
              <rect width="640" height="360" fill="url(#grid)" />

              {/* Support line */}
              <line x1="0" y1="280" x2="640" y2="280" stroke="#10B981" strokeWidth="2" strokeDasharray="6 4" opacity="0.9" />
              <text x="10" y="295" fill="#10B981" fontSize="12" fontFamily="sans-serif">Support ~142</text>

              {/* Resistance line */}
              <line x1="0" y1="80" x2="640" y2="80" stroke="#EF4444" strokeWidth="2" strokeDasharray="6 4" opacity="0.9" />
              <text x="10" y="70" fill="#EF4444" fontSize="12" fontFamily="sans-serif">Resistance ~158</text>

              {/* Price line bouncing between support and resistance */}
              <polyline
                points="20,200 60,180 100,220 140,160 180,140 220,100 260,120 300,90 340,110 380,85 420,95 460,120 500,140 540,130 580,150 620,180"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Candlestick bodies along the line */}
              <rect x="55" y="175" width="10" height="10" fill="#3B82F6" rx="1" />
              <rect x="95" y="215" width="10" height="12" fill="#EF4444" rx="1" />
              <rect x="135" y="155" width="10" height="14" fill="#3B82F6" rx="1" />
              <rect x="175" y="135" width="10" height="12" fill="#3B82F6" rx="1" />
              <rect x="215" y="95" width="10" height="12" fill="#EF4444" rx="1" />
              <rect x="255" y="115" width="10" height="12" fill="#3B82F6" rx="1" />
              <rect x="295" y="85" width="10" height="12" fill="#EF4444" rx="1" />
              <rect x="335" y="105" width="10" height="14" fill="#3B82F6" rx="1" />
              <rect x="375" y="80" width="10" height="12" fill="#EF4444" rx="1" />
              <rect x="415" y="90" width="10" height="14" fill="#EF4444" rx="1" />
              <rect x="455" y="115" width="10" height="14" fill="#3B82F6" rx="1" />
              <rect x="495" y="135" width="10" height="12" fill="#3B82F6" rx="1" />
              <rect x="535" y="125" width="10" height="12" fill="#EF4444" rx="1" />
              <rect x="575" y="145" width="10" height="14" fill="#3B82F6" rx="1" />
              <rect x="615" y="175" width="10" height="12" fill="#EF4444" rx="1" />

              {/* Wick lines */}
              <line x1="60" y1="170" x2="60" y2="190" stroke="#94A3B8" strokeWidth="1" />
              <line x1="100" y1="210" x2="100" y2="235" stroke="#94A3B8" strokeWidth="1" />
              <line x1="140" y1="150" x2="140" y2="175" stroke="#94A3B8" strokeWidth="1" />
              <line x1="180" y1="130" x2="180" y2="150" stroke="#94A3B8" strokeWidth="1" />
              <line x1="220" y1="90" x2="220" y2="110" stroke="#94A3B8" strokeWidth="1" />
              <line x1="260" y1="110" x2="260" y2="130" stroke="#94A3B8" strokeWidth="1" />
              <line x1="300" y1="80" x2="300" y2="100" stroke="#94A3B8" strokeWidth="1" />
              <line x1="340" y1="100" x2="340" y2="125" stroke="#94A3B8" strokeWidth="1" />
              <line x1="380" y1="75" x2="380" y2="95" stroke="#94A3B8" strokeWidth="1" />
              <line x1="420" y1="85" x2="420" y2="110" stroke="#94A3B8" strokeWidth="1" />
              <line x1="460" y1="110" x2="460" y2="135" stroke="#94A3B8" strokeWidth="1" />
              <line x1="500" y1="130" x2="500" y2="150" stroke="#94A3B8" strokeWidth="1" />
              <line x1="540" y1="120" x2="540" y2="140" stroke="#94A3B8" strokeWidth="1" />
              <line x1="580" y1="140" x2="580" y2="165" stroke="#94A3B8" strokeWidth="1" />
              <line x1="620" y1="170" x2="620" y2="190" stroke="#94A3B8" strokeWidth="1" />

              {/* Bounce arrows */}
              <path d="M 100 275 Q 120 260 140 275" fill="none" stroke="#10B981" strokeWidth="2" markerEnd="url(#arrowGreen)" />
              <path d="M 300 85 Q 320 100 340 85" fill="none" stroke="#EF4444" strokeWidth="2" markerEnd="url(#arrowRed)" />

              <defs>
                <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#10B981" />
                </marker>
                <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#EF4444" />
                </marker>
              </defs>

              {/* Axis labels */}
              <text x="580" y="350" fill="#64748B" fontSize="11" fontFamily="sans-serif">เวลา →</text>
              <text x="5" y="20" fill="#64748B" fontSize="11" fontFamily="sans-serif">ราคา ↑</text>
            </svg>
          </div>
          <p>เมื่อแนวรับถูกทะลุ จะกลายเป็นแนวต้านใหม่ และในทางกลับกัน แนวต้านที่ถูกทะลุ จะกลายเป็นแนวรับใหม่</p>
        </AccordionSection>

        <AccordionSection
          title="Volume คืออะไร?"
          icon={<PieChart size={16} className="text-brand-primary" />}
        >
          <p><strong>Volume (ปริมาณการซื้อขาย)</strong> คือจำนวนหุ้นที่มีการเปลี่ยนมือในช่วงเวลาหนึ่ง</p>
          <LearningVisual type="volume" />
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 360" className="h-full w-full" aria-label="กราฟราคาและปริมาณการซื้อขาย Volume">
              <defs>
                <pattern id="vgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27354F" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="640" height="360" fill="#0B1120" />
              <rect width="640" height="360" fill="url(#vgrid)" />

              {/* Price area top half */}
              <line x1="0" y1="200" x2="640" y2="200" stroke="#1E293B" strokeWidth="1" />

              {/* Price line */}
              <polyline
                points="40,160 100,140 160,170 220,130 280,110 340,90 400,120 460,100 520,130 580,150 620,170"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Price candles */}
              <rect x="34" y="150" width="12" height="18" fill="#10B981" rx="1" />
              <line x1="40" y1="145" x2="40" y2="175" stroke="#94A3B8" strokeWidth="1" />

              <rect x="94" y="130" width="12" height="16" fill="#10B981" rx="1" />
              <line x1="100" y1="125" x2="100" y2="152" stroke="#94A3B8" strokeWidth="1" />

              <rect x="154" y="165" width="12" height="14" fill="#EF4444" rx="1" />
              <line x1="160" y1="158" x2="160" y2="185" stroke="#94A3B8" strokeWidth="1" />

              <rect x="214" y="120" width="12" height="18" fill="#10B981" rx="1" />
              <line x1="220" y1="115" x2="220" y2="145" stroke="#94A3B8" strokeWidth="1" />

              <rect x="274" y="100" width="12" height="14" fill="#10B981" rx="1" />
              <line x1="280" y1="95" x2="280" y2="120" stroke="#94A3B8" strokeWidth="1" />

              <rect x="334" y="80" width="12" height="18" fill="#10B981" rx="1" />
              <line x1="340" y1="75" x2="340" y2="105" stroke="#94A3B8" strokeWidth="1" />

              <rect x="394" y="110" width="12" height="18" fill="#EF4444" rx="1" />
              <line x1="400" y1="105" x2="400" y2="135" stroke="#94A3B8" strokeWidth="1" />

              <rect x="454" y="92" width="12" height="14" fill="#10B981" rx="1" />
              <line x1="460" y1="88" x2="460" y2="112" stroke="#94A3B8" strokeWidth="1" />

              <rect x="514" y="120" width="12" height="18" fill="#EF4444" rx="1" />
              <line x1="520" y1="115" x2="520" y2="145" stroke="#94A3B8" strokeWidth="1" />

              <rect x="574" y="142" width="12" height="14" fill="#EF4444" rx="1" />
              <line x1="580" y1="138" x2="580" y2="162" stroke="#94A3B8" strokeWidth="1" />

              {/* Volume bars bottom half */}
              <rect x="30" y="210" width="20" height="40" fill="#10B981" opacity="0.6" rx="1" />
              <rect x="90" y="210" width="20" height="36" fill="#10B981" opacity="0.6" rx="1" />
              <rect x="150" y="210" width="20" height="52" fill="#EF4444" opacity="0.6" rx="1" />
              <rect x="210" y="210" width="20" height="88" fill="#10B981" opacity="0.7" rx="1" />
              <rect x="270" y="210" width="20" height="64" fill="#10B981" opacity="0.6" rx="1" />
              <rect x="330" y="210" width="20" height="120" fill="#10B981" opacity="0.8" rx="1" />
              <rect x="390" y="210" width="20" height="56" fill="#EF4444" opacity="0.6" rx="1" />
              <rect x="450" y="210" width="20" height="44" fill="#10B981" opacity="0.6" rx="1" />
              <rect x="510" y="210" width="20" height="72" fill="#EF4444" opacity="0.6" rx="1" />
              <rect x="570" y="210" width="20" height="48" fill="#EF4444" opacity="0.6" rx="1" />

              {/* Volume spike highlight */}
              <rect x="325" y="205" width="30" height="130" fill="#10B981" opacity="0.08" rx="2" />
              <text x="340" y="345" fill="#10B981" fontSize="11" fontFamily="sans-serif" textAnchor="middle">Volume Spike</text>

              {/* Labels */}
              <text x="10" y="20" fill="#64748B" fontSize="11" fontFamily="sans-serif">ราคา</text>
              <text x="10" y="230" fill="#64748B" fontSize="11" fontFamily="sans-serif">Volume</text>
              <text x="580" y="350" fill="#64748B" fontSize="11" fontFamily="sans-serif">เวลา →</text>
            </svg>
          </div>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Volume สูง + ราคาขึ้น = สะท้อนแรงซื้อที่แข็งแรงขึ้น</li>
            <li>Volume สูง + ราคาลง = สะท้อนแรงขายที่ต้องจัดการความเสี่ยง</li>
            <li>Volume ต่ำ + ราคาขึ้น = อาจเป็นการขึ้นที่ไม่ยั่งยืน</li>
            <li>Volume ต่ำ + ราคาลง = แรงขายอ่อน อาจใกล้จุดกลับตัว</li>
          </ul>
        </AccordionSection>
      </div>

      {/* Indicators Guide */}
      <SectionHeading icon={<TrendingUp size={22} />} title="ตัวชี้วัดและเครื่องมือวิเคราะห์" tone="success" />

      <div className="space-y-3">
        <AccordionSection
          title="SMA — เฉลี่ยเคลื่อนที่แบบง่าย (Simple Moving Average)"
          icon={<TrendingUp size={16} className="text-brand-primary" />}
        >
          <p>
            <strong>SMA</strong> คือค่าเฉลี่ยของราคาปิดในช่วงเวลาที่กำหนด เช่น SMA 20 = ค่าเฉลี่ยราคาปิด 20 วันที่ผ่านมา
          </p>
          <p><strong>วิธีใช้:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>เมื่อราคาอยู่เหนือ SMA = แนวโน้มขาขึ้น</li>
            <li>เมื่อราคาอยู่ต่ำกว่า SMA = แนวโน้มขาลง</li>
            <li>SMA 50 ตัด SMA 200 ขึ้น = Golden Cross (สัญญาณขาขึ้นระยะยาว)</li>
            <li>SMA 50 ตัด SMA 200 ลง = Death Cross (สัญญาณขาลงระยะยาว)</li>
          </ul>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 280" className="h-full w-full">
              <rect width="640" height="280" fill="#0B1120" />
              <line x1="0" y1="140" x2="640" y2="140" stroke="#1E293B" strokeWidth="1" />
              {/* Price */}
              <polyline points="20,180 60,170 100,190 140,160 180,130 220,110 260,90 300,70 340,80 380,60 420,50 460,70 500,90 540,120 580,140 620,150" fill="none" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
              {/* SMA 20 smoother */}
              <polyline points="20,185 60,178 100,185 140,172 180,155 220,138 260,118 300,100 340,90 380,78 420,68 460,75 500,88 540,108 580,125 620,138" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="4 3" />
              {/* SMA 50 slower */}
              <polyline points="20,190 60,188 100,185 140,180 180,172 220,162 260,150 300,138 340,128 380,118 420,108 460,102 500,100 540,105 580,112 620,120" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
              <text x="520" y="90" fill="#3B82F6" fontSize="11" fontFamily="sans-serif">SMA 20</text>
              <text x="520" y="105" fill="#F59E0B" fontSize="11" fontFamily="sans-serif">SMA 50</text>
              <text x="10" y="20" fill="#64748B" fontSize="11" fontFamily="sans-serif">ราคา</text>
            </svg>
          </div>
        </AccordionSection>

        <AccordionSection
          title="EMA — เฉลี่ยเคลื่อนที่แบบเอกซ์โพเนนเชียล (Exponential Moving Average)"
          icon={<TrendingUp size={16} className="text-brand-accent" />}
        >
          <p>
            <strong>EMA</strong> คล้าย SMA แต่ให้น้ำหนักกับข้อมูลล่าสุดมากกว่า ทำให้ตอบสนองต่อการเปลี่ยนแปลงของราคาได้เร็วกว่า
          </p>
          <p><strong>EMA ที่นิยมใช้:</strong> EMA 12 (ระยะสั้น), EMA 26 (ระยะกลาง), EMA 50, EMA 200 (ระยะยาว)</p>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 280" className="h-full w-full">
              <rect width="640" height="280" fill="#0B1120" />
              <line x1="0" y1="140" x2="640" y2="140" stroke="#1E293B" strokeWidth="1" />
              {/* Price */}
              <polyline points="20,160 60,155 100,170 140,150 180,130 220,120 260,100 300,80 340,85 380,65 420,55 460,75 500,95 540,115 580,130 620,145" fill="none" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
              {/* SMA lags */}
              <polyline points="20,170 60,168 100,172 140,165 180,155 220,148 260,140 300,130 340,128 380,120 420,115 460,125 500,135 540,145 580,150 620,155" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="6 4" />
              {/* EMA follows closer */}
              <polyline points="20,165 60,160 100,168 140,156 180,138 220,128 260,108 300,88 340,90 380,72 420,62 460,80 500,100 540,120 580,132 620,148" fill="none" stroke="#10B981" strokeWidth="2.5" />
              <text x="520" y="80" fill="#10B981" fontSize="11" fontFamily="sans-serif">EMA (ตามเร็ว)</text>
              <text x="520" y="95" fill="#EF4444" fontSize="11" fontFamily="sans-serif">SMA (ตามช้า)</text>
              <text x="10" y="20" fill="#64748B" fontSize="11" fontFamily="sans-serif">ราคา</text>
            </svg>
          </div>
        </AccordionSection>

        <AccordionSection
          title="RSI — ดัชนีความแข็งแกร่งสัมพัทธ์ (Relative Strength Index)"
          icon={<Brain size={16} className="text-brand-warning" />}
        >
          <p>
            <strong>RSI</strong> เป็น Momentum Oscillator ที่วัดความเร็วและการเปลี่ยนแปลงของราคา มีค่าระหว่าง 0-100
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>RSI &gt; 70</strong> = ภาวะ Overbought (ซื้อมากเกินไป) — ควรตรวจแรงขายและความเสี่ยงการพักตัว</li>
            <li><strong>RSI &lt; 30</strong> = ภาวะ Oversold (ขายมากเกินไป) — ควรตรวจแรงดีดกลับและเหตุผลที่ราคาถูกกด</li>
            <li><strong>RSI 50</strong> = จุดกึ่งกลาง เป็นเส้นแบ่งระหว่างแนวโน้มขาขึ้นและขาลง</li>
          </ul>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 280" className="h-full w-full">
              <rect width="640" height="280" fill="#0B1120" />
              <line x1="0" y1="70" x2="640" y2="70" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
              <text x="10" y="65" fill="#EF4444" fontSize="11" fontFamily="sans-serif">Overbought 70</text>
              <line x1="0" y1="140" x2="640" y2="140" stroke="#64748B" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              <text x="10" y="135" fill="#64748B" fontSize="11" fontFamily="sans-serif">Mid 50</text>
              <line x1="0" y1="210" x2="640" y2="210" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
              <text x="10" y="225" fill="#10B981" fontSize="11" fontFamily="sans-serif">Oversold 30</text>
              {/* RSI curve */}
              <polyline points="20,180 60,170 100,120 140,80 180,65 220,90 260,130 300,180 340,220 380,200 420,160 460,120 500,90 540,75 580,110 620,150" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
              <text x="550" y="200" fill="#F59E0B" fontSize="11" fontFamily="sans-serif">RSI</text>
            </svg>
          </div>
        </AccordionSection>

        <AccordionSection
          title="MACD — Moving Average Convergence Divergence"
          icon={<BarChart3 size={16} className="text-brand-danger" />}
        >
          <p><strong>MACD</strong> ประกอบด้วย 3 ส่วน:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>MACD Line</strong> = EMA 12 - EMA 26</li>
            <li><strong>Signal Line</strong> = EMA 9 ของ MACD Line</li>
            <li><strong>Histogram</strong> = MACD Line - Signal Line</li>
          </ul>
          <p><strong>สิ่งที่ใช้ตีความ:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>MACD ตัด Signal ขึ้น = โมเมนตัมเริ่มฟื้น ต้องตรวจ volume และแนวโน้มหลักประกอบ</li>
            <li>MACD ตัด Signal ลง = โมเมนตัมเริ่มอ่อน ต้องตรวจแนวรับและข่าวประกอบ</li>
            <li>Histogram ใหญ่ขึ้น = แนวโน้มกำลังแข็งแกร่ง</li>
          </ul>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 280" className="h-full w-full">
              <rect width="640" height="280" fill="#0B1120" />
              <line x1="0" y1="140" x2="640" y2="140" stroke="#1E293B" strokeWidth="1" />
              {/* Histogram bars */}
              <rect x="30" y="125" width="14" height="15" fill="#10B981" opacity="0.7" rx="1" />
              <rect x="60" y="115" width="14" height="25" fill="#10B981" opacity="0.7" rx="1" />
              <rect x="90" y="100" width="14" height="40" fill="#10B981" opacity="0.7" rx="1" />
              <rect x="120" y="110" width="14" height="30" fill="#10B981" opacity="0.7" rx="1" />
              <rect x="150" y="135" width="14" height="5" fill="#EF4444" opacity="0.6" rx="1" />
              <rect x="180" y="130" width="14" height="10" fill="#EF4444" opacity="0.6" rx="1" />
              <rect x="210" y="120" width="14" height="20" fill="#10B981" opacity="0.7" rx="1" />
              <rect x="240" y="105" width="14" height="35" fill="#10B981" opacity="0.7" rx="1" />
              <rect x="270" y="85" width="14" height="55" fill="#10B981" opacity="0.8" rx="1" />
              <rect x="300" y="95" width="14" height="45" fill="#10B981" opacity="0.7" rx="1" />
              <rect x="330" y="125" width="14" height="15" fill="#EF4444" opacity="0.6" rx="1" />
              <rect x="360" y="130" width="14" height="10" fill="#EF4444" opacity="0.6" rx="1" />
              {/* MACD line */}
              <polyline points="37,130 67,110 97,85 127,95 157,145 187,140 217,105 247,80 277,55 307,70 337,135 367,140" fill="none" stroke="#3B82F6" strokeWidth="2.5" />
              {/* Signal line */}
              <polyline points="37,135 67,125 97,105 127,100 157,125 187,130 217,115 247,95 277,75 307,85 337,125 367,135" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 3" />
              <text x="500" y="70" fill="#3B82F6" fontSize="11" fontFamily="sans-serif">MACD Line</text>
              <text x="500" y="85" fill="#F59E0B" fontSize="11" fontFamily="sans-serif">Signal Line</text>
              <text x="500" y="100" fill="#10B981" fontSize="11" fontFamily="sans-serif">Histogram</text>
            </svg>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Bollinger Bands — แถบโบลินเจอร์"
          icon={<Target size={16} className="text-brand-accent" />}
        >
          <p><strong>Bollinger Bands</strong> ประกอบด้วย 3 เส้น:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Upper Band</strong> = SMA 20 + (2 × Standard Deviation)</li>
            <li><strong>Middle Band</strong> = SMA 20</li>
            <li><strong>Lower Band</strong> = SMA 20 - (2 × Standard Deviation)</li>
          </ul>
          <p><strong>วิธีใช้:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>ราคาแตะ Upper Band = อาจ Overbought</li>
            <li>ราคาแตะ Lower Band = อาจ Oversold</li>
            <li>Band แคบ (Squeeze) = อาจมีการเคลื่อนไหวรุนแรงในเร็วๆ นี้</li>
          </ul>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 280" className="h-full w-full">
              <rect width="640" height="280" fill="#0B1120" />
              {/* Upper Band */}
              <path d="M 20 60 Q 120 40 220 70 Q 320 100 420 55 Q 520 35 620 80" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 3" />
              <text x="540" y="40" fill="#EF4444" fontSize="11" fontFamily="sans-serif">Upper Band</text>
              {/* Lower Band */}
              <path d="M 20 220 Q 120 240 220 210 Q 320 180 420 225 Q 520 245 620 200" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="4 3" />
              <text x="540" y="250" fill="#10B981" fontSize="11" fontFamily="sans-serif">Lower Band</text>
              {/* Middle Band (SMA 20) */}
              <path d="M 20 140 Q 120 140 220 140 Q 320 140 420 140 Q 520 140 620 140" fill="none" stroke="#64748B" strokeWidth="1.5" />
              <text x="540" y="155" fill="#64748B" fontSize="11" fontFamily="sans-serif">SMA 20</text>
              {/* Shaded area between bands */}
              <path d="M 20 60 Q 120 40 220 70 Q 320 100 420 55 Q 520 35 620 80 L 620 200 Q 520 245 420 225 Q 320 180 220 210 Q 120 240 20 220 Z" fill="#3B82F6" opacity="0.06" />
              {/* Price line bouncing inside bands */}
              <polyline points="20,120 60,100 100,130 140,90 180,110 220,80 260,100 300,75 340,95 380,70 420,85 460,105 500,130 540,110 580,90 620,115" fill="none" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
              {/* Squeeze highlight */}
              <rect x="380" y="55" width="80" height="170" fill="#F59E0B" opacity="0.06" rx="2" />
              <text x="420" y="240" fill="#F59E0B" fontSize="11" fontFamily="sans-serif" textAnchor="middle">Squeeze</text>
            </svg>
          </div>
        </AccordionSection>
      </div>

      {/* Investment Concepts */}
      <SectionHeading icon={<Lightbulb size={22} />} title="แนวคิดและกลยุทธ์การลงทุน" tone="warning" />

      <div className="space-y-3">
        <AccordionSection
          title="P/E Ratio — อัตราส่วนราคาต่อกำไร"
          icon={<PieChart size={16} className="text-brand-primary" />}
        >
          <p><strong>P/E Ratio (Price-to-Earnings Ratio)</strong> = ราคาหุ้น ÷ กำไรต่อหุ้น (EPS)</p>
          <p>ใช้วัดว่าหุ้นมีราคาแพงหรือถูกเมื่อเทียบกับกำไร</p>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 280" className="h-full w-full">
              <rect width="640" height="280" fill="#0B1120" />
              <line x1="0" y1="220" x2="640" y2="220" stroke="#1E293B" strokeWidth="1" />
              {/* Bars: P/E of different stocks */}
              <rect x="60" y="100" width="40" height="120" fill="#10B981" opacity="0.8" rx="3" />
              <text x="80" y="95" fill="#F8FAFC" fontSize="12" fontFamily="sans-serif" textAnchor="middle">8x</text>
              <text x="80" y="250" fill="#94A3B8" fontSize="11" fontFamily="sans-serif" textAnchor="middle">ถูก</text>

              <rect x="180" y="60" width="40" height="160" fill="#3B82F6" opacity="0.8" rx="3" />
              <text x="200" y="55" fill="#F8FAFC" fontSize="12" fontFamily="sans-serif" textAnchor="middle">15x</text>
              <text x="200" y="250" fill="#94A3B8" fontSize="11" fontFamily="sans-serif" textAnchor="middle">ปกติ</text>

              <rect x="300" y="40" width="40" height="180" fill="#F59E0B" opacity="0.8" rx="3" />
              <text x="320" y="35" fill="#F8FAFC" fontSize="12" fontFamily="sans-serif" textAnchor="middle">25x</text>
              <text x="320" y="250" fill="#94A3B8" fontSize="11" fontFamily="sans-serif" textAnchor="middle">สูง</text>

              <rect x="420" y="20" width="40" height="200" fill="#EF4444" opacity="0.8" rx="3" />
              <text x="440" y="15" fill="#F8FAFC" fontSize="12" fontFamily="sans-serif" textAnchor="middle">45x</text>
              <text x="440" y="250" fill="#94A3B8" fontSize="11" fontFamily="sans-serif" textAnchor="middle">แพง</text>

              <rect x="540" y="120" width="40" height="100" fill="#EF4444" opacity="0.4" rx="3" />
              <text x="560" y="115" fill="#F8FAFC" fontSize="12" fontFamily="sans-serif" textAnchor="middle">60x</text>
              <text x="560" y="250" fill="#94A3B8" fontSize="11" fontFamily="sans-serif" textAnchor="middle">Tech</text>

              <text x="320" y="270" fill="#64748B" fontSize="11" fontFamily="sans-serif" textAnchor="middle">เปรียบเทียบ P/E ระหว่างหุ้นและอุตสาหกรรม</text>
            </svg>
          </div>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>P/E ต่ำ = อาจเป็นหุ้นถูก หรืออาจมีปัจจัยเสี่ยง</li>
            <li>P/E สูง = อาจเป็นหุ้นแพง หรืออาจมีการเติบโตสูง</li>
            <li>ควรเปรียบเทียบ P/E กับค่าเฉลี่ยอุตสาหกรรม</li>
          </ul>
        </AccordionSection>

        <AccordionSection
          title="Market Capitalization — มูลค่าตลาด"
          icon={<BarChart3 size={16} className="text-brand-success" />}
        >
          <p><strong>Market Cap</strong> = ราคาหุ้น × จำนวนหุ้นทั้งหมด</p>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 280" className="h-full w-full">
              <rect width="640" height="280" fill="#0B1120" />
              {/* Small Cap bubble */}
              <circle cx="120" cy="180" r="35" fill="#EF4444" opacity="0.7" />
              <text x="120" y="175" fill="#F8FAFC" fontSize="10" fontFamily="sans-serif" textAnchor="middle">Small Cap</text>
              <text x="120" y="190" fill="#F8FAFC" fontSize="9" fontFamily="sans-serif" textAnchor="middle">&lt; 1,000 M</text>

              {/* Mid Cap bubble */}
              <circle cx="320" cy="140" r="55" fill="#F59E0B" opacity="0.7" />
              <text x="320" y="135" fill="#F8FAFC" fontSize="12" fontFamily="sans-serif" textAnchor="middle">Mid Cap</text>
              <text x="320" y="152" fill="#F8FAFC" fontSize="10" fontFamily="sans-serif" textAnchor="middle">1,000 - 10,000 M</text>

              {/* Large Cap bubble */}
              <circle cx="520" cy="100" r="80" fill="#10B981" opacity="0.7" />
              <text x="520" y="95" fill="#F8FAFC" fontSize="14" fontFamily="sans-serif" textAnchor="middle">Large Cap</text>
              <text x="520" y="115" fill="#F8FAFC" fontSize="11" fontFamily="sans-serif" textAnchor="middle">&gt; 10,000 M</text>

              <text x="320" y="260" fill="#64748B" fontSize="11" fontFamily="sans-serif" textAnchor="middle">มูลค่าตลาดยิ่งใหญ่ = บริษัทยิ่งมั่นคง (โดยทั่วไป)</text>
            </svg>
          </div>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Large Cap</strong> (&gt; 10,000 ล้าน) — มั่นคง ความเสี่ยงต่ำ</li>
            <li><strong>Mid Cap</strong> (1,000-10,000 ล้าน) — สมดุลระหว่างความเสี่ยงและผลตอบแทน</li>
            <li><strong>Small Cap</strong> (&lt; 1,000 ล้าน) — ความเสี่ยงสูง โอกาสเติบโตสูง</li>
          </ul>
        </AccordionSection>

        <AccordionSection
          title="Diversification — การกระจายความเสี่ยง"
          icon={<Target size={16} className="text-brand-warning" />}
        >
          <p><strong>&ldquo;Don&apos;t put all your eggs in one basket&rdquo;</strong> — อย่าใส่ไข่ทุกฟองไว้ตะกร้าเดียว</p>
          <p>การกระจายการลงทุนในหลายหลักทรัพย์ หลายอุตสาหกรรม หรือหลายสินทรัพย์ ช่วยลดความเสี่ยงรวมของพอร์ตโฟลิโอ</p>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 280" className="h-full w-full">
              <rect width="640" height="280" fill="#0B1120" />
              {/* Pie chart segments */}
              <path d="M 320 140 L 320 40 A 100 100 0 0 1 420 140 Z" fill="#3B82F6" opacity="0.8" />
              <path d="M 320 140 L 420 140 A 100 100 0 0 1 370 235 Z" fill="#10B981" opacity="0.8" />
              <path d="M 320 140 L 370 235 A 100 100 0 0 1 270 235 Z" fill="#F59E0B" opacity="0.8" />
              <path d="M 320 140 L 270 235 A 100 100 0 0 1 220 140 Z" fill="#EF4444" opacity="0.8" />
              <path d="M 320 140 L 220 140 A 100 100 0 0 1 320 40 Z" fill="#8B5CF6" opacity="0.8" />
              {/* Labels */}
              <text x="370" y="90" fill="#F8FAFC" fontSize="11" fontFamily="sans-serif" textAnchor="middle">หุ้น 30%</text>
              <text x="400" y="180" fill="#F8FAFC" fontSize="11" fontFamily="sans-serif" textAnchor="middle">ตราสารหนี้ 25%</text>
              <text x="320" y="210" fill="#F8FAFC" fontSize="11" fontFamily="sans-serif" textAnchor="middle">ทองคำ 20%</text>
              <text x="240" y="180" fill="#F8FAFC" fontSize="11" fontFamily="sans-serif" textAnchor="middle">อสังหา 15%</text>
              <text x="270" y="90" fill="#F8FAFC" fontSize="11" fontFamily="sans-serif" textAnchor="middle">กองทุน 10%</text>

              {/* Diversified vs Concentrated comparison */}
              <rect x="480" y="60" width="120" height="40" fill="#EF4444" opacity="0.3" rx="4" stroke="#EF4444" strokeWidth="1" />
              <text x="540" y="75" fill="#EF4444" fontSize="10" fontFamily="sans-serif" textAnchor="middle">ไม่กระจาย</text>
              <text x="540" y="90" fill="#EF4444" fontSize="9" fontFamily="sans-serif" textAnchor="middle">ความเสี่ยงสูง</text>

              <rect x="480" y="140" width="120" height="40" fill="#10B981" opacity="0.3" rx="4" stroke="#10B981" strokeWidth="1" />
              <text x="540" y="155" fill="#10B981" fontSize="10" fontFamily="sans-serif" textAnchor="middle">กระจายแล้ว</text>
              <text x="540" y="170" fill="#10B981" fontSize="9" fontFamily="sans-serif" textAnchor="middle">ความเสี่ยงลด</text>

              <text x="320" y="270" fill="#64748B" fontSize="11" fontFamily="sans-serif" textAnchor="middle">พอร์ตที่กระจายลดผลกระทบจากหุ้นตัวใดตัวหนึ่งลง</text>
            </svg>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Dollar-Cost Averaging — เฉลี่ยต้นทุนแบบ DCA"
          icon={<TrendingUp size={16} className="text-brand-accent" />}
        >
          <p>
            <strong>DCA</strong> คือกลยุทธ์ลงทุนด้วยจำนวนเงินเท่ากันสม่ำเสมอ ไม่ว่าราคาจะขึ้นหรือลง
          </p>
          <p><strong>ข้อดี:</strong> ลดความเสี่ยงจากการจับจังหวะตลาดผิด, สร้างวินัยการลงทุน, เฉลี่ยต้นทุนอัตโนมัติ</p>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
            <svg viewBox="0 0 640 280" className="h-full w-full">
              <rect width="640" height="280" fill="#0B1120" />
              <line x1="0" y1="140" x2="640" y2="140" stroke="#1E293B" strokeWidth="1" />
              {/* Price line volatile */}
              <polyline points="20,100 60,140 100,80 140,160 180,60 220,120 260,50 300,170 340,90 380,130 420,70 460,150 500,110 540,180 580,120 620,140" fill="none" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
              {/* DCA buy points — same amount at regular intervals */}
              <circle cx="40" cy="120" r="5" fill="#3B82F6" />
              <circle cx="120" cy="110" r="5" fill="#3B82F6" />
              <circle cx="200" cy="90" r="5" fill="#3B82F6" />
              <circle cx="280" cy="130" r="5" fill="#3B82F6" />
              <circle cx="360" cy="110" r="5" fill="#3B82F6" />
              <circle cx="440" cy="100" r="5" fill="#3B82F6" />
              <circle cx="520" cy="140" r="5" fill="#3B82F6" />
              <circle cx="600" cy="130" r="5" fill="#3B82F6" />
              {/* Average cost line */}
              <line x1="20" y1="118" x2="620" y2="118" stroke="#10B981" strokeWidth="2" strokeDasharray="5 4" />
              <text x="520" y="110" fill="#10B981" fontSize="11" fontFamily="sans-serif">ต้นทุนเฉลี่ย DCA</text>
              <text x="40" y="260" fill="#3B82F6" fontSize="11" fontFamily="sans-serif">● ซื้อสม่ำเสมอทุกเดือน (จำนวนเงินเท่ากัน)</text>
              <text x="320" y="275" fill="#64748B" fontSize="11" fontFamily="sans-serif">ราคาขึ้นลง แต่ต้นทุนเฉลี่ยลดลงเรื่อยๆ</text>
            </svg>
          </div>
        </AccordionSection>
      </div>

      {/* FAQ */}
      <SectionHeading icon={<HelpCircle size={22} />} title="คำถามที่พบบ่อย (FAQ)" />

      <div className="space-y-3">
        <AccordionSection
          title="ควรเริ่มต้นลงทุนอย่างไร?"
          icon={<HelpCircle size={16} className="text-brand-primary" />}
        >
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li><strong>ศึกษาพื้นฐาน</strong> — เรียนรู้เกี่ยวกับตลาดหุ้น ประเภทหลักทรัพย์ และความเสี่ยง</li>
            <li><strong>เปิดบัญชีซื้อขายหลักทรัพย์</strong> — เลือกโบรกเกอร์ที่น่าเชื่อถือ</li>
            <li><strong>กำหนดเป้าหมาย</strong> — กำหนดวัตถุประสงค์ ระยะเวลา และระดับความเสี่ยงที่ยอมรับได้</li>
            <li><strong>เริ่มจากเล็ก</strong> — เริ่มลงทุนด้วยเงินที่พร้อมจะสูญเสียได้</li>
            <li><strong>เรียนรู้จากประสบการณ์</strong> — บันทึกการซื้อขาย วิเคราะห์ผล และพัฒนากลยุทธ์</li>
          </ol>
        </AccordionSection>

        <AccordionSection
          title="วิเคราะห์ทางเทคนิค vs วิเคราะห์ปัจจัยพื้นฐาน ต่างกันอย่างไร?"
          icon={<HelpCircle size={16} className="text-brand-warning" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-brand-card rounded-lg p-3 border border-brand-border">
              <p className="font-semibold text-brand-primary mb-1">📊 วิเคราะห์ทางเทคนิค</p>
              <p>มุ่งเน้น<strong>ราคา</strong>และ<strong>ปริมาณ</strong> เหมาะกับการซื้อขายระยะสั้น (Trading) ใช้ Charts และ Indicators</p>
            </div>
            <div className="bg-brand-card rounded-lg p-3 border border-brand-border">
              <p className="font-semibold text-brand-success mb-1">📋 วิเคราะห์ปัจจัยพื้นฐาน</p>
              <p>มุ่งเน้น<strong>งบการเงิน</strong>และ<strong>ธุรกิจ</strong> เหมาะกับการลงทุนระยะยาว (Investing) ใช้ P/E, EPS, Revenue</p>
            </div>
          </div>
          <p className="text-brand-text-primary font-medium">💡 นักลงทุนที่ดีควรใช้ทั้งสองวิธีร่วมกัน</p>
        </AccordionSection>

        <AccordionSection
          title="Stop Loss คืออะไร?"
          icon={<HelpCircle size={16} className="text-brand-danger" />}
        >
          <p><strong>Stop Loss (จุดขาดทุน)</strong> คือคำสั่งขายหุ้นอัตโนมัติเมื่อราคาลงถึงระดับที่กำหนด เพื่อจำกัดจำนวนขาดทุน</p>
          <p>ตัวอย่าง: ซื้อหุ้นที่ 100 บาท ตั้ง Stop Loss ที่ 90 บาท = ขาดทุนสูงสุด 10%</p>
          <p className="text-brand-danger font-medium">⚠️ นักลงทุนทุกคนควรมี Stop Loss เพื่อจัดการความเสี่ยง</p>
        </AccordionSection>

        <AccordionSection
          title="Timeframe ไหนดีที่สุด?"
          icon={<HelpCircle size={16} className="text-brand-accent" />}
        >
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Intraday (1-15 นาที)</strong> — สำหรับ Scalper/Day Trader</li>
            <li><strong>Swing (1-4 ชั่วโมง, 1 วัน)</strong> — สำหรับ Swing Trader ถือ 2-10 วัน</li>
            <li><strong>Position (รายสัปดาห์, รายเดือน)</strong> — สำหรับ Position Trader ถือสัปดาห์-เดือน</li>
            <li><strong>Long-term (รายเดือน, รายปี)</strong> — สำหรับนักลงทุนระยะยาว</li>
          </ul>
          <p>Timeframe ที่เหมาะสมขึ้นอยู่กับสไตล์การซื้อขายและเป้าหมายของแต่ละคน</p>
        </AccordionSection>
      </div>
    </div>
  )
}
