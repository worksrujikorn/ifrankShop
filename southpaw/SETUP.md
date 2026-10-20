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

## 2. ตั้งรหัสลับของเซิร์ฟเวอร์
Settings → **Environment Variables** → เพิ่ม
- `SOUTHPAW_KEY` = ข้อความลับยาวๆ (ใช้เซ็นสิทธิ์แก้ไข ไม่ต้องจำ ไม่ต้องใส่ในแอป)
- `SOUTHPAW_PIN` = รหัสแก้ไข (ไม่ใส่ = `69`)

## 3. Deploy
```bash
git add api/southpaw.mjs southpaw package.json
git commit -m "southpaw: cloud sync + history"
git push
```
> ถ้า push ก่อนทำข้อ 1–2 ให้กด **Redeploy** ใน Vercel อีกรอบ เพราะ env var ใหม่มีผลกับ deploy ถัดไป

## 4. ใช้งาน
เปิด `โดเมน/southpaw/` จากเบราว์เซอร์ไหนก็เห็นข้อมูลชุดเดียวกัน ไม่ต้องตั้งค่าอะไรในเครื่อง
การแก้ไข (ติ๊กเซต จดน้ำหนัก แก้ตาราง) ต้องใส่รหัสทุกครั้งที่เปิดแอป ปลดล็อกได้ 5 นาที
เซิร์ฟเวอร์เป็นคนตรวจรหัส (รหัสไม่ได้อยู่ในหน้าเว็บ) ใส่ผิด 8 ครั้งจะล็อก 15 นาที
เปิดหน้าทิ้งไว้ไม่ได้แตะ 5 นาที หน้าจะรีเฟรชเองและกลับมาล็อก (ยกเว้นตอนตัวจับเวลากำลังเดิน)

## เช็คว่า API ทำงาน
```bash
curl "https://โดเมน/api/southpaw?list=1"
```
- `{"weeks":[...]}` = ใช้ได้
- `500 server not configured` = env var ยังไม่ครบ หรือยังไม่ redeploy
- `502 storage error` = ต่อ MongoDB ไม่ได้ เช็ค Network Access ใน Atlas ว่าเปิด `0.0.0.0/0` (การเชื่อมผ่าน Vercel ตั้งให้เอง)
- `404` = Vercel ไม่เห็นไฟล์ เช็ค rewrite ใน vercel.json

## ข้อมูลที่เก็บ
ต่อสัปดาห์ (collection `weeks`, `_id` = วันจันทร์ของสัปดาห์ YYYY-MM-DD):
เซตที่ติ๊ก, ปุ่มซ้อมเสร็จ, บันทึกรายวัน, น้ำหนักตัว
ดูย้อนหลังได้ที่หัวข้อ **ประวัติย้อนหลัง** ในแอป (สูงสุด 52 สัปดาห์)
ถ้าออฟไลน์ ข้อมูลจะเก็บในเครื่องก่อน แล้วซิงก์ให้เองเมื่อกลับมามีเน็ต

## แจ้งเตือนทุกเช้า (ไม่ต้องตั้งค่าเพิ่ม)
- `vercel.json` ตั้ง Cron ให้เรียก `/api/southpaw-remind` ทุกวัน 23:00 UTC = 6 โมงเช้าเวลาไทย (แพ็ก Hobby คลาดได้ ±1 ชม.)
- กุญแจสำหรับส่งแจ้งเตือน (VAPID) ระบบสร้างเองครั้งแรกแล้วเก็บใน MongoDB
- เปิดในแอป: ⚙️ → เปิดการแจ้งเตือนในเครื่องนี้ (iPhone ต้องเพิ่มแอปไว้ที่หน้าจอโฮมก่อน)
- ถ้าอยากกันคนอื่นเรียก `/api/southpaw-remind` ให้เพิ่ม env `CRON_SECRET` (ค่าอะไรก็ได้) Vercel จะส่งให้เองตอนเรียก cron

## ตารางซ้อม
แก้ได้ในแอป (⚙️ → แก้ตารางซ้อม) เก็บใน MongoDB collection `meta` (`_id: program`) ทุกเครื่องเห็นตารางเดียวกัน
