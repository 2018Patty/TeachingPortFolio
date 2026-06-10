import React from 'react';
import { X, Shield, Mail, User, Database, Lock, FileText } from 'lucide-react';
import { SiteProfile } from '../types';

const DEFAULT_PURPOSES = [
  'เพื่อยืนยันตัวตนและจัดการบัญชีผู้ใช้งาน',
  'เพื่อบันทึกการเข้าร่วมรายวิชาและติดตามความก้าวหน้าการเรียน',
  'เพื่อรับ-ส่งงานมอบหมายและกิจกรรมการเรียนการสอน',
  'เพื่อปรับปรุงคุณภาพการเรียนการสอนและการพัฒนาระบบ',
  'เพื่อปฏิบัติตามหน้าที่ตามกฎหมายที่เกี่ยวข้องกับการศึกษา',
];

const DEFAULT_RETENTION =
  'ข้อมูลจะถูกเก็บรักษาตลอดระยะเวลาที่ท่านมีบัญชีในระบบ หรือตามที่กฎหมายกำหนด หลังสิ้นสุดความจำเป็น ข้อมูลจะถูกลบหรือทำให้ไม่สามารถระบุตัวตนได้';

const DEFAULT_THIRD_PARTY =
  'ระบบนี้ใช้บริการ Supabase (ผู้ให้บริการ Cloud Database ที่ผ่านมาตรฐาน SOC 2) เพื่อจัดเก็บข้อมูล และ Google OAuth สำหรับการยืนยันตัวตน ข้อมูลของท่านจะไม่ถูกเปิดเผย ขาย หรือส่งต่อแก่บุคคลที่สามเพื่อวัตถุประสงค์เชิงพาณิชย์';

interface PDPAPrivacyModalProps {
  onClose: () => void;
  siteProfile?: Partial<SiteProfile>;
}

