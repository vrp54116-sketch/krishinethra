"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import type { Alert } from "@/lib/types";
import { Card, CardHeader, formatRelativeTime } from "./ui";

const LEVEL_BORDER: Record<string, string> = {
  critical: "border-l-[#FB7185]",
  warning: "border-l-[#FBBF24]",
  info: "border-l-[#34D399]",
};

export const AlertRow = memo(function AlertRow({
  alert,
  now,
  onMarkRead,
}: {
  alert: Alert;
  now: number;
  onMarkRead: (id: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.li
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(!alert.read && !shouldReduceMotion && "alert-shake-single")}
    >
      <button
        type="button"
        onClick={() => onMarkRead(alert.id)}
        title="Mark as read"
        aria-label={`Mark alert as read: ${alert.title}`}
        className={cn(
          "w-full rounded-[16px] border border-white/10 border-l-4 bg-[rgba(18,26,22,0.75)] p-3 text-left transition-all hover:bg-[rgba(18,26,22,0.92)]",
          LEVEL_BORDER[alert.level] ?? "border-l-[#34D399]",
          !alert.read && "bg-[rgba(18,26,22,0.92)] border-white/15",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 truncate text-[13px] font-bold text-white">
            {!alert.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#34D399]" />}
            <span className="truncate">{alert.title}</span>
          </p>
          <span className="shrink-0 font-mono text-[10px] text-[#9CA3AF]">
            {formatRelativeTime(alert.timestamp, now)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-[#9CA3AF]">{alert.message}</p>
      </button>
    </motion.li>
  );
});

export default function AlertsFeed() {
  const t = useT();
  const alerts = useFarmStore((s) => s.alerts);
  const tasks = useFarmStore((s) => s.tasks);
  const markAlertRead = useFarmStore((s) => s.markAlertRead);
  const markAlertsRead = useFarmStore((s) => s.markAlertsRead);

  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter((task) => !task.done && task.dueDate < today);

  // Re-render clock so "x min ago" stays fresh.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // Cap alerts list to 5 (Rule 6)
  const last = alerts.slice(0, 5);
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <Card>
      <CardHeader
        title={t("alertsPage.alertCenter")}
        subtitle={unread > 0 ? `${unread} unread — tap to mark read` : t("common.noAlerts")}
        action={
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                type="button"
                onClick={markAlertsRead}
                aria-label={`Mark all ${unread} alerts as read`}
                className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-[#F3F4F6] transition-colors hover:border-[#34D399]/40 hover:text-[#34D399]"
              >
                {t("common.markAllRead")}
              </button>
            )}
            <Link
              href="/app/alerts"
              aria-label="View all alerts"
              className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-[#F3F4F6] transition-colors hover:border-[#34D399]/40 hover:text-[#34D399]"
            >
              {t("common.viewAll")}
            </Link>
          </div>
        }
      />

      {overdueTasks.length > 0 && (
        <ul className="mb-2 space-y-2">
          {overdueTasks.slice(0, 3).map((task) => (
            <li key={task.id}>
              <Link
                href="/app/tasks"
                className="block w-full animate-pulse rounded-xl border border-red-500/60 bg-red-500/[0.07] p-3 text-left shadow-[0_0_18px_rgba(239,68,68,0.25)] transition-all hover:bg-red-500/[0.12]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-[13px] font-bold text-red-200">
                    Overdue: {task.title}
                  </p>
                  <span className="shrink-0 font-mono text-[10px] text-red-300/80">
                    {task.dueDate}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-red-200/60">
                  Task is past its due date — open Task Manager to finish it.
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {last.length === 0 && overdueTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Bell className="h-6 w-6 text-zinc-600" />
          <p className="text-xs text-zinc-500">{t("common.noAlerts")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {last.map((a) => (
            <AlertRow
              key={a.id}
              alert={a}
              now={now}
              onMarkRead={markAlertRead}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
