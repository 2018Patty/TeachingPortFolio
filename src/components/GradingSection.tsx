import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck, ClipboardList, Zap, FileDown, Link as LinkIcon, AlignLeft,
  Save, CheckCircle, Clock, AlertCircle, Download, MessageSquare, Award, History, ChevronDown,
} from 'lucide-react';
import {
  Course, Assignment, ActiveLearning, AssignmentSubmission, StudentProfile, StudentCourseVisit,
} from '../types';
import { groupFromVisitId } from '../utils/enrollGroups';
import {
  parseGrade, isGraded, formatScore, isLateSubmission, legacyNote, latestAttempts, type SubmissionGrade,
} from '../utils/grading';

export type SaveGrade = (submissionId: string, grade: SubmissionGrade | null) => Promise<void>;

interface Task {
  id: string;
  title: string;
  dueDate: string;
  week: number | null;
  kind: 'assignment' | 'activity';
}

const fileUrls = (raw?: string): string[] => {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string' && !!x) : [raw];
  } catch {
    return [raw];
  }
};

const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '';

/** What the student sent: answer text, files and link. */
export const SubmissionContent: React.FC<{ sub: AssignmentSubmission }> = ({ sub }) => {
  const [open, setOpen] = useState(false);
  const files = fileUrls(sub.file_url);
  const note = legacyNote(sub.note);
  const long = (sub.answer_text || '').length > 220;
  if (!sub.answer_text && files.length === 0 && !sub.link_url && !note) {
    return <p className="text-[11px] text-slate-400 italic">ไม่มีเนื้อหาการส่งงาน (อาจส่งผ่านช่องทางอื่น)</p>;
  }
  return (
    <div className="space-y-2">
      {sub.answer_text && (
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mb-1">
            <AlignLeft size={10} /> คำตอบ
          </div>
          <p className={`text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words ${open ? '' : 'line-clamp-4'}`}>
            {sub.answer_text}
          </p>
          {long && (
            <button type="button" onClick={() => setOpen(!open)} className="text-[10px] font-bold text-indigo-600 hover:underline mt-1">
              {open ? 'ย่อ' : 'อ่านทั้งหมด'}
            </button>
          )}
        </div>
      )}
      {(files.length > 0 || sub.link_url) && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-2.5 py-1.5 transition">
              <FileDown size={11} /> ไฟล์ {i + 1}
            </a>
          ))}
          {sub.link_url && (
            <a href={sub.link_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-2.5 py-1.5 transition max-w-full">
              <LinkIcon size={11} className="shrink-0" />
              <span className="truncate max-w-[260px]">{sub.link_url}</span>
            </a>
          )}
        </div>
      )}
      {note && <p className="text-[11px] text-slate-500 italic">หมายเหตุ: {note}</p>}
    </div>
  );
};

/** Score + feedback for the student (read-only). */
export const GradeFeedback: React.FC<{ note?: string; compact?: boolean }> = ({ note, compact }) => {
  const g = parseGrade(note);
  if (!g || (g.score === null && !g.feedback.trim())) {
    return compact ? null : <p className="text-[10px] text-slate-400">รอผู้สอนตรวจ</p>;
  }
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <Award size={12} className="text-amber-600" />
        {g.score !== null ? (
          <span className="text-xs font-black text-amber-800">คะแนน {formatScore(g)}</span>
        ) : (
          <span className="text-xs font-bold text-amber-800">ผู้สอนให้ความเห็นแล้ว</span>
        )}
        {g.graded_at && <span className="text-[10px] text-amber-700/70">ตรวจเมื่อ {fmtTime(g.graded_at)}</span>}
      </div>
      {g.feedback.trim() && (
        <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
          <span className="font-bold text-amber-800">Feedback: </span>{g.feedback}
        </p>
      )}
    </div>
  );
};

// ─── One student row ──────────────────────────────────────────────────────────

