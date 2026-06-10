import React, { useState, useEffect } from 'react';
import { Shield, X, ChevronRight, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'pdpa_consent_v2';

interface PDPAConsentBannerProps {
  onOpenPrivacy: () => void;
  policyVersion: string; // pdpa_version from site_settings (ISO timestamp or string)
}

export const PDPAConsentBanner: React.FC<PDPAConsentBannerProps> = ({ onOpenPrivacy, policyVersion }) => {
  const [visible, setVisible] = useState(false);
  const [isPolicyUpdate, setIsPolicyUpdate] = useState(false);

  useEffect(() => {
    if (!policyVersion) return; // wait until site_settings loaded
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // First visit — show after short delay
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
      const saved: { version?: string; accepted?: boolean } = JSON.parse(raw);
      if (saved.version !== policyVersion) {
        // Policy has been updated since last consent
        setIsPolicyUpdate(true);
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [policyVersion]);

  const accept = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accepted: true, version: policyVersion, date: new Date().toISOString() })
    );
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accepted: false, version: policyVersion, date: new Date().toISOString() })
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className={`backdrop-blur-md border rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
          isPolicyUpdate
            ? 'bg-amber-950/95 border-amber-700'
            : 'bg-slate-900/95 border-slate-700'
        }`}>
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isPolicyUpdate
              ? 'bg-amber-500/20 border border-amber-500/30'
              : 'bg-indigo-500/20 border border-indigo-500/30'
          }`}>
            {isPolicyUpdate
              ? <RefreshCw size={18} className="text-amber-400" />
              : <Shield size={18} className="text-indigo-400" />
            }
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            {isPolicyUpdate ? (
              <>
                <p className="text-xs font-bold text-amber-300 mb-0.5">นโยบายความเป็นส่วนตัวมีการอัปเดต</p>
                <p className="text-[11px] text-amber-200/70 leading-relaxed">
                  ผู้ดูแลระบบได้ปรับปรุงนโยบาย PDPA กรุณาอ่านและยืนยันการยอมรับใหม่{' '}
                  <button
                    onClick={onOpenPrivacy}
                    className="text-amber-300 hover:text-amber-200 underline underline-offset-2 font-semibold inline-flex items-center gap-0.5"
                  >
                    อ่านนโยบายฉบับใหม่
                    <ChevronRight size={11} />
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-white mb-0.5">การคุ้มครองข้อมูลส่วนบุคคล (PDPA)</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ระบบนี้เก็บรวบรวมข้อมูลส่วนบุคคล (ชื่อ, อีเมล, รหัสนักศึกษา, ประวัติการเรียน) เพื่อการเรียนการสอน
                  ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562{' '}
                  <button
                    onClick={onOpenPrivacy}
                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-semibold inline-flex items-center gap-0.5"
                  >
                    อ่านนโยบายฉบับเต็ม
                    <ChevronRight size={11} />
                  </button>
                </p>
              </>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={decline}
              className="flex-1 sm:flex-none px-4 py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-500 rounded-xl transition"
            >
              ปฏิเสธ
            </button>
            <button
              onClick={accept}
              className={`flex-1 sm:flex-none px-5 py-2 text-[11px] font-bold text-white rounded-xl transition active:scale-[0.98] ${
                isPolicyUpdate
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {isPolicyUpdate ? 'รับทราบและยอมรับ' : 'ยอมรับทั้งหมด'}
            </button>
          </div>

          {/* Close (mobile) */}
          <button
            onClick={decline}
            className="absolute top-3 right-3 sm:hidden p-1 text-slate-500 hover:text-slate-300"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
