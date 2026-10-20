# Southpaw — ตั้งค่าซิงก์ข้ามเครื่อง

## ไฟล์ในชุดนี้ (แตกที่ root ของ ifrankShop)
```
api/southpaw.mjs   ← API เก็บข้อมูล (Vercel Function, ใช้ MongoDB)
package.json       ← บอก Vercel ให้ติดตั้ง mongodb + @vercel/functions
southpaw/          ← ตัวแอป เปิดที่ /southpaw/
```

## 1. ต่อฐานข้อมูล MongoDB Atlas (ครั้งเดียว)
Vercel Dashboard → **Integrations** → **MongoDB Atlas** → สร้าง cluster (แพ็กฟรี M0 พอ)
→ **Connect Project** เลือก ifrank-shop (Custom Prefix ปล่อยว่าง)
ระบบจะเพิ่ม `MONGODB_URI` ให้เอง
(ถ้าอยากตั้งชื่อ database เอง เพิ่ม `MONGODB_DB` ได้ ไม่ใส่จะใช้ชื่อ `southpaw`)

## 2. ตั้งรหัสซิงก์
Settings → **Environment Variables** → เพิ่ม
- Name: `SOUTHPAW_KEY`
- Value: รหัสที่ตั้งเอง (ยาวๆ เดายาก)
- Environments: Production (+ Preview ถ้าใช้)

## 3. Deploy
```bash
git add api/southpaw.mjs southpaw package.json
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
- `502 storage error` = ต่อ MongoDB ไม่ได้ เช็ค Network Access ใน Atlas ว่าเปิด `0.0.0.0/0` (การเชื่อมผ่าน Vercel ตั้งให้เอง)
- `404` = Vercel ไม่เห็นไฟล์ เช็ค rewrite ใน vercel.json

## ข้อมูลที่เก็บ
ต่อสัปดาห์ (collection `weeks`, `_id` = วันจันทร์ของสัปดาห์ YYYY-MM-DD):
เซตที่ติ๊ก, ปุ่มซ้อมเสร็จ, บันทึกรายวัน, น้ำหนักตัว
ดูย้อนหลังได้ที่หัวข้อ **ประวัติย้อนหลัง** ในแอป (สูงสุด 52 สัปดาห์)
ถ้าออฟไลน์ ข้อมูลจะเก็บในเครื่องก่อน แล้วซิงก์ให้เองเมื่อกลับมามีเน็ต
