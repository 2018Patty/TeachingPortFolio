import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Course, Material, Assignment } from '@/src/types';
import { DEFAULT_COURSES, DEFAULT_MATERIALS, DEFAULT_ASSIGNMENTS } from '@/src/data';
import { GraduationCap, ArrowLeft, BookOpen } from 'lucide-react';
import EditCourseForm from './EditCourseForm';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams.id;

  // Fetch course details, materials, and assignments for pre-filling
  let course: Course | undefined;
  let materials: Material[] = [];
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
    const { data: materialsData, error: mError } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', id);

    if (mError || !materialsData || materialsData.length === 0) {
      materials = DEFAULT_MATERIALS.filter(m => m.course_id === id);
    } else {
      materials = materialsData as Material[];
    }
  } catch (err) {
    materials = DEFAULT_MATERIALS.filter(m => m.course_id === id);
  }

  try {
    const { data: assignmentsData, error: aError } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', id);

    if (aError || !assignmentsData || assignmentsData.length === 0) {
      assignments = DEFAULT_ASSIGNMENTS.filter(a => a.course_id === id);
    } else {
      assignments = assignmentsData as Assignment[];
    }
  } catch (err) {
    assignments = DEFAULT_ASSIGNMENTS.filter(a => a.course_id === id);
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <BookOpen />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">ไม่พบวิชาเรียนที่ระบุในเซิร์ฟเวอร์</h1>
        <p className="text-sm text-slate-500 max-w-sm mb-6">หลักสูตรวิชาที่คุณยืนยันต้องการแก้ไข อาจถูกถอดถอนสาระระบบแล้ว</p>
        <Link 
          href="/admin/dashboard" 
          className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition shadow"
        >
          กลับสู่ตารางควบคุมหลังบ้าน
        </Link>
      </div>
    );
  }

  return (
    <EditCourseForm 
      initialCourse={course} 
      initialMaterials={materials} 
      initialAssignments={assignments} 
    />
  );
}
