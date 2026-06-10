import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-brand-bg-secondary border-t border-brand-border mt-auto">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-primary/35 bg-brand-primary/10">
                <TrendingUp size={18} className="text-brand-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-brand-text-primary">StockGuru</h2>
                <p className="text-[10px] text-brand-text-secondary">สต็อกกูรู</p>
              </div>
            </div>
            <p className="text-sm text-brand-text-secondary leading-relaxed">
              เว็บไซต์วิเคราะห์หุ้นไทยด้วย AI ครบครันด้วยกราฟเทคนิค ข่าวสาร และเครื่องมือวิเคราะห์
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-brand-text-primary mb-3">ลิงก์ด่วน</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-brand-text-secondary hover:text-brand-primary transition-colors">หน้าแรก</Link></li>
              <li><Link href="/screener" className="text-sm text-brand-text-secondary hover:text-brand-primary transition-colors">Screener</Link></li>
              <li><Link href="/news" className="text-sm text-brand-text-secondary hover:text-brand-primary transition-colors">ข่าวสาร</Link></li>
              <li><Link href="/pricing" className="text-sm text-brand-text-secondary hover:text-brand-primary transition-colors">ราคา</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-brand-text-primary mb-3">กฎหมาย</h3>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-sm text-brand-text-secondary hover:text-brand-primary transition-colors">เงื่อนไขการใช้บริการ</Link></li>
              <li><Link href="/privacy" className="text-sm text-brand-text-secondary hover:text-brand-primary transition-colors">นโยบายความเป็นส่วนตัว</Link></li>
              <li><Link href="/risk-disclaimer" className="text-sm text-brand-text-secondary hover:text-brand-primary transition-colors">ข้อจำกัดความรับผิดชอบ</Link></li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-sm font-semibold text-brand-text-primary mb-3">ข้อจำกัดความรับผิด</h3>
            <p className="text-xs text-brand-text-secondary leading-relaxed">
              ข้อมูลในเว็บไซต์นี้จัดทำขึ้นเพื่อวัตถุประสงค์ทางการศึกษาเท่านั้น ไม่ถือเป็นคำแนะนำในการลงทุน
              การลงทุนมีความเสี่ยง ผู้ลงทุนควรศึกษาข้อมูลก่อนตัดสินใจลงทุน
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-text-secondary">
            © 2026 StockGuru. สงวนลิขสิทธิ์
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-brand-text-secondary">ขับเคลื่อนโดย AI</span>
            <span className="w-1.5 h-1.5 bg-brand-success rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </footer>
  )
}
