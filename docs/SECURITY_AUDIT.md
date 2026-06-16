# Security Audit — Known Vulnerabilities & Exposure

อัปเดตล่าสุด: 2026-06-16

> เอกสารนี้บันทึกผล `npm audit` และการวิเคราะห์ exposure จริงของ StockGuru
> เพื่อให้การตัดสินใจ upgrade มีข้อมูลครบ ไม่ใช่แค่ดูจำนวน advisory

---

## สรุปผล audit (ณ 2026-06-16)

```
npm audit --omit=dev
2 vulnerabilities (1 moderate, 1 high)
```

| แพ็กเกจ | เวอร์ชันปัจจุบัน | ระดับ | fix path |
|---|---|---|---|
| `next` | `14.2.35` (รุ่นล่าสุดของสาย 14) | **high** | ต้องกระโดด major: `next@15.5.19` หรือ `next@16.2.9` |
| `postcss` (transitive, ใน next) | `<8.5.10` | moderate | ตาม next |

**ไม่มี patch แบบ drop-in** — `14.2.35` คือรุ่นสุดท้ายของสาย 14 แล้ว Next.js ไม่ backport security กลับมาที่ 14.x อีก

---

## Advisory ทั้งหมด (15 รายการใน `next`)

### ✅ ไม่กระทบ StockGuru (หลังตรวจ `next.config.js`)

| Advisory | เหตุผลที่ไม่กระทบ |
|---|---|
| GHSA-9g9p-9gw9-jx7f (Image Optimizer DoS via remotePatterns) | `next.config.js` ไม่มี `images.remotePatterns`/`domains` config |
| GHSA-36qx-fr4f-26g5 (Middleware bypass ใน i18n Pages Router) | ไม่ได้ใช้ i18n; ใช้ App Router |
| GHSA-ffhc-5mcf-pf4q (XSS ใน CSP nonce) | ยังไม่มี CSP nonce (จะเพิ่มในข้อ 3) |
| GHSA-h64f-5h5j-jqjh (Image Optimization API DoS) | ไม่ได้ใช้ Image Optimization |

### ⚠️ กระทบได้ (production on Render)

| Advisory | ผลกระทบ |
|---|---|
| GHSA-h25m-26qc-wcjf (HTTP request deserialization DoS, RSC) | DoS ผ่าน malformed requests |
| GHSA-q4gf-8mx6-v5v3 / GHSA-8h8q-6873-q5fj (Server Components DoS) | DoS ผ่าน RSC payload |
| GHSA-ggv3-7p47-pfv8 (HTTP request smuggling ใน rewrites) | ไม่มี rewrites config แต่ framework-level ยังเสี่ยง |
| GHSA-3x4c-7xq6-9pq8 (next/image disk cache exhaustion) | ไม่ได้ใช้ image cache หนัก แต่ framework path ยังเปิด |
| GHSA-3g8h-86w9-wvmq (Middleware redirect cache poisoning) | ใช้ middleware (auth gate) → redirect path เสี่ยง |
| GHSA-vfv6-92ff-j949 / GHSA-wfc6-r584-vfw7 (RSC cache poisoning) | cache poisoning ผ่าน cache-busting collision |
| GHSA-c4j6-fc7j-m34r (SSRF ผ่าน WebSocket upgrade) | SSRF ใน apps ที่ใช้ WebSocket |
| GHSA-gx5p-jg67-6x7h (XSS ใน beforeInteractive scripts) | XSS ถ้าใส่ untrusted input ใน beforeInteractive |

---

## Mitigation ที่ทำแล้ว (ลด exposure โดยไม่ต้อง bump major)

1. **ข้อ 3 — Security headers** (`next.config.js`): CSP/HSTS/X-Frame-Options ลด XSS, clickjacking, MITM — ปิด advisory XSS/SSRF หลายตัวที่ exploit ผ่าน missing headers
2. **Rate limiting** บน public endpoints (มีอยู่ใน `lib/middleware/rate-limit.ts`) ลด DoS surface
3. **CRON_SECRET gate** บน `/api/data/fetch` (PR23) ป้องกัน resource exhaustion จาก anonymous trigger

---

## Migration plan (PR แยก — ไม่ทำใน session นี้)

### Option A — `next@15.5.19` (recommended เมื่อทำ)
Risk: moderate (major 1 รุ่น)
งานที่ต้องทำ:
- [ ] Dynamic route pages 3 ตัว: `/stock/[symbol]`, `/journal/[id]`, `/news/[id]` เปลี่ยน `params` → `Promise<Params>` + `await params`
- [ ] `searchParams` ใน pages ที่ใช้ → `Promise<>` + `await`
- [ ] `eslint-config-next@15` (devDependency)
- [ ] ทดสอบ: `npm run typecheck && npm run lint && npm test && npm run build`
- [ ] e2e smoke: `/`, `/stock/PTT.BK`, `/journal/[id]`, `/news/[id]`, middleware redirect path
- [ ] ตรวจ middleware.ts (auth gate) ว่า caching/redirect behavior เปลี่ยนไหม
- [ ] `npm audit` สะอาด

### Option B — `next@16.2.9`
Risk: สูง (major 2 รุ่น) — เพิ่มเติมจาก Option A:
- [ ] ตรวจ App Router caching changes (fetch cache, `revalidate` defaults)
- [ ] ตรวจ middleware API ที่อาจเปลี่ยน
- [ ] ทดสอบ production deploy บน Render ก่อน confidence

### คำแนะนำ
ทำ **Option A** เป็น PR แยกต่างหากเมื่อมีเวลาทดสอบเต็มที่ — อย่า bump major ใน session ที่ทำงานหลายอย่างพร้อมกัน เพราะ risk พังแอปสูงและยาก rollback ถ้า merge ไปแล้ว

---

## การใช้เอกสารนี้
- อ้างอิงใน CI: ถ้า `npm audit` fail ให้ check กับรายการที่นี่ก่อน ถ้าตรง known-issue ให้ bypass ได้
- อัปเดตทุกครั้งที่ bump Next.js หรือแก้ mitigation
- ลบ advisory ออกเมื่อ bump major เสร็จและ audit สะอาด
