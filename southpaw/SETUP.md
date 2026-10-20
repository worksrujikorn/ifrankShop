# Southpaw — ตั้งค่าซิงก์ข้ามเครื่อง

## ไฟล์ในชุดนี้ (แตกที่ root ของ ifrankShop)
```
api/southpaw.mjs   ← API เก็บข้อมูล (Vercel Function)
southpaw/          ← ตัวแอป เปิดที่ /southpaw/
```

## 1. ต่อฐานข้อมูล Redis (ครั้งเดียว)
Vercel Dashboard → โปรเจกต์ ifrankShop → **Storage** → **Create Database** → เลือก **Upstash for Redis** (แพ็กฟรีพอ)
→ **Connect Project** เลือก ifrankShop
ระบบจะเพิ่ม `KV_REST_API_URL` กับ `KV_REST_API_TOKEN` ให้เอง

## 2. ตั้งรหัสซิงก์
Settings → **Environment Variables** → เพิ่ม
- Name: `SOUTHPAW_KEY`
- Value: รหัสที่ตั้งเอง (ยาวๆ เดายาก)
- Environments: Production (+ Preview ถ้าใช้)

## 3. Deploy
```bash
git add api/southpaw.mjs southpaw
git commit -m "southpaw: cloud sync + history"
git push
```
> ถ้า push ก่อนทำข้อ 1–2 ให้กด **Redeploy** ใน Vercel อีกรอบ เพราะ env var ใหม่มีผลกับ deploy ถัดไป

## 4. ใช้งาน
เปิด `โดเมน/southpaw/` → กดป้าย "บันทึกในเครื่องนี้" มุมขวาของหัวหน้า → ใส่รหัสเดียวกับ `SOUTHPAW_KEY`
ทำแบบนี้ครั้งเดียวต่อเครื่อง (มือถือ, คอม, และแอปที่เพิ่มไว้บนหน้าจอโฮมด้วย)

## เช็คว่า API ทำงาน
```bash
curl -H "x-southpaw-key: รหัสของคุณ" "https://โดเมน/api/southpaw?list=1"
```
- `{"weeks":[...]}` = ใช้ได้
- `401` = รหัสไม่ตรง
- `500 server not configured` = env var ยังไม่ครบ หรือยังไม่ redeploy
- `404` = Vercel ไม่เห็นไฟล์ ลองเปลี่ยนชื่อเป็น `api/southpaw.js` (ถ้าใน package.json มี `"type": "module"`) หรือเช็ค rewrite ใน vercel.json

## ข้อมูลที่เก็บ
ต่อสัปดาห์ (key `southpaw:week:YYYY-MM-DD` = วันจันทร์ของสัปดาห์):
เซตที่ติ๊ก, ปุ่มซ้อมเสร็จ, บันทึกรายวัน, น้ำหนักตัว
ดูย้อนหลังได้ที่หัวข้อ **ประวัติย้อนหลัง** ในแอป (สูงสุด 52 สัปดาห์)
ถ้าออฟไลน์ ข้อมูลจะเก็บในเครื่องก่อน แล้วซิงก์ให้เองเมื่อกลับมามีเน็ต
