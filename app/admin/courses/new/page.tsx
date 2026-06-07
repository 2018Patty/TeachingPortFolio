'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCourse } from '@/app/admin/actions';
import { 
  ArrowLeft, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields State
  const [courseCode, setCourseCode] = useState('');
  const [courseNameTh, setCourseNameTh] = useState('');
  const [courseNameEn, setCourseNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [semesterId, setSemesterId] = useState(1);
  const [year, setYear] = useState(2026);
  const [credit, setCredit] = useState('3((3)-0-6)');
  const [section, setSection] = useState('01');

  // Objectives (CLOs) Dynamic list
  const [objectives, setObjectives] = useState<string[]>([
    'เข้าใจทฤษฎีและเนื้อหาพื้นฐานตามรายวิชาการศึกษา',
  ]);

  const handleAddObjective = () => {
    setObjectives([...objectives, '']);
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const updated = [...objectives];
    updated[index] = value;
    setObjectives(updated);
  };

  const handleRemoveObjective = (index: number) => {
    if (objectives.length <= 1) return; // Must keep at least one
    const updated = objectives.filter((_, i) => i !== index);
    setObjectives(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !courseNameTh || !courseNameEn) {
      setError('กรุณากรอกรหัสวิชา และชื่อวิชาให้ถูกต้องครบถ้วน');
      return;
    }

    // Filter out blank objectives
    const finalObjectives = objectives
      .map(o => o.trim())
      .filter(o => o.length > 0);

    if (finalObjectives.length === 0) {
      setError('กรุณาเพิ่มวัตถุประสงค์รายวิชาอย่างน้อย 1 รายการ');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await createCourse({
        course_code: courseCode,
        course_name_th: courseNameTh,
        course_name_en: courseNameEn,
        description,
        objectives: finalObjectives,
        semester_id: semesterId,
        year: year,
        credit,
        section
      });

      if (res && res.success) {
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการลงทะเบียนหลักสูตรวิชาพจนานุกรม');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Title Header Navbar */}
      <nav className="w-full bg-slate-900 text-white py-3.5 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white shrink-0">
              <GraduationCap size={18} />
            </div>
            <div>
              <span className="font-bold text-sm block leading-none">
                ลงทะเบียนคอร์สใหม่
              </span>
              <span className="text-[10px] text-indigo-300 font-bold leading-none">ผศ.ดร.ภัทราพร วรินทรเวช</span>
            </div>
          </div>

          <Link 
            href="/admin/dashboard"
            className="text-xs font-bold text-slate-300 hover:text-white border border-slate-700 px-3.5 py-2 rounded-xl bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>กลับบอร์ดควบคุม</span>
          </Link>
        </div>
      </nav>

      {/* Main Form content container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles size={22} className="text-[#4F46E5] animate-pulse" />
            <span>เพิ่มวิชาเรียนใหม่เข้าระบบ</span>
          </h1>
          <p className="text-slate-500 text-xs italic mt-1">
            กรุณากรอกระบุเนื้อหาให้ครบถ้วนตามหลักสูตร WCAG เพื่อความถูกต้องของรายแผนงานการทบทวนของนักศึกษา
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-2 text-rose-800 text-xs font-bold">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card Frame 1: Core Fields values */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider pb-3 border-b border-slate-100">
              ข้อมูลกลุ่มและสิทธิ์วิชา
            </h3>

            {/* Code / Semester / Year Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  รหัสวิชา (Course Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น CS-101 หรือ 928-221"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  เลือกเทอมการสอน (Semester) *
                </label>
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(Number(e.target.value))}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-bold"
                >
                  <option value={1}>เทอม 1 (Semester 1)</option>
                  <option value={2}>เทอม 2 (Semester 2)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ปีการศึกษาคริสต์ (Academic Year) *
                </label>
                <input
                  type="number"
                  required
                  min={2020}
                  max={2050}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-bold"
                />
              </div>
            </div>

            {/* Th name / En name / Credit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ชื่อหลักสูตรภาษาไทย (Thai Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น การพัฒนาเว็บขั้นสูง"
                  value={courseNameTh}
                  onChange={(e) => setCourseNameTh(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ชื่อหลักสูตรภาษาอังกฤษ (English Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ADVANCED WEB DEVELOPMENT"
                  value={courseNameEn}
                  onChange={(e) => setCourseNameEn(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold uppercase"
                />
              </div>
            </div>

            {/* Credit / Section details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  หน่วยกิตประเมิน (Credit)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 3((3)-0-6)"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ประยุกต์กลุ่มเซก (Section)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 01 หรือ 02"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Course Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                รายละเอียดบรรยายหลักสูตร (Description)
              </label>
              <textarea
                rows={4}
                placeholder="อธิบายโครงสร้างหัวข้อ ขอบเขต เนื้อหาวิชา และแผนการตัดสินใจเบื้องต้น"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400 leading-relaxed font-normal whitespace-pre-wrap"
              />
            </div>
          </div>

          {/* Card Frame 2: Objectives Dynamic List */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
                  วัตถุประสงค์วิชา (Course Learning Outcomes - CLOs)
                </h3>
                <p className="text-[10px] text-slate-400 italic mt-0.5">ระบุวัตถุประสงค์สำคัญที่ต้องการให้ผู้เรียนบรรลุเมื่อจบคอร์สนี้</p>
              </div>

              <button
                type="button"
                onClick={handleAddObjective}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-white border border-indigo-200/60 hover:bg-[#4F46E5] px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer"
              >
                <Plus size={14} />
                <span>เพิ่มวัตถุประสงค์</span>
              </button>
            </div>

            {/* List entries */}
            <div className="space-y-3.5">
              {objectives.map((obj, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-xs text-indigo-700 font-bold shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={`เป้าหมายที่ ${index + 1} เช่น เข้าใจวิธีการพัฒนาและคุ้มครองความปลอดภัยระบบ`}
                    value={obj}
                    onChange={(e) => handleObjectiveChange(index, e.target.value)}
                    className="block w-full px-4 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
                  />
                  <button
                    type="button"
                    disabled={objectives.length <= 1}
                    onClick={() => handleRemoveObjective(index)}
                    className="p-2 border border-slate-200/60 hover:border-red-100 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link
              href="/admin/dashboard"
              className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-5 py-3 rounded-xl font-bold transition duration-150 cursor-pointer"
            >
              ยกเลิกและย้อนกลับ
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-100 transition duration-150 cursor-pointer"
            >
              {loading ? 'กำลังลงทะเบียนจัดโครงร่าง...' : 'ยืนยันลงทะเบียนหลักสูตร'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
