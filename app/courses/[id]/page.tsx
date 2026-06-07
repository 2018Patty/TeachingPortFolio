import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Course } from '@/src/types';
import { DEFAULT_COURSES } from '@/src/data';
import { ArrowLeft, BookOpen, GraduationCap, ChevronRight, FileText, CheckCircle2, Award, Users } from 'lucide-react';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams.id;

  let course: Course | undefined;

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

  const title = course
    ? `${course.course_code} ${course.course_name_th} - Portfolio ผศ.ดร.ภัทราพร`
    : 'ไม่พบข้อมูลรายวิชา | Portfolio ผศ.ดร.ภัทราพร';
  const description = course
    ? `${course.description?.substring(0, 155) || course.course_name_en}...`
    : 'รายละเอียดรายวิชาและข้อมูลประกอบการเรียนการสอนของ ผศ.ดร.ภัทราพร วรินทรเวช';

  return {
    title,
    description,
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams.id;

  // 1. Fetch the course from Supabase with local fallback
  let course: Course | undefined;

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

  // Handle case where course is not found
  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <BookOpen size={28} />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">ไม่พบรายวิชานี้ในสารบบ</h1>
        <p className="text-sm text-slate-500 max-w-sm mb-6">รายวิชาที่คุณกำลังค้นหาอาจจะถูกย้ายรหัส หรือไม่ได้เปิดทำการสอนในเทอมนี้</p>
        <Link 
          href="/" 
          className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition duration-150 active:scale-95 shadow-lg shadow-indigo-100"
        >
          กลับสู่แลนดิ้งเพจหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Navbar Title Bar */}
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
              href="/"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft size={13} />
              <span>กลับสู่หน้าหลัก</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8 w-full">
        {/* Back Link Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold mb-2">
          <Link href="/" className="hover:text-indigo-600 transition-colors">หน้าแรก</Link>
          <ChevronRight size={12} />
          <span className="text-slate-600 font-bold truncate">รายละเอียดวิชา {course.course_code}</span>
        </div>

        {/* Hero Course Header Frame */}
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-[2.5rem] p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-3 py-1 rounded-full font-bold">
                วิชาการศึกษา
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-bold">
                เทอม {course.semester_id}/{course.year}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white">
              {course.course_code}
            </h1>
            
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                {course.course_name_th}
              </h2>
              <p className="text-sm font-semibold text-indigo-200 uppercase tracking-wide tracking-wide leading-none italic opacity-90">
                {course.course_name_en}
              </p>
            </div>

            {/* Practical Course Meta Cards - Responsive Column Design */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-2xl text-left border-t border-white/5 mt-4">
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <FileText className="text-indigo-400 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none uppercase">หน่วยกิต (Credit)</div>
                  <div className="text-xs font-bold text-white mt-1">{course.credit || '3((3)-0-6)'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <Users className="text-indigo-400 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none uppercase">กลุ่มเซก (Section)</div>
                  <div className="text-xs font-bold text-white mt-1">Sec {course.section || '01'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <Award className="text-indigo-400 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none uppercase">ภาคการศึกษา</div>
                  <div className="text-xs font-bold text-white mt-1">ภาควิเรียน {course.semester_id}/{course.year}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Layout divided into 1 column -> 3 columns responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Main specification info (2 cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview / Description block */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight pb-3 border-b border-slate-100">
                คำอธิบายรายวิชา (Course Description)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {/* Course objectives block */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight pb-3 border-b border-slate-100">
                วัตถุประสงค์การเรียนรู้ (Course Objectives)
              </h3>
              {course.objectives && course.objectives.length > 0 ? (
                <ul className="space-y-3.5">
                  {course.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mt-0.5 shrink-0">
                        <CheckCircle2 size={12} strokeWidth={3} />
                      </span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">ไม่มีข้อมูลวัตถุประสงค์รายวิชาสำรองในขณะนี้</p>
              )}
            </div>
          </div>

          {/* Column 3: Secondary explore paths panel (1 col wide on desktop) */}
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100/80 rounded-[2rem] p-6 sm:p-8 space-y-4">
              <h3 className="text-sm font-black uppercase text-indigo-900 tracking-wider">
                Explore Course Assets
              </h3>
              <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                เข้าตรวจกิจกรรมการเรียนด้วยเอกสารการสอน สไลด์บรรยาย และตารางการมอบหมายงานสำคัญในแต่ละสัปดาห์
              </p>

              <div className="space-y-3.5 pt-2">
                <Link 
                  href={`/courses/${id}/materials`}
                  className="w-full flex items-center justify-between text-left text-sm font-bold bg-white text-indigo-900 border border-indigo-200 hover:border-indigo-400 p-4 rounded-2xl transition duration-150 hover:bg-indigo-100/50 shadow-sm shadow-indigo-100/10 group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">📚</span>
                    <span>สื่อการเรียนการสอน</span>
                  </span>
                  <ChevronRight size={16} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link 
                  href={`/courses/${id}/assignments`}
                  className="w-full flex items-center justify-between text-left text-sm font-bold bg-white text-indigo-900 border border-indigo-200 hover:border-indigo-400 p-4 rounded-2xl transition duration-150 hover:bg-indigo-100/50 shadow-sm shadow-indigo-100/10 group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">📢</span>
                    <span>งานมอบหมาย & การส่งงาน</span>
                  </span>
                  <ChevronRight size={16} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Quick Profile Bio widget */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 space-y-4 text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center font-bold text-violet-700 border border-violet-100">
                  ผศ.
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ผู้จัดการวิชาของคณะ</div>
                  <div className="text-xs font-bold text-slate-800">ผศ.ดร.ภัทราพร วรินทรเวช</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                ติดต่อสอบถามรายละเอียดแผนงาน โครงการวิจัย หรือแผนจัดซื้อเครื่องจักรและซอฟต์แวร์สนับสนุนวิชาการ ได้โดยการเยี่ยมชมโปรไฟล์ทางการ
              </p>
              <a 
                href="https://asst-prof-dr-pattaraporn-s-portfolio-48351978234.asia-southeast1.run.app/"
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold transition-all transition-colors cursor-pointer"
              >
                <span>เปิดประวัติหลักของอาจารย์</span>
                <ChevronRight size={12} />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-12 py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-semibold text-slate-500">ผศ.ดร.ภัทราพร วรินทรเวช — Teaching Course Knowledge Portfolio</p>
          <p>ภาควิชาวิศวกรรมคอมพิวเตอร์ คณะวิศวกรรมศาสตร์</p>
          <p className="opacity-75">© {new Date().getFullYear()} All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