const GradeRow: React.FC<{
  index: number;
  student?: StudentProfile;
  sid: string;
  group: number | null;
  attempts: AssignmentSubmission[];   // newest first; [0] is the one graded here
  task: Task;
  maxScore: number | null;
  onSave: SaveGrade;
}> = ({ index, student, sid, group, attempts, task, maxScore, onSave }) => {
  const sub = attempts[0] as AssignmentSubmission | undefined;
  const [showLog, setShowLog] = useState(false);
  const grade = parseGrade(sub?.note);
  const [score, setScore] = useState(grade?.score?.toString() ?? '');
  const [feedback, setFeedback] = useState(grade?.feedback ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  // Reset when the stored grade changes (e.g. after saving, or switching task).
  useEffect(() => {
    setScore(grade?.score?.toString() ?? '');
    setFeedback(grade?.feedback ?? '');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub?.submission_id, sub?.note]);

  const dirty = (grade?.score?.toString() ?? '') !== score.trim() || (grade?.feedback ?? '') !== feedback;
  const graded = isGraded(sub?.note);
  const late = sub ? isLateSubmission(sub.submitted_at, task.dueDate) : false;
  const name = student ? `${student.first_name} ${student.last_name}`.trim() : 'ไม่พบข้อมูลนักศึกษา';

  const save = async () => {
    if (!sub) return;
    setError('');
    const s = score.trim();
    let scoreNum: number | null = null;
    if (s) {
      scoreNum = Number(s);
      if (!Number.isFinite(scoreNum) || scoreNum < 0) { setError('คะแนนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป'); return; }
      if (maxScore !== null && scoreNum > maxScore) { setError(`คะแนนต้องไม่เกินคะแนนเต็ม (${maxScore})`); return; }
    }
    const empty = scoreNum === null && !feedback.trim();
    setSaving(true);
    try {
      await onSave(sub.submission_id, empty ? null : {
        score: scoreNum,
        max_score: maxScore,
        feedback: feedback.trim(),
        graded_at: new Date().toISOString(),
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      setError(`บันทึกไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`border rounded-2xl p-4 transition ${
      !sub ? 'border-slate-200 bg-slate-50/50'
        : graded ? 'border-emerald-200 bg-emerald-50/30'
        : 'border-amber-200 bg-white'
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">{index}</span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{name}</p>
            <p className="text-[10px] text-slate-400">
              {student?.student_id || sid.slice(0, 8)}
              {group !== null && <> · กลุ่ม {group}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {sub ? (
            <>
              {attempts.length > 1 && (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">ครั้งที่ {attempts.length}</span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <Clock size={10} /> ส่งเมื่อ {fmtTime(sub.submitted_at)}
              </span>
              {late && (
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">ส่งช้า</span>
              )}
              {graded ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle size={9} /> ตรวจแล้ว
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">รอตรวจ</span>
              )}
            </>
          ) : (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">ยังไม่ส่ง</span>
          )}
        </div>
      </div>

      {sub && (
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2 min-w-0">
            <SubmissionContent sub={sub} />
            {attempts.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowLog(!showLog)}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900"
                >
                  <History size={11} /> ประวัติการส่ง ({attempts.length} ครั้ง)
                  <ChevronDown size={11} className={`transition-transform ${showLog ? 'rotate-180' : ''}`} />
                </button>
                {showLog && (
                  <div className="border-l-2 border-slate-200 pl-3 space-y-3">
                    {attempts.slice(1).map((a, i) => (
                      <div key={a.submission_id} className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500">
                          ครั้งที่ {attempts.length - 1 - i} · {fmtTime(a.submitted_at)}
                          {isLateSubmission(a.submitted_at, task.dueDate) && <span className="text-red-600"> · ส่งช้า</span>}
                        </p>
                        <div className="opacity-80"><SubmissionContent sub={a} /></div>
                        <GradeFeedback note={a.note} compact />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-600 shrink-0" htmlFor={`score-${sub.submission_id}`}>คะแนน</label>
              <input
                id={`score-${sub.submission_id}`}
                type="number" inputMode="decimal" min={0} max={maxScore ?? undefined} step="any"
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="-"
                className="w-20 px-2.5 py-1.5 text-xs font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
              />
              {maxScore !== null && <span className="text-[11px] text-slate-500">/ {maxScore}</span>}
            </div>
            <textarea
              aria-label="Feedback"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
              placeholder="Feedback ถึงนักศึกษา (นักศึกษาจะเห็นข้อความนี้)"
              className="w-full px-3 py-2 text-xs text-slate-700 border border-slate-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            />
            <div className="flex items-center justify-end gap-2">
              {error && <span className="text-[10px] text-red-600 mr-auto">{error}</span>}
              {savedFlash && !dirty && <span className="text-[10px] font-bold text-emerald-600">บันทึกแล้ว</span>}
              {grade?.graded_at && !dirty && !savedFlash && (
                <span className="text-[10px] text-slate-400">ตรวจเมื่อ {fmtTime(grade.graded_at)}</span>
              )}
              <button
                type="button"
                onClick={save}
                disabled={saving || !dirty}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Save size={11} />
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────

type Filter = 'all' | 'pending' | 'graded' | 'missing';

export const GradingSection: React.FC<{
  course: Course;
  assignments: Assignment[];
  activities: ActiveLearning[];
  submissions: AssignmentSubmission[];
  students: StudentProfile[];
  visits: StudentCourseVisit[];
  onSaveGrade: SaveGrade;
}> = ({ course, assignments, activities, submissions, students, visits, onSaveGrade }) => {
  const tasks: Task[] = useMemo(() => [
    ...assignments.map(a => ({
      id: a.assignment_id, title: a.title, dueDate: a.due_date || '',
      week: a.week_number ?? null, kind: 'assignment' as const,
    })),
    ...activities.filter(a => a.is_assignment).map(a => ({
      id: a.activity_id, title: a.title, dueDate: a.due_date || '',
      week: a.week_number ?? null, kind: 'activity' as const,
    })),
  ].sort((a, b) => (a.week ?? 999) - (b.week ?? 999) || a.dueDate.localeCompare(b.dueDate)),
  [assignments, activities]);

  const courseSubs = submissions.filter(s => s.course_id === course.course_id);
  const courseVisits = visits.filter(v => v.course_id === course.course_id);

  // Roster: everyone enrolled in the course, plus anyone who submitted.
  const roster = useMemo(() => {
    const ids = Array.from(new Set([...courseVisits.map(v => v.student_id), ...courseSubs.map(s => s.student_id)]));
    return ids.map(sid => ({
      sid,
      student: students.find(s => s.id === sid),
      group: courseVisits.filter(v => v.student_id === sid)
        .map(v => groupFromVisitId(v.visit_id)).find((g): g is number => g !== null) ?? null,
    })).sort((a, b) =>
      (a.group ?? 999) - (b.group ?? 999) ||
      (a.student?.student_id || '').localeCompare(b.student?.student_id || ''));
  }, [courseVisits, courseSubs, students]);

  const [taskId, setTaskId] = useState<string | null>(null);
  const task = tasks.find(t => t.id === taskId) ?? tasks[0];
  const [filter, setFilter] = useState<Filter>('all');
  const [groupFilter, setGroupFilter] = useState<'all' | number>('all');

  // Full score: from existing grades of this task, else 10.
  const [maxInputs, setMaxInputs] = useState<Record<string, string>>({});
  const defaultMax = (id: string) => {
    const g = courseSubs.filter(s => s.assignment_id === id).map(s => parseGrade(s.note)).find(x => x?.max_score != null);
    return String(g?.max_score ?? 10);
  };
  const maxText = task ? (maxInputs[task.id] ?? defaultMax(task.id)) : '';
  const maxNum = maxText.trim() === '' ? null : Number(maxText);
  const maxScore = maxNum !== null && Number.isFinite(maxNum) && maxNum > 0 ? maxNum : null;

  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 space-y-2">
        <ClipboardCheck size={26} className="mx-auto" />
        <p className="text-sm font-semibold text-slate-500">ยังไม่มีงานให้ตรวจในวิชานี้</p>
        <p className="text-xs">เพิ่มงานมอบหมาย หรือกิจกรรม Active Learning ที่ตั้งเป็นงานมอบหมายก่อน</p>
      </div>
    );
  }

  const taskSubs = courseSubs.filter(s => s.assignment_id === task.id);
  const rows = roster.map(r => {
    const attempts = taskSubs
      .filter(s => s.student_id === r.sid)
      .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime());
    return { ...r, attempts, sub: attempts[0] as AssignmentSubmission | undefined };
  });
  const counts = {
    all: rows.length,
    pending: rows.filter(r => r.sub && !isGraded(r.sub.note)).length,
    graded: rows.filter(r => r.sub && isGraded(r.sub.note)).length,
    missing: rows.filter(r => !r.sub).length,
  };
  const groups = Array.from(new Set(rows.map(r => r.group).filter((g): g is number => g !== null))).sort((a, b) => a - b);
  const visible = rows
    .filter(r => groupFilter === 'all' || r.group === groupFilter)
    .filter(r =>
      filter === 'all' ? true
        : filter === 'pending' ? r.sub && !isGraded(r.sub.note)
        : filter === 'graded' ? r.sub && isGraded(r.sub.note)
        : !r.sub);

  const scores = rows.map(r => parseGrade(r.sub?.note)?.score).filter((x): x is number => typeof x === 'number');
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      ['ลำดับ', 'รหัสนักศึกษา', 'ชื่อ-สกุล', 'กลุ่ม', 'สถานะ', 'ส่งเมื่อ', 'จำนวนครั้งที่ส่ง', 'ส่งช้า', 'คะแนน', 'คะแนนเต็ม', 'Feedback'].map(esc).join(','),
      ...rows.map((r, i) => {
        const g = parseGrade(r.sub?.note);
        return [
          i + 1,
          r.student?.student_id || '',
          r.student ? `${r.student.first_name} ${r.student.last_name}` : '',
          r.group ?? '',
          !r.sub ? 'ยังไม่ส่ง' : isGraded(r.sub.note) ? 'ตรวจแล้ว' : 'รอตรวจ',
          r.sub ? fmtTime(r.sub.submitted_at) : '',
          r.attempts.length || '',
          r.sub && isLateSubmission(r.sub.submitted_at, task.dueDate) ? 'ใช่' : '',
          g?.score ?? '',
          g?.score != null ? (g.max_score ?? '') : '',
          g?.feedback ?? '',
        ].map(esc).join(',');
      }),
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `คะแนน_${course.course_code}_${task.title.slice(0, 40).replace(/[\\/:*?"<>|]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filterBtn = (f: Filter, label: string) => (
    <button
      key={f}
      type="button"
      onClick={() => setFilter(f)}
      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition ${
        filter === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label} <span className="opacity-70">({counts[f]})</span>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Task picker */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
          <ClipboardCheck size={13} className="text-indigo-500" /> เลือกงานที่จะตรวจ
        </p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {tasks.map(t => {
            const subs = latestAttempts(courseSubs.filter(s => s.assignment_id === t.id));
            const submitted = subs.length;
            const pending = subs.filter(s => !isGraded(s.note)).length;
            const active = t.id === task.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTaskId(t.id); setFilter('all'); }}
                className={`text-left rounded-xl border p-3 transition ${
                  active ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {t.kind === 'activity' ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded"><Zap size={8} /> Active Learning</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded"><ClipboardList size={8} /> งานมอบหมาย</span>
                  )}
                  {t.week !== null && <span className="text-[9px] font-semibold text-slate-500">สัปดาห์ที่ {t.week}</span>}
                </div>
                <p className="text-xs font-bold text-slate-800 line-clamp-2">{t.title}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 flex-wrap">
                  <span>ส่งแล้ว {submitted}/{roster.length}</span>
                  {pending > 0
                    ? <span className="font-bold text-amber-700">รอตรวจ {pending}</span>
                    : submitted > 0 && <span className="font-bold text-emerald-700">ตรวจครบ</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected task */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900">{task.title}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
              {task.dueDate && <span className="flex items-center gap-1"><Clock size={10} /> กำหนดส่ง {task.dueDate}</span>}
              <span>ส่งแล้ว {counts.all - counts.missing}/{counts.all} คน</span>
              {avg !== null && <span>คะแนนเฉลี่ย {avg.toFixed(2)}{maxScore !== null && ` / ${maxScore}`} ({scores.length} คน)</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
              คะแนนเต็ม
              <input
                type="number" min={1} step="any"
                value={maxText}
                onChange={e => setMaxInputs(m => ({ ...m, [task.id]: e.target.value }))}
                className="w-16 px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition"
            >
              <Download size={11} /> ส่งออกคะแนน (CSV)
            </button>
          </div>
        </div>
        {maxScore === null && (
          <p className="text-[10px] text-amber-700 flex items-center gap-1"><AlertCircle size={10} /> ยังไม่ได้กำหนดคะแนนเต็ม ระบบจะไม่ตรวจว่าคะแนนเกินหรือไม่</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {filterBtn('all', 'ทั้งหมด')}
          {filterBtn('pending', 'รอตรวจ')}
          {filterBtn('graded', 'ตรวจแล้ว')}
          {filterBtn('missing', 'ยังไม่ส่ง')}
          {groups.length > 1 && (
            <select
              aria-label="กรองตามกลุ่ม"
              value={groupFilter === 'all' ? '' : String(groupFilter)}
              onChange={e => setGroupFilter(e.target.value === '' ? 'all' : Number(e.target.value))}
              className="ml-auto px-2.5 py-1.5 text-[11px] font-bold text-slate-600 border border-slate-200 rounded-lg bg-white"
            >
              <option value="">ทุกกลุ่ม</option>
              {groups.map(g => <option key={g} value={g}>กลุ่ม {g}</option>)}
            </select>
          )}
        </div>

        <div className="space-y-2.5">
          {visible.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-8 flex items-center justify-center gap-1.5">
              <MessageSquare size={13} /> ไม่มีรายการในตัวกรองนี้
            </p>
          ) : visible.map((r, i) => (
            <GradeRow
              key={`${task.id}-${r.sid}`}
              index={i + 1}
              sid={r.sid}
              student={r.student}
              group={r.group}
              attempts={r.attempts}
              task={task}
              maxScore={maxScore}
              onSave={onSaveGrade}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
