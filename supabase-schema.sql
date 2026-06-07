-- =====================================================================
-- SUPABASE DATABASE SCHEMA SQL
-- For: Teaching Course Portfolio (ผศ.ดร.ภัทราพร วรินทรเวช)
-- Place this inside the Supabase "SQL Editor" to create the tables.
-- =====================================================================

-- 1. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    course_id text PRIMARY KEY,
    course_code text NOT NULL,
    course_name_th text NOT NULL,
    course_name_en text NOT NULL,
    description text DEFAULT '',
    objectives text[] DEFAULT '{}'::text[],
    semester_id integer NOT NULL,
    year integer NOT NULL,
    credit text DEFAULT '3((3)-0-6)',
    section text DEFAULT '01',
    theory_hours numeric(4,1) DEFAULT 0,    -- ชั่วโมงทฤษฏีต่อสัปดาห์ (คงที่ทุกสัปดาห์)
    practice_hours numeric(4,1) DEFAULT 0,  -- ชั่วโมงปฏิบัติต่อสัปดาห์ (คงที่ทุกสัปดาห์)
    total_weeks integer DEFAULT 15,          -- จำนวนสัปดาห์ทั้งภาคเรียน
    enrollment_code text DEFAULT '',         -- รหัสลงทะเบียนสำหรับนักศึกษา (ว่าง = ไม่ต้องใส่รหัส)
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.materials (
    material_id text PRIMARY KEY,
    course_id text REFERENCES public.courses(course_id) ON DELETE CASCADE,
    title text NOT NULL,
    type text NOT NULL, -- 'slides', 'video', 'document', 'link'
    week_number integer NOT NULL,
    file_url text NOT NULL,
    description text DEFAULT '',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
    assignment_id text PRIMARY KEY,
    course_id text REFERENCES public.courses(course_id) ON DELETE CASCADE,
    title text NOT NULL,
    description text DEFAULT '',
    due_date text NOT NULL,
    attachment_url text DEFAULT '',
    status text NOT NULL DEFAULT 'open', -- 'open', 'closed', 'upcoming'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. QUESTIONS TABLE (Q&A Board)
CREATE TABLE IF NOT EXISTS public.questions (
    question_id text PRIMARY KEY,
    course_id text REFERENCES public.courses(course_id) ON DELETE CASCADE,
    author_name text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. REPLIES TABLE (Q&A Replies)
CREATE TABLE IF NOT EXISTS public.replies (
    reply_id text PRIMARY KEY,
    question_id text REFERENCES public.questions(question_id) ON DELETE CASCADE,
    author_name text NOT NULL,
    content text NOT NULL,
    is_instructor boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ACTIVE LEARNING TABLE
CREATE TABLE IF NOT EXISTS public.active_learning (
    activity_id text PRIMARY KEY,
    course_id text REFERENCES public.courses(course_id) ON DELETE CASCADE,
    type_id text DEFAULT '',         -- เช่น 'al-01', 'al-02' (อ้างอิง AL_TYPES ใน code)
    title text NOT NULL,
    description text DEFAULT '',
    duration text DEFAULT '',        -- เช่น '15 นาที', '1 ชั่วโมง'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TEACHING REFLECTIONS TABLE (บันทึกหลังสอน)
CREATE TABLE IF NOT EXISTS public.teaching_reflections (
    reflection_id text PRIMARY KEY,
    course_id text REFERENCES public.courses(course_id) ON DELETE CASCADE,
    week_number integer NOT NULL,
    content text NOT NULL,
    image_url text DEFAULT NULL,  -- base64 data URL หรือ URL รูปภาพประกอบบันทึก
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. WEEKLY TEACHING HOURS TABLE (ชั่วโมงการสอนรายสัปดาห์)
--    บันทึกจำนวนชั่วโมงทฤษฏีและปฏิบัติในแต่ละสัปดาห์ของแต่ละรายวิชา
CREATE TABLE IF NOT EXISTS public.weekly_teaching_hours (
    hour_id text PRIMARY KEY,
    course_id text REFERENCES public.courses(course_id) ON DELETE CASCADE,
    week_number integer NOT NULL,
    theory_hours numeric(4,1) NOT NULL DEFAULT 0,    -- ชั่วโมงทฤษฏี (รองรับครึ่งชั่วโมง เช่น 1.5)
    practice_hours numeric(4,1) NOT NULL DEFAULT 0,  -- ชั่วโมงปฏิบัติ (รองรับครึ่งชั่วโมง เช่น 2.5)
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (course_id, week_number)  -- ป้องกันบันทึกซ้ำสัปดาห์เดียวกันในวิชาเดียวกัน
);

-- 9. STUDENT COURSE VISITS TABLE (บันทึกการเข้าชมวิชารายคน)
CREATE TABLE IF NOT EXISTS public.student_course_visits (
    visit_id text PRIMARY KEY,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    course_id text REFERENCES public.courses(course_id) ON DELETE CASCADE,
    visited_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. ASSIGNMENT SUBMISSIONS TABLE (การส่งงานของนักศึกษา)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    submission_id text PRIMARY KEY,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    assignment_id text REFERENCES public.assignments(assignment_id) ON DELETE CASCADE,
    course_id text REFERENCES public.courses(course_id) ON DELETE CASCADE,
    submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    note text DEFAULT ''
);

-- 11. STUDENTS TABLE (นักศึกษาที่ลงทะเบียน)
--    เชื่อมกับ Supabase Auth (id = auth.users.id)
CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY,              -- Supabase Auth user id
    student_id text DEFAULT '',       -- รหัสนักศึกษา เช่น 6401234567890
    first_name text DEFAULT '',       -- ชื่อ
    last_name text DEFAULT '',        -- นามสกุล
    email text DEFAULT '',
    avatar_url text DEFAULT '',       -- จาก Google profile หรือว่างไว้
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. SITE SETTINGS TABLE (ข้อมูลโปรไฟล์อาจารย์)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id integer PRIMARY KEY DEFAULT 1,
    profile_name text DEFAULT '',
    profile_title text DEFAULT '',
    profile_department text DEFAULT '',
    profile_faculty text DEFAULT '',
    profile_university text DEFAULT '',
    profile_bio text DEFAULT '',
    profile_email text DEFAULT '',
    profile_photo_url text DEFAULT '',
    profile_link_url text DEFAULT '',
    admin_password text DEFAULT 'admin123',
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS for all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_teaching_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_course_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- A. courses
CREATE POLICY "Allow public SELECT on courses"
ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on courses"
ON public.courses FOR ALL TO anon USING (true) WITH CHECK (true);

-- B. materials
CREATE POLICY "Allow public SELECT on materials"
ON public.materials FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on materials"
ON public.materials FOR ALL TO anon USING (true) WITH CHECK (true);

-- C. assignments
CREATE POLICY "Allow public SELECT on assignments"
ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on assignments"
ON public.assignments FOR ALL TO anon USING (true) WITH CHECK (true);

-- D. questions
CREATE POLICY "Allow public SELECT on questions"
ON public.questions FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on questions"
ON public.questions FOR ALL TO anon USING (true) WITH CHECK (true);

-- E. replies
CREATE POLICY "Allow public SELECT on replies"
ON public.replies FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on replies"
ON public.replies FOR ALL TO anon USING (true) WITH CHECK (true);

-- F. active_learning
CREATE POLICY "Allow public SELECT on active_learning"
ON public.active_learning FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on active_learning"
ON public.active_learning FOR ALL TO anon USING (true) WITH CHECK (true);

-- G. teaching_reflections
CREATE POLICY "Allow public SELECT on teaching_reflections"
ON public.teaching_reflections FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on teaching_reflections"
ON public.teaching_reflections FOR ALL TO anon USING (true) WITH CHECK (true);

-- H. weekly_teaching_hours
CREATE POLICY "Allow public SELECT on weekly_teaching_hours"
ON public.weekly_teaching_hours FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on weekly_teaching_hours"
ON public.weekly_teaching_hours FOR ALL TO anon USING (true) WITH CHECK (true);

-- I. student_course_visits
CREATE POLICY "Allow public SELECT on student_course_visits"
ON public.student_course_visits FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on student_course_visits"
ON public.student_course_visits FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated ALL on student_course_visits"
ON public.student_course_visits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- I2. assignment_submissions
CREATE POLICY "Allow public SELECT on assignment_submissions"
ON public.assignment_submissions FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on assignment_submissions"
ON public.assignment_submissions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated ALL on assignment_submissions"
ON public.assignment_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- J. students
CREATE POLICY "Allow public SELECT on students"
ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on students"
ON public.students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated ALL on students"
ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- J. site_settings
CREATE POLICY "Allow public SELECT on site_settings"
ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow anon ALL on site_settings"
ON public.site_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================================================================
-- INDEXES (ช่วยเพิ่มความเร็วในการค้นหา)
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_materials_course_id ON public.materials(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_course_id ON public.questions(course_id);
CREATE INDEX IF NOT EXISTS idx_replies_question_id ON public.replies(question_id);
CREATE INDEX IF NOT EXISTS idx_active_learning_course_id ON public.active_learning(course_id);
CREATE INDEX IF NOT EXISTS idx_teaching_reflections_course_id ON public.teaching_reflections(course_id);
CREATE INDEX IF NOT EXISTS idx_weekly_hours_course_id ON public.weekly_teaching_hours(course_id);
CREATE INDEX IF NOT EXISTS idx_weekly_hours_course_week ON public.weekly_teaching_hours(course_id, week_number);

-- =====================================================================
-- MIGRATION: สำหรับ DB ที่สร้างไว้แล้ว ให้รัน SQL ด้านล่างเพื่อเพิ่ม columns ใหม่
-- (ถ้าสร้างใหม่จาก schema นี้ทั้งหมด ไม่ต้องรัน migration นี้)
-- =====================================================================

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS profile_link_url text DEFAULT '';
ALTER TABLE public.teaching_reflections ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS theory_hours numeric(4,1) DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS practice_hours numeric(4,1) DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS total_weeks integer DEFAULT 15;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS enrollment_code text DEFAULT '';

-- เพิ่มตาราง students (สำหรับ DB ที่สร้างไว้แล้ว)
CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY,
    student_id text DEFAULT '',
    first_name text DEFAULT '',
    last_name text DEFAULT '',
    email text DEFAULT '',
    avatar_url text DEFAULT '',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public SELECT on students" ON public.students FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon ALL on students" ON public.students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow authenticated ALL on students" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================================
-- GOOGLE OAUTH SETUP GUIDE
-- =====================================================================
-- ขั้นตอนเปิดใช้ Google Login ใน Supabase:
-- 1. Supabase Dashboard → Authentication → Providers → Google
-- 2. เปิด "Enable Google provider"
-- 3. ใส่ Google OAuth Client ID และ Client Secret จาก Google Cloud Console
--    (Google Cloud → APIs & Services → Credentials → Create OAuth Client ID)
-- 4. ใน Authorized redirect URIs: https://<project>.supabase.co/auth/v1/callback
-- 5. Authentication → Settings → "Confirm email" → ปิดถ้าต้องการให้นักศึกษาเข้าได้ทันที

-- ตาราง weekly_teaching_hours ไม่จำเป็นอีกต่อไป
-- ชั่วโมงสอนถูกย้ายมาเก็บที่ตาราง courses แทน (theory_hours, practice_hours, total_weeks)
-- DROP TABLE IF EXISTS public.weekly_teaching_hours; -- uncomment หากต้องการลบทิ้ง

-- =====================================================================
-- STORAGE BUCKETS SETUP GUIDE
-- =====================================================================
-- รัน SQL ด้านล่างใน Supabase SQL Editor เพื่อสร้าง bucket และ policy

-- 1. สร้าง Storage Bucket "course-assets" แบบ public
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Policy: ทุกคนอ่านได้ (public read)
CREATE POLICY "Public read course-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-assets');

-- 3. Policy: anon (ไม่ต้อง login) upload/update/delete ได้
--    เหมาะสำหรับระบบที่ Admin login ผ่าน password ใน app (ไม่ใช่ Supabase Auth)
CREATE POLICY "Anon upload course-assets"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'course-assets');

CREATE POLICY "Anon update course-assets"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'course-assets');

CREATE POLICY "Anon delete course-assets"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'course-assets');
