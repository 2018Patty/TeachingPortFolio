import { useEffect } from 'react';
import { hasRegisteredUnsavedWork } from '../utils/unsavedWork';

// Reloads the page automatically when a newer deployment is live.
// Each build gives the main script a new hashed name (/assets/index-<hash>.js), so we
// re-read index.html now and then and compare it with the script this tab is running.
// The reload waits until it cannot lose work: no unsaved grades, no open form dialog,
// and nobody typing in a field.

const CHECK_EVERY_MS = 3 * 60 * 1000;
const SAFE_RETRY_MS = 5 * 1000;
const SCRIPT_RE = /\/assets\/index-[\w-]+\.js/;
const TRIED_KEY = 'auto-update-tried';

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

const isTyping = () => {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
};

// Dialogs in this app are fixed overlays; one holding a form may have unsaved input.
const formDialogOpen = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.fixed'))
    .some(el => el.getClientRects().length > 0 && !!el.querySelector('form, textarea'));

const safeToReload = () => !hasRegisteredUnsavedWork() && !isTyping() && !formDialogOpen();

const readTried = () => { try { return sessionStorage.getItem(TRIED_KEY); } catch { return null; } };
const writeTried = (v: string) => { try { sessionStorage.setItem(TRIED_KEY, v); } catch { /* ignore */ } };

export const AutoUpdate = () => {
  useEffect(() => {
    const current = runningScript();
    if (!current) return;   // dev server, or an unexpected page layout

    let stopped = false;
    let waitTimer: number | undefined;

    const reloadWhenSafe = (latest: string) => {
      if (stopped) return;
      if (safeToReload()) {
        writeTried(latest);
        window.location.reload();
        return;
      }
      window.clearTimeout(waitTimer);
      waitTimer = window.setTimeout(() => reloadWhenSafe(latest), SAFE_RETRY_MS);
    };

    const check = async () => {
      if (stopped || document.visibilityState !== 'visible') return;
      try {
        const latest = await latestScript();
        // Already reloaded once for this version but still running the old one
        // (e.g. a cache served the old page): don't loop.
        if (!stopped && latest && latest !== current && readTried() !== latest) reloadWhenSafe(latest);
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
      window.clearTimeout(waitTimer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  return null;
};
