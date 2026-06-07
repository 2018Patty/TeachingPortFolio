import React from 'react';
import Link from 'next/link';
import { Eye, ChevronRight, BookOpen } from 'lucide-react';
import { Course } from '@/src/types';

interface CourseCardProps {
  key?: React.Key;
  course: Course;
  index: number;
  materialsCount?: number;
  assignmentsCount?: number;
}

export default function CourseCard({ course, index, materialsCount = 0, assignmentsCount = 0 }: CourseCardProps) {
  // Color index cycle: 0 -> Blue, 1 -> Pink, 2 -> Green, 3 -> Purple
  const colorCycle = [
    {
      bg: 'bg-blue-50 border-blue-200 hover:shadow-blue-100',
      text: 'text-blue-700',
      badge: 'bg-blue-100/75 text-blue-800 border-blue-200/50',
      button: 'bg-blue-700 hover:bg-blue-800 text-white',
    },
    {
      bg: 'bg-pink-50 border-pink-200 hover:shadow-pink-100',
      text: 'text-pink-700',
      badge: 'bg-pink-100/75 text-pink-800 border-pink-200/50',
      button: 'bg-pink-700 hover:bg-pink-800 text-white',
    },
    {
      bg: 'bg-green-50 border-green-200 hover:shadow-green-100',
      text: 'text-green-700',
      badge: 'bg-green-100/75 text-green-800 border-green-200/50',
      button: 'bg-green-700 hover:bg-green-800 text-white',
    },
    {
      bg: 'bg-purple-50 border-purple-200 hover:shadow-purple-100',
      text: 'text-purple-700',
      badge: 'bg-purple-100/75 text-purple-800 border-purple-200/50',
      button: 'bg-purple-700 hover:bg-purple-800 text-white',
    }
  ];

  const theme = colorCycle[index % 4];

  return (
    <Link 
      href={`/courses/${course.course_id}`}
      className={`group block rounded-[2rem] border-2 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${theme.bg} flex flex-col justify-between min-h-[260px] cursor-pointer`}
      id={`next-course-card-${course.course_code}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
            COURSE CODE
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${theme.badge}`}>
            Sec {course.section || '01'}
          </span>
        </div>

        <div>
          <h3 className={`text-3xl font-extrabold mt-1 mb-1 tracking-tighter ${theme.text}`}>
            {course.course_code}
          </h3>
          <h4 className="text-lg font-bold text-slate-800 tracking-tight line-clamp-1 group-hover:text-slate-950 transition-colors">
            {course.course_name_th}
          </h4>
          <div className="text-xs font-semibold text-slate-500 tracking-normal line-clamp-1 italic mb-2">
            {course.course_name_en}
          </div>
          
          <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
            {course.description}
          </p>
        </div>
      </div>

      {/* Footer view and counts */}
      <div className={`mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between text-xs font-bold ${theme.text}`}>
        <div className="flex gap-4 items-end">
          <div className="text-left">
            <span className="block text-lg font-black leading-none">{materialsCount}</span>
            <span className="text-[9px] uppercase font-bold opacity-60">เอกสาร</span>
          </div>
          <div className="text-left">
            <span className="block text-lg font-black leading-none">{assignmentsCount}</span>
            <span className="text-[9px] uppercase font-bold opacity-60">งานมอบหมาย</span>
          </div>
          {course.views !== undefined && (
            <div className="text-left pl-3 ml-1 border-l border-slate-200">
              <span className="flex items-center gap-0.5 text-lg font-black leading-none">
                <Eye size={13} className="opacity-80" />
                <span>{course.views}</span>
              </span>
              <span className="text-[9px] uppercase font-bold opacity-60">เข้าชม</span>
            </div>
          )}
        </div>

        <span className="inline-flex items-center gap-0.5 text-xs font-black uppercase tracking-wider bg-black/5 px-3 py-1.5 rounded-full transition-transform group-hover:translate-x-1">
          <span>เข้าชมคอร์ส</span>
          <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}
