import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Users, Target, FileText, Zap,
  MessageSquare, ClipboardList, ChevronDown, ChevronRight,
  Eye, Edit3, ExternalLink, Clock, CheckCircle, TrendingUp,
  GraduationCap, CalendarDays, ArrowRight, Plus,
} from 'lucide-react';
import {
  Course, Material, Assignment, Question, Reply, ActiveLearning,
  StudentProfile, StudentCourseVisit, AssignmentSubmission,
} from '../types';
import { DashboardPage } from './DashboardPage';

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseSection =
  | 'overview' | 'students' | 'objectives'
  | 'materials' | 'active_learning' | 'qa' | 'assignments';

type BoView =
  | { type: 'dashboard' }
  | { type: 'course'; courseId: string; section: CourseSection };

interface BackOfficeProps {
  courses: Course[];
  materials: Material[];
  assignments: Assignment[];
  questions: Question[];
  replies: Reply[];
  activities: ActiveLearning[];
  visits: StudentCourseVisit[];
  submissions: AssignmentSubmission[];
  students: StudentProfile[];
  onNavigateCourses: () => void;
  onNavigateToCourse: (courseId: string, tab: string) => void;
  onEditCourse: (course: Course) => void;
  onAddCourse: () => void;
}

// ─── Sidebar section config ───────────────────────────────────────────────────

const SECTIONS: { section: CourseSection; label: string; icon: React.ReactNode; tab?: string }[] = [
  { section: 'overview',       label: 'ภาพรวมวิชา',       icon: <Eye size={12} /> },
  { section: 'students',       label: 'นักศึกษา',          icon: <Users size={12} /> },
  { section: 'objectives',     label: 'วัตถุประสงค์',      icon: <Target size={12} /> },
  { section: 'materials',      label: 'เอกสารการสอน',     icon: <FileText size={12} />,     tab: 'materials' },
  { section: 'active_learning',label: 'Active Learning',   icon: <Zap size={12} />,          tab: 'active_learning' },
  { section: 'qa',             label: 'ถามตอบ',            icon: <MessageSquare size={12} />, tab: 'qa' },
  { section: 'assignments',    label: 'งานมอบหมาย',       icon: <ClipboardList size={12} />, tab: 'assignments' },
];

// ─── Helper: FA icon avatar (same logic as StudentProfilePage) ────────────────

const FA_ICONS = [
  'fa-user-graduate','fa-user-astronaut','fa-user-ninja','fa-user-secret',
  'fa-user-tie','fa-robot','fa-ghost','fa-cat','fa-dragon','fa-frog',
  'fa-crow','fa-horse','fa-otter','fa-fish','fa-dove',
];
const AVATAR_COLORS = [
  '#7C3AED','#059669','#2563EB','#DB2777','#D97706','#0891B2','#DC2626','#65A30D',
];
function avatarCfg(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h) + seed.charCodeAt(i); h = h & h; }
  const abs = Math.abs(h);
  return { icon: FA_ICONS[abs % FA_ICONS.length], color: AVATAR_COLORS[(abs >> 4) % AVATAR_COLORS.length] };
}

// ─── Student List Section ─────────────────────────────────────────────────────

