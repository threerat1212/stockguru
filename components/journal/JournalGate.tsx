'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { BookOpen, Lock, ArrowRight, Eye } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function JournalGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { plan, isLoading: subLoading, hasJournalAccess, journalLimit } = useSubscription()
  const isLoading = authLoading || subLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-brand-text-secondary">กำลังโหลด...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
          <Lock size={28} className="text-brand-primary" />
        </div>
        <h2 className="text-xl font-bold text-brand-text-primary">ต้องเข้าสู่ระบบก่อน</h2>
        <p className="text-sm text-brand-text-secondary max-w-sm">
          Trading Journal เป็นฟีเจอร์สำหรับสมาชิกเท่านั้น เข้าสู่ระบบเพื่อเริ่มบันทึกการเทรด
        </p>
        <p className="text-xs text-brand-text-muted">
          หากยังไม่มีบัญชี สามารถสมัครได้ฟรีและอัพเกรดเป็นแผน Trader เมื่อต้องการใช้งานเต็มรูปแบบ
        </p>
      </div>
    )
  }

  if (plan === 'free') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
          <BookOpen size={28} className="text-brand-primary" />
        </div>
        <h2 className="text-xl font-bold text-brand-text-primary">Trading Journal</h2>
        <p className="text-sm text-brand-text-secondary max-w-sm">
          บันทึก วิเคราะห์ และปรับปรุงการเทรดของคุณด้วย AI การวิเคราะห์พฤติกรรมส่วนตัว ไม่ใช่คำแนะนำซื้อขาย
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <div className="p-3 bg-brand-bg-secondary rounded-lg text-left">
            <div className="flex items-center gap-2 mb-1">
              <Eye size={14} className="text-brand-warning" />
              <span className="text-xs font-medium text-brand-text-primary">Free</span>
            </div>
            <p className="text-xs text-brand-text-secondary">ดูตัวอย่างระบบเท่านั้น ไม่สามารถบันทึกได้</p>
          </div>
          <div className="p-3 bg-brand-bg-secondary rounded-lg text-left border border-brand-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={14} className="text-brand-accent" />
              <span className="text-xs font-medium text-brand-text-primary">Trader</span>
            </div>
            <p className="text-xs text-brand-text-secondary">บันทึกไม่จำกัด AI Review รายสัปดาห์ Export ข้อมูล</p>
          </div>
          <Link href="/pricing">
            <Button variant="primary" className="w-full gap-1">
              ดูแผนราคา <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (plan === 'pro' || plan === 'founding_pro') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
          <BookOpen size={28} className="text-brand-primary" />
        </div>
        <h2 className="text-xl font-bold text-brand-text-primary">Trading Journal</h2>
        <p className="text-sm text-brand-text-secondary max-w-sm">
          บันทึกและวิเคราะห์การเทรดของคุณด้วย AI การวิเคราะห์พฤติกรรมส่วนตัว ไม่ใช่คำแนะนำซื้อขาย
        </p>
        <div className="p-4 bg-brand-bg-secondary rounded-xl border border-brand-border max-w-sm w-full text-left space-y-3">
          <p className="text-xs font-medium text-brand-text-secondary uppercase tracking-wider">ตัวอย่างฟีเจอร์</p>
          <ul className="space-y-2 text-sm text-brand-text-primary">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-success" /> บันทึกการเทรดแบบละเอียด (symbol, direction, SL/TP, setup)</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-success" /> แท็กพฤติกรรม (FOMO, revenge trade, over-risk)</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-success" /> Analytics: win rate, profit factor, avg R, max drawdown</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-success" /> AI Weekly Review สรุปพฤติกรรมจากข้อมูลที่บันทึก</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-success" /> Export CSV / ลบข้อมูลได้</li>
          </ul>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Link href="/pricing">
            <Button variant="primary" className="w-full gap-1">
              อัพเกรดเป็น Trader <ArrowRight size={16} />
            </Button>
          </Link>
          <p className="text-xs text-brand-text-muted text-center">
            แผน Pro ไม่รองรับ Trading Journal อัพเกรดเป็น Trader เพื่อใช้งานเต็มรูปแบบ
          </p>
        </div>
      </div>
    )
  }

  if (plan === 'trader') {
    return <>{children}</>
  }

  return null
}
