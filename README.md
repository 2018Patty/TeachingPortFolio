# Teaching Course Portfolio - ผศ.ดร.ภัทราพร วรินทรเวช (Admin & Public Portal)

ระบบจัดการและรหัสวิชาเรียน (Course Knowledge Management Portfolio) ของ **ผศ.ดร.ภัทราพร วรินทรเวช** คณะวิศวกรรมศาสตร์ ภาควิชาวิศวกรรมคอมพิวเตอร์ พัฒนาขึ้นด้วย Next.js 15+ (App Router), Tailwind CSS, Lucide Icons, Framer Motion และเชื่อมต่อฐานข้อมูลหลักอย่างปลอดภัยกับ **Supabase Database & Authentication (Supabase Auth)**

แอปพลิเคชันนี้ประกอบด้วย **หน้ารายวิชาสำหรับบุคคลทั่วไป (Public Views)** เพื่อใช้สืบค้นและดาวน์โหลดสไลด์หรือตรวจปฏิทินงานส่ง และ **หน้าบอร์ดควบคุมบริหาร (Admin Dashboard)** สำหรับผู้พัฒนา/ผู้ดูแลระบบ เพื่อลงทะเบียนคอร์สใหม่ อัปโหลดสื่อสารคลัง (Storage) สะพานเชื่อมแบบฟอร์มแก้ไขเนื้อหารายสัปดาห์

---

## 🛠️ สรุปค่าตัวแปรสภาพแวดล้อม (Environment Variables)

ในการทำงานเต็มระบบ (Full Integration Mode) จำต้องตั้งค่าไฟล์ `.env` (สำหรับการรัน Local) หรือระบุใน Hosting Secrets ด้วยตัวแปรต่อไปนี้:

```env
# URL ปลายทางของแอป
APP_URL="http://localhost:3000"

# การเชื่อมต่อ Supabase Database & Auth Client
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
```

*หมายเหตุ: หากไม่มีค่าตัวแปร Supabase ระบบจะสลับไปใช้งานข้อมูลจำลอง (Preloaded Backup Mode) โดยอัตโนมัติ เพื่อให้ผู้ตรวจงานสามารถเข้าคลิกทดสอบและเห็นภาพความลื่นไหลได้อย่างไร้ขีดจำกัด*

---

## 🚀 ขั้นตอนการติดตั้งและรันในเครื่อง (Local Setup)

ทำตามขั้นตอนด้านล่างนี้เพื่อเปิดแอปพลิเคชันของคุณบนเครื่องคอมพิวเตอร์ส่วนตัว:

1. **คัดลอกโปรเจกต์ลงเครื่อง:**
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

2. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```

3. **เตรียมไฟล์ Environment:**
   สร้างไฟล์ `.env.local` ในระดับ Root จากโครงร่างของ `.env.example` แล้วกรอก URL และ Anon Key ของ Supabase ของท่าน

4. **รันบนเซิร์ฟเวอร์จำลอง (Local Dev Server):**
   ```bash
   npm run dev
   ```
   *เปิดบราวเซอร์เข้าสู่ลิงก์: [http://localhost:3000](http://localhost:3000)*

5. **ตรวจสอบประเภทความถูกต้อง (Build Verification):**
   ```bash
   npm run build
   ```

---

## 🚀 ขั้นตอนการเซตอัพบน Supabase & Auth ปลอดภัย

1. **สร้างตารางคลังจัดเก็บ (Tables):**
   - ไปที่ `Supabase Dashboard` -> เลือกโปรเจกต์ของคุณ -> ไปที่หน้า **SQL Editor**
   - เปิดไฟล์ `supabase-schema.sql` ใน Root ของโปรเจกต์นี้
   - คัดลอกคำสั่ง SQL ทั้งหมดแล้วกดยิงสั่งรัน (Click "Run") ระบบจะสร้างตาราง `courses`, `materials`, `assignments` และเปิดใช้งาน Row-Level Security (RLS) ทั้งหมดและนโยบายเข้าถึงสิทธิ์ความปลอดภัยเรียบร้อย
   
2. **สร้างบัญชีผู้บริหาร (Admin Auth Account):**
   - ไปที่แถบ **Authentication** -> เลือกเมนู **Users**
   - คลิกระบุปุ่ม **Add User** -> เลือกป้อน **Create User** แล้วกรอกเมลติดต่อและรหัสผ่านของ Admin
   - นำข้อมูลล็อกอินนี้ไปใช้ลงชื่อเข้าใช้งานที่หน้า `/admin/login` ได้โดยตรงอย่างปลอดภัย

3. **ตั้งค่าที่จัดเก็บไฟล์สื่อ (Storage Bucket):**
   - ไปที่ริบบอน **Storage** -> เลือก **New Bucket** ตั้งชื่อด้วยคำว่า `course-assets` (แบบ Public)
   - เปิดสิทธิ์การอัปโหลดไฟล์/ลบไฟล์ให้กับผู้ที่ลงชื่อเข้าใช้งาน (Authenticated Users)

---

## ☁️ พิมพ์เขียวการนำขึ้นระบบและขึ้นเซิร์ฟเวอร์เผยแพร่ (Deployment Guide)

### 1. การขึ้นสู่ Vercel (Deploy to Vercel)
แอปนี้ได้รับการกำหนดค่าและโครงสร้างความพร้อมรองรับ Vercel อย่างสมบูรณ์:
- คลิกเข้าสู่หน้าหลักของระบบ **Vercel Console**
- เลือกกดปุ่ม **Import Project** -> ปักเลือก Repository นี้
- ในส่วนขั้นตอน **Environment Variables** ให้ป้อนตัวแปร `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ของ Supabase ให้เรียบร้อย
- กดปุ่ม **Deploy** เพื่อให้ Vercel ยื่นประมวลผลเซิร์ฟเลสและรันแอปพลิเคชัน Next.js ให้ท่านภายใน 1 นาที

### 2. การขึ้นสู่ Cloud Run / GCP (Deploy to Cloud Run Container)
เซิร์ฟเวอร์ Next.js นี้มาพร้อมโครงสร้างเบลนด์ Docker พร้อมรันในคอนเทนเนอร์:
- ใช้คำสั่งตรวจงานคอนเทนเนอร์สากล:
  ```bash
  gcloud builds submit --tag gcr.io/[PROJECT-ID]/teaching-portfolio
  ```
- ยื่นเปิดเผยคอนเทนเนอร์บน Cloud Run:
  ```bash
  gcloud run deploy teaching-portfolio \
    --image gcr.io/[PROJECT-ID]/teaching-portfolio \
    --platform managed \
    --port 3000 \
    --allow-unauthenticated
  ```
