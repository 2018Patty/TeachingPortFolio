import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Course, Material } from '@/src/types';
import { DEFAULT_COURSES, DEFAULT_MATERIALS } from '@/src/data';
import { 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  ChevronRight, 
  FileText, 
  Video, 
  Presentation, 
  ExternalLink,
  Layers,
  Calendar
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams.id;

  // 1. Fetch course details and materials with fallbacks
  let course: Course | undefined;
  let materials: Material[] = [];

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
    const { data: materialsData, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', id);

    if (materialsError || !materialsData || materialsData.length === 0) {
      materials = DEFAULT_MATERIALS.filter(m => m.course_id === id);
    } else {
      materials = materialsData as Material[];
    }
  } catch (err) {
    materials = DEFAULT_MATERIALS.filter(m => m.course_id === id);
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

  // Group materials by week_number: Record<number, Material[]>
  const materialsByWeek = materials.reduce<Record<number, Material[]>>((groups, material) => {
    const week = material.week_number || 1;
    if (!groups[week]) {
      groups[week] = [];
    }
    groups[week].push(material);
    return groups;
  }, {});

  // Sort weeks in ascending order
  const weeks = Object.keys(materialsByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  // Icon selector per type
  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'slides':
        return <Presentation size={18} className="text-blue-600" />;
      case 'video':
        return <Video size={18} className="text-[#9D174D]" />;
      case 'document':
        return <FileText size={18} className="text-emerald-600" />;
      default:
        return <BookOpen size={18} className="text-slate-600" />;
    }
  };

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case 'slides':
        return 'บรรยาย (Slides)';
      case 'video':
        return 'วิดีโอ (Video)';
      case 'document':
        return 'เอกสาร / เล่ม (Doc)';
      default:
        return 'อื่น ๆ (Other)';
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
          <span className="text-slate-600 font-bold">คลังสื่อการสอน</span>
        </div>

        {/* Simple Course Summary Bar */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
              Teaching Course Assets
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              คลังสื่อการสอน: {course.course_code}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {course.course_name_th} • ภาคเรียนที่ {course.semester_id}/{course.year}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto uppercase">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100">
              <Layers size={13} />
              <span>{materials.length} รายการ</span>
            </span>
          </div>
        </div>

        {/* Grouped materials list */}
        {weeks.length > 0 ? (
          <div className="space-y-12">
            {weeks.map((week) => (
              <div key={week} className="space-y-4">
                {/* Week Header */}
                <div className="flex items-center gap-3.5 pb-2 border-b border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
                    W{week}
                  </div>
                  <div>
                    <h2 className="text-md sm:text-lg font-black text-slate-800 leading-tight">
                      สัปดาห์ที่ {week} (Week {week})
                    </h2>
                    <p className="text-xs text-slate-400">เนื้อหาและเอกสารประกอบการทบทวนของสัปดาห์นี้</p>
                  </div>
                </div>

                {/* Week's Materials Cards Grid (Responsive layout) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materialsByWeek[week].map((material) => (
                    <div 
                      key={material.material_id}
                      className="bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                            {getMaterialIcon(material.type)}
                            <span className="ml-0.5">{getMaterialTypeLabel(material.type)}</span>
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                          {material.title}
                        </h3>
                        <p className="text-xs text-slate-500 leading-normal line-clamp-3 font-normal">
                          {material.description || 'ไม่มีคำอธิบายสำหรับเอกสารประกอบคอร์สนี้เพิ่มเติม'}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <a 
                          href={material.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink size={14} />
                          <span>เปิดดูและใช้งานสื่อ</span>
                        </a>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          W{material.week_number}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center max-w-full space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-500 mx-auto">
              <BookOpen size={28} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">ไม่พบเอกสารประกอบการเรียนการสอน</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                อาจารย์ยังไม่ได้อัปโหลดหรือผูกไฟล์เอกสารการเรียนใด ๆ ในวิชานี้ โปรดเข้าตรวจสอบประวัติในสัปดาห์อื่น ๆ หรือภาคปีถัดไป
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