const StudentsSection: React.FC<{
  course: Course;
  visits: StudentCourseVisit[];
  submissions: AssignmentSubmission[];
  assignments: Assignment[];
  students: StudentProfile[];
}> = ({ course, visits, submissions, assignments, students }) => {
  const courseVisits = visits.filter(v => v.course_id === course.course_id);
  const courseSubmissions = submissions.filter(s => s.course_id === course.course_id);

  // Build per-student data
  const studentIds = Array.from(new Set(courseVisits.map(v => v.student_id)));
  const rows = studentIds.map(sid => {
    const student = students.find(s => s.id === sid);
    const visitCount = courseVisits.filter(v => v.student_id === sid).length;
    const studentSubmissions = courseSubmissions.filter(s => s.student_id === sid);
    const lastVisit = courseVisits
      .filter(v => v.student_id === sid)
      .sort((a, b) => (b.visited_at || '').localeCompare(a.visited_at || ''))
      .at(0);
    return { sid, student, visitCount, submissionCount: studentSubmissions.length, studentSubmissions, lastVisit };
  });

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <Users size={36} className="mx-auto text-slate-200 mb-3" />
        <p className="text-sm font-semibold text-slate-400">ยังไม่มีนักศึกษาเข้าชมวิชานี้</p>
        <p className="text-xs text-slate-300 mt-1">ระบบจะบันทึกเมื่อนักศึกษา (login) เปิดวิชานี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-extrabold text-indigo-600">{rows.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">นักศึกษาทั้งหมด</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-extrabold text-emerald-600">{courseVisits.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">ครั้งการเข้าชมรวม</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-extrabold text-amber-600">{courseSubmissions.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">งานที่ส่งแล้ว</div>
        </div>
      </div>

      {/* Student table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Users size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-700">รายชื่อนักศึกษา</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500">นักศึกษา</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500">รหัส</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500">เข้าชม (ครั้ง)</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500">ส่งงาน (ครั้ง)</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500">งานที่ส่ง</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500">เข้าชมล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ sid, student, visitCount, submissionCount, studentSubmissions, lastVisit }, i) => {
                const cfg = avatarCfg(sid);
                const name = student
                  ? `${student.first_name} ${student.last_name}`.trim() || student.email
                  : sid.slice(0, 8) + '...';
                const email = student?.email || '—';
                const submittedAssignmentTitles = studentSubmissions.map(sub => {
                  const asgn = assignments.find(a => a.assignment_id === sub.assignment_id);
                  return asgn?.title || sub.assignment_id;
                });

                return (
                  <tr key={sid} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white"
                          style={{ background: cfg.color }}
                        >
                          <i className={`fa-solid ${cfg.icon} text-[10px]`} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{name}</div>
                          <div className="text-[10px] text-slate-400">{email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {student?.student_id || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                        <Eye size={10} />
                        {visitCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        submissionCount > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <CheckCircle size={10} />
                        {submissionCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {submittedAssignmentTitles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {submittedAssignmentTitles.map((title, ti) => (
                            <span key={ti} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                              {title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[11px]">ยังไม่ส่งงาน</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[10px]">
                      {lastVisit?.visited_at
                        ? new Date(lastVisit.visited_at).toLocaleString('th-TH', {
                            dateStyle: 'short', timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Course Overview Section ──────────────────────────────────────────────────

const CourseOverview: React.FC<{
  course: Course;
  materials: Material[];
  assignments: Assignment[];
  questions: Question[];
  activities: ActiveLearning[];
  visits: StudentCourseVisit[];
  onEdit: () => void;
  onNavigate: (tab: string) => void;
}> = ({ course, materials, assignments, questions, activities, visits, onEdit, onNavigate }) => {
  const weeks = course.total_weeks || 15;
  const courseVisits = visits.filter(v => v.course_id === course.course_id);
  const uniqueStudents = new Set(courseVisits.map(v => v.student_id)).size;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full mb-2">
              {course.course_code}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{course.course_name_th}</h2>
            <p className="text-xs text-slate-500 mt-1">{course.course_name_en}</p>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-4 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold rounded-xl transition shrink-0"
          >
            <Edit3 size={13} />
            แก้ไขวิชา
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          {[
            `ภาคเรียน ${course.semester_id}/${course.year}`,
            course.section ? `Section ${course.section}` : '',
            course.credit || '',
          ].filter(Boolean).map(tag => (
            <span key={tag} className="text-xs text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Eye size={14} className="text-blue-600" />, value: course.views || 0, label: 'ผู้เข้าชม', color: 'border-blue-100 bg-blue-50 text-blue-700' },
          { icon: <Users size={14} className="text-violet-600" />, value: uniqueStudents, label: 'นักศึกษา', color: 'border-violet-100 bg-violet-50 text-violet-700' },
          { icon: <FileText size={14} className="text-emerald-600" />, value: materials.length, label: 'เอกสาร', color: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
          { icon: <ClipboardList size={14} className="text-amber-600" />, value: assignments.length, label: 'งาน', color: 'border-amber-100 bg-amber-50 text-amber-700' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border ${s.color}`}>
            {s.icon}
            <div>
              <div className="text-lg font-extrabold leading-none">{s.value}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Teaching hours */}
      {((course.theory_hours || 0) + (course.practice_hours || 0)) > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-4">
            <Clock size={13} className="text-indigo-500" /> ชั่วโมงการสอน
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="text-xl font-extrabold text-indigo-700">{course.theory_hours}</div>
              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">ชม.ทฤษฎี/สัปดาห์</div>
              <div className="text-[10px] text-indigo-400 mt-0.5">รวม {(course.theory_hours || 0) * weeks} ชม.</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="text-xl font-extrabold text-emerald-700">{course.practice_hours}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">ชม.ปฏิบัติ/สัปดาห์</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">รวม {(course.practice_hours || 0) * weeks} ชม.</div>
            </div>
            <div className="text-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-xl font-extrabold text-slate-700">{weeks}</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">สัปดาห์/ภาคเรียน</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick links to sections */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'เอกสารการสอน', count: materials.length, tab: 'materials', icon: <FileText size={14} />, color: 'indigo' },
          { label: 'Active Learning', count: activities.length, tab: 'active_learning', icon: <Zap size={14} />, color: 'amber' },
          { label: 'Q&A', count: questions.length, tab: 'qa', icon: <MessageSquare size={14} />, color: 'violet' },
          { label: 'งานมอบหมาย', count: assignments.length, tab: 'assignments', icon: <ClipboardList size={14} />, color: 'emerald' },
        ].map(q => (
          <button
            key={q.tab}
            onClick={() => onNavigate(q.tab)}
            className="flex items-center justify-between gap-2 px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm hover:shadow transition text-left group"
          >
            <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900">
              {q.icon}
              <span className="text-xs font-semibold">{q.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">{q.count}</span>
              <ArrowRight size={11} className="text-slate-300 group-hover:text-slate-500 transition" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Generic section (objectives / materials / AL / Q&A / assignments) ────────

const GenericSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  count: number;
  items: { key: string; label: string; sub?: string }[];
  tab: string;
  onNavigate: (tab: string) => void;
}> = ({ title, icon, count, items, tab, onNavigate }) => (
  <div className="space-y-4">
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          {icon} {title}
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
        </h3>
        <button
          onClick={() => onNavigate(tab)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          <ExternalLink size={12} />
          จัดการในหน้าวิชา
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.key} className="flex items-start gap-2.5 px-3 py-2.5 bg-slate-50 rounded-xl">
              <ChevronRight size={13} className="text-slate-300 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-700 truncate">{item.label}</div>
                {item.sub && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{item.sub}</div>}
              </div>
            </div>
          ))}
          {count > items.length && (
            <div className="text-center text-[11px] text-slate-400 pt-1">
              + อีก {count - items.length} รายการ — คลิก "จัดการในหน้าวิชา"
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

// ─── Main BackOffice ──────────────────────────────────────────────────────────

export const BackOffice: React.FC<BackOfficeProps> = ({
  courses, materials, assignments, questions, replies, activities,
  visits, submissions, students,
  onNavigateCourses, onNavigateToCourse, onEditCourse, onAddCourse,
}) => {
  const [view, setView] = useState<BoView>({ type: 'dashboard' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleCourse = (courseId: string) => {
    const willExpand = expandedId !== courseId;
    setExpandedId(willExpand ? courseId : null);
    if (willExpand) setView({ type: 'course', courseId, section: 'overview' });
  };

  const selectSection = (courseId: string, section: CourseSection) => {
    setExpandedId(courseId);
    setView({ type: 'course', courseId, section });
  };

  // Group courses by semester-year (newest first)
  const grouped = courses.reduce<Record<string, Course[]>>((acc, c) => {
    const k = `${c.year}-${c.semester_id}`;
    (acc[k] = acc[k] || []).push(c);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped).sort((a, b) => {
    const [ay, as_] = a.split('-').map(Number);
    const [by, bs_] = b.split('-').map(Number);
    return by !== ay ? by - ay : bs_ - as_;
  });

  const currentCourse = view.type === 'course'
    ? courses.find(c => c.course_id === view.courseId)
    : undefined;

  const renderContent = () => {
    if (view.type === 'dashboard') {
      return (
        <DashboardPage
          courses={courses} materials={materials} assignments={assignments}
          questions={questions} replies={replies} activities={activities}
          visits={visits} allStudents={students}
          onNavigateCourses={onNavigateCourses}
          onSelectCourse={(id) => { onNavigateToCourse(id, 'info'); }}
        />
      );
    }
    if (!currentCourse) return null;
    const { courseId, section } = view;
    const cMaterials = materials.filter(m => m.course_id === courseId);
    const cAssignments = assignments.filter(a => a.course_id === courseId);
    const cQuestions = questions.filter(q => q.course_id === courseId);
    const cActivities = activities.filter(a => a.course_id === courseId);

    if (section === 'overview') return (
      <CourseOverview
        course={currentCourse}
        materials={cMaterials} assignments={cAssignments}
        questions={cQuestions} activities={cActivities}
        visits={visits}
        onEdit={() => onEditCourse(currentCourse)}
        onNavigate={(tab) => onNavigateToCourse(courseId, tab)}
      />
    );

    if (section === 'students') return (
      <StudentsSection
        course={currentCourse}
        visits={visits} submissions={submissions}
        assignments={cAssignments} students={students}
      />
    );

    if (section === 'objectives') return (
      <GenericSection
        title="วัตถุประสงค์รายวิชา (CLOs)"
        icon={<Target size={14} className="text-indigo-500" />}
        count={currentCourse.objectives?.length || 0}
        items={(currentCourse.objectives || []).map((o, i) => ({ key: String(i), label: o }))}
        tab="info"
        onNavigate={(tab) => onNavigateToCourse(courseId, tab)}
      />
    );

    if (section === 'materials') return (
      <GenericSection
        title="เอกสารประกอบการสอน"
        icon={<FileText size={14} className="text-emerald-500" />}
        count={cMaterials.length}
        items={cMaterials.slice(0, 8).map(m => ({
          key: m.material_id, label: m.title,
          sub: `สัปดาห์ ${m.week_number} · ${m.type}`,
        }))}
        tab="materials"
        onNavigate={(tab) => onNavigateToCourse(courseId, tab)}
      />
    );

    if (section === 'active_learning') return (
      <GenericSection
        title="Active Learning"
        icon={<Zap size={14} className="text-amber-500" />}
        count={cActivities.length}
        items={cActivities.slice(0, 8).map(a => ({
          key: a.activity_id, label: a.title,
          sub: a.duration ? `${a.duration}` : undefined,
        }))}
        tab="active_learning"
        onNavigate={(tab) => onNavigateToCourse(courseId, tab)}
      />
    );

    if (section === 'qa') return (
      <GenericSection
        title="กระดานถามตอบ"
        icon={<MessageSquare size={14} className="text-violet-500" />}
        count={cQuestions.length}
        items={cQuestions.slice(0, 8).map(q => ({
          key: q.question_id, label: q.content.slice(0, 80),
          sub: `โดย ${q.author_name}`,
        }))}
        tab="qa"
        onNavigate={(tab) => onNavigateToCourse(courseId, tab)}
      />
    );

    if (section === 'assignments') return (
      <GenericSection
        title="งานมอบหมาย"
        icon={<ClipboardList size={14} className="text-rose-500" />}
        count={cAssignments.length}
        items={cAssignments.slice(0, 8).map(a => ({
          key: a.assignment_id, label: a.title,
          sub: `กำหนดส่ง ${a.due_date} · ${a.status}`,
        }))}
        tab="assignments"
        onNavigate={(tab) => onNavigateToCourse(courseId, tab)}
      />
    );

    return null;
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* ── Left Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-slate-900 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow">
              B
            </div>
            <div>
              <div className="text-sm font-extrabold text-white tracking-tight">BackOffice</div>
              <div className="text-[10px] text-slate-400 font-medium">ระบบจัดการวิชา</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {/* Dashboard */}
          <button
            onClick={() => { setView({ type: 'dashboard' }); setExpandedId(null); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              view.type === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={14} />
            Dashboard ภาพรวม
          </button>

          {/* Section divider */}
          <div className="pt-4 pb-1.5 px-3 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen size={10} />
              รายวิชา
              <span className="bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full text-[8px]">
                {courses.length}
              </span>
            </span>
            <button
              type="button"
              onClick={onAddCourse}
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 hover:text-white hover:bg-indigo-600 px-2 py-1 rounded-lg transition"
              title="สร้างรายวิชาใหม่"
            >
              <Plus size={11} />
              สร้างวิชา
            </button>
          </div>

          {/* Course accordion */}
          {groupKeys.map(key => {
            const [yr, sem] = key.split('-');
            return (
              <div key={key}>
                <div className="px-3 py-1 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  ภาค {sem}/{yr}
                </div>
                {grouped[key].map(course => {
                  const expanded = expandedId === course.course_id;
                  const active = view.type === 'course' && view.courseId === course.course_id;
                  return (
                    <div key={course.course_id}>
                      {/* Course row */}
                      <button
                        onClick={() => toggleCourse(course.course_id)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all mb-0.5 ${
                          active
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="text-slate-500 shrink-0">
                          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        <div className="text-left min-w-0 flex-1">
                          <div className="font-bold text-[11px] truncate">{course.course_code}</div>
                          <div className="text-[10px] text-slate-400 truncate leading-tight">{course.course_name_th}</div>
                        </div>
                      </button>

                      {/* Sub-menu */}
                      {expanded && (
                        <div className="ml-5 pl-3 border-l border-slate-700 mb-2 space-y-0.5">
                          {SECTIONS.map(s => {
                            const isActive = active && view.type === 'course' && view.section === s.section;
                            return (
                              <button
                                key={s.section}
                                onClick={() => selectSection(course.course_id, s.section)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${
                                  isActive
                                    ? 'bg-indigo-600 text-white font-semibold'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800 font-medium'
                                }`}
                              >
                                {s.icon}
                                {s.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto bg-[#F8FAFC]">
        {/* Content header breadcrumb */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="font-bold text-slate-700">BackOffice</span>
          {view.type === 'dashboard' && (
            <><ChevronRight size={12} /><span>Dashboard ภาพรวม</span></>
          )}
          {view.type === 'course' && currentCourse && (
            <>
              <ChevronRight size={12} />
              <span>{currentCourse.course_code}</span>
              <ChevronRight size={12} />
              <span className="font-semibold text-slate-700">
                {SECTIONS.find(s => s.section === view.section)?.label}
              </span>
            </>
          )}
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};
