/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Filter, RefreshCw } from 'lucide-react';

interface SemesterSelectorProps {
  selectedSemester: number;
  selectedYear: number;
  yearsList: number[];
  onChange: (semester: number, year: number) => void;
  instructorName?: string;
  instructorFaculty?: string;
}

export const SemesterSelector: React.FC<SemesterSelectorProps> = ({
  selectedSemester,
  selectedYear,
  yearsList,
  onChange,
  instructorName,
  instructorFaculty,
}) => {
  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(Number(e.target.value), selectedYear);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(selectedSemester, Number(e.target.value));
  };

  const handleReset = () => {
    onChange(1, 2026);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Helper title & decoration */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-[#4F46E5] shrink-0">
            <Filter size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">
              เลือกปีการศึกษา / เทอมที่สอน
            </h3>
            <p className="text-xs text-slate-400 italic">
              {[instructorName, instructorFaculty].filter(Boolean).join(' — ')}
            </p>
          </div>
        </div>

        {/* Dynamic Editorial Selection Component */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200/80 shadow-sm self-start md:self-auto">
          <div className="flex flex-col">
            <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 px-2 leading-none mb-1">
              ปีการศึกษา / เทอม
            </label>
            <div className="flex items-center gap-2 px-2">
              <select
                id="semester-select"
                value={selectedSemester}
                onChange={handleSemesterChange}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer border-0 p-0"
              >
                <option value={1}>ภาคเรียนที่ 1</option>
                <option value={2}>ภาคเรียนที่ 2</option>
              </select>
              <span className="text-slate-300 text-xs font-light">/</span>
              <select
                id="year-select"
                value={selectedYear}
                onChange={handleYearChange}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer border-0 p-0"
              >
                {yearsList.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 text-xs font-bold text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
          >
            เริ่มต้น
          </button>
        </div>
      </div>

      {/* Selected Tag summary */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-200/60 flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">ภาคเรียนปัจจุบัน:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100/60">
          ภาคเรียนที่ {selectedSemester}/{selectedYear} (พ.ศ. {selectedYear + 543})
        </span>
      </div>
    </div>
  );
};
