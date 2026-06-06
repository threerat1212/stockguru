import { AlertTriangle } from 'lucide-react'

export default function RiskDisclaimerPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <AlertTriangle size={28} className="text-brand-warning" />
        <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">
          ข้อจำกัดความรับผิดชอบ
        </h1>
      </div>

      <div className="p-4 bg-brand-warning/5 border border-brand-warning/20 rounded-lg">
        <p className="text-sm text-brand-text-primary font-medium mb-2">
          สำคัญ: กรุณาอ่านอย่างละเอียดก่อนใช้งาน StockGuru
        </p>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          StockGuru เป็นเครื่องมือวิเคราะห์ข้อมูลเพื่อการศึกษาและวิจัยเท่านั้น
          ไม่ใช่ผู้ให้คำแนะนำการลงทุนที่ได้รับอนุญาตจาก ก.ล.ต.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">1. ไม่ใช่คำแนะนำการลงทุน</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          ข้อมูล กราฟ การวิเคราะห์ AI และมุมมองเชิงข้อมูลทั้งหมดบนแพลตฟอร์มนี้
          เป็นเพียงการรวบรวมข้อมูลและวิเคราะห์เชิงสถิติ ไม่ใช่การแนะนำให้ซื้อหรือขายหลักทรัพย์
          ผู้ใช้ต้องใช้วิจารณญาณและศึกษาข้อมูลด้วยตนเองก่อนตัดสินใจลงทุน
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">2. ไม่รับประกันผลตอบแทน</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          อดีตไม่ได้เป็นตัวบ่งชี้อนาคต ผลการวิเคราะห์จาก AI หรืออินดิเคเตอร์ใดๆ
          ไม่สามารถรับประกันว่าจะทำกำไรได้ การลงทุนในตลาดหุ้นมีความเสี่ยงของการขาดทุน
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">3. ความเสี่ยงจากข้อมูล</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          ข้อมูลราคาและข่าวสารดึงมาจากแหล่งภายนอก (Yahoo Finance ฯลฯ)
          อาจมีความล่าช้า ผิดพลาด หรือขาดหายไป StockGuru ไม่รับผิดชอบต่อความเสียหาย
          ที่เกิดจากข้อมูลผิดพลาดหรือล่าช้า
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">4. ผู้ใช้รับผิดชอบเอง</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          ผู้ใช้รับผิดชอบต่อการตัดสินใจลงทุนทั้งหมดด้วยตนเอง
          ควรปรึกษาที่ปรึกษาการเงินที่ได้รับอนุญาตก่อนตัดสินใจลงทุนจริง
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">5. AI ไม่ใช่ผู้เชี่ยวชาญ</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          AI วิเคราะห์ของ StockGuru เป็นโมเดลภาษาที่สรุปข้อมูลจากข้อมูลทางเทคนิคเท่านั้น
          ไม่ใช่ผู้เชี่ยวชาญด้านการเงิน ไม่มีใบอนุญาต และไม่สามารถเข้าใจบริบทเฉพาะของแต่ละบุคคลได้
        </p>
      </section>
    </div>
  )
}
