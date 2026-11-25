// Assignment attachments (files and videos given by URL).
//
// Stored in assignments.attachment_url (no DB schema change):
//  - old format: one plain URL                → a single "file" link
//  - new format: JSON array of AttachmentLink → '[{"kind":"video","url":"…","label":"…"}]'

export type AttachmentKind = 'file' | 'video';

export interface AttachmentLink {
  kind: AttachmentKind;
  url: string;
  label?: string;
}

export const looksLikeVideo = (url: string): boolean =>
  /(youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|mov|m4v)(\?|#|$))/i.test(url);

export const parseAttachments = (raw?: string | null): AttachmentLink[] => {
  const s = (raw || '').trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr
          .filter(a => a && typeof a.url === 'string' && a.url.trim())
          .map(a => ({
            kind: a.kind === 'video' ? 'video' : 'file',
            url: String(a.url).trim(),
            label: typeof a.label === 'string' && a.label.trim() ? a.label.trim() : undefined,
          }));
      }
    } catch { /* not JSON — fall through to plain URL */ }
  }
  return [{ kind: looksLikeVideo(s) ? 'video' : 'file', url: s }];
};

export const serializeAttachments = (links: AttachmentLink[]): string => {
  const clean = links
    .map(l => ({ kind: l.kind, url: l.url.trim(), ...(l.label?.trim() ? { label: l.label.trim() } : {}) }))
    .filter(l => l.url);
  return clean.length ? JSON.stringify(clean) : '';
};

/** Embeddable player URL for YouTube / Vimeo / Google Drive, or null. */
export const videoEmbedUrl = (url: string): string | null => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = /^\/(shorts|embed|live)\/([^/?#]+)/.exec(u.pathname);
      if (m) return `https://www.youtube.com/embed/${m[2]}`;
      return null;
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').find(p => /^\d+$/.test(p));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === 'drive.google.com') {
      const m = /\/file\/d\/([^/]+)/.exec(u.pathname);
      const id = m?.[1] || u.searchParams.get('id');
      return id ? `https://drive.google.com/file/d/${id}/preview` : null;
    }
  } catch { /* invalid URL */ }
  return null;
};

export const isDirectVideoFile = (url: string): boolean =>
  /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);

// ── Active Learning: active_learning.file_url ────────────────────────────────
// Formats: one plain URL, or a JSON array whose items are uploaded-file URLs
// (strings) and video links ({ kind: 'video', url, label? }).

export const splitActivityFileUrl = (raw?: string | null): { files: string[]; videos: AttachmentLink[] } => {
  const s = (raw || '').trim();
  if (!s) return { files: [], videos: [] };
  let items: unknown[] = [s];
  if (s.startsWith('[')) {
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p)) items = p;
    } catch { /* plain URL */ }
  }
  const files: string[] = [];
  const videos: AttachmentLink[] = [];
  for (const it of items) {
    if (typeof it === 'string') {
      if (it.trim()) files.push(it.trim());
    } else if (it && typeof it === 'object' && typeof (it as AttachmentLink).url === 'string' && (it as AttachmentLink).url.trim()) {
      const l = it as AttachmentLink;
      if (l.kind === 'video') videos.push({ kind: 'video', url: l.url.trim(), label: l.label?.trim() || undefined });
      else files.push(l.url.trim());
    }
  }
  return { files, videos };
};

export const buildActivityFileUrl = (files: string[], videos: AttachmentLink[]): string => {
  const f = files.map(x => x.trim()).filter(Boolean);
  const v = videos
    .map(l => ({ kind: 'video' as const, url: l.url.trim(), ...(l.label?.trim() ? { label: l.label.trim() } : {}) }))
    .filter(l => l.url);
  if (v.length === 0) return f.length === 0 ? '' : f.length === 1 ? f[0] : JSON.stringify(f);
  return JSON.stringify([...f, ...v]);
};

/** Active Learning activity ids ("al-…") also appear in `assignments` as hidden anchor rows
 *  so that assignment_submissions' foreign key accepts submissions for activities. */
export const isActivityAnchorId = (id?: string | null): boolean => (id || '').startsWith('al-');
