"use client";

import { useState } from "react";
import type { GitActivity, TranscriptSummary } from "@clawcommand/shared";
import { timeAgo } from "../lib/format";

interface Props {
  git?: GitActivity;
  transcripts?: TranscriptSummary;
}

export function ActivityTimeline({ git, transcripts }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (!git && !transcripts) return null;

  const visibleCommits = showAll ? (git?.recentCommits ?? []) : (git?.recentCommits ?? []).slice(0, 6);

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        Activity
      </h3>

      {/* Git stats bar */}
      {git && (
        <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="font-semibold text-slate-900 dark:text-white">{git.totalCommits}</span>
            <span className="text-slate-500 dark:text-slate-400">commits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-900 dark:text-white">{git.activeDays}</span>
            <span className="text-slate-500 dark:text-slate-400">active days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-semibold text-slate-900 dark:text-white">{git.filesChanged.length}</span>
            <span className="text-slate-500 dark:text-slate-400">files touched</span>
          </div>
          {git.topAuthors.length > 0 && (
            <div className="text-slate-400 dark:text-slate-500 text-xs ml-auto">
              by {git.topAuthors.map((a) => a.name).join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Commit timeline */}
      {git && git.recentCommits.length > 0 && (
        <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-3">
          {visibleCommits.map((commit) => (
            <div key={commit.hash} className="relative">
              <div className="absolute -left-[1.625rem] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-sky-400 bg-white dark:bg-gray-950" />
              <div className="flex items-baseline gap-2 flex-wrap">
                <code className="text-xs font-mono text-sky-600 dark:text-sky-400">{commit.hash}</code>
                <span className="text-sm text-slate-800 dark:text-slate-200">{commit.message}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                <span>{timeAgo(commit.date)}</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>{commit.author}</span>
                {commit.filesChanged > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>{commit.filesChanged} file{commit.filesChanged !== 1 ? "s" : ""}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {git && (git.recentCommits.length > 6) && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 ml-6 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {showAll ? "Show less" : `Show all ${git.recentCommits.length} commits`}
        </button>
      )}

      {/* Transcript sessions */}
      {transcripts && transcripts.totalSessions > 0 && (
        <div className={git ? "mt-5 pt-5 border-t border-slate-200/60 dark:border-slate-700/60" : ""}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {transcripts.totalSessions} Agent Chat Sessions
            </span>
            {transcripts.dateRange && (
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                {transcripts.dateRange.earliest.slice(0, 10)} to {transcripts.dateRange.latest.slice(0, 10)}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {transcripts.recentSessions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
                <div className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 truncate flex-1">
                  {s.title || "Untitled session"}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                  {s.messageCount} msgs
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                  {timeAgo(s.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
