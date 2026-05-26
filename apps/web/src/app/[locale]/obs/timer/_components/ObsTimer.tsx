"use client";

import { differenceInSeconds, endOfDay, startOfDay } from "date-fns";
import { fromS } from "hh-mm-ss";
import { useEffect, useMemo, useState } from "react";
import { useDuration } from "../../../_hooks/useDuration";

const formatDuration = (seconds: number) => fromS(seconds, "hh:mm:ss");

type TimerStatus = {
  isRunning: boolean;
  currentDuration: number;
  activeTodayDuration: number;
  todayProjectDuration: number;
  todayTotalDuration: number;
  runningTimeEntry: {
    description: string;
    folderId: string;
    startedAt: string;
  } | null;
  folder: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  } | null;
};

export const ObsTimer = () => {
  const [status, setStatus] = useState<TimerStatus | null>(null);
  const todayRange = useMemo(() => {
    const now = new Date();
    return {
      startDate: startOfDay(now),
      endDate: endOfDay(now),
    };
  }, []);

  useEffect(() => {
    const refreshStatus = async () => {
      const res = await fetch("/api/obs/timer", { cache: "no-store" });
      if (!res.ok) return;
      setStatus((await res.json()) as TimerStatus);
    };

    void refreshStatus();
    const intervalId = setInterval(() => void refreshStatus(), 5000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const activeEntry = status?.runningTimeEntry ?? null;
  const startedAt =
    activeEntry === null ? undefined : new Date(activeEntry.startedAt);
  const currentDuration = useDuration(startedAt);
  const currentFolder = status?.folder ?? null;
  const startedToday =
    activeEntry !== null &&
    startedAt !== undefined &&
    startedAt >= todayRange.startDate;
  const activeTodayDuration =
    activeEntry === null || startedAt === undefined
      ? 0
      : Math.max(
          0,
          differenceInSeconds(
            new Date(),
            startedToday ? startedAt : todayRange.startDate,
          ),
        );
  const todayProjectDuration =
    (status?.todayProjectDuration ?? 0) +
    (activeTodayDuration - (status?.activeTodayDuration ?? 0));
  const todayTotalDuration =
    (status?.todayTotalDuration ?? 0) +
    (activeTodayDuration - (status?.activeTodayDuration ?? 0));

  return (
    <main className="flex min-h-screen items-start bg-transparent p-4 text-white">
      <section className="w-[min(100vw,32rem)] border border-white/20 bg-black/45 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              Current timer
            </p>
            <h1 className="mt-1 truncate text-xl font-semibold text-white">
              {currentFolder
                ? `${currentFolder.emoji} ${currentFolder.name}`
                : activeEntry
                  ? "Running"
                  : "Idle"}
            </h1>
          </div>
          <span
            className={`size-3 shrink-0 rounded-full ${activeEntry ? "animate-pulse bg-red-400" : "bg-white/35"}`}
            aria-label={activeEntry ? "Timer running" : "Timer idle"}
          />
        </div>

        <div className="font-mono text-[3.5rem] leading-none text-white tabular-nums">
          {formatDuration(currentDuration)}
        </div>

        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-white/60">Today project</dt>
          <dd className="font-mono text-white tabular-nums">
            {formatDuration(todayProjectDuration)}
          </dd>
          <dt className="text-white/60">Today total</dt>
          <dd className="font-mono text-white tabular-nums">
            {formatDuration(todayTotalDuration)}
          </dd>
          <dt className="text-white/60">Started</dt>
          <dd className="font-mono text-white tabular-nums">
            {activeEntry
              ? startedAt?.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "--:--:--"}
          </dd>
        </dl>

        <div className="mt-5 border-t border-white/15 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Note
          </p>
          <p className="mt-2 min-h-6 break-words text-lg text-white">
            {activeEntry?.description !== undefined &&
            activeEntry.description !== ""
              ? activeEntry.description
              : "No active timer"}
          </p>
        </div>
      </section>
    </main>
  );
};
