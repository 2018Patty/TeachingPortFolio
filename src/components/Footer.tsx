/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, MapPin, Award, Building2, GraduationCap } from 'lucide-react';

interface FooterProps {
  name: string;
  title?: string;
  department?: string;
  faculty?: string;
  university?: string;
  bio?: string;
}

export const Footer: React.FC<FooterProps> = ({
  name, title, department, faculty, university, bio
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          {/* Col 1: Instructor / Affiliation info */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Award size={18} className="text-indigo-400" />
              <span>{name}</span>
            </div>
            {bio ? (
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm pl-7">{bio}</p>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm pl-7">
                แฟ้มสะสมผลงานวิชาการและการจัดการความรู้รายวิชา
              </p>
            )}
          </div>

          {/* Col 2: Institutional context */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">สังกัด</h4>
            {department && (
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <BookOpen size={13} className="text-slate-500 mt-0.5 shrink-0" />
                <span>{department}</span>
              </div>
            )}
            {faculty && (
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <Building2 size={13} className="text-slate-500 mt-0.5 shrink-0" />
                <span>{faculty}</span>
              </div>
            )}
            {university && (
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <GraduationCap size={13} className="text-slate-500 mt-0.5 shrink-0" />
                <span>{university}</span>
              </div>
            )}
            {!department && !faculty && !university && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin size={13} className="shrink-0" />
                <span>ยังไม่ได้ระบุสังกัด</span>
              </div>
            )}
          </div>

          {/* Col 3: System info */}
          <div className="flex flex-col gap-1.5 justify-center">
            <div className="text-xs text-slate-500">
              ระบบจัดการความรู้รายวิชา 1.0 (มิถุนายน 2026)
            </div>
            <div className="text-[11px] text-slate-600">
              ขับเคลื่อนด้วย React, Tailwind CSS และ Supabase
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
          <div>&copy; {currentYear} {name}. สงวนลิขสิทธิ์ทั้งหมด</div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-500">พร้อมใช้งานสำหรับการเผยแพร่สู่สาธารณะ</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
