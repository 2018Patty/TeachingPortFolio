/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'student' | 'guest';

export interface StudentProfile {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

export interface SiteProfile {
  profile_name: string;
  profile_title: string;
  profile_department: string;
  profile_faculty: string;
  profile_university: string;
  profile_bio: string;
  profile_email: string;
  profile_photo_url: string;
  profile_link_url: string;
  admin_password: string;
  // PDPA settings
  pdpa_purposes?: string;       // JSON array of purpose strings
  pdpa_retention?: string;      // retention period description
  pdpa_third_party?: string;    // third-party disclosure info
  pdpa_updated_at?: string;     // e.g. "มิถุนายน 2026"
  pdpa_effective_date?: string; // e.g. "1 มิถุนายน 2026"
  pdpa_version?: string;        // ISO timestamp — bumped on every admin save
  semester_schedules?: string;  // JSON: SemesterSchedule[]
}

export interface SemesterSchedule {
  semester_id: number;   // 1 or 2
  year: number;          // academic year e.g. 2026
  week1_start: string;   // ISO date 'YYYY-MM-DD' — Monday of week 1
  total_weeks: number;   // default 16
}

export type MaterialType = 'slides' | 'video' | 'document' | 'link';

export type AssignmentStatus = 'open' | 'closed' | 'upcoming';

export interface Semester {
  semester_id: number; // 1 or 2
  year: number; // e.g., 2026, 2027
  label: string; // e.g., "1/2026", "2/2026"
}

export interface Course {
  course_id: string; // PK: e.g., 'CS101-1-2026'
  course_code: string;
  course_name_th: string;
  course_name_en: string;
  description: string;
  objectives: string[]; // Course Learning Outcomes (CLOs)
  semester_id: number; // 1 or 2
  year: number; // e.g., 2026
  credit?: string;
  section?: string;
  theory_hours?: number;   // ชั่วโมงทฤษฏีต่อสัปดาห์ (คงที่ทุกสัปดาห์)
  practice_hours?: number; // ชั่วโมงปฏิบัติต่อสัปดาห์ (คงที่ทุกสัปดาห์)
  total_weeks?: number;    // จำนวนสัปดาห์ทั้งภาคเรียน (default 15)
  enrollment_code?: string; // รหัสลงทะเบียน — นักศึกษาต้องใส่เพื่อเข้าวิชา
  views?: number;
  created_at?: string;
}

export interface Material {
  material_id: string;
  course_id: string;
  title: string;
  type: MaterialType;
  week_number?: number;
  file_url: string;
  description?: string;
  created_at?: string;
}

export interface Assignment {
  assignment_id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string; // Date string
  week_number?: number;
  attachment_url?: string;
  status: AssignmentStatus;
  created_at?: string;
}

export interface Question {
  question_id: string;
  course_id: string;
  author_name: string;
  content: string;
  created_at?: string;
}

export interface Reply {
  reply_id: string;
  question_id: string;
  author_name: string;
  content: string;
  is_instructor: boolean;
  created_at?: string;
}

export interface ActiveLearningType {
  type_id: string;
  name: string;
  description: string;
  example: string;
}

export const AL_TYPES: ActiveLearningType[] = [
  { type_id: 'al-01', name: 'Think-Pair-Share',              description: 'คิดคนเดียว → จับคู่ → แลกเปลี่ยน',                     example: 'วิเคราะห์โจทย์ AI แล้วอภิปรายกับเพื่อน' },
  { type_id: 'al-02', name: 'Case-Based Learning (CBL)',     description: 'เรียนรู้ผ่านกรณีศึกษา',                                 example: 'วิเคราะห์ Netflix, Amazon, 7-Eleven ใช้ Data Analytics อย่างไร' },
  { type_id: 'al-03', name: 'Problem-Based Learning (PBL)', description: 'เริ่มจากปัญหาจริงแล้วหาคำตอบ',                         example: 'ออกแบบ AI แก้ปัญหาการท่องเที่ยวชุมชน' },
  { type_id: 'al-04', name: 'Project-Based Learning',       description: 'สร้างชิ้นงานหรือโครงงาน',                               example: 'พัฒนา AI Web Application' },
  { type_id: 'al-05', name: 'Inquiry-Based Learning',       description: 'ตั้งคำถามและค้นคว้าหาคำตอบ',                           example: 'นักศึกษาศึกษา "ทำไมโมเดลทำนายผิด"' },
  { type_id: 'al-06', name: 'Design Thinking',              description: 'Empathy → Define → Ideate → Prototype',              example: 'คิด Startup AI จากปัญหาจริง' },
  { type_id: 'al-07', name: 'Collaborative Learning',       description: 'เรียนร่วมกันเป็นกลุ่ม',                                example: 'ทำ Business Model Canvas ร่วมกัน' },
  { type_id: 'al-08', name: 'Peer Learning',                description: 'เรียนรู้จากเพื่อน',                                    example: 'นักศึกษาสอนวิธีใช้เครื่องมือ AI ให้เพื่อน' },
  { type_id: 'al-09', name: 'Peer Review',                  description: 'วิจารณ์และให้ข้อเสนอแนะ',                              example: 'ตรวจ PRD หรือ Prototype ของเพื่อน' },
  { type_id: 'al-10', name: 'Flipped Classroom',            description: 'ศึกษาก่อนเรียน แล้วมาอภิปรายในห้อง',                 example: 'ดูวิดีโอ Next.js ก่อนเข้าห้องเรียน' },
  { type_id: 'al-11', name: 'Discussion-Based Learning',   description: 'เรียนผ่านการอภิปราย',                                  example: 'Debate เรื่อง AI แทนที่มนุษย์ได้หรือไม่' },
  { type_id: 'al-12', name: 'Role Play',                    description: 'สวมบทบาท',                                             example: 'ลูกค้า, Product Owner, Developer' },
  { type_id: 'al-13', name: 'Simulation-Based Learning',   description: 'จำลองสถานการณ์',                                       example: 'จำลองการวิเคราะห์ข้อมูลธุรกิจ' },
  { type_id: 'al-14', name: 'Gamification',                 description: 'ใช้เกมหรือการแข่งขัน',                                 example: 'Kaggle Competition' },
  { type_id: 'al-15', name: 'Workshop-Based Learning',     description: 'ลงมือปฏิบัติจริง',                                    example: 'Workshop Teachable Machine' },
  { type_id: 'al-16', name: 'Experiential Learning',       description: 'เรียนรู้จากประสบการณ์จริง',                            example: 'ลงพื้นที่เก็บข้อมูลชุมชน' },
  { type_id: 'al-17', name: 'Service Learning',             description: 'เรียนรู้ผ่านการบริการสังคม',                           example: 'พัฒนาระบบให้ชุมชนจริง' },
  { type_id: 'al-18', name: 'Jigsaw Learning',              description: 'แบ่งเนื้อหาให้แต่ละกลุ่มเชี่ยวชาญ',                 example: 'กลุ่ม A ศึกษา CNN, B ศึกษา Regression' },
  { type_id: 'al-19', name: 'Brainstorming',                description: 'ระดมความคิด',                                          example: 'หาไอเดีย AI Startup' },
  { type_id: 'al-20', name: 'Reflection Learning',         description: 'สะท้อนการเรียนรู้',                                   example: 'เขียน Reflection หลังจบ Lab' },
];

export interface ActiveLearning {
  activity_id: string;
  course_id: string;
  type_id?: string;
  title: string;
  description: string;
  duration: string;
  week_number?: number;
  file_url?: string;
  is_assignment?: boolean;
  due_date?: string;
  created_at?: string;
}

export interface TeachingHour {
  hour_id: string;
  course_id: string;
  week_number: number;
  theory_hours: number;
  practice_hours: number;
  created_at?: string;
}

export interface StudentCourseVisit {
  visit_id: string;
  student_id: string;   // uuid of students.id
  course_id: string;
  visited_at?: string;
}

export interface AssignmentSubmission {
  submission_id: string;
  student_id: string;   // uuid of students.id
  assignment_id: string;
  course_id: string;
  submitted_at?: string;
  note?: string;
  answer_text?: string;
  file_url?: string;
  link_url?: string;
}

export interface TeachingReflection {
  reflection_id: string;
  course_id: string;
  week_number: number;
  content: string;
  image_url?: string;
  created_at?: string;
}
