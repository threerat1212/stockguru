export type OpportunityTone = 'success' | 'warning' | 'danger' | 'info'

export interface OpportunityRow {
  rank: number
  symbol: string
  signal: string
  reason: string
  trigger: string
  risk: string
  nextStep: string
  score: number
  tone: OpportunityTone
}

export const opportunityRows: OpportunityRow[] = [
  { rank: 1, symbol: 'PTT', signal: 'Breakout', reason: 'ทะลุแนวต้าน 34.00', trigger: 'ราคาปิดเหนือกรอบสะสม', risk: 'น้ำมันผันผวน', nextStep: 'ดูยืนยันด้วย volume', score: 5, tone: 'success' },
  { rank: 2, symbol: 'BH', signal: 'Volume Spike', reason: 'ปริมาณเพิ่มขึ้น 3.2 เท่า', trigger: 'แรงซื้อเข้ากลุ่มโรงพยาบาล', risk: 'ไล่ราคาเร็ว', nextStep: 'รอ pullback ใกล้แนวรับ', score: 4, tone: 'warning' },
  { rank: 3, symbol: 'GPSC', signal: 'MA Golden Cross', reason: 'ตัดเส้น MA20 ขึ้น MA50', trigger: 'โมเมนตัมเริ่มกลับตัว', risk: 'ค่าไฟและ yield', nextStep: 'ดูราคายืนเหนือ MA50', score: 4, tone: 'warning' },
  { rank: 4, symbol: 'MINT', signal: 'Rebound', reason: 'เด้งจากแนวรับสำคัญ', trigger: 'แรงขายเริ่มชะลอ', risk: 'ท่องเที่ยวผันผวน', nextStep: 'ดู high ใหม่ระยะสั้น', score: 3, tone: 'danger' },
  { rank: 5, symbol: 'VGI', signal: 'High Volume', reason: 'มูลค่าซื้อขายพุ่ง', trigger: 'เก็งกำไรหุ้นเล็ก', risk: 'spread กว้าง', nextStep: 'จำกัดขนาดสถานะ', score: 3, tone: 'info' },
  { rank: 6, symbol: 'ADVANC', signal: 'Trend Hold', reason: 'ราคายืนเหนือ MA20', trigger: 'defensive flow ยังอยู่', risk: 'อัพไซด์เริ่มแคบ', nextStep: 'เทียบ dividend yield', score: 4, tone: 'success' },
  { rank: 7, symbol: 'KBANK', signal: 'Bank Rotation', reason: 'แรงซื้อกลับเข้ากลุ่มธนาคาร', trigger: 'NIM และปันผลช่วยหนุน', risk: 'NPL รอบใหม่', nextStep: 'ดูงบล่าสุดกับสำรอง', score: 4, tone: 'warning' },
  { rank: 8, symbol: 'CPALL', signal: 'Base Build', reason: 'สร้างฐานใกล้แนวรับ 57.00', trigger: 'ค้าปลีกเริ่มฟื้น', risk: 'margin ถูกกด', nextStep: 'รอปิดเหนือ 58.50', score: 3, tone: 'info' },
  { rank: 9, symbol: 'BBL', signal: 'Dividend Watch', reason: 'valuation ยังต่ำกว่ากลุ่ม', trigger: 'เงินปันผลช่วยประคอง', risk: 'กำไรโตช้า', nextStep: 'ดู P/BV เทียบ ROE', score: 3, tone: 'info' },
  { rank: 10, symbol: 'AOT', signal: 'Demand Recovery', reason: 'traffic ฟื้นต่อเนื่อง', trigger: 'นักท่องเที่ยวหนุน sentiment', risk: 'ต้นทุนและ capex', nextStep: 'ดูแนวต้าน 63.50', score: 4, tone: 'warning' },
  { rank: 11, symbol: 'BDMS', signal: 'Defensive Flow', reason: 'แรงขายต่ำกว่าตลาด', trigger: 'หุ้น defensive ถูกสะสม', risk: 'ราคา sideway นาน', nextStep: 'ดู volume ยืนยัน', score: 3, tone: 'info' },
  { rank: 12, symbol: 'WHA', signal: 'Industrial Estate', reason: 'ยืนเหนือฐานสะสม', trigger: 'ธีม FDI และนิคม', risk: 'ขายทำกำไรเร็ว', nextStep: 'ดู breakout 5.10', score: 4, tone: 'success' },
  { rank: 13, symbol: 'EA', signal: 'Oversold Bounce', reason: 'เด้งจากภาวะ oversold', trigger: 'แรง short-cover ระยะสั้น', risk: 'ข่าวเฉพาะบริษัท', nextStep: 'ไม่ไล่ราคา รอฐานใหม่', score: 2, tone: 'danger' },
  { rank: 14, symbol: 'GULF', signal: 'Power Momentum', reason: 'ราคายืนเหนือกรอบ 20 วัน', trigger: 'กลุ่มไฟฟ้าฟื้นตาม yield', risk: 'bond yield กลับขึ้น', nextStep: 'ดู MA20 เป็น stop', score: 4, tone: 'warning' },
  { rank: 15, symbol: 'SCC', signal: 'Value Watch', reason: 'เริ่มเห็นแรงรับแถว valuation ต่ำ', trigger: 'cycle วัสดุก่อสร้าง', risk: 'กำไรยังชะลอ', nextStep: 'รอข่าวงบหรือ guidance', score: 3, tone: 'info' },
  { rank: 16, symbol: 'HMPRO', signal: 'Retail Rebound', reason: 'เด้งจากกรอบล่าง', trigger: 'ค้าปลีกบ้านเริ่มฟื้น', risk: 'กำลังซื้ออ่อน', nextStep: 'ดู same-store sales', score: 3, tone: 'info' },
  { rank: 17, symbol: 'TOP', signal: 'Refinery Spread', reason: 'ค่าการกลั่นช่วยหนุน', trigger: 'พลังงานหมุนกลับ', risk: 'น้ำมันกลับตัว', nextStep: 'ดู spread รายสัปดาห์', score: 4, tone: 'warning' },
  { rank: 18, symbol: 'DELTA', signal: 'Momentum Risk', reason: 'แรงซื้อกลับแต่ valuation สูง', trigger: 'หุ้น electronics นำตลาด', risk: 'ผันผวนสูง', nextStep: 'ใช้ position size ต่ำ', score: 3, tone: 'danger' },
]
