"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { uid } from "@/lib/simulation-engine";
import type { IrrigationScheduleSlot } from "@/lib/types";
import { Card, CardHeader, useMounted } from "@/components/dashboard/ui";
import { WEEKDAYS, WEEKDAYS_SHORT } from "./shared";

function nextOccurrence(slot: IrrigationScheduleSlot, from: Date): Date {
  const [h, m] = slot.time.split(":").map(Number);
  const d = new Date(from);
  d.setHours(h || 0, m || 0, 0, 0);
  let delta = (slot.day - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() <= from.getTime()) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

/** Stable fallback so the store selector below never returns a new reference. */
const EMPTY_SLOTS: IrrigationScheduleSlot[] = [];

function formatSlotTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function SchedulePanel() {
  const t = useT();
  const storedSlots = useFarmStore((s) => s.settings.irrigationSchedule);
  const slots = storedSlots ?? EMPTY_SLOTS;
  const pumpMode = useFarmStore((s) => s.pump.mode);
  const simMode = useFarmStore((s) => s.settings.mode);
  const updateSettings = useFarmStore((s) => s.updateSettings);
  const startScheduledRun = useFarmStore((s) => s.startScheduledRun);
  const addAlert = useFarmStore((s) => s.addAlert);
  const mounted = useMounted();

  const [day, setDay] = useState("1");
  const [time, setTime] = useState("06:00");
  const [durationMin, setDurationMin] = useState("8");
  const firedRef = useRef<string | null>(null);

  // Fire weekly slots while in Schedule mode (simulation clock = wall clock).
  useEffect(() => {
    const id = setInterval(() => {
      const st = useFarmStore.getState();
      if (st.settings.mode !== "simulation" || st.pump.mode !== "schedule") return;
      const list = st.settings.irrigationSchedule ?? [];
      if (list.length === 0) return;
      const now = new Date();
      const dateStr = now.toDateString();
      for (const slot of list) {
        if (slot.day !== now.getDay()) continue;
        const [h, m] = slot.time.split(":").map(Number);
        const slotTime = new Date(now);
        slotTime.setHours(h || 0, m || 0, 0, 0);
        const diff = now.getTime() - slotTime.getTime();
        const key = `${slot.id}@${dateStr}`;
        if (diff >= 0 && diff < 60_000 && firedRef.current !== key) {
          firedRef.current = key;
          const moisture = st.snapshot.soilMoistureB.toFixed(1);
          st.startScheduledRun(slot.durationMin * 60);
          st.addAlert({
            level: "info",
            title: "Scheduled irrigation started",
            message: `${WEEKDAYS[slot.day]} ${slot.time} slot — running ${slot.durationMin} min. Zone B at ${moisture}%.`,
          });
          toast.success("Scheduled irrigation started", {
            description: `${WEEKDAYS[slot.day]} ${slot.time} · ${slot.durationMin} min run.`,
          });
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [startScheduledRun, addAlert]);

  const next = useMemo(() => {
    if (slots.length === 0) return null;
    const now = new Date();
    let best: { slot: IrrigationScheduleSlot; at: Date } | null = null;
    for (const slot of slots) {
      const at = nextOccurrence(slot, now);
      if (!best || at.getTime() < best.at.getTime()) best = { slot, at };
    }
    return best;
  }, [slots]);

  const nextLabel = useMemo(() => {
    if (!next || !mounted) return null;
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const target = new Date(next.at);
    target.setHours(0, 0, 0, 0);
    const dayDiff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    const dayWord = dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : WEEKDAYS[next.at.getDay()];
    return `${dayWord} ${formatSlotTime(next.slot.time)} (${next.slot.durationMin} min)`;
  }, [next, mounted]);

  const handleAdd = () => {
    const dur = Math.max(1, Math.min(120, Math.round(Number(durationMin) || 8)));
    const slot: IrrigationScheduleSlot = {
      id: uid("sched"),
      day: Math.max(0, Math.min(6, Number(day))),
      time: /^\d{2}:\d{2}$/.test(time) ? time : "06:00",
      durationMin: dur,
    };
    updateSettings({ irrigationSchedule: [...slots, slot] });
    toast.success("Schedule slot added", {
      description: `${WEEKDAYS[slot.day]} ${slot.time} · ${slot.durationMin} min.`,
    });
  };

  const handleDelete = (id: string) => {
    updateSettings({ irrigationSchedule: slots.filter((s) => s.id !== id) });
  };

  return (
    <Card>
      <CardHeader
        title={t("irrigation.scheduleTitle")}
        subtitle={t("irrigation.scheduleSub")}
        action={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <CalendarClock className="h-4 w-4" />
          </span>
        }
      />

      {/* Next run banner */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          next
            ? "border-violet-400/40 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
            : "border-white/10 bg-black/40",
        )}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{t("irrigation.nextScheduled")}</p>
        <p className="mt-0.5 font-extrabold text-white">
          {!mounted ? "…" : next && nextLabel ? nextLabel : t("irrigation.noSlots")}
        </p>
        {pumpMode !== "schedule" && next && (
          <p className="mt-1 text-[11px] text-amber-200/80">
            Pump is not in Schedule mode — switch modes in the pump card to let slots fire.
          </p>
        )}
        {simMode !== "simulation" && (
          <p className="mt-1 text-[11px] text-zinc-500">Simulation paused (live hardware mode).</p>
        )}
      </div>

      {/* Slot list */}
      <div className="mt-3 space-y-2">
        {slots.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-xs text-zinc-500">
            No weekly slots. Add your first run below — e.g. Monday 06:00 for 8 min.
          </p>
        )}
        {slots.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/40 px-3 py-2.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-xs font-extrabold text-violet-200">
              {WEEKDAYS_SHORT[s.day]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold tabular-nums text-white">
                {mounted ? formatSlotTime(s.time) : s.time}
                <span className="ml-2 text-xs font-semibold text-zinc-400">{s.durationMin} min</span>
              </p>
              <p className="text-[11px] text-zinc-500">Every {WEEKDAYS[s.day]}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(s.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-500 transition-colors hover:border-red-400/50 hover:text-red-300"
              aria-label={`Delete ${WEEKDAYS[s.day]} ${s.time} slot`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add slot */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Day</span>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/60 px-2 py-2 text-xs font-semibold text-white outline-none focus:border-emerald-500/50"
          >
            {WEEKDAYS.map((w, i) => (
              <option key={w} value={i}>{w}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/60 px-2 py-2 text-xs font-semibold text-white outline-none focus:border-emerald-500/50"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Mins</span>
          <input
            type="number"
            min={1}
            max={120}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/60 px-2 py-2 text-xs font-semibold text-white outline-none focus:border-emerald-500/50"
          />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="col-span-2 flex items-center justify-center gap-1.5 self-end rounded-lg bg-emerald-500 px-4 py-2 text-xs font-extrabold text-black shadow-[0_0_16px_rgba(34,197,94,0.35)] transition-all hover:bg-emerald-400 active:scale-[0.97] sm:col-span-1"
        >
          <Plus className="h-4 w-4" /> {t("irrigation.addSlot")}
        </button>
      </div>
    </Card>
  );
}
