/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, UserCircle, BarChart2, GraduationCap, UserRound, Home } from 'lucide-react';
import { Role, StudentProfile } from '../types';

type Page = 'courses' | 'profile' | 'dashboard' | 'student-profile' | 'admin-panel';

interface NavbarProps {
  currentRole: Role;
  currentPage: Page;
  studentProfile?: StudentProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  onStudentLogin: () => void;
  onStudentLogout: () => void;
  onNavigate: (page: Page) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentPage,
  studentProfile,
  onLogin,
  onLogout,
  onStudentLogin,
  onStudentLogout,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: App Brand */}
        <button
          onClick={() => onNavigate('courses')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-indigo-100">
            P
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-800">
            PattyTeacher Course
          </span>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Home link */}
          <button
            onClick={() => onNavigate('courses')}
            className={`text-sm font-semibold py-1 flex items-center gap-1.5 border-b-2 transition-colors ${
              currentPage === 'courses'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-600 hover:text-indigo-600 border-transparent hover:border-indigo-300'
            }`}
          >
            <Home size={15} className="opacity-80" />
            <span className="hidden sm:inline">หน้าแรก</span>
          </button>

          {/* Instructor profile link */}
          <button
            onClick={() => onNavigate('profile')}
            className={`text-sm font-semibold py-1 flex items-center gap-1.5 border-b-2 transition-colors ${
              currentPage === 'profile'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-600 hover:text-indigo-600 border-transparent hover:border-indigo-300'
            }`}
            id="nav-profile-link"
          >
            <UserCircle size={15} className="opacity-80" />
            <span className="hidden sm:inline">ข้อมูลอาจารย์</span>
          </button>

          {/* Admin Panel — admin only */}
          {currentRole === 'admin' && (
            <button
              onClick={() => onNavigate('admin-panel')}
              className={`text-sm font-semibold py-1 flex items-center gap-1.5 border-b-2 transition-colors ${
                currentPage === 'admin-panel' || currentPage === 'dashboard'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-slate-600 hover:text-indigo-600 border-transparent hover:border-indigo-300'
              }`}
              id="nav-dashboard-link"
            >
              <BarChart2 size={15} className="opacity-80" />
              <span className="hidden sm:inline">BackOffice</span>
            </button>
          )}

          {/* Student profile link — student only */}
          {currentRole === 'student' && (
            <button
              onClick={() => onNavigate('student-profile')}
              className={`text-sm font-semibold py-1 flex items-center gap-1.5 border-b-2 transition-colors ${
                currentPage === 'student-profile'
                  ? 'text-emerald-600 border-emerald-600'
                  : 'text-slate-600 hover:text-emerald-600 border-transparent hover:border-emerald-300'
              }`}
              id="nav-student-profile-link"
            >
              <UserRound size={15} className="opacity-80" />
              <span className="hidden sm:inline">โปรไฟล์ของฉัน</span>
            </button>
          )}

          {/* Role status badge */}
          {currentRole === 'guest' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <User size={13} />
              <span>ผู้เยี่ยมชม</span>
            </div>
          )}
          {currentRole === 'admin' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
              <User size={13} />
              <span>อาจารย์ (Admin)</span>
            </div>
          )}
          {currentRole === 'student' && studentProfile && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <GraduationCap size={13} />
              <span className="max-w-[120px] truncate">
                {studentProfile.first_name
                  ? `${studentProfile.first_name} ${studentProfile.last_name}`.trim()
                  : studentProfile.email}
              </span>
            </div>
          )}

          {/* Auth buttons */}
          {currentRole === 'guest' ? (
            <>
              <button
                onClick={onStudentLogin}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-sm hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-95"
                id="nav-student-login-btn"
              >
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={13} />
                  <span>Login / สมัครเข้าเรียน</span>
                </span>
              </button>
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-[#4F46E5] text-white text-xs font-semibold rounded-full shadow-sm hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95"
                id="nav-login-btn"
              >
                <span>Admin</span>
              </button>
            </>
          ) : currentRole === 'student' ? (
            <button
              onClick={onStudentLogout}
              className="px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-full shadow-sm hover:bg-red-600 transition-all hover:scale-[1.02] active:scale-95"
              id="nav-student-logout-btn"
            >
              ออกจากระบบ
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-full shadow-sm hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-95"
              id="nav-logout-btn"
            >
              ออกจากระบบ
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
