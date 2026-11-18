import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, BookOpen, Users, Target, FileText, Zap,
  MessageSquare, ClipboardList, ChevronDown, ChevronRight,
  Eye, Edit3, ExternalLink, Clock, CheckCircle, TrendingUp,
  GraduationCap, CalendarDays, ArrowRight, Plus, X, Link as LinkIcon,
  FileDown, AlignLeft, Shield, Save, RefreshCw, Trash2, Calendar,
} from 'lucide-react';
import {
  Course, Material, Assignment, Question, Reply, ActiveLearning,
  StudentProfile, StudentCourseVisit, AssignmentSubmission, SiteProfile,
  SemesterSchedule,
} from '../types';
import { DashboardPage } from './DashboardPage';
import { PDPAPrivacyModal } from './PDPAPrivacyModal';
import { StudentLoginLog } from './StudentLoginLog';
import { groupFromVisitId, groupCount, parseGroupCodes } from '../utils/enrollGroups';
import { TeachingPlanTab } from './TeachingPlanTab';

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseSection =
  | 'overview' | 'students' | 'objectives'
  | 'materials' | 'active_learning' | 'qa' | 'assignments' | 'plan';

type BoView =
  | { type: 'dashboard' }
  | { type: 'course'; courseId: string; section: CourseSection }
  | { type: 'pdpa' }
  | { type: 'schedule' }
  | { type: 'logins' };

