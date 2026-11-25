import React, { useState } from 'react';
import { AssignmentAttachments } from './AssignmentAttachments';
import {
  User, BookOpen, FileText, Video, ExternalLink, ChevronRight,
  ArrowLeft, Layers, GraduationCap, Mail, IdCard, Edit, Save,
  X, LogOut, AlertCircle, CheckCircle2, Clock, Paperclip,
  Check, Circle, Presentation, Zap, Timer,
} from 'lucide-react';
import {
  StudentProfile, Course, Material, Assignment,
  StudentCourseVisit, AssignmentSubmission, MaterialType, ActiveLearning,
} from '../types';
import { supabase } from '@/lib/supabase';
import { studentGroupInCourse } from '../utils/enrollGroups';

// ─── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_ICONS = [
  'fa-user-graduate', 'fa-user-astronaut', 'fa-user-ninja',
  'fa-user-secret',  'fa-user-tie',       'fa-robot',
  'fa-ghost',        'fa-cat',            'fa-dragon',
  'fa-frog',         'fa-crow',           'fa-horse',
  'fa-otter',        'fa-fish',           'fa-dove',
];
const AVATAR_COLORS = [
  { from: '#7C3AED', to: '#6D28D9' }, { from: '#059669', to: '#0F766E' },
  { from: '#2563EB', to: '#4338CA' }, { from: '#DB2777', to: '#BE185D' },
  { from: '#D97706', to: '#B45309' }, { from: '#0891B2', to: '#0369A1' },
  { from: '#DC2626', to: '#B91C1C' }, { from: '#65A30D', to: '#4D7C0F' },
];

function getAvatarConfig(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const abs = Math.abs(hash);
  return {
    icon: AVATAR_ICONS[abs % AVATAR_ICONS.length],
    color: AVATAR_COLORS[(abs >> 4) % AVATAR_COLORS.length],
  };
}

// ─── Icon helpers ──────────────────────────────────────────────────────────────

function MatIcon({ type }: { type: MaterialType }) {
  if (type === 'slides')   return <Presentation size={16} className="text-amber-500 shrink-0" />;
  if (type === 'video')    return <Video        size={16} className="text-rose-500  shrink-0" />;
  if (type === 'document') return <FileText     size={16} className="text-blue-500  shrink-0" />;
  return                          <ExternalLink size={16} className="text-indigo-500 shrink-0" />;
}

