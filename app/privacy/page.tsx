export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="heading-balance text-2xl font-bold text-brand-text-primary mb-2">
          นโยบายความเป็นส่วนตัว
        </h1>
        <p className="text-sm text-brand-text-secondary">อัปเดตล่าสุด: 6 มิถุนายน 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">1. ข้อมูลที่เราเก็บ</h2>
        <ul className="list-disc list-inside text-sm text-brand-text-secondary space-y-1">
          <li>อีเมลและรหัสผ่าน (เข้ารหัส) สำหรับการสมัครสมาชิก</li>
          <li>Watchlist และการตั้งค่าที่ผู้ใช้บันทึกไว้</li>
          <li>ประวัติการใช้งาน AI เพื่อคำนวณ quota</li>
          <li>ข้อมูลการชำระเงิน (จัดการโดย Stripe เราไม่เก็บข้อมูลบัตร)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">2. การใช้ข้อมูล</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          ข้อมูลใช้เพื่อให้บริการ คำนวณการใช้งานตามแผน ปรับปรุงคุณภาพการบริการ
          และติดต่อผู้ใช้ในกรณีที่จำเป็น เราไม่ขายข้อมูลผู้ใช้ให้บุคคลที่สาม
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">3. ความปลอดภัย</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          ข้อมูลผู้ใช้เก็บใน Supabase ซึ่งมีมาตรฐานความปลอดภัยสูง
          การเข้าถึงข้อมูลใช้การยืนยันตัวตน (Authentication) และจำกัดสิทธิ์ตามบทบาท
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary">4. สิทธิของผู้ใช้</h2>
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          ผู้ใช้มีสิทธิ์ขอลบบัญชีและข้อมูลส่วนตัวได้ตลอดเวลา
          สามารถติดต่อทีมงานผ่านอีเมลที่ระบุในหน้าเกี่ยวกับเรา
        </p>
      </section>
    </div>
  )
}
