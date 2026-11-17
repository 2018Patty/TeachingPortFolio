import React, { useState } from 'react';
import { X, GraduationCap, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PDPAPrivacyModal } from './PDPAPrivacyModal';
import { SiteProfile } from '../types';

interface StudentAuthModalProps {
  onClose: () => void;
  initialTab?: 'login' | 'register';
  siteProfile?: Partial<SiteProfile>;
}

type AuthTab = 'login' | 'register';

// Email/password sign-up is turned off: Supabase requires e-mail confirmation and the
// built-in mailer cannot deliver to students. Set to true once "Confirm email" is
// disabled (or custom SMTP is configured) in the Supabase dashboard.
const EMAIL_AUTH_ENABLED = false;

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({ onClose, initialTab = 'login', siteProfile }) => {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pdpaConsent, setPdpaConsent] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setLoading(true);
    setError('');
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });
    if (loginError) {
      if (/email not confirmed/i.test(loginError.message)) {
        setPendingEmail(loginForm.email);
        setError('อีเมลนี้ยังไม่ได้ยืนยันตัวตน กรุณาคลิกลิงก์ในอีเมลยืนยัน (ตรวจสอบโฟลเดอร์ Spam/Junk ด้วย) หรือกด "ส่งอีเมลยืนยันอีกครั้ง"');
      } else {
        setError(
          loginError.message === 'Invalid login credentials'
            ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
            : loginError.message
        );
      }
    } else {
      onClose();
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { student_id, first_name, last_name, email, password } = registerForm;
    if (!student_id.trim() || !first_name.trim() || !last_name.trim()) {
      setError('กรุณากรอกรหัสนักศึกษา ชื่อ และนามสกุล');
      return;
    }
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (!pdpaConsent) {
      setError('กรุณายอมรับนโยบายความเป็นส่วนตัว (PDPA) ก่อนสมัครสมาชิก');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Send the confirmation link back to the site the student signed up from
        // (otherwise Supabase falls back to the dashboard "Site URL", often localhost).
        emailRedirectTo: window.location.origin,
        data: {
          student_id: student_id.trim(),
          first_name: first_name.trim(),
          last_name: last_name.trim(),
        },
      },
    });
    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'อีเมลนี้ถูกสมัครแล้ว กรุณาเข้าสู่ระบบ'
          : signUpError.message
      );
      setLoading(false);
      return;
    }
    // Supabase returns a fake user with no identities (and sends no email)
    // when the address is already registered — treat it as a duplicate.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('อีเมลนี้ถูกสมัครแล้ว กรุณาเข้าสู่ระบบ (หากยังไม่ได้ยืนยันอีเมล กด "ส่งอีเมลยืนยันอีกครั้ง")');
      setPendingEmail(email);
      setLoading(false);
      return;
    }
    if (data.user && !data.session) {
      setPendingEmail(email);
      setSuccessMsg(
        `สมัครสมาชิกสำเร็จ! ระบบส่งอีเมลยืนยันไปที่ ${email} แล้ว กรุณาคลิกลิงก์ในอีเมล (ตรวจสอบโฟลเดอร์ Spam/Junk ด้วย) แล้วเข้าสู่ระบบอีกครั้ง`
      );
    } else {
      onClose();
    }
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!pendingEmail) return;
    setLoading(true);
    setError('');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: pendingEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    if (resendError) {
      setError(
        /rate limit|seconds/i.test(resendError.message)
          ? 'ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'
          : resendError.message
      );
    } else {
      setSuccessMsg(`ส่งอีเมลยืนยันไปที่ ${pendingEmail} อีกครั้งแล้ว กรุณาตรวจสอบกล่องจดหมายและโฟลเดอร์ Spam/Junk`);
    }
    setLoading(false);
  };

  const switchTab = (newTab: AuthTab) => {
    setTab(newTab);
    setError('');
    setSuccessMsg('');
    setPendingEmail('');
  };

  return (
    <>
    {showPrivacyModal && <PDPAPrivacyModal onClose={() => setShowPrivacyModal(false)} siteProfile={siteProfile} />}
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold">นักศึกษา</h3>
              <p className="text-[10px] text-emerald-100">สมัครหรือเข้าสู่ระบบเพื่อเข้าเรียน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        {EMAIL_AUTH_ENABLED && (
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => switchTab('login')}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              tab === 'login'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            onClick={() => switchTab('register')}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              tab === 'register'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>
        )}

        <div className="p-6 space-y-4">
          {!EMAIL_AUTH_ENABLED && (
            <p className="text-xs text-slate-600 leading-relaxed text-center">
              สมัครสมาชิกและเข้าสู่ระบบด้วยบัญชี Google ได้ทันที ไม่ต้องยืนยันอีเมล
              <br />
              <span className="text-slate-400">ครั้งแรกระบบจะให้กรอกรหัสนักศึกษา ชื่อ และนามสกุล</span>
            </p>
          )}
          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {!EMAIL_AUTH_ENABLED ? 'สมัคร / เข้าสู่ระบบด้วย Google' : tab === 'login' ? 'เข้าสู่ระบบด้วย Google' : 'สมัครด้วย Google'}
          </button>

          {!EMAIL_AUTH_ENABLED && (
            <>
              {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                การเข้าสู่ระบบถือว่ายอมรับ{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold hover:underline"
                >
                  <Shield size={10} />
                  นโยบายความเป็นส่วนตัว (PDPA)
                </button>
                {' '}เพื่อวัตถุประสงค์ทางการศึกษา
              </p>
            </>
          )}

          {EMAIL_AUTH_ENABLED && (<>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] text-slate-400 font-medium">หรือกรอกข้อมูล</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Success message (email confirmation pending) */}
          {successMsg ? (
            <div className="bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 p-4 rounded-xl leading-relaxed space-y-3">
              <p>{successMsg}</p>
              {pendingEmail && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 font-semibold hover:bg-emerald-100 disabled:opacity-50"
                  >
                    ส่งอีเมลยืนยันอีกครั้ง
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSuccessMsg(''); setTab('login'); setLoginForm(f => ({ ...f, email: pendingEmail })); }}
                    className="px-3 py-1.5 rounded-lg text-emerald-700 font-semibold hover:bg-emerald-100"
                  >
                    ไปหน้าเข้าสู่ระบบ
                  </button>
                </div>
              )}
            </div>
          ) : pendingEmail && error ? (
            <div className="space-y-3">
              <div className="bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200 p-4 rounded-xl leading-relaxed">{error}</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  ส่งอีเมลยืนยันอีกครั้ง
                </button>
                <button
                  type="button"
                  onClick={() => { setError(''); setPendingEmail(''); }}
                  className="px-3 py-1.5 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  กลับ
                </button>
              </div>
            </div>
          ) : tab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="student@example.com"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่าน</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
              <p className="text-center text-[11px] text-slate-500">
                ยังไม่มีบัญชี?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  สมัครสมาชิก
                </button>
              </p>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสนักศึกษา</label>
                <input
                  type="text"
                  value={registerForm.student_id}
                  onChange={e => setRegisterForm(f => ({ ...f, student_id: e.target.value }))}
                  placeholder="เช่น 6401234567890"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ</label>
                  <input
                    type="text"
                    value={registerForm.first_name}
                    onChange={e => setRegisterForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="ชื่อ"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={registerForm.last_name}
                    onChange={e => setRegisterForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="นามสกุล"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="student@example.com"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่าน</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              {/* PDPA Consent */}
              <div className={`rounded-xl border p-3 ${pdpaConsent ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdpaConsent}
                    onChange={e => { setPdpaConsent(e.target.checked); if (error) setError(''); }}
                    className="mt-0.5 w-3.5 h-3.5 accent-emerald-600 shrink-0"
                  />
                  <span className="text-[11px] text-slate-600 leading-relaxed">
                    ข้าพเจ้ายินยอมให้เก็บรวบรวมและใช้ข้อมูลส่วนบุคคล ตาม{' '}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      <Shield size={10} />
                      นโยบายความเป็นส่วนตัว (PDPA)
                    </button>
                    {' '}เพื่อวัตถุประสงค์ทางการศึกษา
                  </span>
                </label>
              </div>

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <button
                type="submit"
                disabled={loading || !pdpaConsent}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
              </button>
              <p className="text-center text-[11px] text-slate-500">
                มีบัญชีแล้ว?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            </form>
          )}
          </>)}
        </div>
      </div>
    </div>
    </>
  );
};