function AssignmentStatusBadge({ status }: { status: string }) {
  if (status === 'open')
    return <span className="text-[10px] font-bold border px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border-emerald-100">เปิดรับ</span>;
  if (status === 'closed')
    return <span className="text-[10px] font-bold border px-2 py-0.5 rounded-full bg-red-50 text-red-700 border-red-100">ปิดรับ</span>;
  return <span className="text-[10px] font-bold border px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border-amber-100">เร็ว ๆ นี้</span>;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type SidebarSection = 'info' | 'my-courses';
type CourseTab      = 'objectives' | 'materials' | 'assignments' | 'active_learning';

interface Props {
  studentProfile: StudentProfile;
  courses:     Course[];
  materials:   Material[];
  assignments: Assignment[];
  activities:  ActiveLearning[];
  visits:      StudentCourseVisit[];
  submissions: AssignmentSubmission[];
  onUpdate: (updated: StudentProfile) => void;
  onLogout: () => void;
}

// ─── Main component ────────────────────────────────────────────────────────────

export const StudentProfilePage: React.FC<Props> = ({
  studentProfile, courses, materials, assignments, activities, visits, submissions,
  onUpdate, onLogout,
}) => {
  const needsCompletion = !studentProfile.student_id;
  const avatarConfig    = getAvatarConfig(studentProfile.id);

  // Sidebar + drill-down state
  const [section,          setSection]          = useState<SidebarSection>(needsCompletion ? 'info' : 'info');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseTab,        setCourseTab]        = useState<CourseTab>('objectives');

  // Profile edit state
  const [editing, setEditing] = useState(needsCompletion);
  const [imgError, setImgError] = useState(false);
  const [form, setForm] = useState({
    student_id: studentProfile.student_id,
    first_name: studentProfile.first_name,
    last_name:  studentProfile.last_name,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ── derived data ──
  const displayName = studentProfile.first_name || studentProfile.last_name
    ? `${studentProfile.first_name} ${studentProfile.last_name}`.trim()
    : 'ยังไม่ได้กรอกชื่อ';

  const myVisitedCourseIds = [...new Set(
    visits.filter(v => v.student_id === studentProfile.id).map(v => v.course_id)
  )];
  const myCourses = courses.filter(c => myVisitedCourseIds.includes(c.course_id));

  const activeCourse      = selectedCourseId ? courses.find(c => c.course_id === selectedCourseId) : null;
  const courseMaterials   = materials.filter(m => m.course_id === selectedCourseId);
  const courseAssignments = assignments.filter(a => a.course_id === selectedCourseId);
  const courseActivities  = activities.filter(a => a.course_id === selectedCourseId);
  const mySubmittedIds   = new Set(
    submissions
      .filter(s => s.student_id === studentProfile.id && s.course_id === selectedCourseId)
      .map(s => s.assignment_id)
  );

  // ── save profile ──
  const handleSave = async () => {
    if (!form.student_id.trim() || !form.first_name.trim() || !form.last_name.trim()) {
      setFormError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    setSaving(true);
    setFormError('');
    const updateData = {
      student_id: form.student_id.trim(),
      first_name: form.first_name.trim(),
      last_name:  form.last_name.trim(),
    };
    const { error } = await supabase.from('students').update(updateData).eq('id', studentProfile.id);
    if (error) { setFormError(error.message); setSaving(false); return; }
    onUpdate({ ...studentProfile, ...updateData });
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setForm({ student_id: studentProfile.student_id, first_name: studentProfile.first_name, last_name: studentProfile.last_name });
    setFormError('');
    setEditing(false);
  };

  // ─── Sidebar nav item ────────────────────────────────────────────────────────

  const NavItem = ({
    icon: Icon, label, active, badge, onClick,
  }: { icon: React.ElementType; label: string; active: boolean; badge?: number; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
        active
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
      }`}
    >
      <Icon size={15} className={active ? 'text-indigo-600' : 'text-slate-400'} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {badge}
        </span>
      )}
    </button>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* ── Left Sidebar ── */}
        <aside className="w-full md:w-60 shrink-0">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm sticky top-24">

            {/* Avatar header */}
            <div
              className="p-5 text-center space-y-2"
              style={{ background: `linear-gradient(135deg, ${avatarConfig.color.from}, ${avatarConfig.color.to})` }}
            >
              {studentProfile.avatar_url && !imgError ? (
                <img
                  src={studentProfile.avatar_url}
                  alt={displayName}
                  onError={() => setImgError(true)}
                  className="w-14 h-14 rounded-2xl border-2 border-white/30 object-cover mx-auto"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center mx-auto">
                  <i className={`fa-solid ${avatarConfig.icon} text-white text-xl`} />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-white leading-tight">{displayName}</p>
                {studentProfile.student_id && (
                  <p className="text-[10px] text-white/70 mt-0.5">{studentProfile.student_id}</p>
                )}
              </div>
            </div>

            {/* Nav items */}
            <div className="p-3 space-y-1">
              <NavItem
                icon={User}
                label="ข้อมูลของฉัน"
                active={section === 'info'}
                onClick={() => { setSection('info'); setSelectedCourseId(null); }}
              />
              <NavItem
                icon={BookOpen}
                label="วิชาของฉัน"
                active={section === 'my-courses'}
                badge={myCourses.length}
                onClick={() => { setSection('my-courses'); setSelectedCourseId(null); }}
              />
            </div>

            {/* Logout */}
            <div className="px-3 pb-3 border-t border-slate-100 pt-2">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100"
              >
                <LogOut size={13} />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── Section: ข้อมูลของฉัน ── */}
          {section === 'info' && (
            <>
              {needsCompletion && !editing && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">กรุณากรอกข้อมูลส่วนตัวให้ครบ</p>
                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                      อาจารย์ต้องการข้อมูลนี้เพื่อระบุตัวตนของนักศึกษา
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <User size={15} className="text-indigo-500" />
                    ข้อมูลส่วนตัว
                  </h2>
                  {!editing && (
                    <button
                      onClick={() => { setEditing(true); setForm({ student_id: studentProfile.student_id, first_name: studentProfile.first_name, last_name: studentProfile.last_name }); }}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                    >
                      <Edit size={12} />
                      แก้ไข
                    </button>
                  )}
                </div>

                <div className="p-6">
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">รหัสนักศึกษา <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={form.student_id}
                          onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                          placeholder="เช่น 6401234567890"
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">ชื่อ <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={form.first_name}
                            onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                            placeholder="ชื่อ"
                            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">นามสกุล <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={form.last_name}
                            onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                            placeholder="นามสกุล"
                            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                      </div>
                      {formError && (
                        <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formError}
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition active:scale-[0.98] disabled:opacity-50"
                        >
                          <Save size={13} />
                          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                        {!needsCompletion && (
                          <button
                            onClick={handleCancel}
                            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
                          >
                            <X size={13} />
                            ยกเลิก
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <InfoRow icon={<IdCard size={14} className="text-indigo-500" />} label="รหัสนักศึกษา" value={studentProfile.student_id || '—'} />
                      <InfoRow icon={<User size={14} className="text-indigo-500" />} label="ชื่อ-นามสกุล" value={studentProfile.first_name || studentProfile.last_name ? displayName : '—'} />
                      <InfoRow icon={<Mail size={14} className="text-indigo-500" />} label="อีเมล" value={studentProfile.email} />
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-black text-indigo-700">{myCourses.length}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">วิชาที่เข้าร่วม</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-black text-emerald-600">
                    {submissions.filter(s => s.student_id === studentProfile.id).length}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">งานที่ส่งแล้ว</p>
                </div>
              </div>
            </>
          )}

          {/* ── Section: วิชาของฉัน — list ── */}
          {section === 'my-courses' && !selectedCourseId && (
            <>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-600" />
                <h2 className="text-base font-black text-slate-800">วิชาของฉัน</h2>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                  {myCourses.length} วิชา
                </span>
              </div>

              {myCourses.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <GraduationCap size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">ยังไม่มีวิชาที่เข้าร่วม</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                      กลับไปหน้าหลักแล้วคลิกเข้าดูวิชาที่สนใจเพื่อเริ่มเรียน
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {myCourses.map(course => {
                    const cMaterials   = materials.filter(m => m.course_id === course.course_id).length;
                    const cAssignments = assignments.filter(a => a.course_id === course.course_id).length;
                    const submitted    = submissions.filter(
                      s => s.student_id === studentProfile.id && s.course_id === course.course_id
                    ).length;
                    return (
                      <button
                        key={course.course_id}
                        onClick={() => { setSelectedCourseId(course.course_id); setCourseTab('objectives'); }}
                        className="w-full text-left bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              <GraduationCap size={18} className="text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                                  {course.course_code}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {course.semester_id}/{course.year}
                                </span>
                                {(() => {
                                  const g = studentGroupInCourse(visits, studentProfile.id, course.course_id);
                                  return g !== null && (
                                    <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                                      กลุ่ม {g}
                                    </span>
                                  );
                                })()}
                              </div>
                              <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-1">
                                {course.course_name_th}
                              </p>
                              <p className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                                {course.course_name_en}
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-[10px] font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Layers size={11} className="text-blue-400" />
                            {cMaterials} สื่อ
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText size={11} className="text-pink-400" />
                            {cAssignments} งาน
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Check size={11} />
                            ส่งแล้ว {submitted}/{cAssignments}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Section: วิชาของฉัน — course detail ── */}
          {section === 'my-courses' && selectedCourseId && activeCourse && (
            <>
              {/* Back + header */}
              <button
                onClick={() => setSelectedCourseId(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition"
              >
                <ArrowLeft size={13} />
                กลับไปรายวิชาของฉัน
              </button>

              {/* Course hero */}
              <div className="bg-linear-to-tr from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-4xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-2.5 py-0.5 rounded-full">
                      {activeCourse.course_code}
                    </span>
                    <span className="text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10 px-2.5 py-0.5 rounded-full">
                      เทอม {activeCourse.semester_id}/{activeCourse.year}
                    </span>
                    {activeCourse.section && (
                      <span className="text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10 px-2.5 py-0.5 rounded-full">
                        Sec {activeCourse.section}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                    {activeCourse.course_name_th}
                  </h2>
                  <p className="text-xs text-indigo-200 italic font-medium uppercase tracking-wide">
                    {activeCourse.course_name_en}
                  </p>
                  {activeCourse.credit && (
                    <p className="text-[11px] text-slate-400">{activeCourse.credit} หน่วยกิต</p>
                  )}
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
                {([
                  { key: 'objectives',     label: 'วัตถุประสงค์',  icon: CheckCircle2 },
                  { key: 'materials',      label: 'เอกสารประกอบ',  icon: Layers },
                  { key: 'assignments',    label: 'งานมอบหมาย',    icon: FileText },
                  { key: 'active_learning', label: 'Active Learning', icon: Zap },
                ] as { key: CourseTab; label: string; icon: React.ElementType }[]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setCourseTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-2 rounded-xl transition whitespace-nowrap min-w-fit ${
                      courseTab === tab.key
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab: วัตถุประสงค์ */}
              {courseTab === 'objectives' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                  <h3 className="text-sm font-black text-slate-800">คำอธิบายรายวิชา</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {activeCourse.description || 'ไม่มีคำอธิบายรายวิชา'}
                  </p>

                  {activeCourse.objectives && activeCourse.objectives.length > 0 && (
                    <>
                      <h3 className="text-sm font-black text-slate-800 pt-2 border-t border-slate-100">
                        วัตถุประสงค์การเรียนรู้ (CLOs)
                      </h3>
                      <ul className="space-y-3">
                        {activeCourse.objectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-3 border-l-2 border-indigo-100 pl-3 py-1">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md shrink-0 mt-0.5">
                              CLO{i + 1}
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed">{obj}</p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {activeCourse.theory_hours || activeCourse.practice_hours ? (
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                      <MetaCard label="ทฤษฏี/สัปดาห์"  value={`${activeCourse.theory_hours ?? 0} ชม.`}  color="indigo" />
                      <MetaCard label="ปฏิบัติ/สัปดาห์" value={`${activeCourse.practice_hours ?? 0} ชม.`} color="emerald" />
                      <MetaCard label="จำนวนสัปดาห์"    value={`${activeCourse.total_weeks ?? 15} สัปดาห์`} color="violet" />
                    </div>
                  ) : null}
                </div>
              )}

              {/* Tab: เอกสารประกอบ */}
              {courseTab === 'materials' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Layers size={15} className="text-indigo-500" />
                    สื่อการเรียนการสอน
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                      {courseMaterials.length} รายการ
                    </span>
                  </h3>

                  {courseMaterials.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                      <Layers size={22} className="mx-auto" />
                      <p className="text-xs">ยังไม่มีสื่อการเรียนในวิชานี้</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...courseMaterials]
                        .sort((a, b) => (a.week_number ?? 0) - (b.week_number ?? 0))
                        .map(mat => (
                          <div key={mat.material_id} className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 bg-slate-50/40 hover:bg-slate-50 transition">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                                <MatIcon type={mat.type} />
                              </div>
                              <div>
                                {mat.week_number && (
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    สัปดาห์ที่ {mat.week_number}
                                  </span>
                                )}
                                <p className="text-xs font-bold text-slate-800 mt-1 leading-snug">{mat.title}</p>
                                {mat.description && (
                                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{mat.description}</p>
                                )}
                              </div>
                            </div>
                            <a
                              href={mat.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-100 transition shrink-0"
                            >
                              เปิด
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: งานมอบหมาย */}
              {courseTab === 'assignments' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <FileText size={15} className="text-pink-500" />
                      งานมอบหมาย
                      <span className="text-[10px] font-bold bg-pink-50 text-pink-600 border border-pink-100 px-2 py-0.5 rounded-full">
                        {courseAssignments.length} รายการ
                      </span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ส่งแล้ว {mySubmittedIds.size}/{courseAssignments.length}
                    </span>
                  </div>

                  {courseAssignments.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                      <FileText size={22} className="mx-auto" />
                      <p className="text-xs">ยังไม่มีงานมอบหมายในวิชานี้</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courseAssignments.map(assign => {
                        const submitted = mySubmittedIds.has(assign.assignment_id);
                        const mySub = submissions.find(
                          s => s.student_id === studentProfile.id && s.assignment_id === assign.assignment_id
                        );
                        return (
                          <div
                            key={assign.assignment_id}
                            className={`border rounded-2xl p-4 space-y-2.5 transition ${
                              submitted
                                ? 'border-emerald-200 bg-emerald-50/30'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                  submitted
                                    ? 'bg-emerald-100 border-emerald-200 text-emerald-600'
                                    : 'bg-slate-100 border-slate-200 text-slate-400'
                                }`}>
                                  {submitted ? <Check size={14} /> : <Circle size={14} />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800 leading-snug">{assign.title}</p>
                                  {assign.description && (
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                      {assign.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0 flex flex-col items-end gap-1.5">
                                <AssignmentStatusBadge status={assign.status} />
                                {submitted ? (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                    ✓ ส่งแล้ว
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                    ยังไม่ส่ง
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-medium pl-11">
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                กำหนดส่ง: {assign.due_date}
                              </span>
                              <AssignmentAttachments raw={assign.attachment_url} variant="compact" />
                              {submitted && mySub?.submitted_at && (
                                <span className="text-emerald-600 font-bold">
                                  ส่งเมื่อ: {new Date(mySub.submitted_at).toLocaleDateString('th-TH', {
                                    day: 'numeric', month: 'short', year: '2-digit',
                                    hour: '2-digit', minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {/* Tab: Active Learning */}
              {courseTab === 'active_learning' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Zap size={15} className="text-green-500" />
                    กิจกรรม Active Learning
                    <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">
                      {courseActivities.length} กิจกรรม
                    </span>
                  </h3>

                  {courseActivities.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                      <Zap size={22} className="mx-auto" />
                      <p className="text-xs">ยังไม่มีกิจกรรม Active Learning ในวิชานี้</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courseActivities.map((act, idx) => (
                        <div key={act.activity_id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 hover:bg-slate-50 transition space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0 text-green-700 font-black text-xs">
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 leading-snug">{act.title}</p>
                                {act.type_id && (
                                  <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md">
                                    {act.type_id}
                                  </span>
                                )}
                              </div>
                            </div>
                            {act.duration && (
                              <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
                                <Timer size={10} />
                                {act.duration}
                              </span>
                            )}
                          </div>

                          {act.description && (
                            <p className="text-[11px] text-slate-600 leading-relaxed pl-11 whitespace-pre-line">
                              {act.description}
                            </p>
                          )}

                          {act.file_url && (
                            <div className="pl-11 flex flex-wrap gap-1.5">
                              {(() => {
                                try {
                                  const p = JSON.parse(act.file_url!);
                                  return Array.isArray(p) ? p.filter(Boolean) : [act.file_url!];
                                } catch { return [act.file_url!]; }
                              })().map((url: string, fi: number) => (
                                <a
                                  key={fi}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-100 px-2.5 py-1 rounded-lg transition"
                                >
                                  <Paperclip size={11} />
                                  ไฟล์ {fi + 1}
                                  <ExternalLink size={10} />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Small helper sub-components ──────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 font-medium">{label}</p>
        <p className="text-xs font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function MetaCard({ label, value, color }: { label: string; value: string; color: 'indigo' | 'emerald' | 'violet' }) {
  const cls: Record<string, string> = {
    indigo:  'bg-indigo-50  border-indigo-100  text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    violet:  'bg-violet-50  border-violet-100  text-violet-700',
  };
  return (
    <div className={`border rounded-2xl p-3 text-center ${cls[color]}`}>
      <p className="text-sm font-black">{value}</p>
      <p className="text-[10px] font-bold opacity-70 mt-0.5">{label}</p>
    </div>
  );
}
