import type { NewsArticle } from '@/types/stock'

const now = Date.now()

export const NEWS_REFRESH_INTERVAL_MS = 60 * 60 * 1000

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'set-energy-flow',
    title: 'SET ปิดบวก 12 จุด แรงซื้อหุ้นพลังงานหนุน',
    summary: 'ตลาดหุ้นไทยปิดในแดนบวก โดยได้แรงหนุนจากหุ้นกลุ่มพลังงาน หลังราคาน้ำมันดิบปรับตัวสูงขึ้นและ fund flow กลับเข้าหุ้นใหญ่',
    content: [
      'ตลาดหุ้นไทยฟื้นตัวจากแรงซื้อในหุ้นกลุ่มพลังงานและธนาคาร โดยนักลงทุนให้น้ำหนักกับราคาน้ำมันดิบที่ปรับขึ้นและความคาดหวังต่อกำไรไตรมาสถัดไป',
      'ประเด็นที่ต้องติดตามคือความต่อเนื่องของ volume หากดัชนียืนเหนือแนวรับสำคัญได้ มีโอกาสเห็นแรงซื้อเก็งกำไรต่อในหุ้นขนาดใหญ่ แต่หากราคาน้ำมันกลับตัวลง กลุ่มพลังงานอาจถูกขายทำกำไรเร็ว',
      'สำหรับนักลงทุนระยะสั้น ควรดูการยืนยันจากมูลค่าการซื้อขายและทิศทาง fund flow ต่างชาติควบคู่กัน ไม่ควรไล่ราคาจากข่าวเพียงอย่างเดียว',
    ],
    url: 'https://www.set.or.th/th/market/index/set/overview',
    source: 'StockGuru Research',
    publishedAt: new Date(now - 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 20 * 60 * 1000).toISOString(),
    category: 'market',
    relatedSymbols: ['PTT.BK', 'ADVANC.BK', 'KBANK.BK'],
    marketImpactScore: 78,
    impactPoints: [
      { label: 'ตลาดรวม', value: '+12 จุด', sentiment: 'positive' },
      { label: 'กลุ่มนำตลาด', value: 'พลังงาน', sentiment: 'positive' },
      { label: 'ความเสี่ยง', value: 'น้ำมันผันผวน', sentiment: 'neutral' },
    ],
    references: [
      { title: 'SET Index Overview', url: 'https://www.set.or.th/th/market/index/set/overview', source: 'SET' },
      { title: 'Oil market data', url: 'https://www.eia.gov/petroleum/', source: 'EIA' },
    ],
  },
  {
    id: 'scb-dividend',
    title: 'SCB ประกาศจ่ายปันผล 5.50 บาทต่อหุ้น',
    summary: 'ธนาคารไทยพาณิชย์ประกาศจ่ายเงินปันผลสำหรับผลการดำเนินงานครึ่งปีหลัง สะท้อนฐานเงินทุนแข็งแรงและกำไรยังประคองตัวได้',
    content: [
      'SCB ประกาศจ่ายปันผล 5.50 บาทต่อหุ้น ทำให้นักลงทุนกลับมาให้ความสนใจกับกลุ่มธนาคารที่มี dividend yield สูง',
      'ปัจจัยบวกคือรายได้ดอกเบี้ยยังอยู่ในระดับดีและค่าใช้จ่ายควบคุมได้ แต่ยังต้องติดตามคุณภาพสินทรัพย์และ NPL ในครึ่งปีหลัง',
      'การประเมินมูลค่าควรเทียบกับกลุ่มธนาคารทั้ง P/BV, ROE และทิศทางสำรองหนี้สูญ ไม่ควรดู dividend yield แยกเดี่ยว',
    ],
    url: 'https://www.set.or.th/th/market/product/stock/quote/SCB/financial-statement/company-highlights',
    source: 'StockGuru Research',
    publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    category: 'company',
    relatedSymbols: ['SCB.BK', 'KBANK.BK', 'BBL.BK'],
    marketImpactScore: 62,
    impactPoints: [
      { label: 'Dividend', value: '5.50 บาท', sentiment: 'positive' },
      { label: 'กลุ่มที่กระทบ', value: 'ธนาคาร', sentiment: 'positive' },
      { label: 'ต้องติดตาม', value: 'NPL', sentiment: 'neutral' },
    ],
    references: [
      { title: 'SCB company highlights', url: 'https://www.set.or.th/th/market/product/stock/quote/SCB/financial-statement/company-highlights', source: 'SET' },
    ],
  },
  {
    id: 'telecom-5g-growth',
    title: 'กลุ่มสื่อสารแนวโน้มสดใส 5G ขยายตัวต่อเนื่อง',
    summary: 'นักวิเคราะห์มองรายได้ data และบริการ enterprise 5G ยังเป็นแรงหนุนหลักของกลุ่มสื่อสารในระยะกลาง',
    content: [
      'กลุ่มสื่อสารได้รับแรงหนุนจากการใช้งาน data ที่เพิ่มขึ้นและบริการ 5G สำหรับภาคธุรกิจ ทำให้ตลาดกลับมาให้น้ำหนักกับคุณภาพกระแสเงินสด',
      'หุ้นที่มีฐานลูกค้าแข็งแรงและต้นทุนโครงข่ายควบคุมได้จะได้เปรียบ ส่วนความเสี่ยงหลักคือการแข่งขันด้านราคาและค่าใช้จ่ายลงทุนโครงข่าย',
    ],
    url: 'https://www.set.or.th/th/market/product/stock/quote/ADVANC/price',
    source: 'StockGuru Research',
    publishedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    category: 'sector',
    relatedSymbols: ['ADVANC.BK', 'TRUE.BK'],
    marketImpactScore: 55,
    impactPoints: [
      { label: 'Theme', value: '5G / Data', sentiment: 'positive' },
      { label: 'หุ้นเด่น', value: 'ADVANC', sentiment: 'positive' },
      { label: 'ความเสี่ยง', value: 'แข่งขันราคา', sentiment: 'negative' },
    ],
    references: [
      { title: 'ADVANC price and profile', url: 'https://www.set.or.th/th/market/product/stock/quote/ADVANC/price', source: 'SET' },
    ],
  },
  {
    id: 'cpall-expansion-2026',
    title: 'CPALL เตรียมเปิดสาขาใหม่ 200 แห่งในปี 2569',
    summary: 'ซีพี ออลล์วางแผนขยายสาขาเพิ่มทั่วประเทศ หนุนรายได้ค้าปลีกแต่ต้องจับตาต้นทุนและกำลังซื้อ',
    content: [
      'แผนขยายสาขาของ CPALL ช่วยเพิ่มโอกาสเติบโตของรายได้ แต่ตลาดจะประเมินควบคู่กับ same-store sales growth และ margin',
      'หากกำลังซื้อในประเทศฟื้นตัว จะเป็นปัจจัยหนุนกลุ่มค้าปลีกโดยรวม แต่ต้นทุนค่าแรงและค่าไฟยังเป็นตัวแปรสำคัญ',
    ],
    url: 'https://www.set.or.th/th/market/product/stock/quote/CPALL/price',
    source: 'StockGuru Research',
    publishedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    category: 'company',
    relatedSymbols: ['CPALL.BK'],
    marketImpactScore: 48,
    impactPoints: [
      { label: 'แผนขยาย', value: '200 สาขา', sentiment: 'positive' },
      { label: 'ตัวแปร', value: 'SSSG', sentiment: 'neutral' },
      { label: 'ต้นทุน', value: 'ค่าแรง/ไฟ', sentiment: 'negative' },
    ],
    references: [
      { title: 'CPALL quote', url: 'https://www.set.or.th/th/market/product/stock/quote/CPALL/price', source: 'SET' },
    ],
  },
  {
    id: 'fed-rate-signal-asia',
    title: 'Fed ส่งสัญญาณคงดอกเบี้ย กดดันตลาดเอเชีย',
    summary: 'ตลาดเอเชียผันผวนหลัง Fed ส่งสัญญาณไม่รีบลดดอกเบี้ย ทำให้เงินดอลลาร์แข็งและสินทรัพย์เสี่ยงถูกลดน้ำหนักบางส่วน',
    content: [
      'ถ้อยแถลงของ Fed ทำให้ตลาดลดความคาดหวังต่อการลดดอกเบี้ยระยะสั้น ส่งผลต่อ valuation ของหุ้น growth และตลาดเกิดใหม่',
      'ตลาดไทยอาจได้รับผลทางอ้อมผ่านค่าเงินบาทและ fund flow ต่างชาติ จึงควรติดตาม bond yield สหรัฐและดอลลาร์อย่างใกล้ชิด',
    ],
    url: 'https://www.federalreserve.gov/monetarypolicy.htm',
    source: 'StockGuru Research',
    publishedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    category: 'global',
    relatedSymbols: ['AAPL', 'NVDA', 'MSFT'],
    marketImpactScore: 70,
    impactPoints: [
      { label: 'ดอกเบี้ย', value: 'Higher for longer', sentiment: 'negative' },
      { label: 'USD', value: 'แข็งค่า', sentiment: 'neutral' },
      { label: 'หุ้น Growth', value: 'กดดัน', sentiment: 'negative' },
    ],
    references: [
      { title: 'Federal Reserve Monetary Policy', url: 'https://www.federalreserve.gov/monetarypolicy.htm', source: 'Federal Reserve' },
    ],
  },
  {
    id: 'kbank-earnings-beat',
    title: 'KBANK กำไรสุทธิ Q4/2568 โตกว่าคาด',
    summary: 'KBANK รายงานกำไรสุทธิสูงกว่าคาดจากรายได้ดอกเบี้ยและการตั้งสำรองที่ควบคุมได้ หนุน sentiment กลุ่มธนาคาร',
    content: [
      'กำไรที่ดีกว่าคาดของ KBANK ช่วยเพิ่มความเชื่อมั่นต่อกลุ่มธนาคาร โดยเฉพาะประเด็นคุณภาพสินทรัพย์และส่วนต่างดอกเบี้ย',
      'อย่างไรก็ตาม นักลงทุนควรดูรายละเอียดของกำไรว่าเกิดจากธุรกิจหลักหรือรายการพิเศษ รวมถึงแนวโน้มสำรองในไตรมาสถัดไป',
    ],
    url: 'https://www.set.or.th/th/market/product/stock/quote/KBANK/financial-statement/company-highlights',
    source: 'StockGuru Research',
    publishedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    category: 'company',
    relatedSymbols: ['KBANK.BK', 'SCB.BK', 'BBL.BK'],
    marketImpactScore: 66,
    impactPoints: [
      { label: 'กำไร', value: 'ดีกว่าคาด', sentiment: 'positive' },
      { label: 'Sector', value: 'ธนาคาร', sentiment: 'positive' },
      { label: 'ต้องดูต่อ', value: 'สำรอง', sentiment: 'neutral' },
    ],
    references: [
      { title: 'KBANK company highlights', url: 'https://www.set.or.th/th/market/product/stock/quote/KBANK/financial-statement/company-highlights', source: 'SET' },
    ],
  },
]

export function getNewsArticles() {
  return NEWS_ARTICLES
}

export function getNewsArticleById(id: string) {
  return NEWS_ARTICLES.find((article) => article.id === id || article.slug === id)
}

export function getMarketImpactNews() {
  return NEWS_ARTICLES.filter((article) => (article.marketImpactScore ?? 0) >= 55)
}
