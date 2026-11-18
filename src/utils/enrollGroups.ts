// Per-group enrollment codes.
//
// A course can be taught to several groups (sections). Each group gets its own
// enrollment code, but every group enters the SAME course page — the code only
// tells us which group the student belongs to.
//
// Storage (no DB schema change needed):
//  - courses.enrollment_code holds the codes joined by commas, in group order:
//      "ARZ968,KQP245"  → group 1 = ARZ968, group 2 = KQP245
//    A single code (old format) still works and maps to group 1.
//  - The student's group is encoded in student_course_visits.visit_id:
//      "v-g2-<timestamp>-<random>"  → group 2
//    Older visit ids ("v-<timestamp>-...") have no group (shown as "-").

import type { Course } from '../types';

export const parseGroupCodes = (raw?: string | null): string[] =>
  (raw || '').split(',').map(c => c.trim());

export const joinGroupCodes = (codes: string[]): string => {
  const trimmed = codes.map(c => c.trim());
  return trimmed.some(Boolean) ? trimmed.join(',') : '';
};

export const courseHasCode = (course?: Pick<Course, 'enrollment_code'>): boolean =>
  parseGroupCodes(course?.enrollment_code).some(Boolean);

/** Returns the 1-based group whose code matches (case-insensitive), or null. */
export const matchGroupCode = (course: Pick<Course, 'enrollment_code'>, input: string): number | null => {
  const needle = input.trim().toUpperCase();
  if (!needle) return null;
  const idx = parseGroupCodes(course.enrollment_code).findIndex(c => c && c.toUpperCase() === needle);
  return idx >= 0 ? idx + 1 : null;
};

export const groupCount = (course: Pick<Course, 'section'>): number => {
  const n = parseInt(String(course.section ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 30) : 1;
};

export const generateEnrollCode = (taken: string[] = []): string => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 3; i++) code += letters[Math.floor(Math.random() * letters.length)];
    for (let i = 0; i < 3; i++) code += digits[Math.floor(Math.random() * digits.length)];
  } while (taken.includes(code));
  return code;
};

export const makeVisitId = (group?: number | null): string =>
  `v-${group ? `g${group}-` : ''}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const groupFromVisitId = (visitId?: string | null): number | null => {
  const m = /^v-g(\d+)-/.exec(visitId || '');
  return m ? Number(m[1]) : null;
};

/** True when every group has its own code, so the code alone tells the group. */
export const codesIdentifyGroup = (course: Pick<Course, 'enrollment_code' | 'section'>): boolean => {
  const n = groupCount(course);
  const codes = parseGroupCodes(course.enrollment_code).filter(Boolean);
  return n <= 1 || codes.length >= n;
};

/** The group a student entered a course with (from their visit records), or null. */
export const studentGroupInCourse = (
  visits: { visit_id: string; student_id: string; course_id: string | null }[],
  studentId: string,
  courseId: string,
): number | null =>
  visits
    .filter(v => v.student_id === studentId && v.course_id === courseId)
    .map(v => groupFromVisitId(v.visit_id))
    .find((g): g is number => g !== null) ?? null;
