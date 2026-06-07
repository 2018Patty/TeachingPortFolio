import React from 'react';
import Link from 'next/link';
import { Sparkles, GraduationCap, ExternalLink, BookMarked, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Course, Material, Assignment, SiteProfile } from '@/src/types';
import { DEFAULT_COURSES, DEFAULT_MATERIALS, DEFAULT_ASSIGNMENTS } from '@/src/data';
import SemesterSelector from '@/components/SemesterSelector';
import CourseCard from '@/components/CourseCard';

interface PageProps {
  searchParams: Promise<{ semester?: string; year?: string }> | { semester?: string; year?: string };
}

const DEFAULT_PROFILE: SiteProfile = {
  profile_name: 'ผศ.ดร.ภัทราพร วรินทรเวช',
  profile_title: 'ผู้ช่วยศาสตราจารย์ ดร.',
  profile_department: 'สาขาวิชาเทคโนโลยีสารสนเทศและการจัดการ',
  profile_faculty: 'คณะวิทยาการจัดการ',
  profile_university: 'มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตหาดใหญ่',
  profile_bio: '',
  profile_email: 'pattaraporn.w@psu.ac.th',
  profile_photo_url: '',
  profile_link_url: '',
  admin_password: '',
};

export default async function Page({ searchParams }: PageProps) {
  // Await searchParams in Next.js Server Components
  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;

  // Set default semester (1) and year (2026)
  const semester = Number(resolvedParams?.semester || '1');
  const year = Number(resolvedParams?.year || '2026');

  // 1. Fetch courses, materials, assignments and site_settings from Supabase
  let courses: Course[] = [];
  let materials: Material[] = [];
  let assignments: Assignment[] = [];
  let profile: SiteProfile = DEFAULT_PROFILE;

  try {
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*');

    if (coursesError || !coursesData || coursesData.length === 0) {
      courses = DEFAULT_COURSES;
    } else {
      courses = coursesData as Course[];
    }
  } catch (err) {
    courses = DEFAULT_COURSES;
  }

  try {
    const { data: materialsData, error: materialsError } = await supabase
      .from('materials')
      .select('*');

    if (materialsError || !materialsData || materialsData.length === 0) {
      materials = DEFAULT_MATERIALS;
    } else {
      materials = materialsData as Material[];
    }
  } catch (err) {
    materials = DEFAULT_MATERIALS;
  }

  try {
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*');

    if (assignmentsError || !assignmentsData || assignmentsData.length === 0) {
      assignments = DEFAULT_ASSIGNMENTS;
    } else {
      assignments = assignmentsData as Assignment[];
    }
  } catch (err) {
    assignments = DEFAULT_ASSIGNMENTS;
  }

  try {
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (settingsData) {
      profile = { ...DEFAULT_PROFILE, ...settingsData };
    }
  } catch (err) {
    // ใช้ DEFAULT_PROFILE
  }

  // 2. Filter years list dynamics for Selector
  const yearsInDB = courses.map(c => c.year);
  const yearsList = Array.from(new Set([2026, ...yearsInDB])).sort((a, b) => a - b);

  // 3. Filter courses for the selected semester/academic year
  const filteredCourses = courses.filter(
    (c) => c.semester_id === semester && c.year === year
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Navbar Minimal Header for Public Page */}
      <nav className="w-full bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm block leading-none group-hover:text-indigo-600 transition-colors">
                Teaching Course Portfolio
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{profile.profile_name}</span>
            </div>
          </Link>
          {profile.profile_link_url && (
            <div className="flex items-center gap-3">
              <a
                href={profile.profile_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-slate-600 hover:text-indigo-600 border border-slate-200 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-1 shadow-sm"
              >
                <span>ข้อมูลผู้สอน</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Header Area */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white py-12 px-4 shadow-inner relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-10 w-60 h-60 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-sm mx-auto md:mx-0">
              <Sparkles size={12} className="animate-pulse" />
              <span>ระบบจัดการความรู้รายวิชา</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Teaching Portfolio
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              ยินดีต้อนรับสู่ระบบจัดการความรู้รายวิชาโดย <span className="text-white font-semibold">{profile.profile_name}</span>. สามารถค้นคว้าสไลด์ประกอบการสอน ตารางส่งงาน และติดตามการวัดเบื้องต้นตามรายบทของภาคเรียนต่าง ๆ
            </p>
            
            {profile.profile_link_url && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <a
                  href={profile.profile_link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-white font-medium bg-accent-indigo hover:bg-indigo-500 px-5 py-2.5 rounded-xl transition duration-150 shadow-lg shadow-indigo-900/30 active:scale-95"
                >
                  <GraduationCap size={16} />
                  <span>ข้อมูลผู้สอน</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* Teacher Badge Info Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-6 w-full max-w-xs space-y-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-white/10 shrink-0 text-xs">
                {profile.profile_name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-xs text-indigo-300 font-bold tracking-wider">เจ้าของผลงาน</div>
                <div className="text-sm font-bold text-white leading-tight mt-0.5">{profile.profile_name}</div>
                {profile.profile_title && (
                  <div className="text-[10px] text-indigo-300/70 leading-tight">{profile.profile_title}</div>
                )}
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-3.5 grid grid-cols-2 gap-2 text-center md:text-left">
              <div>
                <div className="text-xs text-slate-400">รายวิชาทั้งหมด</div>
                <div className="text-lg font-bold text-indigo-200">{courses.length} คอร์สที่เปิด</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">บทบาทปัจจุบัน</div>
                <div className="text-xs font-bold text-emerald-400 mt-1 capitalize">Public Guest</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8 w-full">
        {/* Filter Selection Panel */}
        <SemesterSelector
          selectedSemester={semester}
          selectedYear={year}
          yearsList={yearsList}
        />

        {/* Course Grid Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookMarked size={20} className="text-indigo-600" />
            <span>หลักสูตรวิชาที่เปิดสอนในเทอมนี้</span>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
              {filteredCourses.length} รายการ
            </span>
          </h2>
          <p className="text-slate-500 text-xs">
            เลือกการ์ดวิชาที่ปรากฏด้านล่าง เพื่อเข้าใช้งานสื่อการเรียน สไลด์ประกอบบทเรียน และปฏิทินงานส่งมอบหมายของวิชานั้นแบบละเอียด
          </p>
        </div>

        {/* Resposive Course Grid (1 Col -> 2 Cols -> 3 Cols Grid) */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => {
              const courseMaterialsCount = materials.filter(m => m.course_id === course.course_id).length;
              const courseAssignmentsCount = assignments.filter(a => a.course_id === course.course_id).length;
              return (
                <CourseCard
                  key={course.course_id}
                  course={course}
                  index={index}
                  materialsCount={courseMaterialsCount}
                  assignmentsCount={courseAssignmentsCount}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-full space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <BookOpen size={28} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">ไม่พบรายวิชาที่ค้นหา</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                ยังไม่มีการลงทะเบียนคอร์สเรียนเปิดสอนในภาคเรียนที่ {semester}/{year} นี้ 
                ปรับเลือกการตั้งค่าปีการศึกษาเพื่อตรวจดูวิชาประวัติอื่นๆ ด้านบน
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-12 py-8 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-white">{profile.profile_name}</p>
            </div>
            <div className="text-right space-y-1">
              {profile.profile_department && <p>{profile.profile_department}</p>}
              {profile.profile_faculty && <p>{profile.profile_faculty}</p>}
              {profile.profile_university && <p>{profile.profile_university}</p>}
            </div>
          </div>
          <div className="border-t border-slate-800 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} {profile.profile_name}. สงวนลิขสิทธิ์ทั้งหมด</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-500">Teaching Course Portfolio</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