export const PDPAPrivacyModal: React.FC<PDPAPrivacyModalProps> = ({ onClose, siteProfile }) => {
  const instructorName = siteProfile?.profile_name || 'ผศ.ดร.ภัทราพร วรินทรเวช';
  const instructorEmail = siteProfile?.profile_email || 'pattaraporn.w@psu.ac.th';
  const university = siteProfile?.profile_university || 'มหาวิทยาลัยสงขลานครินทร์';

  const purposes: string[] = (() => {
    try {
      const parsed = siteProfile?.pdpa_purposes ? JSON.parse(siteProfile.pdpa_purposes) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PURPOSES;
    } catch { return DEFAULT_PURPOSES; }
  })();

  const retention = siteProfile?.pdpa_retention?.trim() || DEFAULT_RETENTION;
  const thirdParty = siteProfile?.pdpa_third_party?.trim() || DEFAULT_THIRD_PARTY;
  const updatedAt = siteProfile?.pdpa_updated_at?.trim() || 'มิถุนายน 2026';
  const effectiveDate = siteProfile?.pdpa_effective_date?.trim() || '1 มิถุนายน 2026';

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold">นโยบายความเป็นส่วนตัว</h2>
              <p className="text-[10px] text-indigo-200">
                ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          <p className="text-slate-500 text-[11px]">
            ปรับปรุงล่าสุด: {updatedAt} | มีผลบังคับใช้: {effectiveDate}
          </p>

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className="text-indigo-600 shrink-0" />
              <h3 className="font-bold text-slate-800 text-[13px]">1. ผู้ควบคุมข้อมูลส่วนบุคคล</h3>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1">
              <p><span className="font-semibold text-slate-800">ชื่อ:</span> {instructorName}</p>
              <p><span className="font-semibold text-slate-800">สังกัด:</span> {university}</p>
              <p>
                <span className="font-semibold text-slate-800">อีเมลติดต่อ:</span>{' '}
                <a href={`mailto:${instructorEmail}`} className="text-indigo-600 hover:underline">
                  {instructorEmail}
                </a>
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} className="text-indigo-600 shrink-0" />
              <h3 className="font-bold text-slate-800 text-[13px]">2. ข้อมูลส่วนบุคคลที่เก็บรวบรวม</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'ข้อมูลระบุตัวตน', detail: 'ชื่อ นามสกุล รหัสนักศึกษา' },
                { label: 'ข้อมูลการติดต่อ', detail: 'ที่อยู่อีเมล' },
                { label: 'ข้อมูลการใช้งาน', detail: 'ประวัติการเข้าชมรายวิชา วันและเวลาเข้าใช้งาน' },
                { label: 'ผลงานทางวิชาการ', detail: 'ไฟล์งานที่ส่ง คำตอบในการมอบหมายงาน' },
                { label: 'ข้อมูลบัญชี', detail: 'ข้อมูลที่ผูกกับบัญชี Google (เมื่อเข้าสู่ระบบด้วย Google)' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700">{item.label}: </span>
                    <span className="text-slate-600">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 — dynamic purposes */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-indigo-600 shrink-0" />
              <h3 className="font-bold text-slate-800 text-[13px]">3. วัตถุประสงค์การเก็บและใช้ข้อมูล</h3>
            </div>
            <ul className="space-y-1.5">
              {purposes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-600">
                  <span className="text-indigo-500 font-bold shrink-0">{i + 1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4 — dynamic third party */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} className="text-indigo-600 shrink-0" />
              <h3 className="font-bold text-slate-800 text-[13px]">4. การเปิดเผยข้อมูลแก่บุคคลที่สาม</h3>
            </div>
            <p className="text-slate-600 bg-amber-50 border border-amber-100 rounded-xl p-3 whitespace-pre-line">
              {thirdParty}
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-indigo-600 shrink-0" />
              <h3 className="font-bold text-slate-800 text-[13px]">5. สิทธิ์ของเจ้าของข้อมูลส่วนบุคคล</h3>
            </div>
            <p className="text-slate-500 mb-2">ท่านมีสิทธิ์ดังต่อไปนี้ตาม PDPA มาตรา 30–38:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { right: 'สิทธิ์เข้าถึงข้อมูล', desc: 'ขอดูข้อมูลที่เก็บเกี่ยวกับตัวท่าน' },
                { right: 'สิทธิ์แก้ไขข้อมูล', desc: 'ขอแก้ไขข้อมูลที่ไม่ถูกต้อง' },
                { right: 'สิทธิ์ลบข้อมูล', desc: 'ขอให้ลบหรือทำลายข้อมูลส่วนบุคคล' },
                { right: 'สิทธิ์คัดค้าน', desc: 'คัดค้านการประมวลผลข้อมูลในบางกรณี' },
                { right: 'สิทธิ์ระงับการใช้', desc: 'ขอให้ระงับการใช้ข้อมูลชั่วคราว' },
                { right: 'สิทธิ์โอนถ่ายข้อมูล', desc: 'ขอรับข้อมูลในรูปแบบที่อ่านได้ด้วยเครื่อง' },
              ].map((r) => (
                <div key={r.right} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                  <div className="font-semibold text-indigo-700 text-[11px]">{r.right}</div>
                  <div className="text-slate-500 text-[11px]">{r.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6 — dynamic retention */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} className="text-indigo-600 shrink-0" />
              <h3 className="font-bold text-slate-800 text-[13px]">6. ระยะเวลาการเก็บรักษาข้อมูล</h3>
            </div>
            <p className="text-slate-600 whitespace-pre-line">{retention}</p>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Mail size={14} className="text-indigo-600 shrink-0" />
              <h3 className="font-bold text-slate-800 text-[13px]">7. การติดต่อและการร้องเรียน</h3>
            </div>
            <p className="text-slate-600">
              หากต้องการใช้สิทธิ์หรือมีข้อสงสัย กรุณาติดต่อผู้ควบคุมข้อมูลที่{' '}
              <a href={`mailto:${instructorEmail}`} className="text-indigo-600 font-semibold hover:underline">
                {instructorEmail}
              </a>
              {' '}ท่านมีสิทธิ์ร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)
              หากเห็นว่าสิทธิ์ของท่านถูกละเมิด
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition active:scale-[0.98]"
          >
            รับทราบและปิด
          </button>
        </div>
      </div>
    </div>
  );
};
