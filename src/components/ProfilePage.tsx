import React, { useState, useRef } from 'react';
import {
  ArrowLeft, Edit, Camera, Lock, Eye, EyeOff,
  Mail, User, CheckCircle, AlertCircle, Save, X,
  Building2, GraduationCap, BookOpen, Loader2, ExternalLink, Link
} from 'lucide-react';
import { Role, SiteProfile } from '../types';

interface ProfilePageProps {
  role: Role;
  profile: SiteProfile;
  onBack: () => void;
  onSave: (data: Partial<SiteProfile>) => Promise<void>;
  onPasswordChange: (oldPw: string, newPw: string) => Promise<{ success: boolean; message: string }>;
  onPhotoUpload: (file: File) => Promise<string>;
}

// --- Module-level sub-components (must NOT be defined inside ProfilePage) ---

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, type = 'text', placeholder, required }) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
    <input
      type={type}
      required={required}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white placeholder-slate-300"
    />
  </div>
);

interface PwInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}

const PwInput: React.FC<PwInputProps> = ({ id, label, value, onChange, show, onToggle, placeholder }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-xs font-semibold text-slate-700">{label}</label>
    <div className="relative">
      <input
        id={id} required type={show ? 'text' : 'password'} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  </div>
);

// -------------------------------------------------------------------------

const DEFAULT_PROFILE: SiteProfile = {
  profile_name: 'ผศ.ดร.ภัทราพร วรินทรเวช',
  profile_title: 'ผู้ช่วยศาสตราจารย์ ดร.',
  profile_department: 'สาขาวิชาเทคโนโลยีสารสนเทศและการจัดการ',
  profile_faculty: 'คณะวิทยาการจัดการ',
  profile_university: 'มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตหาดใหญ่',
  profile_bio: '',
  profile_email: 'pattaraporn.w@psu.ac.th',
  profile_photo_url: '',
  profile_link_url: '',
  admin_password: 'admin123',
};

