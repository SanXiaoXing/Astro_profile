"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ponytail: 生产环境用 Vercel Edge Function 代理，开发环境直连 Mastodon
const API_URL =
  typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? "/api/mastodon" // 生产：走 Vercel 代理（国内可访问）
    : "https://m.cmx.im/api/v1/accounts/116669312102420954/statuses?exclude_replies=true&exclude_reblogs=true&limit=20"; // 开发：直连 Mastodon（需 VPN）

interface MediaAttachment {
  id: string;
  type: "image" | "video" | "gifv" | "audio" | "unknown";
  url: string;
  preview_url: string | null;
  description?: string | null;
}

interface Status {
  id: string;
  created_at: string;
  url: string;
  content: string;
  sensitive: boolean;
  spoiler_text: string;
  favourites_count: number;
  reblogs_count: number;
  replies_count: number;
  media_attachments: MediaAttachment[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stat({ path, count, label }: { path: string; count: number; label: string }) {
  return (
    <span className="group inline-flex items-center gap-1.5 text-[var(--gray)] transition-colors hover:text-[var(--fontc)]" title={label}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-200 group-hover:scale-110"
      >
        <path d={path} />
      </svg>
      <span className="font-mono text-[11px]">{count}</span>
    </span>
  );
}

function MediaGrid({ media, sensitive }: { media: MediaAttachment[]; sensitive: boolean }) {
  const [revealed, setRevealed] = useState(!sensitive);
  if (media.length === 0) return null;

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="mt-4 text-left text-xs text-[var(--gray)] transition-[transform,color] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-[var(--fontc)] active:scale-[0.97]"
      >
        <span className="font-mono text-[var(--orange)]">敏感内容</span>
        <span className="ml-2">点击显示 {media.length} 个附件</span>
      </button>
    );
  }

  const gridClass = media.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className={`mt-4 grid ${gridClass} gap-2`}>
      {media.map((m) => {
        if (m.type === "video" || m.type === "gifv") {
          return (
            <video
              key={m.id}
              src={m.url}
              controls
              loop={m.type === "gifv"}
              className="w-full rounded-lg bg-black"
              preload="metadata"
            />
          );
        }
        if (m.type === "audio") {
          return <audio key={m.id} src={m.url} controls className="w-full" />;
        }
        return (
          <a
            key={m.id}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/media block overflow-hidden rounded-lg"
          >
            <img
              src={m.preview_url || m.url}
              alt={m.description || "图片附件"}
              loading="lazy"
              className="block aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover/media:scale-105"
            />
          </a>
        );
      })}
    </div>
  );
}

function ContentBody({ html }: { html: string }) {
  return <div className="prose-masto text-[15px] text-[var(--fontc)]/90" dangerouslySetInnerHTML={{ __html: html }} />;
}

function StatusCard({ status, index }: { status: Status; index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay: shouldReduceMotion ? 0 : (index % 4) * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative"
    >
      <div className="flex gap-5 sm:gap-6">
        {/* timeline line */}
        <div className="relative flex shrink-0 flex-col items-center">
          <div className="h-2 w-2 rounded-full bg-[var(--hc)]/60 ring-4 ring-[hsl(var(--primary)/0.08)] transition-[background-color,box-shadow] duration-[var(--duration-base)] group-hover:bg-[var(--hc)] group-hover:ring-[hsl(var(--primary)/0.15)]" />
          <div className="mt-3 w-px flex-1 bg-[var(--current-line)]" />
        </div>

        <div className="flex-1 pb-10">
          <a
            href={status.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 inline-block font-mono text-base text-[var(--gray)] transition-colors hover:text-[var(--hc)]"
            title={new Date(status.created_at).toLocaleString("zh-CN")}
          >
            {formatTime(status.created_at)}
          </a>

          <div className="rounded-2xl border border-[hsl(var(--primary)/0.1)] bg-[hsl(var(--card)/0.4)] p-4 transition-[background-color,border-color] duration-[var(--duration-base)] group-hover:border-[hsl(var(--primary)/0.22)] group-hover:bg-[hsl(var(--card)/0.6)] sm:p-5">
            <ContentBody html={status.content} />

            {status.media_attachments.length > 0 && (
              <MediaGrid media={status.media_attachments} sensitive={status.sensitive} />
            )}

            <div className="mt-4 flex items-center gap-4 border-t border-[var(--current-line)] pt-3">
              <Stat path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" count={status.replies_count} label="回复" />
              <Stat path="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" count={status.reblogs_count} label="转发" />
              <Stat path="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" count={status.favourites_count} label="喜欢" />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-5 sm:gap-6">
      <div className="relative flex shrink-0 flex-col items-center">
        <div className="h-2 w-2 rounded-full bg-[var(--current-line)]" />
        <div className="mt-3 w-px flex-1 bg-[var(--current-line)]" />
      </div>
      <div className="flex-1 pb-10">
        <div className="mb-2 h-3 w-24 animate-pulse rounded bg-[var(--current-line)]" />
        <div className="rounded-2xl border border-[hsl(var(--primary)/0.08)] bg-[hsl(var(--card)/0.3)] p-4 sm:p-5">
          <div className="space-y-2.5">
            <div className="h-3 w-full animate-pulse rounded bg-[var(--current-line)]" />
            <div className="h-3 w-[92%] animate-pulse rounded bg-[var(--current-line)]" />
            <div className="h-3 w-[70%] animate-pulse rounded bg-[var(--current-line)]" />
          </div>
          <div className="mt-4 flex gap-4 border-t border-[var(--current-line)] pt-3">
            <div className="h-4 w-10 animate-pulse rounded bg-[var(--current-line)]" />
            <div className="h-4 w-10 animate-pulse rounded bg-[var(--current-line)]" />
            <div className="h-4 w-10 animate-pulse rounded bg-[var(--current-line)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MastodonFeed() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Status[] = await res.json();
      setStatuses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--red)]/25 bg-[var(--red)]/[0.04] p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--red)]/20 bg-[var(--red)]/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--red)]">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="font-mono text-sm text-[var(--gray)]">加载失败：{error}</p>
        <button
          onClick={load}
          className="rounded-lg border border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.08)] px-4 py-2 font-mono text-xs text-[var(--hc)] transition-[transform,background-color] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[hsl(var(--primary)/0.14)] active:scale-[0.97]"
        >
          重试
        </button>
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[hsl(var(--primary)/0.12)] bg-[hsl(var(--card)/0.35)] p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--current-line)] bg-[hsl(var(--muted)/0.4)] text-[var(--gray)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="font-mono text-sm text-[var(--gray)]">暂无嘟文</p>
      </div>
    );
  }

  return (
    <div className="pl-1 sm:pl-0">
      {statuses.map((s, i) => (
        <StatusCard key={s.id} status={s} index={i} />
      ))}
    </div>
  );
}
