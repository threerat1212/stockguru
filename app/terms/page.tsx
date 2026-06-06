export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="heading-balance text-2xl font-bold text-brand-text-primary mb-2">
          เงื่อนไขการใช้บริการ
        </h1>
        <p className="text-sm text-brand-text-secondary">อัปเดตล่าสุด: 6 มิถุนายน 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">1. ข้อตกลงทั่วไป</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          การใช้งาน StockGuru หมายถึงการยอมรับเงื่อนไขเหล่านี้ หากไม่เห็นด้วย กรุณาหยุดใช้งานทันที
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">2. การเป็นสมาชิกและการสมัคร</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          สมาชิกต้องอายุ 18 ปีขึ้นไป บัญชีสมาชิกเป็นส่วนตัว ห้ามให้ผู้อื่นใช้งานแทน
          การสมัครแผน Pro เป็นการสมัครรายเดือน สามารถยกเลิกได้ตลอดเวลา
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">3. ข้อมูลและความรับผิดชอบ</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          StockGuru ไม่ใช่ผู้ให้คำแนะนำการลงทุนที่ได้รับอนุญาต ข้อมูลทั้งหมดเป็นเพียงการรวบรวมและวิเคราะห์เชิงสถิติ
          ไม่ใช่การคาดการณ์ผลตอบแทนที่แน่นอน ผู้ใช้ต้องใช้วิจารณญาณในการตัดสินใจลงทุน
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">4. การคืนเงิน</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          ไม่มีนโยบายคืนเงินหลังจากชำระแล้ว เนื่องจากเป็นการให้บริการดิจิทัลที่เข้าถึงข้อมูลได้ทันที
          หากมีปัญหาทางเทคนิค สามารถติดต่อทีมงานเพื่อพิจารณาเป็นรายกรณี
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">5. การยกเลิกบริการ</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          ผู้ใช้สามารถยกเลิกการสมัครแผน Pro ได้ตลอดเวลา การยกเลิกจะมีผลในช่วงบิลถัดไป
          บัญชีจะกลับเป็นแผน Free โดยอัตโนมัติ
        </p>
      </section>
    </div>
  )
}
