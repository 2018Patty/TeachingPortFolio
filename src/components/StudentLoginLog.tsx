import React, { useMemo, useState } from 'react';
import { Clock, Search, ChevronDown, ChevronRight, Users, LogIn } from 'lucide-react';
import { StudentProfile, StudentCourseVisit } from '../types';
import { compareStudents } from '../utils/studentOrder';

interface StudentLoginLogProps {
  students: StudentProfile[];
  loginLogs: StudentCourseVisit[];
}

const fmtDateTime = (iso?: string) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) + ' น.';
};

const fmtRelative = (iso?: string) => {
  if (!iso) return '';
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'เมื่อสักครู่';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} วันที่แล้ว`;
  return '';
};

export const StudentLoginLog: React.FC<StudentLoginLogProps> = ({ students, loginLogs }) => {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const byStudent = new Map<string, string[]>();
    loginLogs.forEach(l => {
      if (!l.visited_at) return;
      const list = byStudent.get(l.student_id) || [];
      list.push(l.visited_at);
      byStudent.set(l.student_id, list);
    });
    return students
      .map(s => {
        const times = (byStudent.get(s.id) || []).sort((a, b) => b.localeCompare(a));
        return { student: s, times, last: times[0] };
      })
      .sort((a, b) => compareStudents(a.student, b.student));
  }, [students, loginLogs]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter(({ student: s }) =>
        [s.student_id, s.first_name, s.last_name, s.email].some(v => (v || '').toLowerCase().includes(q)))
    : rows;

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const loginsToday = loginLogs.filter(l =>
    l.visited_at && new Date(l.visited_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) === today
  );
  const studentsToday = new Set(loginsToday.map(l => l.student_id)).size;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
          <Clock size={18} className="text-indigo-500" />
          การเข้าใช้งานของนักศึกษา
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          บันทึกวันและเวลาที่นักศึกษาเข้าสู่ระบบ (เวลาประเทศไทย) — บันทึกครั้งละ 1 รายการต่อการเปิดเว็บ
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5"><Users size={12} /> นักศึกษาที่ลงทะเบียน</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{students.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5"><LogIn size={12} /> เข้าใช้งานวันนี้</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{studentsToday} <span className="text-xs font-semibold text-slate-400">คน</span></div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5"><Clock size={12} /> จำนวนการเข้าสู่ระบบทั้งหมด</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{loginLogs.length} <span className="text-xs font-semibold text-slate-400">ครั้ง</span></div>
        </div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ค้นหารหัสนักศึกษา ชื่อ หรืออีเมล"
          className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left font-semibold px-4 py-3">นักศึกษา</th>
                <th className="text-left font-semibold px-4 py-3">รหัสนักศึกษา</th>
                <th className="text-left font-semibold px-4 py-3">เข้าสู่ระบบล่าสุด</th>
                <th className="text-right font-semibold px-4 py-3">จำนวนครั้ง</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center text-slate-400 py-8">ไม่พบข้อมูลนักศึกษา</td></tr>
              )}
              {filtered.map(({ student: s, times, last }) => {
                const open = expandedId === s.id;
                const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email || '-';
                return (
                  <React.Fragment key={s.id}>
                    <tr
                      onClick={() => times.length && setExpandedId(open ? null : s.id)}
                      className={`border-t border-slate-100 ${times.length ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {times.length > 0
                            ? (open ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />)
                            : <span className="w-3" />}
                          <div>
                            <div className="font-semibold text-slate-800">{name}</div>
                            <div className="text-[10px] text-slate-400">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{s.student_id || '-'}</td>
                      <td className="px-4 py-3">
                        {last ? (
                          <>
                            <div className="text-slate-700">{fmtDateTime(last)}</div>
                            <div className="text-[10px] text-emerald-600">{fmtRelative(last)}</div>
                          </>
                        ) : (
                          <span className="text-slate-400">ยังไม่มีข้อมูล</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-600">{times.length}</td>
                    </tr>
                    {open && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={4} className="px-10 py-3">
                          <div className="text-[10px] font-semibold text-slate-500 mb-2">ประวัติการเข้าสู่ระบบ</div>
                          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {times.map((t, i) => (
                              <li key={t + i} className="text-slate-600">
                                <span className="text-slate-400 mr-1.5">{times.length - i}.</span>{fmtDateTime(t)}
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-slate-400">
        * เริ่มบันทึกตั้งแต่เปิดใช้ฟีเจอร์นี้ การเข้าใช้งานก่อนหน้านั้นจะไม่มีข้อมูล
      </p>
    </div>
  );
};
