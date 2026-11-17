import React from 'react';
import {
  CalendarDays, FileText, Video, Presentation, Link as LinkIcon,
  AlertCircle, BookOpen, Zap, ClipboardList, Clock,
} from 'lucide-react';
import { Course, Material, MaterialType, ActiveLearning, Assignment, SemesterSchedule, AL_TYPES } from '../types';

// ─── Date helpers ─────────────────────────────────────────────────────────────

const TH_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function toTHDate(date: Date): string {
  return `${date.getDate()} ${TH_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function weekRange(week1Start: string, weekNum: number): { start: Date; end: Date; label: string } {
  const start = new Date(week1Start);
  start.setDate(start.getDate() + (weekNum - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end, label: `${toTHDate(start)} – ${toTHDate(end)}` };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const MatIcon: React.FC<{ type: MaterialType }> = ({ type }) => {
  switch (type) {
    case 'slides':   return <Presentation size={11} className="shrink-0 text-amber-500" />;
    case 'video':    return <Video        size={11} className="shrink-0 text-rose-500" />;
    case 'document': return <FileText     size={11} className="shrink-0 text-blue-500" />;
    case 'link':     return <LinkIcon     size={11} className="shrink-0 text-indigo-400" />;
    default:         return <FileText     size={11} className="shrink-0 text-slate-400" />;
  }
};

// ─── Week row ─────────────────────────────────────────────────────────────────

interface WeekRowProps {
  weekNum: number;
  dateLabel: string;
  materials: Material[];
  activities: ActiveLearning[];
  assignments: Assignment[];
  isCurrentWeek: boolean;
  isPast: boolean;
}

const WeekRow: React.FC<WeekRowProps> = ({
  weekNum, dateLabel, materials, activities, assignments, isCurrentWeek, isPast,
}) => {
  const hasContent = materials.length > 0 || activities.length > 0 || assignments.length > 0;

  return (
    <div className={`flex gap-0 ${isPast ? 'opacity-70' : ''}`}>
      {/* Timeline indicator */}
      <div className="flex flex-col items-center w-10 shrink-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 z-10 ${
          isCurrentWeek
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-300'
            : isPast
            ? 'bg-slate-200 text-slate-500'
            : hasContent
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            : 'bg-white text-slate-400 border border-slate-200'
        }`}>
          {weekNum}
        </div>
        <div className="w-px flex-1 bg-slate-200 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 pt-0.5 pl-2 min-w-0 space-y-2">
        {/* Date row */}
        <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${
          isCurrentWeek ? 'text-indigo-600' : 'text-slate-400'
        }`}>
          <CalendarDays size={10} />
          <span>{dateLabel}</span>
          {isCurrentWeek && (
            <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold">สัปดาห์นี้</span>
          )}
        </div>

        {/* Materials */}
        {materials.length > 0 && (
          <div className={`rounded-xl border p-3 space-y-1.5 ${
            isCurrentWeek ? 'bg-indigo-50/60 border-indigo-200' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center gap-1 mb-1.5">
              <BookOpen size={10} className="text-indigo-500" />
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">หัวข้อการสอน</span>
            </div>
            {materials.map(mat => (
              <div key={mat.material_id} className="flex items-start gap-1.5 min-w-0">
                <MatIcon type={mat.type} />
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-700 font-medium leading-snug line-clamp-2">{mat.title}</span>
                  {mat.description && (
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5 line-clamp-1">{mat.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Learning */}
        {activities.length > 0 && (
          <div className="rounded-xl border border-green-100 bg-green-50/50 p-3 space-y-1.5">
            <div className="flex items-center gap-1 mb-1.5">
              <Zap size={10} className="text-green-600" />
              <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">Active Learning</span>
            </div>
            {activities.map(act => {
              const alType = act.type_id ? AL_TYPES.find(t => t.type_id === act.type_id) : null;
              return (
                <div key={act.activity_id} className="flex items-start gap-1.5 min-w-0">
                  <Zap size={11} className="shrink-0 text-green-500 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-700 font-medium leading-snug">{act.title}</span>
                      {alType && (
                        <span className="text-[9px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-md">
                          {alType.name}
                        </span>
                      )}
                      {act.is_assignment && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-pink-700 bg-pink-50 border border-pink-100 px-1.5 py-0.5 rounded-md">
                          <ClipboardList size={8} />
                          งานมอบหมาย
                        </span>
                      )}
                    </div>
                    {act.duration && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{act.duration}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Standalone Assignments (not from AL) */}
        {assignments.length > 0 && (
          <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-3 space-y-1.5">
            <div className="flex items-center gap-1 mb-1.5">
              <ClipboardList size={10} className="text-pink-600" />
              <span className="text-[9px] font-bold text-pink-700 uppercase tracking-wider">งานมอบหมาย</span>
            </div>
            {assignments.map(asgn => (
              <div key={asgn.assignment_id} className="flex items-start gap-1.5 min-w-0">
                <ClipboardList size={11} className="shrink-0 text-pink-500 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-700 font-medium leading-snug line-clamp-2">{asgn.title}</span>
                  {asgn.due_date && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={9} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400">กำหนดส่ง {asgn.due_date}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!hasContent && (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2">
            <span className="text-[10px] text-slate-400 italic">ยังไม่มีหัวข้อ / กิจกรรม</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface TeachingPlanTabProps {
  course: Course;
  materials: Material[];
  activities: ActiveLearning[];
  assignments: Assignment[];
  semesterSchedules: SemesterSchedule[];
}

export const TeachingPlanTab: React.FC<TeachingPlanTabProps> = ({
  course, materials, activities, assignments, semesterSchedules,
}) => {
  const schedule = semesterSchedules.find(
    s => Number(s.semester_id) === Number(course.semester_id) && Number(s.year) === Number(course.year)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalWeeks = schedule?.total_weeks ?? course.total_weeks ?? 16;

  const matByWeek = materials.reduce<Record<number, Material[]>>((acc, m) => {
    const w = m.week_number ?? 0;
    (acc[w] = acc[w] || []).push(m);
    return acc;
  }, {});

  const actByWeek = activities.reduce<Record<number, ActiveLearning[]>>((acc, a) => {
    const w = a.week_number ?? 0;
    (acc[w] = acc[w] || []).push(a);
    return acc;
  }, {});

  // Exclude assignments whose title matches ANY AL activity (regardless of is_assignment flag)
  const alTitles = new Set(activities.map(a => a.title.trim().toLowerCase()));
  const standaloneAssignments = assignments.filter(
    a => !alTitles.has(a.title.trim().toLowerCase())
  );
  const asnByWeek = standaloneAssignments.reduce<Record<number, Assignment[]>>((acc, a) => {
    const w = a.week_number ?? 0;
    (acc[w] = acc[w] || []).push(a);
    return acc;
  }, {});

  if (!schedule) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
          <AlertCircle size={22} className="text-amber-500" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">ยังไม่ได้กำหนดวันเริ่มต้นภาคการศึกษา</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Admin สามารถตั้งค่าวันที่เริ่มสัปดาห์ที่ 1 ของภาคเรียนที่ {course.semester_id}/{course.year}
          ได้ที่ BackOffice → ตารางการสอน
        </p>
      </div>
    );
  }

  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  const week1Date = new Date(schedule.week1_start);
  week1Date.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - week1Date.getTime()) / 86400000);
  const currentWeek = diffDays >= 0 ? Math.min(Math.floor(diffDays / 7) + 1, totalWeeks) : null;

  const totalWithContent = weeks.filter(w =>
    (matByWeek[w]?.length ?? 0) > 0 || (actByWeek[w]?.length ?? 0) > 0 || (asnByWeek[w]?.length ?? 0) > 0
  ).length;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={16} className="text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">แผนการสอน</h3>
            </div>
            <p className="text-[11px] text-slate-500">
              ภาคเรียนที่ {course.semester_id}/{course.year} · {totalWeeks} สัปดาห์
              · เริ่ม {toTHDate(new Date(schedule.week1_start))}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              มีเนื้อหา {totalWithContent}/{totalWeeks} สัปดาห์
            </div>
            {currentWeek && (
              <div className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                กำลังสอนสัปดาห์ที่ {currentWeek}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-5 flex-wrap">
        {[
          { dot: 'bg-indigo-500', label: 'หัวข้อการสอน' },
          { dot: 'bg-green-500',  label: 'Active Learning' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <div className={`w-2 h-2 rounded-full ${l.dot}`} />
            {l.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <div className="w-2 h-2 rounded-full bg-pink-500" />
          งานมอบหมาย (ไม่ซ้ำกับ AL)
        </div>
      </div>

      {/* Week timeline */}
      <div className="p-6 pt-3">
        {weeks.map(w => {
          const { start, end, label } = weekRange(schedule.week1_start, w);
          return (
            <WeekRow
              key={w}
              weekNum={w}
              dateLabel={label}
              materials={matByWeek[w] || []}
              activities={actByWeek[w] || []}
              assignments={asnByWeek[w] || []}
              isCurrentWeek={currentWeek === w}
              isPast={end < today}
            />
          );
        })}
        {/* End node */}
        <div className="flex gap-0">
          <div className="w-10 shrink-0 flex justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-300" />
          </div>
          <div className="pb-2 pl-2">
            <span className="text-[10px] text-slate-400 italic">สิ้นสุดภาคการศึกษา</span>
          </div>
        </div>
      </div>
    </div>
  );
};