interface BackOfficeProps {
  courses: Course[];
  materials: Material[];
  assignments: Assignment[];
  questions: Question[];
  replies: Reply[];
  activities: ActiveLearning[];
  reflections: import('../types').TeachingReflection[];
  visits: StudentCourseVisit[];
  loginLogs: StudentCourseVisit[];
  submissions: AssignmentSubmission[];
  students: StudentProfile[];
  siteProfile: SiteProfile;
  onNavigateCourses: () => void;
  onNavigateToCourse: (courseId: string, tab: string) => void;
  onEditCourse: (course: Course) => void;
  onAddCourse: () => void;
  onSavePdpa: (data: Pick<SiteProfile, 'pdpa_purposes' | 'pdpa_retention' | 'pdpa_third_party' | 'pdpa_updated_at' | 'pdpa_effective_date' | 'pdpa_version'>) => Promise<void>;
  semesterSchedules: SemesterSchedule[];
  onSaveSchedules: (schedules: SemesterSchedule[]) => Promise<void>;
  onChangeStudentGroup: (studentId: string, courseId: string, group: number | null) => Promise<void>;
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
  { section: 'plan',           label: 'แผนการสอน',        icon: <Calendar size={12} /> },
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

// ─── Student Detail Modal ─────────────────────────────────────────────────────

const StudentDetailModal: React.FC<{
  studentId: string;
  student: StudentProfile | undefined;
  visits: StudentCourseVisit[];
  submissions: AssignmentSubmission[];
  assignments: Assignment[];
  onClose: () => void;
}> = ({ studentId, student, visits, submissions, assignments, onClose }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cfg = avatarCfg(studentId);
  const name = student
    ? `${student.first_name} ${student.last_name}`.trim() || student.email
    : studentId.slice(0, 8) + '...';
  const visitCount = visits.filter(v => v.student_id === studentId).length;
  const studentGroup = visits.map(v => groupFromVisitId(v.visit_id)).find((g): g is number => g !== null) ?? null;
  const lastVisit = visits
    .filter(v => v.student_id === studentId)
    .sort((a, b) => (b.visited_at || '').localeCompare(a.visited_at || ''))
    .at(0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
              style={{ background: cfg.color }}
            >
              <i className={`fa-solid ${cfg.icon} text-sm`} />
            </div>
            <div>
              <div className="font-extrabold text-sm">{name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {student?.student_id && <span className="font-mono">{student.student_id}</span>}
                {student?.email && <span className="ml-2">{student.email}</span>}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${studentGroup !== null ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-300'}`}>
                  {studentGroup !== null ? `กลุ่ม ${studentGroup}` : 'ไม่ระบุกลุ่ม'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="text-center">
            <div className="text-xl font-extrabold text-blue-600">{visitCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">ครั้งที่เข้าชม</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-extrabold text-emerald-600">{submissions.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">งานที่ส่งแล้ว</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-extrabold text-amber-600">{assignments.length - submissions.length < 0 ? 0 : assignments.length - submissions.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">งานที่ยังไม่ส่ง</div>
          </div>
        </div>

        {/* Assignment list */}
        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <ClipboardList size={13} className="text-slate-400" />
            งานมอบหมายทั้งหมด ({assignments.length} รายการ)
          </p>
          {assignments.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-6">ยังไม่มีงานมอบหมายในวิชานี้</p>
          )}
          {assignments.map(assign => {
            const sub = submissions.find(s => s.assignment_id === assign.assignment_id);
            const isExpanded = expandedId === assign.assignment_id;

            return (
              <div
                key={assign.assignment_id}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  sub
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                {/* Assignment header — clickable when submitted */}
                <div
                  className={`flex items-start justify-between gap-2 p-4 ${sub ? 'cursor-pointer hover:bg-emerald-50 transition-colors' : ''}`}
                  onClick={() => sub && setExpandedId(isExpanded ? null : assign.assignment_id)}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{assign.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">กำหนดส่ง {assign.due_date}</div>
                    {sub?.submitted_at && (
                      <div className="text-[10px] text-emerald-600 mt-0.5">
                        ส่งเมื่อ {new Date(sub.submitted_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sub ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <CheckCircle size={9} />
                      {sub ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}
                    </span>
                    {sub && (
                      <ChevronDown
                        size={13}
                        className={`text-emerald-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    )}
                  </div>
                </div>

                {/* Submission content — expanded only */}
                {sub && isExpanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-emerald-100">
                    {!sub.answer_text && !sub.file_url && !sub.link_url && !sub.note && (
                      <p className="text-[11px] text-slate-400 italic pt-3">ไม่มีเนื้อหาการส่งงาน (อาจส่งผ่านช่องทางอื่น)</p>
                    )}
                    {sub.answer_text && (
                      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 space-y-1 mt-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <AlignLeft size={10} />
                          คำตอบ
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{sub.answer_text}</p>
                      </div>
                    )}
                    {sub.file_url && (() => {
                      const urls: string[] = (() => {
                        try {
                          const p = JSON.parse(sub.file_url!);
                          return Array.isArray(p) ? p.filter(Boolean) : [sub.file_url!];
                        } catch { return [sub.file_url!]; }
                      })();
                      return (
                        <div className="flex flex-wrap gap-2">
                          {urls.map((url, fi) => (
                            <a
                              key={fi}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-3 py-2 transition w-fit"
                            >
                              <FileDown size={12} />
                              ไฟล์ {fi + 1}
                            </a>
                          ))}
                        </div>
                      );
                    })()}
                    {sub.link_url && (
                      <a
                        href={sub.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl px-3 py-2 transition w-fit"
                      >
                        <LinkIcon size={12} />
                        <span className="truncate max-w-[260px]">{sub.link_url}</span>
                      </a>
                    )}
                    {sub.note && (
                      <p className="text-[11px] text-slate-500 italic">หมายเหตุ: {sub.note}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 shrink-0 text-right">
          {lastVisit?.visited_at && (
            <span className="text-[10px] text-slate-400 mr-auto float-left">
              เข้าชมล่าสุด: {new Date(lastVisit.visited_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Student List Section ─────────────────────────────────────────────────────

const StudentsSection: React.FC<{
  course: Course;
  visits: StudentCourseVisit[];
  submissions: AssignmentSubmission[];
  assignments: Assignment[];
  students: StudentProfile[];
  onSelectStudent: (sid: string) => void;
  onChangeGroup: (sid: string, group: number | null) => Promise<void>;
}> = ({ course, visits, submissions, assignments, students, onSelectStudent, onChangeGroup }) => {
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
    const group = courseVisits
      .filter(v => v.student_id === sid)
      .map(v => groupFromVisitId(v.visit_id))
      .find((g): g is number => g !== null) ?? null;
    return { sid, student, visitCount, submissionCount: studentSubmissions.length, studentSubmissions, lastVisit, group };
  }).sort((a, b) => (a.group ?? 999) - (b.group ?? 999));

  const [groupFilter, setGroupFilter] = useState<'all' | 'none' | number>('all');
  const [savingGroupFor, setSavingGroupFor] = useState<string | null>(null);
  const [groupError, setGroupError] = useState('');
  const changeGroup = async (sid: string, value: string) => {
    setSavingGroupFor(sid);
    setGroupError('');
    try {
      await onChangeGroup(sid, value === '' ? null : Number(value));
    } catch (err) {
      setGroupError(`เปลี่ยนกลุ่มไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingGroupFor(null);
    }
  };
  const nGroups = groupCount(course);
  const groupCodes = parseGroupCodes(course.enrollment_code);
  const groupNumbers = Array.from(new Set([
    ...Array.from({ length: nGroups }, (_, i) => i + 1),
    ...rows.map(r => r.group).filter((g): g is number => g !== null),
  ])).sort((a, b) => a - b);
  const hasUngrouped = rows.some(r => r.group === null);
  const visibleRows = rows.filter(r =>
    groupFilter === 'all' ? true : groupFilter === 'none' ? r.group === null : r.group === groupFilter
  );

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
            <span className="text-[10px] text-slate-400 ml-1">— คลิกชื่อเพื่อดูรายละเอียด · เปลี่ยนกลุ่มได้ที่คอลัมน์ "กลุ่ม"</span>
          </div>
          {groupError && <div className="px-5 py-2 text-[11px] text-red-600 font-medium bg-red-50 border-b border-red-100">{groupError}</div>}
          {/* Group filter + codes */}
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-1.5">
            {([['all', `ทั้งหมด (${rows.length})`]] as [typeof groupFilter, string][])
              .concat(groupNumbers.map(g => [g, `กลุ่ม ${g} (${rows.filter(r => r.group === g).length})`] as [typeof groupFilter, string]))
              .concat(hasUngrouped ? [['none', `ไม่ระบุกลุ่ม (${rows.filter(r => r.group === null).length})`] as [typeof groupFilter, string]] : [])
              .map(([key, label]) => (
                <button
                  key={String(key)}
                  onClick={() => setGroupFilter(key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    groupFilter === key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            {groupCodes.some(Boolean) && (
              <span className="ml-auto text-[10px] text-slate-400 flex flex-wrap gap-x-3">
                {groupCodes.map((c, i) => c && (
                  <span key={i}>กลุ่ม {i + 1}: <span className="font-mono font-semibold text-amber-700">{c}</span></span>
                ))}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">#</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">นักศึกษา</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">รหัส</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500">กลุ่ม</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500">เข้าชม (ครั้ง)</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500">ส่งงาน (ครั้ง)</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">งานที่ส่ง</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">เข้าชมล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400 text-xs">ยังไม่มีนักศึกษาในกลุ่มนี้</td></tr>
                )}
                {visibleRows.map(({ sid, student, visitCount, submissionCount, studentSubmissions, lastVisit, group }, i) => {
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
                    <tr key={sid} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors cursor-pointer group" onClick={() => onSelectStudent(sid)}>
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
                            <div className="font-semibold text-indigo-700 group-hover:underline underline-offset-2">{name}</div>
                            <div className="text-[10px] text-slate-400">{email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                        {student?.student_id || '—'}
                      </td>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <select
                          value={group ?? ''}
                          disabled={savingGroupFor === sid}
                          onChange={e => changeGroup(sid, e.target.value)}
                          title="เปลี่ยนกลุ่มของนักศึกษา"
                          className={`text-[11px] font-bold rounded-lg border px-1.5 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 disabled:cursor-wait ${
                            group !== null ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-white text-slate-400 border-slate-200'
                          }`}
                        >
                          <option value="">ไม่ระบุ</option>
                          {Array.from({ length: Math.max(nGroups, group ?? 0) }, (_, k) => k + 1).map(g => (
                            <option key={g} value={g}>กลุ่ม {g}</option>
                          ))}
                        </select>
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
  replies: Reply[];
  activities: ActiveLearning[];
  reflections: import('../types').TeachingReflection[];
  visits: StudentCourseVisit[];
  onEdit: () => void;
  onNavigate: (tab: string) => void;
}> = ({ course, materials, assignments, questions, replies, activities, reflections, visits, onEdit, onNavigate }) => {
  const weeks = course.total_weeks || 15;
  const courseVisits = visits.filter(v => v.course_id === course.course_id);
  const uniqueStudents = new Set(courseVisits.map(v => v.student_id)).size;
  const [exporting, setExporting] = useState(false);

  const handleExport = async (includeImages: boolean) => {
    setExporting(true);
    try {
      const { exportCourseToWord } = await import('../utils/exportCourseWord');
      await exportCourseToWord({
        course,
        materials,
        assignments,
        questions,
        replies,
        activities,
        reflections,
        includeImages,
      });
    } catch (err) {
      alert(`เกิดข้อผิดพลาดในการ export: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  };

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
          <div className="flex items-center gap-2 shrink-0">
            {/* Export dropdown */}
            <div className="relative group">
              <button
                disabled={exporting}
                className="flex items-center gap-1.5 px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl transition disabled:opacity-60"
              >
                <FileDown size={13} />
                {exporting ? 'กำลัง Export...' : 'Export Word'}
                <ChevronDown size={11} />
              </button>
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => handleExport(true)}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-emerald-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <FileDown size={12} className="text-emerald-600" />
                  Export พร้อมรูปภาพ
                </button>
                <button
                  onClick={() => handleExport(false)}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 border-t border-slate-100"
                >
                  <AlignLeft size={12} className="text-slate-500" />
                  Export เฉพาะข้อความ
                </button>
              </div>
            </div>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold rounded-xl transition"
            >
              <Edit3 size={13} />
              แก้ไขวิชา
            </button>
          </div>
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

// ─── PDPA Editor ─────────────────────────────────────────────────────────────

const DEFAULT_PURPOSES_TEXT = [
  'เพื่อยืนยันตัวตนและจัดการบัญชีผู้ใช้งาน',
  'เพื่อบันทึกการเข้าร่วมรายวิชาและติดตามความก้าวหน้าการเรียน',
  'เพื่อรับ-ส่งงานมอบหมายและกิจกรรมการเรียนการสอน',
  'เพื่อปรับปรุงคุณภาพการเรียนการสอนและการพัฒนาระบบ',
  'เพื่อปฏิบัติตามหน้าที่ตามกฎหมายที่เกี่ยวข้องกับการศึกษา',
];

const PDPAEditor: React.FC<{
  siteProfile: SiteProfile;
  onSave: BackOfficeProps['onSavePdpa'];
}> = ({ siteProfile, onSave }) => {
  const parsePurposes = (): string[] => {
    try {
      const p = siteProfile.pdpa_purposes ? JSON.parse(siteProfile.pdpa_purposes) : null;
      return Array.isArray(p) && p.length > 0 ? p : DEFAULT_PURPOSES_TEXT;
    } catch { return DEFAULT_PURPOSES_TEXT; }
  };

  const [purposes, setPurposes] = useState<string[]>(parsePurposes);
  const [retention, setRetention] = useState(
    siteProfile.pdpa_retention ||
    'ข้อมูลจะถูกเก็บรักษาตลอดระยะเวลาที่ท่านมีบัญชีในระบบ หรือตามที่กฎหมายกำหนด หลังสิ้นสุดความจำเป็น ข้อมูลจะถูกลบหรือทำให้ไม่สามารถระบุตัวตนได้'
  );
  const [thirdParty, setThirdParty] = useState(
    siteProfile.pdpa_third_party ||
    'ระบบนี้ใช้บริการ Supabase (ผู้ให้บริการ Cloud Database ที่ผ่านมาตรฐาน SOC 2) เพื่อจัดเก็บข้อมูล และ Google OAuth สำหรับการยืนยันตัวตน ข้อมูลของท่านจะไม่ถูกเปิดเผย ขาย หรือส่งต่อแก่บุคคลที่สามเพื่อวัตถุประสงค์เชิงพาณิชย์'
  );
  const [updatedAt, setUpdatedAt] = useState(siteProfile.pdpa_updated_at || 'มิถุนายน 2026');
  const [effectiveDate, setEffectiveDate] = useState(siteProfile.pdpa_effective_date || '1 มิถุนายน 2026');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const addPurpose = () => setPurposes(prev => [...prev, '']);
  const removePurpose = (i: number) => setPurposes(prev => prev.filter((_, idx) => idx !== i));
  const updatePurpose = (i: number, val: string) =>
    setPurposes(prev => prev.map((p, idx) => idx === i ? val : p));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        pdpa_purposes: JSON.stringify(purposes.filter(p => p.trim())),
        pdpa_retention: retention,
        pdpa_third_party: thirdParty,
        pdpa_updated_at: updatedAt,
        pdpa_effective_date: effectiveDate,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const previewProfile: SiteProfile = {
    ...siteProfile,
    pdpa_purposes: JSON.stringify(purposes),
    pdpa_retention: retention,
    pdpa_third_party: thirdParty,
    pdpa_updated_at: updatedAt,
    pdpa_effective_date: effectiveDate,
  };

  return (
    <div className="space-y-6">
      {showPreview && (
        <PDPAPrivacyModal siteProfile={previewProfile} onClose={() => setShowPreview(false)} />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Shield size={18} className="text-indigo-600" />
            นโยบายความเป็นส่วนตัว (PDPA)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            แก้ไขเนื้อหานโยบายที่แสดงต่อผู้ใช้งาน — บันทึกแล้วมีผลทันที
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
          >
            <Eye size={13} />
            ดูตัวอย่าง
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl transition active:scale-[0.98] disabled:opacity-60 ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว!' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* Metadata row */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">ข้อมูลเอกสาร</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">วันที่ปรับปรุงล่าสุด</label>
            <input
              value={updatedAt}
              onChange={e => setUpdatedAt(e.target.value)}
              placeholder="เช่น มิถุนายน 2026"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">วันที่มีผลบังคับใช้</label>
            <input
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
              placeholder="เช่น 1 มิถุนายน 2026"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-3">
          ข้อมูล ชื่อ อีเมล และมหาวิทยาลัยของผู้ควบคุมข้อมูล ดึงจาก Profile ของอาจารย์โดยอัตโนมัติ
        </p>
      </div>

      {/* Purposes editor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            วัตถุประสงค์การเก็บและใช้ข้อมูล (ข้อ 3)
          </h3>
          <button
            onClick={addPurpose}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 px-3 py-1.5 rounded-lg transition"
          >
            <Plus size={11} />
            เพิ่มวัตถุประสงค์
          </button>
        </div>
        <div className="space-y-2">
          {purposes.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-400 w-5 text-center shrink-0">{i + 1}.</span>
              <input
                value={p}
                onChange={e => updatePurpose(i, e.target.value)}
                placeholder={`วัตถุประสงค์ที่ ${i + 1}`}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => removePurpose(i)}
                disabled={purposes.length <= 1}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Third party */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          การเปิดเผยข้อมูลแก่บุคคลที่สาม (ข้อ 4)
        </h3>
        <textarea
          value={thirdParty}
          onChange={e => setThirdParty(e.target.value)}
          rows={4}
          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
        />
      </div>

      {/* Retention */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          ระยะเวลาการเก็บรักษาข้อมูล (ข้อ 6)
        </h3>
        <textarea
          value={retention}
          onChange={e => setRetention(e.target.value)}
          rows={3}
          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
        />
      </div>

      {/* Info: fixed sections */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
        <p className="text-[11px] text-indigo-700 font-semibold mb-1">ส่วนที่ไม่สามารถแก้ไขผ่านหน้านี้ได้</p>
        <p className="text-[11px] text-indigo-600 leading-relaxed">
          ข้อมูลที่เก็บรวบรวม (ข้อ 2), สิทธิ์เจ้าของข้อมูล (ข้อ 5), และช่องทางติดต่อ (ข้อ 7)
          เป็นข้อมูลคงที่ตามกฎหมาย PDPA — หากต้องการแก้ไข กรุณาติดต่อผู้พัฒนาระบบ
        </p>
      </div>
    </div>
  );
};

// ─── Semester Schedule Editor ─────────────────────────────────────────────────

const TH_MONTHS_FULL = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];

function formatTHDateFull(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${TH_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function calcWeekEnd(iso: string, totalWeeks: number): string {
  if (!iso) return '';
  const d = new Date(iso);
  d.setDate(d.getDate() + totalWeeks * 7 - 1);
  return `${d.getDate()} ${TH_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`;
}

const SemesterScheduleEditor: React.FC<{
  schedules: SemesterSchedule[];
  onSave: (s: SemesterSchedule[]) => Promise<void>;
}> = ({ schedules, onSave }) => {
  const [list, setList] = useState<SemesterSchedule[]>(schedules);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<{ semester_id: number; year: number; week1_start: string; total_weeks: number }>({
    semester_id: 1, year: new Date().getFullYear(), week1_start: '', total_weeks: 16,
  });
  const [formError, setFormError] = useState('');
  const [saveError, setSaveError] = useState('');

  // Schedules arrive from the DB after this page may already be open — keep in sync
  useEffect(() => { setList(schedules); }, [schedules]);

  // Every add / edit / delete is written to the database immediately
  const persist = async (next: SemesterSchedule[]) => {
    const prev = list;
    setList(next);
    setSaving(true);
    setSaveError('');
    try {
      await onSave(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (err) {
      setList(prev);
      setSaveError(`บันทึกไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!form.week1_start) { setFormError('กรุณาเลือกวันที่เริ่มต้นสัปดาห์ที่ 1'); return; }
    setFormError('');
    // Same semester/year already set → replace it (edit) instead of refusing
    const next = [
      ...list.filter(s => !(Number(s.semester_id) === form.semester_id && Number(s.year) === form.year)),
      { ...form },
    ];
    if (await persist(next)) setForm(f => ({ ...f, week1_start: '' }));
  };

  const handleEdit = (s: SemesterSchedule) => {
    setForm({ semester_id: Number(s.semester_id), year: Number(s.year), week1_start: s.week1_start, total_weeks: s.total_weeks });
    setFormError('');
  };

  const handleDelete = (idx: number) => {
    const s = list[idx];
    if (!window.confirm(`ลบการตั้งค่าภาคเรียน ${s.semester_id}/${s.year} ?`)) return;
    persist(list.filter((_, i) => i !== idx));
  };

  const handleSave = () => persist(list);

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            ตารางการสอน — วันเริ่มต้นแต่ละภาคเรียน
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดวันที่เริ่มสัปดาห์ที่ 1 ระบบจะคำนวณช่วงวันที่ครบทุกสัปดาห์อัตโนมัติ
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl transition active:scale-[0.98] disabled:opacity-60 text-white ${
            saved ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว!' : 'บันทึก'}
        </button>
      </div>

      {/* Add form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">เพิ่มภาคการศึกษาใหม่</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ภาคเรียนที่</label>
            <select
              value={form.semester_id}
              onChange={e => setForm(f => ({ ...f, semester_id: Number(e.target.value) }))}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>ภาคเรียนที่ 1</option>
              <option value={2}>ภาคเรียนที่ 2</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ปีการศึกษา</label>
            <select
              value={form.year}
              onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">วันแรกสัปดาห์ที่ 1</label>
            <input
              type="date"
              value={form.week1_start}
              onChange={e => { setForm(f => ({ ...f, week1_start: e.target.value })); setFormError(''); }}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">จำนวนสัปดาห์</label>
            <input
              type="number"
              min={8} max={20}
              value={form.total_weeks}
              onChange={e => setForm(f => ({ ...f, total_weeks: Math.max(8, Math.min(20, Number(e.target.value))) }))}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        {form.week1_start && (
          <p className="text-[10px] text-slate-500 mb-3">
            สิ้นสุดสัปดาห์ที่ {form.total_weeks}: <span className="font-semibold text-slate-700">{calcWeekEnd(form.week1_start, form.total_weeks)}</span>
          </p>
        )}
        {formError && <p className="text-[11px] text-red-600 font-medium mb-3">{formError}</p>}
        <button
          onClick={handleAdd}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition active:scale-[0.98] disabled:opacity-60"
        >
          <Plus size={13} />
          {list.some(s => Number(s.semester_id) === form.semester_id && Number(s.year) === form.year)
            ? `บันทึกการแก้ไขภาค ${form.semester_id}/${form.year}`
            : 'เพิ่มและบันทึกภาคการศึกษา'}
        </button>
        {saveError && <p className="text-[11px] text-red-600 font-medium mt-3">{saveError}</p>}
      </div>

      {/* Schedule list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
          ภาคการศึกษาที่กำหนดแล้ว ({list.length})
        </div>
        {list.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-slate-400">ยังไม่มีการตั้งค่า</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {[...list].sort((a, b) => b.year - a.year || b.semester_id - a.semester_id).map((s, i) => {
              const origIdx = list.indexOf(s);
              return (
                <div key={i} className="flex items-center px-5 py-3.5 gap-4 hover:bg-slate-50 transition">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">
                      ภาคเรียนที่ {s.semester_id}/{s.year}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      สัปดาห์ที่ 1: <span className="font-semibold text-slate-700">{formatTHDateFull(s.week1_start)}</span>
                      &nbsp;·&nbsp;
                      สิ้นสุด: <span className="font-semibold text-slate-700">{calcWeekEnd(s.week1_start, s.total_weeks)}</span>
                      &nbsp;·&nbsp;{s.total_weeks} สัปดาห์
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(s)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="แก้ไข"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(origIdx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="ลบ"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-[11px] text-blue-700 font-semibold mb-1">วิธีใช้งาน</p>
        <ul className="text-[11px] text-blue-600 space-y-1 leading-relaxed">
          <li>• ตั้งค่า "วันแรกสัปดาห์ที่ 1" ให้ตรงกับวันเปิดภาคแต่ละรายวิชาในมหาวิทยาลัย</li>
          <li>• ระบบจะคำนวณช่วงวันทุกสัปดาห์ให้อัตโนมัติ และแสดงในแท็บ "แผนการสอน" ของทุกวิชาในภาคนั้น</li>
          <li>• หัวข้อแต่ละสัปดาห์ดึงมาจากชื่อเอกสารประกอบการสอนที่กำหนด week_number ไว้</li>
        </ul>
      </div>
    </div>
  );
};

// ─── Main BackOffice ──────────────────────────────────────────────────────────

export const BackOffice: React.FC<BackOfficeProps> = ({
  courses, materials, assignments, questions, replies, activities, reflections,
  visits, loginLogs, submissions, students, siteProfile,
  onNavigateCourses, onNavigateToCourse, onEditCourse, onAddCourse, onSavePdpa,
  semesterSchedules, onSaveSchedules, onChangeStudentGroup,
}) => {
  const [view, setView] = useState<BoView>({ type: 'dashboard' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailStudent, setDetailStudent] = useState<{ sid: string; courseId: string } | null>(null);

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
          onSelectCourse={(id, section) => {
            setExpandedId(id);
            setView({ type: 'course', courseId: id, section: (section as CourseSection) || 'overview' });
          }}
        />
      );
    }
    if (view.type === 'pdpa') {
      return <PDPAEditor siteProfile={siteProfile} onSave={onSavePdpa} />;
    }
    if (view.type === 'schedule') {
      return <SemesterScheduleEditor schedules={semesterSchedules} onSave={onSaveSchedules} />;
    }
    if (view.type === 'logins') {
      return <StudentLoginLog students={students} loginLogs={loginLogs} />;
    }
    if (!currentCourse) return null;
    const { courseId, section } = view;
    const cMaterials = materials.filter(m => m.course_id === courseId);
    const cAssignments = assignments.filter(a => a.course_id === courseId);
    const cQuestions = questions.filter(q => q.course_id === courseId);
    const cActivities = activities.filter(a => a.course_id === courseId);

    const cReplies = replies.filter(r => cQuestions.some(q => q.question_id === r.question_id));
    const cReflections = reflections.filter(r => r.course_id === courseId);

    if (section === 'overview') return (
      <CourseOverview
        course={currentCourse}
        materials={cMaterials} assignments={cAssignments}
        questions={cQuestions} replies={cReplies}
        activities={cActivities}
        reflections={cReflections}
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
        onSelectStudent={(sid) => setDetailStudent({ sid, courseId })}
        onChangeGroup={(sid, g) => onChangeStudentGroup(sid, courseId, g)}
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

    if (section === 'plan') return (
      <TeachingPlanTab
        course={currentCourse}
        materials={cMaterials}
        activities={cActivities}
        assignments={cAssignments}
        semesterSchedules={semesterSchedules}
      />
    );

    return null;
  };

  const modalStudent = detailStudent ? students.find(s => s.id === detailStudent.sid) : undefined;
  const modalVisits = detailStudent ? visits.filter(v => v.course_id === detailStudent.courseId && v.student_id === detailStudent.sid) : [];
  const modalSubmissions = detailStudent ? submissions.filter(s => s.course_id === detailStudent.courseId && s.student_id === detailStudent.sid) : [];
  const modalAssignments = detailStudent ? assignments.filter(a => a.course_id === detailStudent.courseId) : [];

  return (
    <>
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

          {/* PDPA Settings */}
          <button
            onClick={() => { setView({ type: 'pdpa' }); setExpandedId(null); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              view.type === 'pdpa'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Shield size={14} />
            นโยบาย PDPA
          </button>

          {/* Semester Schedule */}
          <button
            onClick={() => { setView({ type: 'schedule' }); setExpandedId(null); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              view.type === 'schedule'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            ตารางการสอน
          </button>

          {/* Student log-in history */}
          <button
            onClick={() => { setView({ type: 'logins' }); setExpandedId(null); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              view.type === 'logins'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Clock size={14} />
            การเข้าใช้งานของนักศึกษา
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
          {view.type === 'pdpa' && (
            <><ChevronRight size={12} /><Shield size={12} className="text-indigo-500" /><span className="font-semibold text-slate-700">นโยบาย PDPA</span></>
          )}
          {view.type === 'schedule' && (
            <><ChevronRight size={12} /><Calendar size={12} className="text-indigo-500" /><span className="font-semibold text-slate-700">ตารางการสอน</span></>
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

    {detailStudent && (
      <StudentDetailModal
        studentId={detailStudent.sid}
        student={modalStudent}
        visits={modalVisits}
        submissions={modalSubmissions}
        assignments={modalAssignments}
        onClose={() => setDetailStudent(null)}
      />
    )}
    </>
  );
};
