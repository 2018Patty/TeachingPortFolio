import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Course, Assignment } from '@/src/types';
import { DEFAULT_COURSES, DEFAULT_ASSIGNMENTS } from '@/src/data';
import { 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  ChevronRight, 
  FileText, 
  Clock, 
  Paperclip, 
  AlertCircle,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams.id;

  // 1. Fetch course details and assignments with fallbacks
  let course: Course | undefined;
  let assignments: Assignment[] = [];

  try {
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('course_id', id)
      .single();

    if (courseError || !courseData) {
      course = DEFAULT_COURSES.find(c => c.course_id === id);
    } else {
      course = courseData as Course;
    }
  } catch (err) {
    course = DEFAULT_COURSES.find(c => c.course_id === id);
  }

  try {
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', id);

    if (assignmentsError || !assignmentsData || assignmentsData.length === 0) {
      assignments = DEFAULT_ASSIGNMENTS.filter(a => a.course_id === id);
    } else {
      assignments = assignmentsData as Assignment[];
    }
  } catch (err) {
    assignments = DEFAULT_ASSIGNMENTS.filter(a => a.course_id === id);
  }

  // Handle case where course is not found
  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <BookOpen size={28} />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">ไม่พบรายวิชานี้</h1>
        <Link href="/" className="text-xs font-bold bg-indigo-600 text-white px-5 py-2.5 rounded-xl transition shadow">
          กลับสู่แลนดิ้งเพจ
        </Link>
      </div>
    );
  }

  // Formatting date dynamically (e.g. 2026-06-30 -> 30 มิ.ย. 2026)
  const formatThaiDate = (dateString: string) => {
    try {
      const months = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear() + 543; // Buddhist Era
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateString;
    }
  };

  // Status styling configurations
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 shadow-sm">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>เปิดรับงาน</span>
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold text-rose-800 bg-rose-50 border border-rose-200 shadow-sm">
            <AlertCircle size={13} className="text-rose-600" />
            <span>ปิดรับงาน</span>
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 shadow-sm">
            <Clock size={13} className="text-amber-600" />
            <span>เตรียมเปิดรับ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 shadow-sm">
            <span>ไม่ระบุสถานะ</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Title Bar Navigation */}
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
              <span className="text-[10px] text-slate-400 font-medium">ผศ.ดร.ภัทราพร วรินทรเวช</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href={`/courses/${id}`}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft size={13} />
              <span>กลับสู่รายละเอียดวิชา</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8 w-full">
        {/* Breadcrumb Row */}
        <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold mb-2">
          <Link href="/" className="hover:text-indigo-600 transition-colors">หน้าแรก</Link>
          <ChevronRight size={12} />
          <Link href={`/courses/${id}`} className="hover:text-indigo-600 transition-colors">วิชา {course.course_code}</Link>
          <ChevronRight size={12} />
          <span className="text-slate-600 font-bold">งานมอบหมาย</span>
        </div>

        {/* Course Summary Frame */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
              Teaching Course Calendar
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              ตารางงานที่มอบหมาย: {course.course_code}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {course.course_name_th} • ภาคเรียนที่ {course.semester_id}/{course.year}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto uppercase">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-100">
              <CalendarDays size={13} />
              <span>{assignments.length} งานสำคัญ</span>
            </span>
          </div>
        </div>

        {/* Responsive Grid layout containing Assignments */}
        {assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <div 
                key={assignment.assignment_id}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      ASSIGNMENT TASK
                    </span>
                    {getStatusBadge(assignment.status)}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-4 font-normal">
                      {assignment.description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับขั้นตอนการมอบหมายงานนี้'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3.5">
                  {/* Due Date Indicator */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">กำหนดวันส่งงาน</span>
                    <span className="font-extrabold text-slate-700 flex items-center gap-1 bg-slate-50 border border-slate-200/55 px-2.5 py-1 rounded-lg">
                      <Clock size={12} className="text-slate-400" />
                      <span>{formatThaiDate(assignment.due_date)}</span>
                    </span>
                  </div>

                  {/* Optional Attachment Link */}
                  {assignment.attachment_url ? (
                    <a 
                      href={assignment.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full flex items-center justify-center gap-1 text-xs text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 p-2.5 rounded-xl transition duration-150 cursor-pointer"
                    >
                      <Paperclip size={13} />
                      <span>ดาวน์โหลดไฟล์แนบวิชาสั่งงาน</span>
                    </a>
                  ) : (
                    <div className="text-center text-[10px] text-slate-400 italic py-2">
                      (ไม่มีไฟล์เอกสารแนบเพิ่มเติม)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center max-w-full space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100/60 flex items-center justify-center text-rose-500 mx-auto">
              <BookOpen size={28} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">ไม่พบตารางสั่งงานมอบหมาย</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                ขณะนี้ไม่มีรายการทำงาน งานปฏิบัติ หรือสไลด์สรุปสั่งข้อตกลงที่ค้างเสร็จสิ้นในกิจกรรมเทอมนี้ของภาคการเรียนนี้
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-12 py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-semibold text-slate-500">ผศ.ดร.ภัทราพร วรินทรเวช — Teaching Course Knowledge Portfolio</p>
          <p>คณะวิศวกรรมศาสตร์</p>
          <p className="opacity-75">© {new Date().getFullYear()} All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
