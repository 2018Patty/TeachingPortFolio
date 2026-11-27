import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck, ClipboardList, Zap, FileDown, Link as LinkIcon, AlignLeft,
  Save, CheckCircle, Clock, AlertCircle, Download, MessageSquare, Award, History, ChevronDown,
  ChevronLeft, ChevronRight, Search, ExternalLink,
} from 'lucide-react';
import {
  Course, Assignment, ActiveLearning, AssignmentSubmission, StudentProfile, StudentCourseVisit,
} from '../types';
import { groupFromVisitId } from '../utils/enrollGroups';
import { compareStudents } from '../utils/studentOrder';
import { useUnsavedWork } from '../utils/unsavedWork';
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
  createdAt: string;   // when the teacher assigned it
  order: number;       // 1-based position in assignment order
}

const createdMs = (iso: string | undefined, id: string) => {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (Number.isFinite(t)) return t;
  const m = /-(\d{12,14})-/.exec(id);   // ids carry a creation timestamp
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
};

const fmtDue = (d: string) =>
  d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '';

const dueState = (d: string): 'none' | 'past' | 'soon' | 'later' => {
  if (!/^\d{4}-\d{2}-\d{2}/.test(d)) return 'none';
  const end = new Date(`${d.slice(0, 10)}T23:59:59`).getTime();
  const now = Date.now();
  if (end < now) return 'past';
  return end - now < 3 * 86400000 ? 'soon' : 'later';
};

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

// Unsaved score / feedback the teacher typed (kept by the section until saved).
interface Draft { score: string; feedback: string }

const storedDraft = (sub: AssignmentSubmission): Draft => {
  const g = parseGrade(sub.note);
  return { score: g?.score?.toString() ?? '', feedback: g?.feedback ?? '' };
};
const sameDraft = (a: Draft, b: Draft) => a.score.trim() === b.score.trim() && a.feedback === b.feedback;

/** Draft → grade to store (null clears grading), or an error message. */
const draftToGrade = (d: Draft, maxScore: number | null): { grade: SubmissionGrade | null } | { error: string } => {
  const s = d.score.trim();
  let score: number | null = null;
  if (s) {
    score = Number(s);
    if (!Number.isFinite(score) || score < 0) return { error: 'คะแนนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป' };
    if (maxScore !== null && score > maxScore) return { error: `คะแนนต้องไม่เกินคะแนนเต็ม (${maxScore})` };
  }
  if (score === null && !d.feedback.trim()) return { grade: null };
  return { grade: { score, max_score: maxScore, feedback: d.feedback.trim(), graded_at: new Date().toISOString() } };
};

