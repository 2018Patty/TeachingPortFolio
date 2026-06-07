'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { Course, Material, Assignment, MaterialType, AssignmentStatus } from '@/src/types';
import { revalidatePath } from 'next/cache';

// Helper to check authentication
async function authorize() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-token')?.value;
  if (!token) {
    throw new Error('ผู้ใช้งานไม่มีสิทธิ์ดำเนินการ (Unauthorized)');
  }
}

// ---------------------------------------------
// Course Server Actions
// ---------------------------------------------

export async function createCourse(data: {
  course_code: string;
  course_name_th: string;
  course_name_en: string;
  description: string;
  objectives: string[];
  semester_id: number;
  year: number;
  credit?: string;
  section?: string;
}) {
  await authorize();

  // Generate deterministic course_id consistent with preloaded pattern
  const course_id = `${data.course_code.trim()}-${data.semester_id}-${data.year}`;

  const { error } = await supabase
    .from('courses')
    .insert({
      course_id,
      course_code: data.course_code.trim(),
      course_name_th: data.course_name_th.trim(),
      course_name_en: data.course_name_en.trim(),
      description: data.description.trim(),
      objectives: data.objectives,
      semester_id: Number(data.semester_id),
      year: Number(data.year),
      credit: data.credit?.trim() || '3((3)-0-6)',
      section: data.section?.trim() || '01',
      views: 0
    });

  if (error) {
    throw new Error(`ไม่สามารถระบุรายวิชาเพิ่มเติมได้: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/admin/dashboard');
  return { success: true, course_id };
}

export async function updateCourse(id: string, data: {
  course_code: string;
  course_name_th: string;
  course_name_en: string;
  description: string;
  objectives: string[];
  semester_id: number;
  year: number;
  credit?: string;
  section?: string;
}) {
  await authorize();

  const { error } = await supabase
    .from('courses')
    .update({
      course_code: data.course_code.trim(),
      course_name_th: data.course_name_th.trim(),
      course_name_en: data.course_name_en.trim(),
      description: data.description.trim(),
      objectives: data.objectives,
      semester_id: Number(data.semester_id),
      year: Number(data.year),
      credit: data.credit?.trim() || '3((3)-0-6)',
      section: data.section?.trim() || '01'
    })
    .eq('course_id', id);

  if (error) {
    throw new Error(`ไม่สามารถเซฟข้อมูลการอัปเดตวิชา: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath(`/courses/${id}`);
  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function deleteCourse(id: string) {
  await authorize();

  // 1. Delete associated materials
  const { error: mError } = await supabase
    .from('materials')
    .delete()
    .eq('course_id', id);

  // 2. Delete associated assignments
  const { error: aError } = await supabase
    .from('assignments')
    .delete()
    .eq('course_id', id);

  // 3. Delete the course
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('course_id', id);

  if (error) {
    throw new Error(`ไม่สามารถลบวิชาในสารบบ: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/admin/dashboard');
  return { success: true };
}

// ---------------------------------------------
// Materials Server Actions
// ---------------------------------------------

export async function createMaterial(id: string, data: {
  course_id: string;
  title: string;
  type: MaterialType;
  week_number: number;
  file_url: string;
  description?: string;
}) {
  await authorize();

  const material_id = `mat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const { error } = await supabase
    .from('materials')
    .insert({
      material_id,
      course_id: data.course_id,
      title: data.title.trim(),
      type: data.type,
      week_number: Number(data.week_number),
      file_url: data.file_url.trim(),
      description: data.description?.trim() || ''
    });

  if (error) {
    throw new Error(`ไม่สามารถอัปโหลดสื่อประสงค์: ${error.message}`);
  }

  revalidatePath(`/courses/${data.course_id}/materials`);
  return { success: true, material_id };
}

export async function deleteMaterial(materialId: string, courseId: string) {
  await authorize();

  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('material_id', materialId);

  if (error) {
    throw new Error(`ไม่สามารถลบเอกสารสอน: ${error.message}`);
  }

  revalidatePath(`/courses/${courseId}/materials`);
  return { success: true };
}

// ---------------------------------------------
// Assignments Server Actions
// ---------------------------------------------

export async function createAssignment(data: {
  course_id: string;
  title: string;
  description: string;
  due_date: string;
  attachment_url?: string;
  status: AssignmentStatus;
}) {
  await authorize();

  const assignment_id = `asm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const { error } = await supabase
    .from('assignments')
    .insert({
      assignment_id,
      course_id: data.course_id,
      title: data.title.trim(),
      description: data.description.trim(),
      due_date: data.due_date,
      attachment_url: data.attachment_url?.trim() || '',
      status: data.status
    });

  if (error) {
    throw new Error(`ไม่สามารถเพิ่มปฏิทินงานส่งมอบหมาย: ${error.message}`);
  }

  revalidatePath(`/courses/${data.course_id}/assignments`);
  return { success: true, assignment_id };
}

export async function deleteAssignment(assignmentId: string, courseId: string) {
  await authorize();

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('assignment_id', assignmentId);

  if (error) {
    throw new Error(`ไม่สามารถลบตารางงานส่ง: ${error.message}`);
  }

  revalidatePath(`/courses/${courseId}/assignments`);
  return { success: true };
}
