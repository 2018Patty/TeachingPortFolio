'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore signOut errors
    } finally {
      // Clear cookie
      document.cookie = 'sb-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      router.push('/admin/login');
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 text-xs text-white bg-red-600 hover:bg-red-700 font-extrabold px-3 py-2 rounded-xl border border-transparent shadow-md transition cursor-pointer"
    >
      <LogOut size={13} />
      <span>ออกจากระบบ</span>
    </button>
  );
}