/** Full score of a task, from its graded submissions (most common max_score). */
export const taskMaxScore = (subs: AssignmentSubmission[], taskId: string): number | null => {
  const counts = new Map<number, number>();
  for (const s of subs) {
    if (s.assignment_id !== taskId) continue;
    const m = parseGrade(s.note)?.max_score;
    if (m != null) counts.set(m, (counts.get(m) || 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

/** Stand-alone score + feedback form for one submission (used in the student popup). */
export const GradeEditor: React.FC<{
  sub: AssignmentSubmission;
  defaultMax: number | null;   // the task's full score, if known
  onSave: SaveGrade;
}> = ({ sub, defaultMax, onSave }) => {
  const grade = parseGrade(sub.note);
  const stored = storedDraft(sub);
  const [draft, setDraft] = useState<Draft>(stored);
  const [maxText, setMaxText] = useState(String(grade?.max_score ?? defaultMax ?? 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // After saving (or when the submission changes) start again from what is stored.
  useEffect(() => {
    setDraft(storedDraft(sub));
    setMaxText(String(parseGrade(sub.note)?.max_score ?? defaultMax ?? 10));
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.submission_id, sub.note]);

  const maxNum = Number(maxText);
  const maxScore = maxText.trim() !== '' && Number.isFinite(maxNum) && maxNum > 0 ? maxNum : null;
  const maxChanged = maxScore !== (grade?.max_score ?? null) && !!grade && grade.score !== null;
  const dirty = !sameDraft(draft, stored) || maxChanged;
  const isFull = maxScore !== null && draft.score.trim() !== '' && Number(draft.score) === maxScore;

  const save = async () => {
    const r = draftToGrade(draft, maxScore);
    if ('error' in r) { setError(r.error); return; }
    setSaving(true); setError('');
    try {
      await onSave(sub.submission_id, r.grade);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(`บันทึกไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${dirty ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}>
      <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Award size={11} /> ให้คะแนนและ feedback</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[11px] font-bold text-slate-600" htmlFor={`ge-score-${sub.submission_id}`}>คะแนน</label>
        <input
          id={`ge-score-${sub.submission_id}`}
          type="number" inputMode="decimal" min={0} max={maxScore ?? undefined} step="any"
          value={draft.score}
          onChange={e => { setDraft(d => ({ ...d, score: e.target.value })); setError(''); }}
          placeholder="-"
          className="w-20 px-2.5 py-1.5 text-xs font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <span className="text-[11px] text-slate-500">/</span>
        <input
          aria-label="คะแนนเต็ม"
          type="number" min={1} step="any"
          value={maxText}
          onChange={e => setMaxText(e.target.value)}
          title="คะแนนเต็ม"
          className="w-16 px-2 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        {maxScore !== null && (
          <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFull}
              onChange={e => setDraft(d => ({
                ...d,
                score: e.target.checked ? String(maxScore)
                  : (stored.score.trim() !== '' && Number(stored.score) !== maxScore ? stored.score : ''),
              }))}
              className="w-3.5 h-3.5 accent-emerald-600"
            />
            คะแนนเต็ม
          </label>
        )}
      </div>
      <textarea
        aria-label="Feedback"
        value={draft.feedback}
        onChange={e => setDraft(d => ({ ...d, feedback: e.target.value }))}
        rows={3}
        placeholder="Feedback ถึงนักศึกษา (นักศึกษาจะเห็นข้อความนี้)"
        className="w-full px-3 py-2 text-xs text-slate-700 border border-slate-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      <div className="flex items-center justify-end gap-2">
        {error && <span className="text-[10px] text-red-600 mr-auto">{error}</span>}
        {!error && dirty && <span className="text-[10px] font-bold text-indigo-600 mr-auto">ยังไม่ได้บันทึก</span>}
        {saved && !dirty && <span className="text-[10px] font-bold text-emerald-600">บันทึกแล้ว</span>}
        {grade?.graded_at && !dirty && !saved && <span className="text-[10px] text-slate-400">ตรวจเมื่อ {fmtTime(grade.graded_at)}</span>}
        {dirty && (
          <button
            type="button"
            onClick={() => { setDraft(stored); setMaxText(String(grade?.max_score ?? defaultMax ?? 10)); setError(''); }}
            className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg"
          >
            ยกเลิก
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400"
        >
          <Save size={11} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </div>
  );
};

const GradeRow: React.FC<{
  index: number;
  student?: StudentProfile;
  sid: string;
  group: number | null;
  attempts: AssignmentSubmission[];   // newest first; [0] is the one graded here
  task: Task;
  maxScore: number | null;
  draft?: Draft;                       // unsaved edit, if any
  onDraft: (d: Draft) => void;
  onSave: () => void;
  saving: boolean;
  error: string;
  savedFlash: boolean;
}> = ({ index, student, sid, group, attempts, task, maxScore, draft, onDraft, onSave, saving, error, savedFlash }) => {
  const sub = attempts[0] as AssignmentSubmission | undefined;
  const [showLog, setShowLog] = useState(false);
  const grade = parseGrade(sub?.note);
  const stored = sub ? storedDraft(sub) : { score: '', feedback: '' };
  const { score, feedback } = draft ?? stored;
  const setScore = (v: string) => onDraft({ score: v, feedback });
  const setFeedback = (v: string) => onDraft({ score, feedback: v });
  const dirty = !!draft && !sameDraft(draft, stored);
  const graded = isGraded(sub?.note);
  const late = sub ? isLateSubmission(sub.submitted_at, task.dueDate) : false;
  const name = student ? `${student.first_name} ${student.last_name}`.trim() : 'ไม่พบข้อมูลนักศึกษา';
  const save = onSave;

  return (
    <div className={`border rounded-2xl p-4 transition ${
      !sub ? 'border-slate-200 bg-slate-50/50'
        : dirty ? 'border-indigo-300 bg-indigo-50/30 ring-1 ring-indigo-100'
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
              {maxScore !== null && (
                <label className="ml-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={score.trim() !== '' && Number(score) === maxScore}
                    onChange={e => setScore(e.target.checked
                      ? String(maxScore)
                      : (grade?.score != null && grade.score !== maxScore ? String(grade.score) : ''))}
                    className="w-3.5 h-3.5 accent-emerald-600"
                  />
                  คะแนนเต็ม
                </label>
              )}
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
              {dirty && !error && <span className="text-[10px] font-bold text-indigo-600 mr-auto">ยังไม่ได้บันทึก</span>}
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
  onOpenTask?: (taskId: string) => void;   // open the task's details in the course page
}> = ({ course, assignments, activities, submissions, students, visits, onSaveGrade, onOpenTask }) => {
  // Tasks by week, then in the order the teacher assigned them; numbered 1..n.
  const tasks: Task[] = useMemo(() => [
    ...assignments.map(a => ({
      id: a.assignment_id, title: a.title, dueDate: a.due_date || '',
      week: a.week_number ?? null, kind: 'assignment' as const, createdAt: a.created_at || '',
      ms: createdMs(a.created_at, a.assignment_id),
    })),
    ...activities.filter(a => a.is_assignment).map(a => ({
      id: a.activity_id, title: a.title, dueDate: a.due_date || '',
      week: a.week_number ?? null, kind: 'activity' as const, createdAt: a.created_at || '',
      ms: createdMs(a.created_at, a.activity_id),
    })),
  ].sort((a, b) => (a.week ?? 999) - (b.week ?? 999) || a.ms - b.ms || a.dueDate.localeCompare(b.dueDate))
   .map(({ ms: _ms, ...t }, i) => ({ ...t, order: i + 1 })),
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
    })).sort((a, b) => compareStudents(a.student, b.student));
  }, [courseVisits, courseSubs, students]);

  // Progress of every task (latest attempt per student).
  const taskStats = useMemo(() => {
    const m = new Map<string, { submitted: number; pending: number }>();
    for (const t of tasks) {
      const subs = latestAttempts(courseSubs.filter(s => s.assignment_id === t.id));
      m.set(t.id, { submitted: subs.length, pending: subs.filter(s => !isGraded(s.note)).length });
    }
    return m;
  }, [tasks, courseSubs]);

  const [taskId, setTaskId] = useState<string | null>(null);
  // Default: the earliest-assigned task that still has work to grade.
  const task = tasks.find(t => t.id === taskId)
    ?? tasks.find(t => (taskStats.get(t.id)?.pending ?? 0) > 0)
    ?? tasks[0];
  const [taskQuery, setTaskQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [taskSort, setTaskSort] = useState<'assigned' | 'due'>('assigned');
  // Expanded / collapsed week groups (key = week number or 'none'); unset = default.
  const [weekOpen, setWeekOpen] = useState<Record<string, boolean>>({});
  const selectTask = (id: string) => {
    if (task && id !== task.id) {
      const unsaved = courseSubs.filter(s => s.assignment_id === task.id && drafts[s.submission_id]).length;
      if (unsaved && !window.confirm(`งานนี้มีคะแนนที่ยังไม่ได้บันทึก ${unsaved} รายการ\nเปลี่ยนไปงานอื่นโดยไม่บันทึก? (คะแนนที่ยังไม่บันทึกจะหายไป)`)) return;
      setDrafts(d => Object.fromEntries(Object.entries(d).filter(([id]) => !courseSubs.some(s => s.submission_id === id && s.assignment_id === task.id))));
      setRowErrors({});
    }
    setTaskId(id); setFilter('all'); setBulkMsg(null);
  };
  const [filter, setFilter] = useState<Filter>('all');
  const [groupFilter, setGroupFilter] = useState<'all' | number>('all');
  // Unsaved edits per submission, plus per-row save state.
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [bulkMsg, setBulkMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Unsaved scores: warn before leaving the page, and hold off automatic updates.
  const hasDrafts = Object.keys(drafts).length > 0;
  useUnsavedWork(hasDrafts);

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

  // ── Drafts ──
  const currentOf = (sub: AssignmentSubmission): Draft => drafts[sub.submission_id] ?? storedDraft(sub);
  const setDraft = (sub: AssignmentSubmission, d: Draft) => {
    setBulkMsg(null);
    setRowErrors(e => { const { [sub.submission_id]: _x, ...rest } = e; return rest; });
    setDrafts(prev => {
      const { [sub.submission_id]: _old, ...rest } = prev;
      return sameDraft(d, storedDraft(sub)) ? rest : { ...rest, [sub.submission_id]: d };
    });
  };
  const flash = (id: string) => {
    setFlashIds(f => new Set(f).add(id));
    setTimeout(() => setFlashIds(f => { const n = new Set(f); n.delete(id); return n; }), 2000);
  };

  /** Save one submission's draft. Returns false when it could not be saved. */
  const saveSub = async (sub: AssignmentSubmission): Promise<boolean> => {
    const d = drafts[sub.submission_id];
    if (!d) return true;
    const r = draftToGrade(d, maxScore);
    if ('error' in r) { setRowErrors(e => ({ ...e, [sub.submission_id]: r.error })); return false; }
    setSavingIds(x => new Set(x).add(sub.submission_id));
    try {
      await onSaveGrade(sub.submission_id, r.grade);
      setDrafts(prev => { const { [sub.submission_id]: _x, ...rest } = prev; return rest; });
      setRowErrors(e => { const { [sub.submission_id]: _x, ...rest } = e; return rest; });
      flash(sub.submission_id);
      return true;
    } catch (err) {
      setRowErrors(e => ({ ...e, [sub.submission_id]: `บันทึกไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}` }));
      return false;
    } finally {
      setSavingIds(x => { const n = new Set(x); n.delete(sub.submission_id); return n; });
    }
  };

  // Unsaved rows of this task (all groups / filters).
  const dirtySubs = rows.map(r => r.sub).filter((x): x is AssignmentSubmission => !!x && !!drafts[x.submission_id]);

  const saveAll = async () => {
    if (!dirtySubs.length) return;
    setBulkMsg(null);
    setBulk({ done: 0, total: dirtySubs.length });
    let ok = 0, done = 0;
    for (let i = 0; i < dirtySubs.length; i += 8) {
      const res = await Promise.all(dirtySubs.slice(i, i + 8).map(async sub => {
        const r = await saveSub(sub);
        done++; setBulk({ done, total: dirtySubs.length });
        return r;
      }));
      ok += res.filter(Boolean).length;
    }
    setBulk(null);
    const failed = dirtySubs.length - ok;
    setBulkMsg(failed
      ? { ok: false, text: `บันทึกแล้ว ${ok} รายการ · ไม่สำเร็จ ${failed} รายการ (ดูข้อความสีแดงในแต่ละแถว)` }
      : { ok: true, text: `บันทึกแล้ว ${ok} รายการ` });
  };

  const discardAll = () => {
    if (!window.confirm(`ยกเลิกคะแนนที่ยังไม่ได้บันทึก ${dirtySubs.length} รายการ?`)) return;
    setDrafts(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => !dirtySubs.some(s => s.submission_id === id))));
    setRowErrors({});
    setBulkMsg(null);
  };

  // ── "Full score for everyone": fills the score fields only; saving is separate ──
  const bulkTargets = rows
    .filter(r => r.sub && (groupFilter === 'all' || r.group === groupFilter))
    .map(r => r.sub!);
  const allFull = maxScore !== null && bulkTargets.length > 0
    && bulkTargets.every(sub => currentOf(sub).score.trim() !== '' && Number(currentOf(sub).score) === maxScore);

  const toggleAllFull = (checked: boolean) => {
    if (maxScore === null) return;
    setBulkMsg(null);
    setRowErrors({});
    setDrafts(prev => {
      const next = { ...prev };
      for (const sub of bulkTargets) {
        const cur = prev[sub.submission_id] ?? storedDraft(sub);
        const stored = storedDraft(sub);
        // Unticking puts back the saved score (or empty if the saved one was the full score).
        const score = checked ? String(maxScore)
          : (stored.score.trim() !== '' && Number(stored.score) !== maxScore ? stored.score : '');
        const d = { score, feedback: cur.feedback };
        if (sameDraft(d, stored)) delete next[sub.submission_id]; else next[sub.submission_id] = d;
      }
      return next;
    });
  };

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
      {/* Task picker: numbered in assignment order, grouped by week */}
      {(() => {
        const q = taskQuery.trim().toLowerCase();
        const shown = tasks
          .filter(t => !q || t.title.toLowerCase().includes(q) || String(t.order) === q)
          .filter(t => {
            const st = taskStats.get(t.id)!;
            return taskFilter === 'all' ? true
              : taskFilter === 'pending' ? st.pending > 0
              : st.submitted > 0 && st.pending === 0;
          })
          .sort((a, b) => (a.week ?? 999) - (b.week ?? 999) || (taskSort === 'assigned' ? a.order - b.order
            : (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || a.order - b.order));
        const pendingTasks = tasks.filter(t => (taskStats.get(t.id)?.pending ?? 0) > 0).length;
        const doneTasks = tasks.filter(t => { const st = taskStats.get(t.id)!; return st.submitted > 0 && st.pending === 0; }).length;
        // One collapsible group per week, in week order.
        const sections: { week: number | null; key: string; items: Task[] }[] = [];
        for (const t of shown) {
          const last = sections[sections.length - 1];
          if (last && last.week === t.week) last.items.push(t);
          else sections.push({ week: t.week, key: t.week === null ? 'none' : String(t.week), items: [t] });
        }
        // Searching opens every group; otherwise the selected task's week starts open.
        const isOpen = (sec: typeof sections[number]) =>
          q ? true : weekOpen[sec.key] ?? sec.items.some(t => t.id === task.id);
        const setAll = (open: boolean) =>
          setWeekOpen(Object.fromEntries(sections.map(sec => [sec.key, open])));
        const chip = (key: typeof taskFilter, label: string, n: number) => (
          <button
            key={key}
            type="button"
            onClick={() => setTaskFilter(key)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
              taskFilter === key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label} <span className="opacity-70">({n})</span>
          </button>
        );
        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-auto">
                <ClipboardCheck size={13} className="text-indigo-500" /> เลือกงานที่จะตรวจ
                <span className="font-normal text-slate-400">· {tasks.length} งาน</span>
              </p>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={taskQuery}
                  onChange={e => setTaskQuery(e.target.value)}
                  placeholder="ค้นหาชื่องาน หรือเลขลำดับ"
                  className="w-52 pl-7 pr-2 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <select
                aria-label="เรียงงาน"
                value={taskSort}
                onChange={e => setTaskSort(e.target.value as typeof taskSort)}
                className="px-2 py-1.5 text-[11px] font-bold text-slate-600 border border-slate-200 rounded-lg bg-white"
              >
                <option value="assigned">ในสัปดาห์: เรียงตามลำดับการสั่งงาน</option>
                <option value="due">ในสัปดาห์: เรียงตามกำหนดส่ง</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {chip('all', 'ทุกงาน', tasks.length)}
              {chip('pending', 'มีงานรอตรวจ', pendingTasks)}
              {chip('done', 'ตรวจครบแล้ว', doneTasks)}
              {sections.length > 1 && !q && (
                <span className="ml-auto flex items-center gap-1">
                  <button type="button" onClick={() => setAll(true)}
                    className="px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50 rounded-lg">ขยายทุกสัปดาห์</button>
                  <button type="button" onClick={() => setAll(false)}
                    className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg">ยุบทุกสัปดาห์</button>
                </span>
              )}
            </div>

            <div className="max-h-[440px] overflow-y-auto -mx-1 px-1 space-y-2">
              {shown.length === 0 && (
                <p className="text-[11px] text-slate-400 italic text-center py-6">ไม่พบงานตามเงื่อนไขนี้</p>
              )}
              {sections.map(sec => {
                const open = isOpen(sec);
                const secPending = sec.items.reduce((n, t) => n + (taskStats.get(t.id)?.pending ?? 0), 0);
                const secDone = sec.items.every(t => { const st = taskStats.get(t.id)!; return st.submitted > 0 && st.pending === 0; });
                const hasSelected = sec.items.some(t => t.id === task.id);
                return (
                <div key={sec.key} className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setWeekOpen(w => ({ ...w, [sec.key]: !open }))}
                    aria-expanded={open}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition ${open ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <ChevronRight size={13} className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
                    <span className="text-xs font-black text-slate-700">
                      {sec.week !== null ? `สัปดาห์ที่ ${sec.week}` : 'ไม่ระบุสัปดาห์'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {sec.items.length} งาน · ลำดับที่ {sec.items[0].order}{sec.items.length > 1 ? `–${sec.items[sec.items.length - 1].order}` : ''}
                    </span>
                    {hasSelected && !open && <span className="text-[10px] font-bold text-indigo-600">· กำลังตรวจงานในสัปดาห์นี้</span>}
                    <span className="ml-auto">
                      {secPending > 0 ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">รอตรวจ {secPending}</span>
                      ) : secDone ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle size={11} /> ตรวจครบ</span>
                      ) : null}
                    </span>
                  </button>
                  {open && (
                  <div className="p-1.5 space-y-1.5 border-t border-slate-100">
                  {sec.items.map(t => {
                    const st = taskStats.get(t.id)!;
                    const active = t.id === task.id;
                    const pct = roster.length ? Math.round((st.submitted / roster.length) * 100) : 0;
                    const due = dueState(t.dueDate);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectTask(t.id)}
                        className={`w-full text-left flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                          active ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${
                          active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`} title={`งานที่ ${t.order} (ตามลำดับการสั่งงาน)`}>
                          {t.order}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            {t.kind === 'activity' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded"><Zap size={8} /> Active Learning</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded"><ClipboardList size={8} /> งานมอบหมาย</span>
                            )}
                            <span className="text-xs font-bold text-slate-800 truncate">{t.title}</span>
                          </span>
                          <span className="flex items-center gap-2 mt-1">
                            <span className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden shrink-0">
                              <span className="block h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                            </span>
                            <span className="text-[10px] text-slate-500">ส่ง {st.submitted}/{roster.length}</span>
                            {t.dueDate && (
                              <span className={`text-[10px] ${due === 'past' ? 'text-slate-400' : due === 'soon' ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                · กำหนดส่ง {fmtDue(t.dueDate)}{due === 'past' ? ' (เลยกำหนด)' : due === 'soon' ? ' (ใกล้ถึง)' : ''}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          {st.pending > 0 ? (
                            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">รอตรวจ {st.pending}</span>
                          ) : st.submitted > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle size={11} /> ตรวจครบ</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">ยังไม่มีคนส่ง</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Selected task */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                งานที่ {task.order} / {tasks.length}
              </span>
              {task.week !== null && <span className="text-[10px] font-semibold text-slate-500">สัปดาห์ที่ {task.week}</span>}
              {task.createdAt && <span className="text-[10px] text-slate-400">สั่งงานเมื่อ {fmtTime(task.createdAt)}</span>}
            </div>
            <h3 className="text-sm font-black text-slate-900">
              {task.title}
              {onOpenTask && (
                <button
                  type="button"
                  onClick={() => onOpenTask(task.id)}
                  title="เปิดรายละเอียดงานในหน้าวิชา"
                  className="ml-2 inline-flex items-center gap-1 align-middle text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-2"
                >
                  <ExternalLink size={10} /> ดูรายละเอียดงาน
                </button>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
              {task.dueDate && <span className="flex items-center gap-1"><Clock size={10} /> กำหนดส่ง {task.dueDate}</span>}
              <span>ส่งแล้ว {counts.all - counts.missing}/{counts.all} คน</span>
              {avg !== null && <span>คะแนนเฉลี่ย {avg.toFixed(2)}{maxScore !== null && ` / ${maxScore}`} ({scores.length} คน)</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                disabled={task.order <= 1}
                onClick={() => selectTask(tasks[task.order - 2].id)}
                title="งานก่อนหน้า"
                className="px-2 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 inline-flex items-center gap-0.5"
              >
                <ChevronLeft size={12} /> ก่อนหน้า
              </button>
              <button
                type="button"
                disabled={task.order >= tasks.length}
                onClick={() => selectTask(tasks[task.order].id)}
                title="งานถัดไป"
                className="px-2 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 border-l border-slate-200 inline-flex items-center gap-0.5"
              >
                ถัดไป <ChevronRight size={12} />
              </button>
            </div>
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

        {/* Full score for everyone (fills fields) + save all — stays visible while scrolling */}
        <div className={`sticky top-0 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 shadow-sm ${
          dirtySubs.length ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-slate-50'
        }`}>
          <label className={`inline-flex items-center gap-2 text-xs font-bold select-none ${maxScore === null || bulkTargets.length === 0 || bulk ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800 cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={allFull}
              disabled={maxScore === null || bulkTargets.length === 0 || !!bulk}
              onChange={e => toggleAllFull(e.target.checked)}
              className="w-4 h-4 accent-emerald-600"
            />
            ให้คะแนนเต็มทุกคนที่ส่งงาน
            {maxScore !== null && <span className="font-normal text-slate-500">({maxScore} คะแนน · {bulkTargets.length} คน{groupFilter !== 'all' ? ` ในกลุ่ม ${groupFilter}` : ''})</span>}
          </label>
          <span className="text-[10px] text-slate-500">
            {maxScore === null ? 'กำหนดคะแนนเต็มก่อน'
              : bulkTargets.length === 0 ? 'ยังไม่มีนักศึกษาส่งงานนี้'
              : 'ใส่คะแนนลงในช่องเท่านั้น · กดบันทึกเพื่อบันทึกจริง'}
          </span>

          <span className="ml-auto flex items-center gap-2">
            {bulk ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-indigo-700 font-bold">
                <Save size={11} className="animate-pulse" /> กำลังบันทึก {bulk.done}/{bulk.total}
              </span>
            ) : bulkMsg ? (
              <span className={`text-[11px] font-bold ${bulkMsg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{bulkMsg.text}</span>
            ) : dirtySubs.length > 0 ? (
              <span className="text-[11px] font-bold text-indigo-700">ยังไม่ได้บันทึก {dirtySubs.length} รายการ</span>
            ) : null}
            {dirtySubs.length > 0 && !bulk && (
              <button
                type="button"
                onClick={discardAll}
                className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              >
                ยกเลิกการแก้ไข
              </button>
            )}
            <button
              type="button"
              onClick={saveAll}
              disabled={!dirtySubs.length || !!bulk}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Save size={12} /> บันทึกทั้งหมด{dirtySubs.length ? ` (${dirtySubs.length})` : ''}
            </button>
          </span>
        </div>

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
              draft={r.sub ? drafts[r.sub.submission_id] : undefined}
              onDraft={d => r.sub && setDraft(r.sub, d)}
              onSave={() => { if (r.sub) void saveSub(r.sub); }}
              saving={!!r.sub && savingIds.has(r.sub.submission_id)}
              error={r.sub ? rowErrors[r.sub.submission_id] ?? '' : ''}
              savedFlash={!!r.sub && flashIds.has(r.sub.submission_id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
