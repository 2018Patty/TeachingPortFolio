'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Course, Material, Assignment, MaterialType, AssignmentStatus } from '@/src/types';
import { 
  updateCourse, 
  deleteCourse, 
  createMaterial, 
  deleteMaterial, 
  createAssignment, 
  deleteAssignment 
} from '@/app/admin/actions';
import { 
  ArrowLeft, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle,
  FileText,
  Video,
  Presentation,
  Link2,
  CalendarDays,
  Clock,
  Paperclip,
  CheckCircle,
  FolderOpen,
  Calendar,
  Upload,
  Check
} from 'lucide-react';

interface EditCourseFormProps {
  initialCourse: Course;
  initialMaterials: Material[];
  initialAssignments: Assignment[];
}

type TabType = 'info' | 'materials' | 'assignments';

export default function EditCourseForm({
  initialCourse,
  initialMaterials,
  initialAssignments,
}: EditCourseFormProps) {
  const router = useRouter();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<TabType>('info');

  // General loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Course Form States
  const [courseCode, setCourseCode] = useState(initialCourse.course_code);
  const [courseNameTh, setCourseNameTh] = useState(initialCourse.course_name_th);
  const [courseNameEn, setCourseNameEn] = useState(initialCourse.course_name_en);
  const [description, setDescription] = useState(initialCourse.description);
  const [semesterId, setSemesterId] = useState(initialCourse.semester_id);
  const [year, setYear] = useState(initialCourse.year);
  const [credit, setCredit] = useState(initialCourse.credit || '3((3)-0-6)');
  const [section, setSection] = useState(initialCourse.section || '01');
  const [objectives, setObjectives] = useState<string[]>(initialCourse.objectives || []);

  // Materials list & addition form states
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState<MaterialType>('slides');
  const [materialWeek, setMaterialWeek] = useState(1);
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [materialDesc, setMaterialDesc] = useState('');
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  // Assignments list & addition form states
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('2026-06-30');
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus>('open');
  const [assignmentAttachUrl, setAssignmentAttachUrl] = useState('');
  const [uploadingAssignment, setUploadingAssignment] = useState(false);

  // Objectives mutations
  const handleAddObjective = () => setObjectives([...objectives, '']);
  const handleObjectiveChange = (i: number, val: string) => {
    const updated = [...objectives];
    updated[i] = val;
    setObjectives(updated);
  };
  const handleRemoveObjective = (i: number) => {
    if (objectives.length <= 1) return;
    setObjectives(objectives.filter((_, idx) => idx !== i));
  };

  // Submit Course General Info changes
  const handleSaveCourseInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const finalObjectives = objectives.map(o => o.trim()).filter(o => o.length > 0);
    if (finalObjectives.length === 0) {
      setError('วัตถุประสงค์ (CLOs) จะต้องมีอย่างน้อย 1 รายการ');
      setLoading(false);
      return;
    }

    try {
      const res = await updateCourse(initialCourse.course_id, {
        course_code: courseCode,
        course_name_th: courseNameTh,
        course_name_en: courseNameEn,
        description,
        objectives: finalObjectives,
        semester_id: semesterId,
        year,
        credit,
        section
      });

      if (res && res.success) {
        setSuccessMsg('บันทึกรายละเอียดวิชาเสร็จสิ้นเรียบร้อยแล้ว');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถทำการแก้ไขเนื้อหาได้');
    } finally {
      setLoading(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async () => {
    if (!window.confirm('คุณยืนยันที่จะลบข้อมูลรายวิชานี้ คลังเอกสารทั้งหมด และตารางงานส่งนี้ออกจากฐานข้อมูลหรือไม่?')) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await deleteCourse(initialCourse.course_id);
      if (res && res.success) {
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดความขัดข้องในการลบรายวิชา');
      setLoading(false);
    }
  };

  // Upload handlers
  const handleStorageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'materials' | 'assignments'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (type === 'materials') setUploadingMaterial(true);
    else setUploadingAssignment(true);

    try {
      const sanitisedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filename = `${type}/${Date.now()}-${sanitisedName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(filename, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        // Storage bucket creation error or failure
        throw new Error(
          `ไม่พบ Storage bucket 'course-assets' บน Supabase ของคุณ โปรดเปิดใช้งาน bucket หรือคุณสามารถเลือกวาง ลิงก์ตรงที่ช่องที่กรอกได้โดยตรง: ${uploadError.message}`
        );
      }

      const { data: urlData } = supabase.storage
        .from('course-assets')
        .getPublicUrl(filename);

      if (type === 'materials') {
        setMaterialFileUrl(urlData.publicUrl);
        setSuccessMsg('อัปโหลดไฟล์สื่อการสอนสำเร็จแล้ว! ลิงก์ถูกกรอกให้คุณโดยอัตโนมัติ');
      } else {
        setAssignmentAttachUrl(urlData.publicUrl);
        setSuccessMsg('อัปโหลดไฟล์แนบการสั่งงานสำเร็จแล้ว! ลิงก์ถูกกรอกให้คุณโดยอัตโนมัติ');
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดความขัดข้องในการอัปโหลดไฟล์');
    } finally {
      setUploadingMaterial(false);
      setUploadingAssignment(false);
    }
  };

  // Submit new Material
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle || !materialFileUrl) {
      setError('กรุณากรอกหัวข้อ และกรอกลิงก์ไฟล์ของสื่อการสอน');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await createMaterial(initialCourse.course_id, {
        course_id: initialCourse.course_id,
        title: materialTitle,
        type: materialType,
        week_number: materialWeek,
        file_url: materialFileUrl,
        description: materialDesc
      });

      if (res && res.success) {
        // Optimistically insert locally to refresh UI instantly
        const newMat: Material = {
          material_id: res.material_id,
          course_id: initialCourse.course_id,
          title: materialTitle,
          type: materialType,
          week_number: materialWeek,
          file_url: materialFileUrl,
          description: materialDesc
        };
        setMaterials([...materials, newMat]);
        setMaterialTitle('');
        setMaterialFileUrl('');
        setMaterialDesc('');
        setMaterialWeek(prev => prev + 1);
        setSuccessMsg('เพิ่มสื่อการเรียนการสอนรายสัปดาห์เรียบร้อยแล้ว');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการลงทะเบียนเอกสาร');
    } finally {
      setLoading(false);
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (matId: string) => {
    if (!window.confirm('ต้องการลบไฟล์เอกสารสื่อชิ้นนี้จากระบบของวิชาธรรมหรือไม่?')) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await deleteMaterial(matId, initialCourse.course_id);
      if (res && res.success) {
        setMaterials(materials.filter(m => m.material_id !== matId));
        setSuccessMsg('ถอดถอนเอกสารสื่อชิ้นนี้จากสาระระบบเสร็จสิ้น');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อขัดข้อง');
    } finally {
      setLoading(false);
    }
  };

  // Submit new Assignment
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle) {
      setError('กรุณากรอกหัวชื่องานที่มอบหมาย');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await createAssignment({
        course_id: initialCourse.course_id,
        title: assignmentTitle,
        description: assignmentDesc,
        due_date: assignmentDueDate,
        attachment_url: assignmentAttachUrl,
        status: assignmentStatus
      });

      if (res && res.success) {
        // Optimistic setup update
        const newAsg: Assignment = {
          assignment_id: res.assignment_id,
          course_id: initialCourse.course_id,
          title: assignmentTitle,
          description: assignmentDesc,
          due_date: assignmentDueDate,
          attachment_url: assignmentAttachUrl,
          status: assignmentStatus
        };
        setAssignments([...assignments, newAsg]);
        setAssignmentTitle('');
        setAssignmentDesc('');
        setAssignmentAttachUrl('');
        setSuccessMsg('เพิ่มตารางงานและการส่งของวิชาเรียบร้อยแล้ว');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (asgId: string) => {
    if (!window.confirm('ต้องการลบงานชิ้นนี้ออกจากตารางวันส่งงานหรือไม่?')) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await deleteAssignment(asgId, initialCourse.course_id);
      if (res && res.success) {
        setAssignments(assignments.filter(a => a.assignment_id !== asgId));
        setSuccessMsg('ลบงานมอบหมายนี้เรียบร้อยแล้ว');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดปัญหาขัดข้อง');
    } finally {
      setLoading(false);
    }
  };

  const getTypesLabel = (type: MaterialType) => {
    switch (type) {
      case 'slides': return 'สไลด์ประกอบสอน';
      case 'video': return 'บันทึกวิดีโอ (Video)';
      case 'document': return 'เอกสารประกอบ / Book';
      default: return 'อื่น ๆ';
    }
  };

  const getStatusLabel = (status: AssignmentStatus) => {
    switch (status) {
      case 'open': return 'เปิดรับงานส่ง';
      case 'closed': return 'ปิดระบบรับงาน';
      case 'upcoming': return 'เตรียมตัวเปิดรับ';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Navbar Container */}
      <nav className="w-full bg-slate-900 text-white py-3.5 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white shrink-0">
              <GraduationCap size={18} />
            </div>
            <div>
              <span className="font-bold text-sm block leading-none">
                โครงสร้างวิชาคอร์ส: {initialCourse.course_code}
              </span>
              <span className="text-[10px] text-indigo-300 font-bold block mt-0.5 leading-none">
                บริหารและจัดการสื่อวิชาวิชานี้
              </span>
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

      {/* Main Inner Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-8">
        
        {/* Banner Headers info */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-[#4F46E5] tracking-widest leading-none">
              EDIT MANAGEMENT PORTAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 leading-none">
              แก้ไขข้อมูลรายวิชา {initialCourse.course_code}
            </h1>
            <p className="text-xs text-slate-400 font-semibold italic">
              {initialCourse.course_name_th} • ภาคเรียนที่ {initialCourse.semester_id}/{initialCourse.year}
            </p>
          </div>

          {/* Delete entire Course button */}
          <button
            onClick={handleDeleteCourse}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-slate-200 text-rose-700 text-xs font-bold px-4 py-3 rounded-xl transition duration-150 cursor-pointer self-start md:self-auto uppercase"
          >
            <Trash2 size={14} />
            <span>ลบวิชาเรียบร้อย</span>
          </button>
        </div>

        {/* Messaging Feedback bars */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-2.5 text-rose-800 text-xs font-bold shadow-sm">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-2.5 text-emerald-800 text-xs font-bold shadow-sm">
            <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Navigation Menu bar */}
        <div className="flex border-b border-slate-200 bg-white p-1.5 rounded-2xl border shadow-sm">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'info' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            📝 ข้อมูลรายละเอียดคอร์ส
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'materials' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            📚 คลังสื่อ & สไลด์การสอน ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'assignments' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            📢 งานมอบหมาย & การส่งงาน ({assignments.length})
          </button>
        </div>

        {/* TAB 1: COURSE INFO PRE-FILLED FORM */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveCourseInfo} className="space-y-8 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider pb-3 border-b border-slate-100">
                ข้อมูลรหัสและสิทธิ์รายวิชาเรียน (Course Base Info)
              </h3>

              {/* Code / Semester / Year Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    รหัสรายวิชา (Course Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-bold"
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

              {/* Th name / En name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    ชื่อหลักสูตรภาษาไทย (Thai Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseNameTh}
                    onChange={(e) => setCourseNameTh(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    ชื่อหลักสูตรภาษาอังกฤษ (English Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseNameEn}
                    onChange={(e) => setCourseNameEn(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold uppercase"
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
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    กลุ่มเซกชัน (Section)
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Course Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  คำอธิบายรายวิชา (Description)
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 leading-relaxed font-normal whitespace-pre-wrap"
                />
              </div>
            </div>

            {/* Objectives dynamic list panel */}
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

              <div className="space-y-3.5">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-xs text-indigo-700 font-bold shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`วัตถุประสงค์ที่ ${i + 1}`}
                      value={obj}
                      onChange={(e) => handleObjectiveChange(i, e.target.value)}
                      className="block w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
                    />
                    <button
                      type="button"
                      disabled={objectives.length <= 1}
                      onClick={() => handleRemoveObjective(i)}
                      className="p-2 border border-slate-200/60 hover:border-red-100 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition cursor-pointer disabled:opacity-30"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-100 transition duration-150 cursor-pointer"
              >
                {loading ? 'กำลังดำเนินการบันทึก...' : '💾 บันทึกการเปลี่ยนแปลงวิชา'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MATERIALS CRUD */}
        {activeTab === 'materials' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Add New Material panel */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider pb-3 border-b border-slate-100">
                เพิ่มไฟล์หรือสื่อการสอนใหม่ (Upload New Material)
              </h3>

              <form onSubmit={handleAddMaterial} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ชื่อหัวข้อไฟล์ / สื่อสอน *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สไลด์คาบเรียนบทนำ (Slide Week 1)"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      สัปดาห์ที่เรียน (Week No.) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={materialWeek}
                      onChange={(e) => setMaterialWeek(Number(e.target.value))}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ชนิดไฟล์หรือเอกสาร (Type)
                    </label>
                    <select
                      value={materialType}
                      onChange={(e) => setMaterialType(e.target.value as MaterialType)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-bold"
                    >
                      <option value="slides">🖼️ บรรยาย (Slides)</option>
                      <option value="video">🎥 วิดีโอบันทึกคาบเรียน (Video)</option>
                      <option value="document">📄 เอกสารประกอบ / Book (Document)</option>
                      <option value="link">🔗 ลิงก์ภายนอกเสริมความรู้ (Other Link)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      อัปโหลดไฟล์สื่อสาระสำคัญ (Supabase Storage)
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="file"
                        onChange={(e) => handleStorageUpload(e, 'materials')}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none pointer"
                      />
                      {uploadingMaterial && (
                        <span className="text-[10px] text-indigo-600 block mt-1 font-bold animate-pulse">
                          กำลังอัปโหลดไฟล์เข้าระบบ Storage...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct File URL Link fallback */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    ลิงก์ปลายทางโดยตรง (Destination URL) *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="วางลิงก์ตรงที่นี่ ได้แก่ PDF บน Google Drive, Youtube Link หรือลิงก์จาก Storage ด้านบน"
                    value={materialFileUrl}
                    onChange={(e) => setMaterialFileUrl(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-mono text-xs"
                  />
                  <p className="text-[9px] text-slate-400 italic mt-1">(หากอัปโหลดไฟล์สำเร็จ ระบบจะกรอก URL ภายนอกของ Supabase คลังส่งให้คุณโดยชอบ)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    คำอธิบายเพิ่มเติมเกี่ยวกับสื่อ
                  </label>
                  <textarea
                    rows={2}
                    placeholder="คำชี้แนะย่อหรือสารวัตถุประสงค์ของบทเรียนสัปดาห์นี้"
                    value={materialDesc}
                    onChange={(e) => setMaterialDesc(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={loading || uploadingMaterial}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>เพิ่มสื่อเข้ารายวิชา</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of current Materials */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <FolderOpen size={18} className="text-indigo-600" />
                <span>คลังเอกสารสื่อการสอนของรายวิชาเรียน ({materials.length} รายการ)</span>
              </h3>

              {materials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {materials.map((mat) => (
                    <div 
                      key={mat.material_id}
                      className="bg-white border border-slate-200 hover:border-indigo-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/50 uppercase">
                            Week {mat.week_number}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{getTypesLabel(mat.type)}</span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1">{mat.title}</h4>
                        {mat.description && <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{mat.description}</p>}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <a 
                          href={mat.file_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Link2 size={13} />
                          <span>เชื่อมไฟล์ตรง</span>
                        </a>

                        <button
                          onClick={() => handleDeleteMaterial(mat.material_id)}
                          className="p-1 px-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-lg transition text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>ถอดจากวิชา</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border rounded-[2rem] p-12 text-center text-xs text-slate-400">
                  สถาบันรายประวัตินี้ ยังไม่มีไฟล์เอกสารแบบผูกส่งใด ๆ ถูกแนบร่างไว้
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ASSIGNMENTS CRUD */}
        {activeTab === 'assignments' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Add New Assignment form */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider pb-3 border-b border-slate-100">
                เพิ่มภารกิจหรือตารางมอบหมายงานใหม่ (Add Assignment Outline)
              </h3>

              <form onSubmit={handleAddAssignment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ชื่องานมอบหมายสำคัญ (Assignment Task Title) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น ใบงานวิเคราะห์ข้อมูลขนาดใหญ่บทที่ 3 (HW3)"
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      กำหนดเวลากลางวันสุดท้ายส่ง (Due Date Year/Month/Day) *
                    </label>
                    <input
                      type="date"
                      required
                      value={assignmentDueDate}
                      onChange={(e) => setAssignmentDueDate(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      สถานะกำหนดส่งงาน (Status)
                    </label>
                    <select
                      value={assignmentStatus}
                      onChange={(e) => setAssignmentStatus(e.target.value as AssignmentStatus)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-bold"
                    >
                      <option value="open">🟢 เปิดระบบรองรับใบงาน (Open)</option>
                      <option value="closed">🔴 ปิดรับระบบการเลท (Closed)</option>
                      <option value="upcoming">🟡 เตรียมพร้อมเปิดรับเร็ว ๆ นี้ (Upcoming)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ความปลอดภัยไฟล์สั่งใบแนบ (Supabase Storage)
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="file"
                        onChange={(e) => handleStorageUpload(e, 'assignments')}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none pointer"
                      />
                      {uploadingAssignment && (
                        <span className="text-[10px] text-rose-600 block mt-1 font-bold animate-pulse">
                          กำลังดึงไฟล์เก็บเข้ารายใบแนบสำรอง...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Attachment File URL Link fallback */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    ลิงก์ไฟล์งานแฝนเพิ่มเติม (Attachment File Link URL)
                  </label>
                  <input
                    type="url"
                    placeholder="วางลิงก์สรุปชี้แจ้นเกณฑ์วิชาเพิ่มเติม PDF หรือปล่อยว่าง"
                    value={assignmentAttachUrl}
                    onChange={(e) => setAssignmentAttachUrl(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    รายละเอียดขั้นตอนหรือข้อแม้การส่ง (Description) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="ระบุข้อตกลง ขนาดไฟล์ นามต้องการสกุลส่ง เมลสำหรับติดต่อชิ้นงาน หรือช่องทางส่ง"
                    value={assignmentDesc}
                    onChange={(e) => setAssignmentDesc(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 text-xs font-medium leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={loading || uploadingAssignment}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>เพิ่มภารกิจการสั่ง</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of current assignments */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <CalendarDays size={18} className="text-indigo-600" />
                <span>ปฏิทินงานส่งสำคัญของสหัสวิชานี้ ({assignments.length} ใบงาน)</span>
              </h3>

              {assignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {assignments.map((asg) => (
                    <div 
                      key={asg.assignment_id}
                      className="bg-white border border-slate-200 hover:border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between transition"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md leading-none">
                            TASK
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                            asg.status === 'open' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              : asg.status === 'closed'
                              ? 'bg-rose-50 text-rose-800 border-rose-100'
                              : 'bg-amber-50 text-amber-800 border-amber-100'
                          }`}>
                            {getStatusLabel(asg.status)}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-800 leading-snug line-clamp-2">{asg.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{asg.description}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 space-y-3.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">เดดไลน์กำหนดส่ง:</span>
                          <span className="font-extrabold text-slate-700 flex items-center gap-1 bg-slate-50 border px-2.5 py-1 rounded-lg">
                            <Clock size={11} className="text-slate-400" />
                            <span className="font-mono text-[11px]">{asg.due_date}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-1">
                          {asg.attachment_url ? (
                            <a 
                              href={asg.attachment_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Paperclip size={12} />
                              <span>ไฟล์ใบสั่งแนบ</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">ไม่มีไฟล์แนบประวัติ</span>
                          )}

                          <button
                            onClick={() => handleDeleteAssignment(asg.assignment_id)}
                            className="p-1 px-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-lg transition text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>ลบตาราง</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border rounded-[2rem] p-12 text-center text-xs text-slate-400">
                  สถาบันตัวจริงนี้ ยังไม่มีหัวข้อกำหนดใบงานมอบหมายลงร่างไว้
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
