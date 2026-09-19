"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  CheckSquare,
  ListTodo,
  MapPin,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import type { Task } from "@/lib/types";
import { Card, CardHeader } from "@/components/dashboard/ui";

type Priority = Task["priority"];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

function fmtDay(iso: string): string {
  const d = parseDay(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function diffDays(aISO: string, bISO: string): number {
  return Math.round((parseDay(aISO).getTime() - parseDay(bISO).getTime()) / 86400000);
}

function fmtDoneTime(ts: number | null | undefined, fallbackDue: string): string {
  if (ts == null) return `due ${fmtDay(fallbackDue)}`;
  const d = new Date(ts);
  const hh = d.getHours();
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const ap = hh < 12 ? "AM" : "PM";
  const today = todayISO();
  const dayISO = d.toISOString().slice(0, 10);
  const dayLabel = dayISO === today ? "today" : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `done ${dayLabel} · ${h12}:${String(d.getMinutes()).padStart(2, "0")} ${ap}`;
}

function dueLabel(task: Task, today: string): { text: string; overdue: boolean } {
  const diff = diffDays(task.dueDate, today);
  if (diff < 0) {
    return {
      text: Math.abs(diff) === 1 ? "Overdue · due yesterday" : `Overdue · ${Math.abs(diff)} days late`,
      overdue: true,
    };
  }
  if (diff === 0) return { text: "Due today", overdue: false };
  if (diff === 1) return { text: "Due tomorrow", overdue: false };
  return { text: `Due ${fmtDay(task.dueDate)}`, overdue: false };
}

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  high: { label: "High", cls: "border-red-400/50 bg-red-500/15 text-red-200" },
  medium: { label: "Medium", cls: "border-amber-400/50 bg-amber-500/15 text-amber-200" },
  low: { label: "Low", cls: "border-emerald-400/50 bg-emerald-500/15 text-emerald-200" },
};

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function Rise({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress ring + confetti                                            */
/* ------------------------------------------------------------------ */

function ProgressRing({ done, total }: { done: number; total: number }) {
  const size = 92;
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;
  const filled = pct * c;
  const allDone = total > 0 && done === total;
  const color = allDone ? "#22c55e" : pct >= 0.5 ? "#34d399" : "#f59e0b";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          initial={false}
          animate={{ strokeDasharray: `${filled} ${c}` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold tabular-nums text-white">
          {done}/{total}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          {total === 0 ? "no tasks" : `${Math.round(pct * 100)}%`}
        </span>
      </span>
    </div>
  );
}

const CONFETTI_COLORS = ["#22c55e", "#f59e0b", "#38bdf8", "#a855f7", "#ef4444", "#facc15"];

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        x: (i * 37) % 260 - 130,
        delay: (i % 9) * 0.06,
        duration: 1.6 + ((i * 13) % 10) / 12,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + ((i * 7) % 6),
        round: i % 3 === 0,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: -12, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: 150, opacity: [1, 1, 0], rotate: 360 }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatDelay: 1.2, ease: "easeIn" }}
          className={cn("absolute left-1/2 top-2", p.round && "rounded-full")}
          style={{ width: p.size, height: p.size * (p.round ? 1 : 0.5), background: p.color }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Task card                                                           */
/* ------------------------------------------------------------------ */

function TaskCard({ task, today }: { task: Task; today: string }) {
  const toggleTask = useFarmStore((s) => s.toggleTask);
  const { text, overdue } = task.done ? { text: "", overdue: false } : dueLabel(task, today);
  const prio = PRIORITY_META[task.priority];

  const handleToggle = () => {
    const willBeDone = !task.done;
    toggleTask(task.id);
    if (willBeDone) {
      toast.success("Task done! 🎉", { description: task.title });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3.5 transition-colors",
        task.done
          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
          : overdue
            ? "animate-pulse border-red-500/70 bg-red-500/[0.07] shadow-[0_0_18px_rgba(239,68,68,0.25)]"
            : "border-white/5 bg-black/30 hover:border-emerald-500/25",
      )}
    >
      {/* Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `Reopen: ${task.title}` : `Complete: ${task.title}`}
        onClick={handleToggle}
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all active:scale-90",
          task.done
            ? "border-emerald-400 bg-emerald-500 shadow-[0_0_14px_rgba(34,197,94,0.6)]"
            : overdue
              ? "border-red-400/70 bg-white/[0.03] hover:border-red-300"
              : "border-white/20 bg-white/[0.03] hover:border-emerald-400/70",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {task.done && (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 500 }}
            >
              <Check className="h-4 w-4 text-black" strokeWidth={3.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-[13px] font-bold leading-snug", task.done ? "text-zinc-500 line-through" : "text-white")}>
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", prio.cls)}>
            {prio.label}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-zinc-300">
            {task.source === "ai" ? "🤖 AI" : "✍️ Manual"}
          </span>
          {task.zone && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              <MapPin className="h-3 w-3" /> Zone {task.zone}
            </span>
          )}
          {task.done ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300/80">
              <Check className="h-3 w-3" /> {fmtDoneTime(task.completedAt, task.dueDate)}
            </span>
          ) : (
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold", overdue ? "text-red-300" : "text-zinc-500")}>
              <CalendarDays className="h-3 w-3" /> {text} · {fmtDay(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Add-task modal                                                      */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors placeholder:font-normal placeholder:text-zinc-600 focus:border-emerald-500/50 [&>option]:bg-[#0a120c]";

const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500";

function AddTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const addTask = useFarmStore((s) => s.addTask);
  const zones = useFarmStore((s) => s.zones);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<string>(todayISO());
  const [zone, setZone] = useState<string>("none");

  const close = () => {
    setTitle("");
    setPriority("medium");
    setDueDate(todayISO());
    setZone("none");
    onClose();
  };

  const submit = () => {
    if (title.trim().length === 0) {
      toast.error("Title required", { description: "Give the task a short name." });
      return;
    }
    addTask({
      title: title.trim(),
      priority,
      dueDate: dueDate || todayISO(),
      done: false,
      source: "manual",
      ...(zone !== "none" ? { zone } : {}),
    });
    toast.success("Task added", { description: "It now shows in your list." });
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="card-surface pointer-events-auto max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-extrabold text-white">
                    <ListTodo className="h-5 w-5 text-emerald-300" /> {t("tasks.addTask")}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">Manual tasks sit alongside AI suggestions.</p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close dialog"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className={labelCls}>{t("tasks.title")}</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Irrigate Zone A in the evening"
                    className={inputCls}
                  />
                </label>
                <div>
                  <span className={labelCls}>{t("tasks.priority")}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={priority === p}
                        onClick={() => setPriority(p)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-xs font-extrabold transition-all active:scale-[0.97]",
                          priority === p
                            ? PRIORITY_META[p].cls + " shadow-[0_0_14px_rgba(34,197,94,0.25)]"
                            : "border-white/10 bg-black/30 text-zinc-400 hover:text-white",
                        )}
                      >
                        {PRIORITY_META[p].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelCls}>{t("tasks.dueDate")}</span>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>{t("tasks.zone")}</span>
                    <select value={zone} onChange={(e) => setZone(e.target.value)} className={inputCls}>
                      <option value="none">No zone</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          Zone {z.id} — {z.crop}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={submit}
                  className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
                >
                  {t("tasks.saveTask")}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TasksPage() {
  const t = useT();
  const tasks = useFarmStore((s) => s.tasks);
  const generateDailyTasks = useFarmStore((s) => s.generateDailyTasks);
  const [modalOpen, setModalOpen] = useState(false);

  const today = todayISO();

  const todayPending = useMemo(
    () =>
      tasks
        .filter((t) => !t.done && t.dueDate <= today)
        .sort((a, b) => {
          const aOver = a.dueDate < today ? 0 : 1;
          const bOver = b.dueDate < today ? 0 : 1;
          if (aOver !== bOver) return aOver - bOver;
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.dueDate.localeCompare(b.dueDate);
        }),
    [tasks, today],
  );

  const completed = useMemo(
    () =>
      [...tasks.filter((t) => t.done)].sort((a, b) => {
        const at = a.completedAt ?? 0;
        const bt = b.completedAt ?? 0;
        if (at !== bt) return bt - at;
        return b.dueDate.localeCompare(a.dueDate);
      }),
    [tasks],
  );

  const upcomingGroups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks.filter((t) => !t.done && t.dueDate > today)) {
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, list]) => ({
        date,
        list: list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]),
      }));
  }, [tasks, today]);

  const todayScope = useMemo(() => tasks.filter((t) => t.dueDate <= today), [tasks, today]);
  const todayDone = todayScope.filter((t) => t.done).length;
  const allTodayDone = todayScope.length > 0 && todayDone === todayScope.length;
  const overdueCount = tasks.filter((t) => !t.done && t.dueDate < today).length;

  const handleGenerate = () => {
    const before = useFarmStore.getState().tasks.length;
    generateDailyTasks();
    const added = useFarmStore.getState().tasks.length - before;
    if (added > 0) {
      toast.success(`Generated ${added} AI task${added === 1 ? "" : "s"}`, {
        description: "Built from live moisture, tank, spray and fertilizer state.",
      });
    } else {
      toast.info("Already up to date", { description: "No new AI tasks — nothing fresh to add." });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* Header: progress + actions */}
      <Rise>
        <Card className="relative overflow-hidden">
          {allTodayDone && <ConfettiBurst />}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <ProgressRing done={todayDone} total={todayScope.length} />
              <div>
                <h2 className="text-base font-extrabold text-white sm:text-lg">
                  {allTodayDone
                    ? t("tasks.allDone")
                    : todayScope.length === 0
                      ? t("tasks.noTasksToday")
                      : `${todayDone}/${todayScope.length} ${t("tasks.today")}`}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {overdueCount > 0
                    ? `${overdueCount} overdue — finish ${overdueCount === 1 ? "it" : "them"} first.`
                    : "Overdue tasks pulse red and raise dashboard alerts."}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4" /> {t("tasks.generateAI")}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-extrabold text-emerald-200 transition-all hover:bg-emerald-500/20 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" strokeWidth={3} /> {t("tasks.addTask")}
              </button>
            </div>
          </div>
        </Card>
      </Rise>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        {/* TODAY */}
        <Rise delay={0.05}>
          <Card className="h-full">
            <CardHeader
              title={t("tasks.today")}
              subtitle={`${todayPending.length} pending · AI + manual`}
              action={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <CheckSquare className="h-4 w-4" />
                </span>
              }
            />
            {todayPending.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs leading-relaxed text-zinc-500">
                {todayScope.length === 0
                  ? "Nothing due today — press “Generate AI Tasks” to build the day's plan."
                  : "Everything due is done. Enjoy the evening chai. ☕"}
              </p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {todayPending.map((t) => (
                    <TaskCard key={t.id} task={t} today={today} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </Rise>

        {/* COMPLETED */}
        <Rise delay={0.08}>
          <Card className="h-full">
            <CardHeader
              title={t("tasks.completed")}
              subtitle={`${completed.length} done`}
              action={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                  <Check className="h-4 w-4" />
                </span>
              }
            />
            {completed.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs leading-relaxed text-zinc-500">
                No finished tasks yet — tick one off and it lands here.
              </p>
            ) : (
              <div className="max-h-[480px] space-y-2 overflow-y-auto pr-0.5">
                <AnimatePresence initial={false}>
                  {completed.map((t) => (
                    <TaskCard key={t.id} task={t} today={today} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </Rise>
      </div>

      {/* UPCOMING */}
      <Rise delay={0.1}>
        <Card>
          <CardHeader
            title={t("tasks.upcoming")}
            subtitle={`${upcomingGroups.reduce((n, g) => n + g.list.length, 0)} scheduled ahead`}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                <CalendarDays className="h-4 w-4" />
              </span>
            }
          />
          {upcomingGroups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs leading-relaxed text-zinc-500">
              Nothing scheduled ahead — future-dated tasks group here by date.
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingGroups.map((g) => (
                <div key={g.date}>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <CalendarDays className="h-3 w-3" /> {fmtDay(g.date)}
                    <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                      {g.list.length}
                    </span>
                  </p>
                  <div className="space-y-2">
                    {g.list.map((t) => (
                      <TaskCard key={t.id} task={t} today={today} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Rise>

      <AddTaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
