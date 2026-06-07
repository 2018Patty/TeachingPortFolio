'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, GraduationCap, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data && data.session) {
        // Set cookie so middleware can protect page
        const token = data.session.access_token;
        document.cookie = `sb-token=${token}; path=/; max-age=86400; SameSite=Lax`;
        
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError('ไม่สามารถลงชื่อเข้าใช้งานได้ ลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setError(err?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 group mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <GraduationCap size={20} />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-slate-800 text-sm block leading-none">
              Teaching Portfolio
            </span>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">ผศ.ดร.ภัทราพร วรินทรเวช</span>
          </div>
        </Link>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
          ระบบจัดการวิชาผู้บริหาร
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          ลงชื่อเข้าใช้ด้วยบัญชีผู้ดูแลระบบ (Supabase Auth)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200/80 shadow-md rounded-[2.5rem] sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-2 text-rose-800 text-xs font-bold leading-relaxed">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email-address" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                อีเมลติดต่อ (Email Address)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                รหัสผ่านเข้าระบบ (Password)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-bold text-white bg-[#4F46E5] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'กำลังลงชื่อเข้าใช้...' : 'เข้าสู่ขั้นตอนผู้บริหาร'}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-200/60 pt-6 text-center">
            <Link 
              href="/"
              className="text-xs text-slate-500 hover:text-indigo-600 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>กลับสู่หน้าเว็บไซต์บุคคลภายนอก</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
