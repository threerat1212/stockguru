import { Brain, ShieldAlert, Database, AlertTriangle } from 'lucide-react'
import AIChat from '@/components/ai/AIChat'
import Card from '@/components/ui/Card'

const safetyPoints = [
  {
    icon: Database,
    title: 'บอกข้อมูลที่ใช้',
    body: 'คำตอบควรอ้างอิงบริบท เช่น ราคา ข่าว งบ หรืออินดิเคเตอร์ที่ถูกใช้ประกอบ',
  },
  {
    icon: ShieldAlert,
    title: 'เช็กสมมติฐานและความเสี่ยง',
    body: 'ใช้ AI เพื่อช่วยตั้งคำถามต่อ ไม่ใช่ให้ตัดสินใจแทน',
  },
  {
    icon: AlertTriangle,
    title: 'ไม่ใช่คำแนะนำลงทุน',
    body: 'StockGuru ไม่ให้สัญญาณซื้อขายและไม่รับประกันผลตอบแทน',
  },
]

export default function AIPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-accent to-brand-primary">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">AI วิเคราะห์</h1>
            <p className="text-sm text-brand-text-secondary">
              สรุปข้อมูลหุ้น ข่าว และความเสี่ยงที่ควรตรวจต่อ โดยไม่ใช่คำแนะนำซื้อขาย
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5">
        <AIChat />

        <div className="space-y-3">
          {safetyPoints.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                    <Icon size={18} className="text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-brand-text-primary">{item.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-brand-text-secondary">{item.body}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