export const ProfilePage: React.FC<ProfilePageProps> = ({
  role, profile, onBack, onSave, onPasswordChange, onPhotoUpload
}) => {
  const merged = { ...DEFAULT_PROFILE, ...profile };

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SiteProfile>>({});
  const [saving, setSaving] = useState(false);

  // Photo upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const startEditing = () => {
    setEditForm({
      profile_name: merged.profile_name,
      profile_title: merged.profile_title,
      profile_department: merged.profile_department,
      profile_faculty: merged.profile_faculty,
      profile_university: merged.profile_university,
      profile_bio: merged.profile_bio,
      profile_email: merged.profile_email,
      profile_link_url: merged.profile_link_url,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(editForm);
      setIsEditing(false);
      setEditForm({});
    } catch {
      alert('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('ไฟล์รูปต้องมีขนาดไม่เกิน 5 MB'); return; }
    setUploading(true);
    setUploadError(null);
    try {
      const url = await onPhotoUpload(file);
      await onSave({ profile_photo_url: url });
      setUploadError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualUrlSave = async () => {
    if (!manualUrl.trim()) return;
    setSaving(true);
    try {
      await onSave({ profile_photo_url: manualUrl.trim() });
      setManualUrl('');
      setShowUrlInput(false);
      setUploadError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwStatus({ type: 'error', msg: 'รหัสผ่านใหม่ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง' }); return; }
    if (newPw.length < 4) { setPwStatus({ type: 'error', msg: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร' }); return; }
    setSavingPw(true);
    const result = await onPasswordChange(oldPw, newPw);
    setPwStatus({ type: result.success ? 'success' : 'error', msg: result.message });
    if (result.success) { setOldPw(''); setNewPw(''); setConfirmPw(''); }
    setSavingPw(false);
  };

  return (
    <div className="space-y-8">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <ArrowLeft size={14} />
          <span>ย้อนกลับหน้าหลัก</span>
        </button>

        {role === 'admin' && !isEditing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-2 text-xs font-bold text-white bg-[#4F46E5] hover:bg-indigo-700 px-4 py-2.5 rounded-xl shadow-md shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Edit size={13} />
            <span>แก้ไขข้อมูลส่วนตัว</span>
          </button>
        )}
      </div>

      {/* Profile card — view mode */}
      {!isEditing && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Photo */}
            <div className="relative shrink-0">
              <div
                onClick={() => role === 'admin' && !uploading && fileInputRef.current?.click()}
                className={`w-32 h-32 rounded-3xl overflow-hidden border-4 border-indigo-100 shadow-lg bg-indigo-50 flex items-center justify-center ${role === 'admin' ? 'cursor-pointer group' : ''}`}
              >
                {merged.profile_photo_url ? (
                  <img src={merged.profile_photo_url} alt={merged.profile_name} className="w-full h-full object-cover" />
                ) : (
                  <User size={56} className="text-indigo-300" />
                )}
                {role === 'admin' && (
                  <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
                    <Camera size={24} className="text-white" />
                  </div>
                )}
              </div>
              {role === 'admin' && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors"
                  title="เปลี่ยนรูปโปรไฟล์"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Upload error + URL fallback — view mode */}
            {role === 'admin' && (uploadError || showUrlInput) && (
              <div className="w-full sm:w-auto sm:absolute sm:top-36 sm:left-0 mt-3 sm:mt-0 space-y-2 max-w-xs">
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Upload Error</p>
                    <p className="text-[11px] text-red-600 break-words">{uploadError}</p>
                    <button
                      onClick={() => setShowUrlInput(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline mt-1"
                    >
                      วาง URL รูปภาพแทน →
                    </button>
                  </div>
                )}
                {showUrlInput && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">วาง URL รูปภาพ</p>
                    <input
                      type="url"
                      value={manualUrl}
                      onChange={e => setManualUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleManualUrlSave}
                        disabled={saving || !manualUrl.trim()}
                        className="flex-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                      >
                        {saving ? 'กำลังบันทึก…' : 'บันทึก'}
                      </button>
                      <button
                        onClick={() => { setShowUrlInput(false); setManualUrl(''); setUploadError(null); }}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info display */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {merged.profile_name}
                </h1>
                {merged.profile_title && (
                  <p className="text-sm font-semibold text-indigo-600 mt-1">{merged.profile_title}</p>
                )}
              </div>
              <div className="space-y-1.5">
                {merged.profile_department && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start text-xs text-slate-600">
                    <BookOpen size={13} className="text-slate-400 shrink-0" />
                    <span>{merged.profile_department}</span>
                  </div>
                )}
                {merged.profile_faculty && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start text-xs text-slate-600">
                    <Building2 size={13} className="text-slate-400 shrink-0" />
                    <span>{merged.profile_faculty}</span>
                  </div>
                )}
                {merged.profile_university && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start text-xs text-slate-600">
                    <GraduationCap size={13} className="text-slate-400 shrink-0" />
                    <span>{merged.profile_university}</span>
                  </div>
                )}
                {merged.profile_email && (
                  <a
                    href={`mailto:${merged.profile_email}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Mail size={13} className="shrink-0" />
                    <span>{merged.profile_email}</span>
                  </a>
                )}
                {merged.profile_link_url && (
                  <a
                    href={merged.profile_link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors break-all"
                  >
                    <ExternalLink size={13} className="shrink-0" />
                    <span>{merged.profile_link_url}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {merged.profile_bio ? (
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">เกี่ยวกับอาจารย์ (About)</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{merged.profile_bio}</p>
            </div>
          ) : role === 'admin' ? (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <button onClick={startEditing} className="text-xs text-slate-400 hover:text-indigo-600 italic transition-colors">
                + คลิกเพื่อเพิ่มคำอธิบายเกี่ยวกับอาจารย์…
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Profile card — edit mode (inline) */}
      {isEditing && (
        <form onSubmit={handleSaveProfile}>
          <div className="bg-white border-2 border-indigo-200 rounded-3xl p-8 shadow-sm space-y-6">
            {/* Edit mode header */}
            <div className="flex items-center justify-between pb-4 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">โหมดแก้ไข</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition"
                >
                  <X size={13} />
                  <span>ยกเลิก</span>
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-accent-indigo hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-xl transition"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>{saving ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-8">
              {/* Photo (still editable in edit mode) */}
              <div className="relative shrink-0 mx-auto sm:mx-0">
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-indigo-200 shadow-lg bg-indigo-50 flex items-center justify-center cursor-pointer group"
                >
                  {merged.profile_photo_url ? (
                    <img src={merged.profile_photo_url} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={56} className="text-indigo-300" />
                  )}
                  <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <p className="text-[10px] text-slate-400 text-center mt-4">คลิกรูปเพื่อเปลี่ยน</p>
              </div>

              {/* Editable fields */}
              <div className="flex-1 space-y-4 w-full">
                <Field
                  label="ชื่อ-นามสกุล (พร้อมตำแหน่งวิชาการ)"
                  value={(editForm.profile_name as string) ?? ''}
                  onChange={v => setEditForm(f => ({ ...f, profile_name: v }))}
                  placeholder="เช่น ผศ.ดร.ชื่อ นามสกุล"
                  required
                />
                <Field
                  label="ตำแหน่งทางวิชาการ"
                  value={(editForm.profile_title as string) ?? ''}
                  onChange={v => setEditForm(f => ({ ...f, profile_title: v }))}
                  placeholder="เช่น ผู้ช่วยศาสตราจารย์ ดร."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="สาขาวิชา / ภาควิชา"
                    value={(editForm.profile_department as string) ?? ''}
                    onChange={v => setEditForm(f => ({ ...f, profile_department: v }))}
                    placeholder="เช่น สาขาวิชาเทคโนโลยีสารสนเทศ"
                  />
                  <Field
                    label="คณะ"
                    value={(editForm.profile_faculty as string) ?? ''}
                    onChange={v => setEditForm(f => ({ ...f, profile_faculty: v }))}
                    placeholder="เช่น คณะวิทยาการจัดการ"
                  />
                </div>
                <Field
                  label="มหาวิทยาลัย"
                  value={(editForm.profile_university as string) ?? ''}
                  onChange={v => setEditForm(f => ({ ...f, profile_university: v }))}
                  placeholder="เช่น มหาวิทยาลัยสงขลานครินทร์"
                />
                <Field
                  label="อีเมลติดต่อ"
                  value={(editForm.profile_email as string) ?? ''}
                  onChange={v => setEditForm(f => ({ ...f, profile_email: v }))}
                  type="email"
                  placeholder="example@psu.ac.th"
                />
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Link size={10} />
                    ลิงก์ Profile อาจารย์ (ไม่บังคับ)
                  </label>
                  <input
                    type="url"
                    value={(editForm.profile_link_url as string) ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, profile_link_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white placeholder-slate-300"
                  />
                  <p className="text-[10px] text-slate-400">เช่น เว็บไซต์ส่วนตัว, Google Scholar, ResearchGate, PSU Profile</p>
                </div>
              </div>
            </div>

            {/* Bio textarea */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ประวัติย่อ / About (ไม่บังคับ)
              </label>
              <textarea
                rows={4}
                value={(editForm.profile_bio as string) ?? ''}
                onChange={e => setEditForm(f => ({ ...f, profile_bio: e.target.value }))}
                placeholder="แนะนำตัวเอง ความเชี่ยวชาญ หรือสิ่งที่สนใจวิจัย..."
                className="w-full text-sm text-slate-900 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed placeholder-slate-300"
              />
            </div>
          </div>
        </form>
      )}

      {/* Password change — admin only, always visible */}
      {role === 'admin' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
              <Lock size={15} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">เปลี่ยนรหัสผ่านเข้าระบบ Admin</h3>
              <p className="text-[11px] text-slate-500">รหัสผ่านจะถูกบันทึกลงในฐานข้อมูลทันที</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
            <PwInput
              id="old-pw" label="รหัสผ่านปัจจุบัน *"
              value={oldPw} onChange={setOldPw}
              show={showOldPw} onToggle={() => setShowOldPw(v => !v)}
              placeholder="รหัสผ่านที่ใช้อยู่ตอนนี้"
            />
            <PwInput
              id="new-pw" label="รหัสผ่านใหม่ *"
              value={newPw} onChange={setNewPw}
              show={showNewPw} onToggle={() => setShowNewPw(v => !v)}
              placeholder="ขั้นต่ำ 4 ตัวอักษร"
            />
            <PwInput
              id="confirm-pw" label="ยืนยันรหัสผ่านใหม่ *"
              value={confirmPw} onChange={setConfirmPw}
              show={showConfirmPw} onToggle={() => setShowConfirmPw(v => !v)}
              placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
            />

            {pwStatus && (
              <div className={`flex items-center gap-2 text-xs font-bold p-3 rounded-xl border ${
                pwStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  : 'bg-red-50 text-red-800 border-red-100'
              }`}>
                {pwStatus.type === 'success'
                  ? <CheckCircle size={14} className="shrink-0" />
                  : <AlertCircle size={14} className="shrink-0" />}
                <span>{pwStatus.msg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingPw || !oldPw || !newPw || !confirmPw}
              className="flex items-center gap-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 px-5 py-2.5 rounded-xl transition"
            >
              {savingPw ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>{savingPw ? 'กำลังบันทึก…' : 'เปลี่ยนรหัสผ่าน'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
