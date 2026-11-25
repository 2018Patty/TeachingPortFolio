import React, { useState } from 'react';
import { CheckCircle, ChevronDown, History, Pencil, Trash2 } from 'lucide-react';
import { AssignmentSubmission } from '../types';
import { SubmissionContent, GradeFeedback } from './GradingSection';
import { isLateSubmission, isGraded } from '../utils/grading';

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

/**
 * A student's own submission of one assignment: the latest attempt (with its
 * links clickable), grade/feedback, an edit button, and the log of earlier attempts.
 */
export const MySubmission: React.FC<{
  attempts: AssignmentSubmission[];   // newest first, at least one
  dueDate?: string;
  canEdit: boolean;
  onEdit: (latest: AssignmentSubmission) => void;
  onDelete?: (sub: AssignmentSubmission) => void;   // offered while canEdit, for ungraded attempts
}> = ({ attempts, dueDate, canEdit, onEdit, onDelete }) => {
  const [showLog, setShowLog] = useState(false);
  const latest = attempts[0];
  if (!latest) return null;
  const n = attempts.length;
  return (
    <div className="mt-2 space-y-2 w-full">
      <div className="flex items-center gap-1.5 flex-wrap text-emerald-600 text-xs font-semibold">
        <CheckCircle size={13} />
        <span>ส่งงานแล้ว</span>
        {n > 1 && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">ครั้งที่ {n}</span>}
        <span className="text-[10px] text-slate-400 font-normal">{fmt(latest.submitted_at)}</span>
        {isLateSubmission(latest.submitted_at, dueDate) && (
          <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">ส่งช้า</span>
        )}
      </div>
      <SubmissionContent sub={latest} />
      <GradeFeedback note={latest.note} />
      <div className="flex items-center gap-2 flex-wrap">
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(latest)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
          >
            <Pencil size={11} /> แก้ไข / ส่งงานใหม่
          </button>
        )}
        {canEdit && onDelete && !isGraded(latest.note) && (
          <button
            type="button"
            onClick={() => onDelete(latest)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition"
          >
            <Trash2 size={11} /> {n > 1 ? 'ลบงานครั้งนี้' : 'ลบงานที่ส่ง'}
          </button>
        )}
        {n > 1 && (
          <button
            type="button"
            onClick={() => setShowLog(!showLog)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition"
          >
            <History size={11} /> ประวัติการส่ง ({n} ครั้ง)
            <ChevronDown size={11} className={`transition-transform ${showLog ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      {canEdit && isGraded(latest.note) && (
        <p className="text-[10px] text-slate-400">งานที่ผู้สอนตรวจแล้วลบไม่ได้ แต่ส่งงานใหม่ได้</p>
      )}
      {showLog && n > 1 && (
        <SubmissionLog attempts={attempts} dueDate={dueDate} onDelete={canEdit ? onDelete : undefined} />
      )}
    </div>
  );
};

/** Earlier attempts (all but the newest), newest first. */
export const SubmissionLog: React.FC<{
  attempts: AssignmentSubmission[];
  dueDate?: string;
  onDelete?: (sub: AssignmentSubmission) => void;
}> = ({ attempts, dueDate, onDelete }) => (
  <div className="border-l-2 border-slate-200 pl-3 space-y-3">
    {attempts.slice(1).map((s, i) => (
      <div key={s.submission_id} className="space-y-1.5">
        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 flex-wrap">
          ครั้งที่ {attempts.length - 1 - i} · {fmt(s.submitted_at)}
          {isLateSubmission(s.submitted_at, dueDate) && <span className="text-red-600">· ส่งช้า</span>}
          {onDelete && !isGraded(s.note) && (
            <button
              type="button"
              onClick={() => onDelete(s)}
              className="inline-flex items-center gap-1 ml-auto text-[10px] font-bold text-red-500 hover:text-red-700"
            >
              <Trash2 size={10} /> ลบ
            </button>
          )}
        </p>
        <div className="opacity-80"><SubmissionContent sub={s} /></div>
        <GradeFeedback note={s.note} compact />
      </div>
    ))}
  </div>
);
