import React, { useState } from 'react';
import {
  ArrowLeft, Eye, MessageCircle, Zap, BookOpen,
  Users, TrendingUp, FileText, BarChart2, ChevronRight,
  GraduationCap, Info, X, Timer, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Course, Material, Assignment, Question, ActiveLearning,
  Reply, ActiveLearningType, AL_TYPES, StudentCourseVisit, StudentProfile
} from '../types';

interface DashboardProps {
  courses: Course[];
  materials: Material[];
  assignments: Assignment[];
  questions: Question[];
  activities: ActiveLearning[];
  replies: Reply[];
  visits: StudentCourseVisit[];
  allStudents: StudentProfile[];
  onNavigateCourses: () => void;
  onSelectCourse: (courseId: string) => void;
}

const MetricCard = ({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) => (
  <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div className="text-2xl font-black text-slate-900">{value.toLocaleString()}</div>
    <div className="text-xs font-semibold text-slate-600">{label}</div>
    {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
  </div>
);

export const DashboardPage: React.FC<DashboardProps> = ({
  courses, materials, assignments, questions, activities, replies,
  visits, allStudents,
  onNavigateCourses, onSelectCourse
}) => {
  const currentYear = new Date().getFullYear();
  const [filterSem, setFilterSem] = useState<number | 'all'>('all');
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [detailType, setDetailType] = useState<ActiveLearningType | null>(null);

  const years = Array.from(new Set([currentYear, ...courses.map(c => c.year)])).sort((a, b) => b - a);

  const filteredCourses = courses.filter(c => {
    const semOk = filterSem === 'all' || c.semester_id === filterSem;
    const yearOk = c.year === filterYear;
    return semOk && yearOk;
  });

  // Metrics
  const totalViews = filteredCourses.reduce((s, c) => s + (c.views || 0), 0);
  const courseIds = filteredCourses.map(c => c.course_id);

  // Enrolled students: distinct student_id per course (first-time visit only)
  const enrolledSetByCourse: Record<string, Set<string>> = {};
  visits.forEach(v => {
    if (!courseIds.includes(v.course_id) || !v.student_id) return;
    if (!enrolledSetByCourse[v.course_id]) enrolledSetByCourse[v.course_id] = new Set();
    enrolledSetByCourse[v.course_id].add(v.student_id);
  });
  const enrolledByCourse: Record<string, number> = {};
  for (const [cid, s] of Object.entries(enrolledSetByCourse)) enrolledByCourse[cid] = s.size;

  const allEnrolledIds = new Set<string>();
  Object.values(enrolledSetByCourse).forEach(s => s.forEach(id => allEnrolledIds.add(id)));
  const totalEnrolledStudents = allEnrolledIds.size;
  const filteredQ = questions.filter(q => courseIds.includes(q.course_id));
  const filteredAct = activities.filter(a => courseIds.includes(a.course_id));
  const filteredMat = materials.filter(m => courseIds.includes(m.course_id));
  const filteredAss = assignments.filter(a => courseIds.includes(a.course_id));
  const totalTheoryHours = filteredCourses.reduce((s, c) => s + (c.theory_hours || 0) * (c.total_weeks || 15), 0);
  const totalPracticeHours = filteredCourses.reduce((s, c) => s + (c.practice_hours || 0) * (c.total_weeks || 15), 0);

  // AL type breakdown
  const alBreakdown = AL_TYPES.map(t => ({
    type: t,
    count: filteredAct.filter(a => a.type_id === t.type_id).length,
  })).filter(b => b.count > 0).sort((a, b) => b.count - a.count);

  const maxAlCount = Math.max(...alBreakdown.map(b => b.count), 1);

  // Answered questions
  const answeredCount = filteredQ.filter(q =>
    replies.some(r => r.question_id === q.question_id)
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-600" />
            Dashboard สรุปภาพรวมการสอน
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">ข้อมูลสรุปจากฐานข้อมูลจริง — อัปเดตทันที</p>
        </div>
        <button onClick={onNavigateCourses} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm transition-colors">
          <ArrowLeft size={13} />
          <span>กลับหน้าหลัก</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <span className="text-xs font-bold text-slate-600">กรองข้อมูล:</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">ภาคการศึกษา:</span>
          <select
            value={filterSem}
            onChange={e => setFilterSem(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 select-chevron"
          >
            <option value="all">ทุกภาค</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>ภาคฤดูร้อน</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">ปีการศึกษา:</span>
          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 select-chevron"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <span className="text-[11px] text-slate-400 ml-auto">{filteredCourses.length} รายวิชา</span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          icon={<GraduationCap size={18} className="text-indigo-600" />}
          label="รายวิชาที่เปิดสอน"
          value={filteredCourses.length}
          sub={`เอกสาร ${filteredMat.length} ชิ้น`}
          color="bg-indigo-50"
        />
        <MetricCard
          icon={<Users size={18} className="text-violet-600" />}
          label="ผู้เรียนทั้งหมด"
          value={totalEnrolledStudents}
          sub={`ลงทะเบียน ${allStudents.length} คน`}
          color="bg-violet-50"
        />
        <MetricCard
          icon={<Eye size={18} className="text-emerald-600" />}
          label="ยอดเข้าชมทั้งหมด"
          value={totalViews}
          sub={`เฉลี่ย ${filteredCourses.length ? Math.round(totalViews / filteredCourses.length) : 0} ต่อวิชา`}
          color="bg-emerald-50"
        />
        <MetricCard
          icon={<MessageCircle size={18} className="text-amber-600" />}
          label="คำถามทั้งหมด"
          value={filteredQ.length}
          sub={`ตอบแล้ว ${answeredCount} / รอตอบ ${filteredQ.length - answeredCount}`}
          color="bg-amber-50"
        />
        <MetricCard
          icon={<Zap size={18} className="text-green-600" />}
          label="กิจกรรม Active Learning"
          value={filteredAct.length}
          sub={`${alBreakdown.length} เทคนิคที่ใช้`}
          color="bg-green-50"
        />
        <MetricCard
          icon={<Timer size={18} className="text-blue-600" />}
          label="ชั่วโมงสอนรวม"
          value={totalTheoryHours + totalPracticeHours}
          sub={`ทฤษฏี ${totalTheoryHours} / ปฏิบัติ ${totalPracticeHours} ชม.`}
          color="bg-blue-50"
        />
      </div>

      {/* Course list + AL breakdown (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course list table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-600" />
              รายวิชาที่เปิดสอน
            </h3>
            {filteredCourses.length > 0 && (
              <button
                onClick={() => {
                  const rows = filteredCourses
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .map(course => {
                      const weeks = course.total_weeks || 15;
                      return {
                        'รหัสวิชา': course.course_code,
                        'ชื่อวิชา (ไทย)': course.course_name_th,
                        'ชื่อวิชา (อังกฤษ)': course.course_name_en,
                        'หน่วยกิต': course.credit || '',
                        'กลุ่มสอน': course.section || '',
                        'ภาค': course.semester_id,
                        'ปีการศึกษา': course.year,
                        'ทฤษฏี (ชม./สัปดาห์)': course.theory_hours ?? 0,
                        'ปฏิบัติ (ชม./สัปดาห์)': course.practice_hours ?? 0,
                        'จำนวนสัปดาห์': weeks,
                        'รวมทฤษฏีทั้งภาค (ชม.)': (course.theory_hours ?? 0) * weeks,
                        'รวมปฏิบัติทั้งภาค (ชม.)': (course.practice_hours ?? 0) * weeks,
                        'รวมชั่วโมงทั้งหมด': ((course.theory_hours ?? 0) + (course.practice_hours ?? 0)) * weeks,
                        'ยอดเข้าชม': course.views || 0,
                        'คำถาม': questions.filter(q => q.course_id === course.course_id).length,
                        'Active Learning': activities.filter(a => a.course_id === course.course_id).length,
                        'งานมอบหมาย': assignments.filter(a => a.course_id === course.course_id).length,
                      };
                    });
                  const ws = XLSX.utils.json_to_sheet(rows);
                  const colWidths = [
                    { wch: 12 }, { wch: 40 }, { wch: 36 }, { wch: 14 }, { wch: 10 },
                    { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 14 },
                    { wch: 24 }, { wch: 24 }, { wch: 20 }, { wch: 12 }, { wch: 10 },
                    { wch: 16 }, { wch: 14 },
                  ];
                  ws['!cols'] = colWidths;
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, `รายวิชา ${filterSem === 'all' ? 'ทุกภาค' : `ภาค${filterSem}`}_${filterYear}`);
                  XLSX.writeFile(wb, `teaching_courses_${filterSem === 'all' ? 'all' : `sem${filterSem}`}_${filterYear}.xlsx`);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shrink-0"
              >
                <Download size={13} />
                <span>Export Excel</span>
              </button>
            )}
          </div>
          {filteredCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="text-left py-2.5 pr-3 pl-2 font-bold text-slate-600 text-[11px] rounded-tl-xl">รหัสวิชา / ชื่อวิชา</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-600 text-[11px]">
                      <div className="flex items-center justify-center gap-1">
                        <Timer size={11} className="text-indigo-500" />
                        <span>ทฤษฏี</span>
                      </div>
                    </th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-600 text-[11px]">
                      <div className="flex items-center justify-center gap-1">
                        <Timer size={11} className="text-emerald-500" />
                        <span>ปฏิบัติ</span>
                      </div>
                    </th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-600 text-[11px]">
                      <div className="flex items-center justify-center gap-1">
                        <GraduationCap size={11} className="text-violet-500" />
                        <span>ผู้เรียน</span>
                      </div>
                    </th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-600 text-[11px]">
                      <div className="flex items-center justify-center gap-1">
                        <Eye size={11} className="text-sky-500" />
                        <span>Views</span>
                      </div>
                    </th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-600 text-[11px]">
                      <div className="flex items-center justify-center gap-1">
                        <MessageCircle size={11} className="text-amber-500" />
                        <span>คำถาม</span>
                      </div>
                    </th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-600 text-[11px]">
                      <div className="flex items-center justify-center gap-1">
                        <Zap size={11} className="text-green-500" />
                        <span>AL</span>
                      </div>
                    </th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-600 text-[11px]">
                      <div className="flex items-center justify-center gap-1">
                        <FileText size={11} className="text-pink-500" />
                        <span>งาน</span>
                      </div>
                    </th>
                    <th className="w-8 rounded-tr-xl"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCourses.sort((a, b) => (b.views || 0) - (a.views || 0)).map(course => {
                    const weeks = course.total_weeks || 15;
                    const theoryTotal = (course.theory_hours ?? 0) * weeks;
                    const practiceTotal = (course.practice_hours ?? 0) * weeks;
                    const cQ = questions.filter(q => q.course_id === course.course_id).length;
                    const cAct = activities.filter(a => a.course_id === course.course_id).length;
                    const cAss = assignments.filter(a => a.course_id === course.course_id).length;
                    return (
                      <tr key={course.course_id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="py-3 pr-3">
                          <div className="font-bold text-slate-900">{course.course_code}</div>
                          <div className="text-slate-500 truncate max-w-[180px]">{course.course_name_th}</div>
                        </td>
                        <td className="text-center py-3 px-2">
                          <div className="font-bold text-indigo-600">{course.theory_hours ?? 0}</div>
                          <div className="text-[9px] text-slate-400">{theoryTotal} ชม.</div>
                        </td>
                        <td className="text-center py-3 px-2">
                          <div className="font-bold text-emerald-600">{course.practice_hours ?? 0}</div>
                          <div className="text-[9px] text-slate-400">{practiceTotal} ชม.</div>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className="inline-flex items-center gap-1 font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-lg text-[11px]">
                            <GraduationCap size={10} />
                            {enrolledByCourse[course.course_id] ?? 0}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2 font-semibold text-sky-600">{course.views || 0}</td>
                        <td className="text-center py-3 px-2 font-semibold text-amber-600">{cQ}</td>
                        <td className="text-center py-3 px-2 font-semibold text-green-600">{cAct}</td>
                        <td className="text-center py-3 px-2 font-semibold text-pink-600">{cAss}</td>
                        <td className="py-3">
                          <button
                            onClick={() => { onSelectCourse(course.course_id); onNavigateCourses(); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-bold text-[11px]">
                    <td className="py-2.5 pl-2 text-slate-600">รวม {filteredCourses.length} วิชา</td>
                    <td className="text-center py-2.5 px-2 text-indigo-700">{totalTheoryHours} ชม.</td>
                    <td className="text-center py-2.5 px-2 text-emerald-700">{totalPracticeHours} ชม.</td>
                    <td className="text-center py-2.5 px-2 text-violet-600">{totalEnrolledStudents} คน</td>
                    <td className="text-center py-2.5 px-2 text-sky-600">{filteredCourses.reduce((s, c) => s + (c.views || 0), 0)}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
              ไม่มีรายวิชาในภาค/ปีที่เลือก
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Views bar chart */}
          {filteredCourses.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-500" />
                ยอดเข้าชมต่อวิชา
              </h4>
              <div className="space-y-2">
                {filteredCourses.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6).map(c => {
                  const maxV = Math.max(...filteredCourses.map(x => x.views || 0), 1);
                  const pct = Math.round(((c.views || 0) / maxV) * 100);
                  return (
                    <div key={c.course_id} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="font-semibold text-slate-700 truncate max-w-[140px]">{c.course_code}</span>
                        <span className="font-bold text-emerald-600">{c.views || 0}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Enrolled students bar chart */}
          {filteredCourses.length > 0 && totalEnrolledStudents > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <GraduationCap size={14} className="text-violet-500" />
                ผู้เรียนต่อวิชา
              </h4>
              <div className="space-y-2">
                {filteredCourses
                  .map(c => ({ c, cnt: enrolledByCourse[c.course_id] ?? 0 }))
                  .sort((a, b) => b.cnt - a.cnt)
                  .slice(0, 6)
                  .map(({ c, cnt }) => {
                    const maxE = Math.max(...filteredCourses.map(x => enrolledByCourse[x.course_id] ?? 0), 1);
                    const pct = Math.round((cnt / maxE) * 100);
                    return (
                      <div key={c.course_id} className="space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="font-semibold text-slate-700 truncate max-w-35">{c.course_code}</span>
                          <span className="font-bold text-violet-600">{cnt} คน</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Q&A stats */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <MessageCircle size={14} className="text-amber-500" />
              สรุปถาม-ตอบ
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'คำถามทั้งหมด', value: filteredQ.length, color: 'text-amber-600 bg-amber-50' },
                { label: 'ตอบแล้ว', value: answeredCount, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'รอตอบ', value: filteredQ.length - answeredCount, color: 'text-red-500 bg-red-50' },
                { label: 'การตอบกลับ', value: replies.filter(r => filteredQ.some(q => q.question_id === r.question_id)).length, color: 'text-indigo-600 bg-indigo-50' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 space-y-0.5 ${s.color.split(' ')[1]}`}>
                  <div className={`text-lg font-black ${s.color.split(' ')[0]}`}>{s.value}</div>
                  <div className="text-[10px] font-semibold text-slate-600">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Learning breakdown */}
      {filteredAct.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Zap size={16} className="text-green-500" />
            เทคนิค Active Learning ที่ใช้
            <span className="text-xs font-semibold bg-green-50 border border-green-100 text-green-700 px-2 py-0.5 rounded-full">{alBreakdown.length} เทคนิค</span>
          </h3>
          {alBreakdown.length > 0 ? (
            <div className="space-y-2.5">
              {alBreakdown.map(({ type, count }) => {
                const pct = Math.round((count / maxAlCount) * 100);
                return (
                  <div key={type.type_id} className="flex items-center gap-3">
                    <div className="w-44 shrink-0">
                      <button
                        onClick={() => setDetailType(type)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline text-left flex items-center gap-1"
                      >
                        <Info size={11} className="shrink-0" />
                        {type.name}
                      </button>
                    </div>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2" style={{ width: `${Math.max(pct, 8)}%` }}>
                        <span className="text-[9px] font-black text-white">{count}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 w-14 text-right shrink-0">
                      {filteredAct.length > 0 ? Math.round((count / filteredAct.length) * 100) : 0}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">ยังไม่มีกิจกรรมในภาค/ปีที่เลือก</p>
          )}

          {/* Activities without type */}
          {filteredAct.some(a => !a.type_id) && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-400">
                กิจกรรมที่ยังไม่ได้ระบุประเภท: {filteredAct.filter(a => !a.type_id).length} รายการ
              </p>
            </div>
          )}
        </div>
      )}

      {/* Assignments & Materials summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <FileText size={14} className="text-pink-500" />
            งานมอบหมาย
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(['open', 'upcoming', 'closed'] as const).map(s => {
              const cnt = filteredAss.filter(a => a.status === s).length;
              const colorMap = { open: 'text-emerald-600 bg-emerald-50', upcoming: 'text-indigo-600 bg-indigo-50', closed: 'text-red-500 bg-red-50' };
              const labelMap = { open: 'เปิดรับ', upcoming: 'เร็วๆนี้', closed: 'ปิดแล้ว' };
              return (
                <div key={s} className={`rounded-xl p-3 ${colorMap[s].split(' ')[1]}`}>
                  <div className={`text-xl font-black ${colorMap[s].split(' ')[0]}`}>{cnt}</div>
                  <div className="text-[10px] font-semibold text-slate-500">{labelMap[s]}</div>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-400 text-center">รวม {filteredAss.length} งาน</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Users size={14} className="text-indigo-500" />
            เอกสารการสอน
          </h4>
          <div className="grid grid-cols-2 gap-2 text-center">
            {(['slides', 'video', 'document', 'link'] as const).map(t => {
              const cnt = filteredMat.filter(m => m.type === t).length;
              const colorMap = { slides: 'text-amber-600 bg-amber-50', video: 'text-rose-600 bg-rose-50', document: 'text-blue-600 bg-blue-50', link: 'text-indigo-600 bg-indigo-50' };
              return (
                <div key={t} className={`rounded-xl p-2.5 ${colorMap[t].split(' ')[1]}`}>
                  <div className={`text-lg font-black ${colorMap[t].split(' ')[0]}`}>{cnt}</div>
                  <div className="text-[10px] font-semibold text-slate-500 capitalize">{t}</div>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-400 text-center">รวม {filteredMat.length} ชิ้น</div>
        </div>
      </div>

      {/* Teaching Hours per course */}
      {filteredCourses.some(c => (c.theory_hours || 0) + (c.practice_hours || 0) > 0) && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Timer size={16} className="text-blue-500" />
              สรุปชั่วโมงการสอนรายวิชา
              <span className="text-xs font-semibold bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                รวม {totalTheoryHours + totalPracticeHours} ชม.
              </span>
            </h3>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-400 inline-block"></span>
                <span className="text-slate-600">ทฤษฏี <b className="text-indigo-600">{totalTheoryHours}</b> ชม.</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block"></span>
                <span className="text-slate-600">ปฏิบัติ <b className="text-emerald-600">{totalPracticeHours}</b> ชม.</span>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredCourses.map(course => {
              const weeks = course.total_weeks || 15;
              const theoryTotal = (course.theory_hours || 0) * weeks;
              const practiceTotal = (course.practice_hours || 0) * weeks;
              const total = theoryTotal + practiceTotal;
              if (total === 0) return null;
              const theoryPct = Math.round((theoryTotal / total) * 100);
              return (
                <div key={course.course_id} className="space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{course.course_code}</span>
                      <span className="text-slate-500 text-[10px] hidden sm:inline truncate max-w-45">{course.course_name_th}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{weeks} สัปดาห์</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-semibold shrink-0">
                      <span className="text-indigo-600">ทฤษฏี {theoryTotal} ชม.</span>
                      <span className="text-emerald-600">ปฏิบัติ {practiceTotal} ชม.</span>
                      <span className="text-slate-700 font-black">รวม {total} ชม.</span>
                    </div>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex text-[9px] font-bold">
                    {theoryTotal > 0 && (
                      <div
                        className="h-full bg-indigo-400 flex items-center justify-center text-white transition-all duration-500"
                        style={{ width: `${theoryPct}%` }}
                        title={`ทฤษฏี ${theoryTotal} ชม. (${theoryPct}%)`}
                      >
                        {theoryPct >= 15 && `${theoryPct}%`}
                      </div>
                    )}
                    {practiceTotal > 0 && (
                      <div
                        className="h-full bg-emerald-400 flex items-center justify-center text-white transition-all duration-500"
                        style={{ width: `${100 - theoryPct}%` }}
                        title={`ปฏิบัติ ${practiceTotal} ชม. (${100 - theoryPct}%)`}
                      >
                        {(100 - theoryPct) >= 15 && `${100 - theoryPct}%`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall summary bar */}
          {(totalTheoryHours + totalPracticeHours) > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>ภาพรวมทุกวิชา</span>
                <span>รวม {totalTheoryHours + totalPracticeHours} ชม.</span>
              </div>
              <div className="h-5 bg-slate-100 rounded-full overflow-hidden flex text-[10px] font-bold">
                {totalTheoryHours > 0 && (
                  <div
                    className="h-full bg-indigo-500 flex items-center justify-center text-white transition-all duration-500"
                    style={{ width: `${Math.round((totalTheoryHours / (totalTheoryHours + totalPracticeHours)) * 100)}%` }}
                  >
                    ทฤษฏี {Math.round((totalTheoryHours / (totalTheoryHours + totalPracticeHours)) * 100)}%
                  </div>
                )}
                {totalPracticeHours > 0 && (
                  <div
                    className="h-full bg-emerald-500 flex items-center justify-center text-white transition-all duration-500"
                    style={{ width: `${Math.round((totalPracticeHours / (totalTheoryHours + totalPracticeHours)) * 100)}%` }}
                  >
                    ปฏิบัติ {Math.round((totalPracticeHours / (totalTheoryHours + totalPracticeHours)) * 100)}%
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AL Type Detail Modal */}
      {detailType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-green-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} />
                <h3 className="text-sm font-bold">{detailType.name}</h3>
              </div>
              <button onClick={() => setDetailType(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">คำอธิบาย</p>
                <p className="text-sm font-semibold text-slate-800">{detailType.description}</p>
              </div>
              {detailType.example && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ตัวอย่างกิจกรรม</p>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-xs text-slate-700 leading-relaxed">{detailType.example}</p>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ใช้ในรายวิชา</p>
                {filteredAct.filter(a => a.course_id && a.type_id === detailType.type_id).length > 0 ? (
                  <div className="space-y-1">
                    {filteredAct.filter(a => a.type_id === detailType.type_id).map(a => {
                      const course = courses.find(c => c.course_id === a.course_id);
                      return (
                        <div key={a.activity_id} className="flex items-center justify-between text-xs bg-slate-50 rounded-xl px-3 py-2">
                          <span className="font-semibold text-slate-700">{course?.course_code || a.course_id}</span>
                          {a.duration && <span className="text-slate-400">{a.duration}</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">ยังไม่ได้ใช้ในภาค/ปีที่กรองไว้</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
