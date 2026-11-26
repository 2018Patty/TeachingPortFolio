import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

// Detects a newer deployment: each build gives the main script a new hashed name
// (/assets/index-<hash>.js). We re-read index.html now and then and compare it with
// the script this tab is running. If it differs, a new version is live.

const CHECK_EVERY_MS = 3 * 60 * 1000;
const SCRIPT_RE = /\/assets\/index-[\w-]+\.js/;

const runningScript = (): string | null => {
  const el = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'))
    .find(s => SCRIPT_RE.test(s.src));
  return el ? (el.src.match(SCRIPT_RE)?.[0] ?? null) : null;
};

const latestScript = async (): Promise<string | null> => {
  const res = await fetch(`/index.html?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.text()).match(SCRIPT_RE)?.[0] ?? null;
};

export const UpdateBanner: React.FC = () => {
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    const current = runningScript();
    if (!current) return;   // dev server, or an unexpected page layout

    let stopped = false;
    const check = async () => {
      if (stopped || document.visibilityState !== 'visible') return;
      try {
        const latest = await latestScript();
        if (!stopped && latest && latest !== current) setNewVersion(latest);
      } catch {
        // offline or a network hiccup; try again next time
      }
    };

    const timer = window.setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    check();
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  if (!newVersion || dismissed === newVersion) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-md
                 flex items-center gap-3 rounded-2xl bg-slate-900 text-white shadow-2xl px-4 py-3"
    >
      <RefreshCw size={16} className="text-indigo-300 shrink-0" />
      <p className="text-xs leading-snug flex-1">
        <span className="font-bold">มีเวอร์ชันใหม่ของเว็บ</span>
        <span className="block text-slate-300 text-[11px]">กดโหลดเพื่อใช้ฟีเจอร์และการแก้ไขล่าสุด</span>
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-500 hover:bg-indigo-400 transition"
      >
        โหลดเวอร์ชันใหม่
      </button>
      <button
        type="button"
        onClick={() => setDismissed(newVersion)}
        aria-label="ปิด"
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
      >
        <X size={14} />
      </button>
    </div>
  );
};
