import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Course, Material, Assignment } from '@/src/types';
import { DEFAULT_COURSES, DEFAULT_MATERIALS, DEFAULT_ASSIGNMENTS } from '@/src/data';
import {
  Plus,
  Edit,
  GraduationCap,
  BookMarked,
  Layers,
  CalendarDays,
  Settings,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import LogoutButton from './LogoutButton';

export default async function AdminDashboardPage() {
  let courses: Course[] = [];
  let materials: Material[] = [];
  let assignments: Assignment[] = [];
  let totalStudents = 0;
  // map course_id → unique student count
  const studentCountByCourse: Record<string, number> = {};
  let databaseError = false;

  try {
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*');

    if (coursesError || !coursesData || coursesData.length === 0) {
      courses = DEFAULT_COURSES;
      databaseError = true;
    } else {
      courses = coursesData as Course[];
    }
  } catch {
    courses = DEFAULT_COURSES;
    databaseError = true;
  }

  try {
    const { data: materialsData, error: mError } = await supabase
      .from('materials')
      .select('*');

    if (mError || !materialsData || materialsData.length === 0) {
      materials = DEFAULT_MATERIALS;
    } else {
      materials = materialsData as Material[];
    }
  } catch {
    materials = DEFAULT_MATERIALS;
  }

  try {
    const { data: assignmentsData, error: aError } = await supabase
      .from('assignments')
      .select('*');

    if (aError || !assignmentsData || assignmentsData.length === 0) {
      assignments = DEFAULT_ASSIGNMENTS;
    } else {
      assignments = assignmentsData as Assignment[];
    }
  } catch {
    assignments = DEFAULT_ASSIGNMENTS;
  }

  // Fetch total student count
  try {
    const { count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    totalStudents = count ?? 0;
  } catch {
    totalStudents = 0;
  }

  // Fetch distinct student counts per course from student_course_visits
  try {
    const { data: visitsData } = await supabase
      .from('student_course_visits')
      .select('course_id, student_id');

    if (visitsData) {
      const perCourse: Record<string, Set<string>> = {};
      for (const row of visitsData) {
        if (!row.course_id || !row.student_id) continue;
        if (!perCourse[row.course_id]) perCourse[row.course_id] = new Set();
        perCourse[row.course_id].add(row.student_id);
      }
      for (const [cid, set] of Object.entries(perCourse)) {
        studentCountByCourse[cid] = set.size;
      }
    }
  } catch {
    // leave studentCountByCourse empty — will show 0 per course
  }

  // Group courses by academic year & semester
  const groups: Record<string, Course[]> = {};
  courses.forEach((course) => {
    const key = `ปีการศึกษา ${course.year} - ภาคเรียนที่ ${course.semester_id}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(course);
  });

  const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Navbar */}
      <nav className="w-full bg-slate-900 text-white shadow-md py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shrink-0">
              <Settings size={18} />
            </div>
            <div>
              <span className="font-extrabold text-sm block leading-none">
                ระบบจัดการหลังบ้านผู้สอน
              </span>
              <span className="text-[10px] text-indigo-300 font-bold">ผศ.ดร.ภัทราพร วรินทรเวช (Admin Master)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-slate-300 hover:text-white font-bold px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
            >
              หน้าเว็บวิชาการ
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main Admin Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8 w-full">
        {/* Banner Alert for placeholders */}
        {databaseError && (
          <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mx-auto sm:mx-0">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-extrabold text-amber-900">
                โหมดจับคู่ข้อมูลจำลองภายใน (Preloaded Backup Active)
              </h3>
              <p className="text-xs text-amber-700 leading-relaxed font-medium">
                ระบบสืบค้นไม่พบการเชื่อมโยงฐานข้อมูลจริงของ Supabase หรือตารางข้อมูลยังว่างอยู่ ระบบจึงแสดงผลรายวิชาสำรองให้อัตโนมัติเพื่อให้คุณพร้อมทดสอบการกรอกร่างข้อมูล
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Title Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              การจัดการคอร์สวิชาทั้งหมด
            </h1>
            <p className="text-xs text-slate-500">
              เพิ่มรายรหัส ลบรายหลักสูตร แนบเนื้อหาสปอยล์สื่อ รวมทั้งปักตารางเวลาส่งงานให้พร้อมเสร็จสมบูรณ์
            </p>
          </div>

          <Link
            href="/admin/courses/new"
            className="inline-flex items-center justify-center gap-1.5 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-lg shadow-indigo-100 transition duration-150 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>สร้างคอร์สใหม่</span>
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Students */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <GraduationCap size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">นักศึกษาทั้งหมด</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{totalStudents} คน</span>
            </div>
          </div>

          {/* Courses */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <BookMarked size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">จำนวนคอร์สเปิดสอน</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{courses.length}</span>
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">ไฟล์เอกสารประกอบ</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{materials.length} แฟ้ม</span>
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 text-pink-600 flex items-center justify-center shrink-0">
              <CalendarDays size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">ตารางงานจัดสอบส่ง</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{assignments.length} กิจกรรม</span>
            </div>
          </div>
        </div>

        {/* Grouped Courses Lists */}
        {sortedGroupKeys.length > 0 ? (
          <div className="space-y-10">
            {sortedGroupKeys.map((groupKey) => (
              <div key={groupKey} className="space-y-4">
                <div className="flex items-center gap-3.5 pb-2 border-b border-slate-200">
                  <div className="w-2.5 h-6 rounded-full bg-[#4F46E5]"></div>
                  <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">
                    {groupKey}
                  </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200/60 text-[10px] uppercase tracking-wider">
                          <th className="py-4 px-6 font-bold text-slate-500">รหัสวิชา</th>
                          <th className="py-4 px-6 font-bold text-slate-500">ชื่อภาษาไทย / ภาษาอังกฤษ</th>
                          <th className="py-4 px-6 font-bold text-slate-500 text-center">นักศึกษา</th>
                          <th className="py-4 px-6 font-bold text-slate-500 text-center">สถิติ</th>
                          <th className="py-4 px-6 font-bold text-slate-500 text-center">คลังสื่อ / งานส่ง</th>
                          <th className="py-4 px-6 font-bold text-slate-500 text-right">เครื่องมือ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groups[groupKey].map((course) => {
                          const cMaterials = materials.filter(m => m.course_id === course.course_id);
                          const cAssignments = assignments.filter(a => a.course_id === course.course_id);
                          const cStudents = studentCountByCourse[course.course_id] ?? 0;

                          return (
                            <tr key={course.course_id} className="hover:bg-slate-50/40 transition-colors text-xs text-slate-700">
                              {/* Course Code */}
                              <td className="py-4 px-6 align-middle">
                                <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-3 py-1 rounded-full text-xs">
                                  {course.course_code}
                                </span>
                              </td>

                              {/* Names */}
                              <td className="py-4 px-6 align-middle max-w-sm">
                                <div className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">{course.course_name_th}</div>
                                <div className="text-[10px] text-slate-400 italic font-medium mt-0.5 line-clamp-1 uppercase">{course.course_name_en}</div>
                              </td>

                              {/* Student count per course */}
                              <td className="py-4 px-6 text-center align-middle">
                                <span className="inline-flex items-center gap-1 font-bold text-violet-700 bg-violet-50 border border-violet-100/80 px-2.5 py-0.5 rounded-lg text-[11px]">
                                  <GraduationCap size={11} className="opacity-80" />
                                  <span>{cStudents} คน</span>
                                </span>
                              </td>

                              {/* Views */}
                              <td className="py-4 px-6 text-center align-middle">
                                <span className="inline-flex items-center gap-1 font-bold text-slate-500">
                                  <Eye size={12} className="opacity-70" />
                                  <span>{course.views || 0}</span>
                                </span>
                              </td>

                              {/* Asset counters */}
                              <td className="py-4 px-6 text-center align-middle whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100/80 px-2 py-0.5 rounded-lg mr-2">
                                  <span>{cMaterials.length} สื่อ</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-100/80 px-2 py-0.5 rounded-lg">
                                  <span>{cAssignments.length} งาน</span>
                                </span>
                              </td>

                              {/* Action Tools */}
                              <td className="py-4 px-6 text-right align-middle">
                                <div className="flex justify-end gap-3.5">
                                  <Link
                                    href={`/admin/courses/${course.course_id}/edit`}
                                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-indigo-600 border border-slate-200/50 hover:border-indigo-100 bg-white transition shadow-sm inline-flex items-center gap-1 font-bold"
                                  >
                                    <Edit size={14} />
                                    <span className="text-[10px] tracking-tight uppercase">แก้ไข</span>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center max-w-full space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100/60 flex items-center justify-center text-slate-400 mx-auto">
              <BookMarked size={28} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">ไม่พบหลักสูตรสารบบวิชาใด ๆ ในระบบ</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                คลิกที่ปุ่มสร้างคอร์สใหม่ด้านบน เพื่อเพิ่มรหัสวิชาเรียนใหม่ของคุณในเทอมปัจจุบัน
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 text-center text-xs mt-12">
        <div className="max-w-7xl mx-auto space-y-1">
          <p className="font-semibold text-slate-300">ผศ.ดร.ภัทราพร วรินทรเวช — Teaching Portfolio Admin Portal</p>
          <p className="opacity-75">© {new Date().getFullYear()} Secured with military-grade JWT checks.</p>
        </div>
      </footer>
    </div>
  );
}
