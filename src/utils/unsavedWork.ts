import { useEffect } from 'react';

// Pages with unsaved edits register here. The auto-updater waits while any are
// registered, so a new deployment never reloads the page over someone's work.

let pending = 0;

export const hasRegisteredUnsavedWork = () => pending > 0;

/** While `active` is true: warn on leaving the page, and hold off automatic reloads. */
export const useUnsavedWork = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    pending += 1;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => {
      pending -= 1;
      window.removeEventListener('beforeunload', warn);
    };
  }, [active]);
};
