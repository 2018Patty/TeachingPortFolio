import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Eye,
  FileText,
  ClipboardList,
  MessageSquare,
  Zap,
  NotebookPen,
  ExternalLink,
  Clock,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { Course, Material, Assignment, Question, Reply, ActiveLearning } from '../types';
import { DashboardPage } from './DashboardPage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminPanelProps {
  courses: Course[];
  materials: Material[];
  assignments: Assignment[];
  questions: Question[];
  replies: Reply[];
  activities: ActiveLearning[];
  visits?: import('../types').StudentCourseVisit[];
  allStudents?: import('../types').StudentProfile[];
  onNavigateCourses: () => void;
  onSelectCourse: (courseId: string) => void;
}

type AdminView = 'dashboard' | string; // string = course_id

// ─── Small stat card used in course detail ────────────────────────────────────

const StatPill = ({
  icon,
  value,
  label,
  colorClass,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  colorClass: string;
}) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorClass}`}>
    <div className="shrink-0">{icon}</div>
    <div>
      <div className="text-sm font-extrabold leading-none">{value}</div>
      <div className="text-[10px] opacity-70 mt-0.5">{label}</div>
    </div>
  </div>
);

// ─── Course detail view (shown in main area when a course is selected) ────────

const CourseDetail: React.FC<{
  course: Course;
  materials: Material[];
  assignments: Assignment[];
  questions: Question[];
  activities: ActiveLearning[];
  enrolledCount: number;
  onGoToFullView: () => void;
}> = ({ course, materials, assignments, questions, activities, enrolledCount, onGoToFullView }) => {
  const hasHours = (course.theory_hours || 0) + (course.practice_hours || 0) > 0;
  const weeks = course.total_weeks || 15;

  return (
    <div className="space-y-5">
      {/* Course header card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-block text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full mb-2">
              {course.course_code}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
              {course.course_name_th}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">{course.course_name_en}</p>
          </div>
          <button
            onClick={onGoToFullView}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shrink-0 shadow-sm"
          >
            <ExternalLink size={13} />
            เปิดวิชา
          </button>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-600 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            ภาคเรียน {course.semester_id}/{course.year}
          </span>
          {course.section && (
            <span className="text-xs text-slate-600 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              Section {course.section}
            </span>
          )}
          {course.credit && (
            <span className="text-xs text-slate-600 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              {course.credit} หน่วยกิต
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          icon={<Eye size={14} className="text-blue-600" />}
          value={enrolledCount}
          label="ผู้เข้าชม"
          colorClass="border-blue-100 bg-blue-50 text-blue-700"
        />
        <StatPill
          icon={<FileText size={14} className="text-emerald-600" />}
          value={materials.length}
          label="เอกสาร"
          colorClass="border-emerald-100 bg-emerald-50 text-emerald-700"
        />
        <StatPill
          icon={<ClipboardList size={14} className="text-amber-600" />}
          value={assignments.length}
          label="งานมอบหมาย"
          colorClass="border-amber-100 bg-amber-50 text-amber-700"
        />
        <StatPill
          icon={<MessageSquare size={14} className="text-violet-600" />}
          value={questions.length}
          label="Q&A"
          colorClass="border-violet-100 bg-violet-50 text-violet-700"
        />
      </div>

      {/* Teaching hours */}
      {hasHours && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-4">
            <Clock size={14} className="text-indigo-500" />
            ชั่วโมงการสอน
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="text-lg font-extrabold text-indigo-700">{course.theory_hours}</div>
              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">ชม.ทฤษฎี/สัปดาห์</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="text-lg font-extrabold text-emerald-700">{course.practice_hours}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">ชม.ปฏิบัติ/สัปดาห์</div>
            </div>
            <div className="text-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-lg font-extrabold text-slate-700">{weeks}</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">สัปดาห์/ภาคเรียน</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="flex justify-between items-center px-3 py-2 bg-indigo-50/50 rounded-lg">
              <span className="text-[11px] text-slate-600">รวมทฤษฎีทั้งภาค</span>
              <span className="text-xs font-bold text-indigo-700">
                {(course.theory_hours || 0) * weeks} ชม.
              </span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 bg-emerald-50/50 rounded-lg">
              <span className="text-[11px] text-slate-600">รวมปฏิบัติทั้งภาค</span>
              <span className="text-xs font-bold text-emerald-700">
                {(course.practice_hours || 0) * weeks} ชม.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active learning & activities count */}
      {activities.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-3">
            <Zap size={14} className="text-amber-500" />
            Active Learning ({activities.length} กิจกรรม)
          </h3>
          <div className="space-y-1.5">
            {activities.slice(0, 5).map(act => (
              <div key={act.activity_id} className="flex items-center gap-2 text-xs text-slate-600">
                <ChevronRight size={12} className="text-slate-300 shrink-0" />
                <span className="font-medium truncate">{act.title}</span>
                {act.duration && (
                  <span className="shrink-0 text-[10px] text-slate-400">{act.duration}</span>
                )}
              </div>
            ))}
            {activities.length > 5 && (
              <div className="text-[11px] text-slate-400 pl-4">
                และอีก {activities.length - 5} กิจกรรม...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {course.description && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 mb-2">คำอธิบายรายวิชา</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{course.description}</p>
        </div>
      )}
    </div>
  );
};

// ─── Main AdminPanel ──────────────────────────────────────────────────────────

export const AdminPanel: React.FC<AdminPanelProps> = ({
  courses,
  materials,
  assignments,
  questions,
  replies,
  activities,
  visits = [],
  allStudents = [],
  onNavigateCourses,
  onSelectCourse,
}) => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');

  const selectedCourse = courses.find(c => c.course_id === activeView);

  // Group courses by "year-semester" for sidebar display
  const grouped = courses.reduce<Record<string, Course[]>>((acc, c) => {
    const key = `${c.year}-${c.semester_id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  // Sort groups newest first
  const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
    const [ayear, asem] = a.split('-').map(Number);
    const [byear, bsem] = b.split('-').map(Number);
    return byear !== ayear ? byear - ayear : bsem - asem;
  });

  return (
    <div className="flex gap-6 items-start">
      {/* ── Left: Main content area ────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {activeView === 'dashboard' ? (
          <DashboardPage
            courses={courses}
            materials={materials}
            assignments={assignments}
            questions={questions}
            replies={replies}
            activities={activities}
            visits={visits}
            allStudents={allStudents}
            onNavigateCourses={onNavigateCourses}
            onSelectCourse={(id) => {
              onSelectCourse(id);
            } as (courseId: string, section?: string) => void}
          />
        ) : selectedCourse ? (
          <CourseDetail
            course={selectedCourse}
            materials={materials.filter(m => m.course_id === selectedCourse.course_id)}
            assignments={assignments.filter(a => a.course_id === selectedCourse.course_id)}
            questions={questions.filter(q => q.course_id === selectedCourse.course_id)}
            activities={activities.filter(a => a.course_id === selectedCourse.course_id)}
            enrolledCount={new Set(visits.filter(v => v.course_id === selectedCourse.course_id).map(v => v.student_id)).size}
            onGoToFullView={() => onSelectCourse(selectedCourse.course_id)}
          />
        ) : (
          // Fallback — shouldn't normally appear
          <div className="text-slate-400 text-sm p-8 text-center">เลือกเมนูด้านขวา</div>
        )}
      </div>

      {/* ── Right: Sidebar navigation ──────────────────────────────────── */}
      <aside className="w-64 shrink-0">
        <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Sidebar header */}
          <div className="bg-slate-900 px-4 py-3.5 flex items-center gap-2">
            <GraduationCap size={15} className="text-indigo-400" />
            <span className="text-xs font-bold text-white tracking-wide">แผงควบคุมอาจารย์</span>
          </div>

          <div className="p-2 space-y-0.5">
            {/* Dashboard item */}
            <button
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard สรุปภาพรวม</span>
            </button>

            {/* Divider */}
            <div className="pt-2 pb-1">
              <div className="flex items-center gap-2 px-3">
                <BookOpen size={11} className="text-slate-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  รายวิชา
                </span>
                <span className="text-[9px] font-bold text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {courses.length}
                </span>
              </div>
            </div>

            {/* Course list — grouped by semester/year */}
            <div className="max-h-[480px] overflow-y-auto space-y-2 pr-0.5">
              {sortedGroupKeys.map(key => {
                const [year, sem] = key.split('-');
                const group = grouped[key];
                return (
                  <div key={key}>
                    {/* Group label */}
                    <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      ภาค {sem}/{year}
                    </div>
                    {/* Course buttons */}
                    {group.map(course => (
                      <button
                        key={course.course_id}
                        onClick={() => setActiveView(course.course_id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all mb-0.5 ${
                          activeView === course.course_id
                            ? 'bg-indigo-50 border border-indigo-200 text-indigo-800'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-[11px] leading-tight truncate">
                          {course.course_code}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                          {course.course_name_th}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}

              {courses.length === 0 && (
                <div className="px-3 py-4 text-[11px] text-slate-400 text-center">
                  ยังไม่มีรายวิชา
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
