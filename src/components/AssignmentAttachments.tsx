import React, { useState } from 'react';
import { Paperclip, PlayCircle, ExternalLink, X } from 'lucide-react';
import {
  parseAttachments, serializeAttachments, splitActivityFileUrl, videoEmbedUrl, isDirectVideoFile, type AttachmentLink,
} from '../utils/assignmentLinks';

const linkLabel = (l: AttachmentLink, i: number, all: AttachmentLink[]) => {
  if (l.label) return l.label;
  const sameKind = all.filter(x => x.kind === l.kind);
  const n = sameKind.indexOf(l) + 1;
  const base = l.kind === 'video' ? 'วีดีโอประกอบ' : 'ไฟล์โจทย์งาน';
  return sameKind.length > 1 ? `${base} ${n}` : base;
};

/** Video player for an attachment (YouTube / Vimeo / Drive / .mp4), or a plain link. */
export const AttachmentVideo: React.FC<{ link: AttachmentLink; title: string }> = ({ link, title }) => {
  const embed = videoEmbedUrl(link.url);
  if (embed) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
        <iframe
          src={embed}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }
  if (isDirectVideoFile(link.url)) {
    return <video src={link.url} controls className="w-full rounded-xl bg-slate-900 border border-slate-200" />;
  }
  return null;
};

/**
 * Attachment chips for an assignment. Files open in a new tab; videos that can be
 * embedded open an inline player (variant "full" shows the players directly).
 */
export const AssignmentAttachments: React.FC<{
  raw?: string;
  variant?: 'chips' | 'full' | 'compact';
}> = ({ raw, variant = 'chips' }) => {
  const links = parseAttachments(raw);
  const [playing, setPlaying] = useState<number | null>(null);
  if (links.length === 0) return null;

  if (variant === 'compact') {
    return (
      <>
        {links.map((l, i) => (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 font-bold ${l.kind === 'video' ? 'text-rose-600 hover:text-rose-800' : 'text-indigo-600 hover:text-indigo-800'}`}
          >
            {l.kind === 'video' ? <PlayCircle size={10} /> : <Paperclip size={10} />}
            {linkLabel(l, i, links)}
          </a>
        ))}
      </>
    );
  }

  const chip = (l: AttachmentLink, i: number) => {
    const label = linkLabel(l, i, links);
    const playable = l.kind === 'video' && (videoEmbedUrl(l.url) || isDirectVideoFile(l.url));
    const cls = `inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition ${
      l.kind === 'video'
        ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-100/60'
        : 'text-pink-700 bg-pink-50 hover:bg-pink-100 border-pink-100/50'
    }`;
    if (playable && variant === 'chips') {
      return (
        <button key={i} type="button" onClick={() => setPlaying(playing === i ? null : i)} className={cls}>
          {playing === i ? <X size={12} /> : <PlayCircle size={12} />}
          <span>{playing === i ? 'ปิดวีดีโอ' : label}</span>
        </button>
      );
    }
    return (
      <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className={cls}>
        {l.kind === 'video' ? <PlayCircle size={12} /> : <Paperclip size={12} />}
        <span>{label}</span>
        <ExternalLink size={10} className="opacity-60" />
      </a>
    );
  };

  if (variant === 'full') {
    const videos = links.filter(l => l.kind === 'video' && (videoEmbedUrl(l.url) || isDirectVideoFile(l.url)));
    return (
      <div className="space-y-2.5">
        {videos.map((l, i) => (
          <div key={`v${i}`} className="space-y-1">
            <p className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
              <PlayCircle size={11} /> {linkLabel(l, links.indexOf(l), links)}
            </p>
            <AttachmentVideo link={l} title={linkLabel(l, links.indexOf(l), links)} />
          </div>
        ))}
        <div className="flex flex-wrap gap-1.5">{links.map(chip)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <div className="flex flex-wrap gap-1.5">{links.map(chip)}</div>
      {playing !== null && links[playing] && (
        <AttachmentVideo link={links[playing]} title={linkLabel(links[playing], playing, links)} />
      )}
    </div>
  );
};

/** Video links of an Active Learning activity (from active_learning.file_url). */
export const ActivityVideos: React.FC<{ raw?: string }> = ({ raw }) => {
  const { videos } = splitActivityFileUrl(raw);
  if (videos.length === 0) return null;
  return <AssignmentAttachments raw={serializeAttachments(videos)} />;
};
