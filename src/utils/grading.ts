// Grading of assignment submissions.
//
// Stored in assignment_submissions.note (no DB schema change):
//  - '' / plain text          → not graded (plain text is an old free-form note)
//  - '{"grade":{…},"note":…}' → graded; "note" keeps any old free-form note

export interface SubmissionGrade {
  score: number | null;      // null = feedback only, no score yet
  max_score: number | null;
  feedback: string;
  graded_at: string;         // ISO time
}

type Stored = { grade?: Partial<SubmissionGrade>; note?: string };

const parseStored = (note?: string | null): Stored | null => {
  const s = (note || '').trim();
  if (!s.startsWith('{')) return null;
  try {
    const o = JSON.parse(s);
    return o && typeof o === 'object' && o.grade && typeof o.grade === 'object' ? o as Stored : null;
  } catch {
    return null;
  }
};

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export const parseGrade = (note?: string | null): SubmissionGrade | null => {
  const g = parseStored(note)?.grade;
  if (!g) return null;
  return {
    score: num(g.score),
    max_score: num(g.max_score),
    feedback: typeof g.feedback === 'string' ? g.feedback : '',
    graded_at: typeof g.graded_at === 'string' ? g.graded_at : '',
  };
};

/** The free-form note part (old data), without grading JSON. */
export const legacyNote = (note?: string | null): string => {
  const stored = parseStored(note);
  if (stored) return typeof stored.note === 'string' ? stored.note : '';
  return (note || '').trim();
};

/** New value for assignment_submissions.note; grade = null clears the grading. */
export const buildGradeNote = (grade: SubmissionGrade | null, oldNote?: string | null): string => {
  const legacy = legacyNote(oldNote);
  if (!grade) return legacy;
  return JSON.stringify({ grade, ...(legacy ? { note: legacy } : {}) });
};

export const isGraded = (note?: string | null): boolean => {
  const g = parseGrade(note);
  return !!g && (g.score !== null || g.feedback.trim() !== '');
};

export const formatScore = (g: SubmissionGrade): string =>
  g.score === null ? '' : g.max_score !== null ? `${g.score} / ${g.max_score}` : String(g.score);

/** Submitted after the end of the due date (local time)? */
export const isLateSubmission = (submittedAt?: string, dueDate?: string): boolean => {
  if (!submittedAt || !dueDate || !/^\d{4}-\d{2}-\d{2}/.test(dueDate)) return false;
  return new Date(submittedAt).getTime() > new Date(`${dueDate.slice(0, 10)}T23:59:59`).getTime();
};

// ── Submission attempts ──────────────────────────────────────────────────────
// Every submit / edit inserts a new assignment_submissions row, so the rows of one
// student for one assignment form the submission log. The newest is the current one.

type SubLike = { student_id: string; assignment_id: string; submitted_at?: string };

const ts = (iso?: string) => (iso ? new Date(iso).getTime() || 0 : 0);
const newestFirst = <T extends SubLike>(a: T, b: T) => ts(b.submitted_at) - ts(a.submitted_at);

/** All attempts of one student for one assignment, newest first. */
export const attemptsOf = <T extends SubLike>(subs: T[], studentId: string, assignmentId: string): T[] =>
  subs.filter(s => s.student_id === studentId && s.assignment_id === assignmentId).sort(newestFirst);

/** Only the newest attempt per (student, assignment). */
export const latestAttempts = <T extends SubLike>(subs: T[]): T[] => {
  const seen = new Map<string, T>();
  for (const s of [...subs].sort(newestFirst)) {
    const k = `${s.student_id}|${s.assignment_id}`;
    if (!seen.has(k)) seen.set(k, s);
  }
  return Array.from(seen.values());
};
