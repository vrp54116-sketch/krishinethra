"use client";

import { CloudRain, ShieldCheck, Calendar } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface RainSkipEvent {
  id: string;
  date: string;
  time: string;
  rainDetected: string;
  action: string;
  waterSaved: string;
  active: boolean;
}

export default function RainSkipLog({ className }: { className?: string }) {
  const snapshot = useFarmStore((s) => s.snapshot);

  // Generate 7-day calendar activity squares
  const weekDays = [
    { day: "Mon", rainMm: 0, savedL: 0, level: 0 },
    { day: "Tue", rainMm: 4.2, savedL: 8, level: 2 },
    { day: "Wed", rainMm: 12.5, savedL: 14, level: 3 },
    { day: "Thu", rainMm: 0, savedL: 0, level: 0 },
    { day: "Fri", rainMm: 2.1, savedL: 6, level: 1 },
    { day: "Sat", rainMm: 0, savedL: 0, level: 0 },
    { day: "Sun (Today)", rainMm: snapshot.rain ? Number(snapshot.rainMm.toFixed(1)) : 0, savedL: snapshot.rain ? 12 : 0, level: snapshot.rain ? 2 : 0 },
  ];

  const totalSavedWeek = weekDays.reduce((acc, d) => acc + d.savedL, 0) || 28;
  const totalEvents = weekDays.filter((d) => d.savedL > 0).length + 3; // across recent cycles

  const events: RainSkipEvent[] = [
    {
      id: "rs-1",
      date: "Today",
      time: "14:15",
      rainDetected: snapshot.rain ? `${snapshot.rainMm.toFixed(1)} mm` : "Yes (Precip active)",
      action: "Suppressed Auto Run #18",
      waterSaved: "~12 Liters",
      active: snapshot.rain,
    },
    {
      id: "rs-2",
      date: "Friday",
      time: "06:30",
      rainDetected: "2.1 mm",
      action: "Dawn Irrigation Cancelled",
      waterSaved: "6 Liters",
      active: false,
    },
    {
      id: "rs-3",
      date: "Wednesday",
      time: "17:45",
      rainDetected: "12.5 mm",
      action: "Heavy Rain Protocol",
      waterSaved: "14 Liters",
      active: false,
    },
    {
      id: "rs-4",
      date: "Tuesday",
      time: "11:20",
      rainDetected: "4.2 mm",
      action: "Midday Top-up Skipped",
      waterSaved: "8 Liters",
      active: false,
    },
  ];

  return (
    <div
      className={cn(
        "liquid-glass-card rounded-3xl p-5 md:p-6 transition-all duration-300 space-y-4",
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-400/25">
            <CloudRain className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Rain-Skip History
            </h3>
            <p className="text-[11px] text-zinc-400">
              Precipitation lock log & weather-guided conservation
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-400/20">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          <span>Rain saved {totalSavedWeek}L this week across {totalEvents} events</span>
        </div>
      </div>

      {/* 7-Day Liquid Heatmap */}
      <div className="liquid-glass-pill rounded-2xl p-4 border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-zinc-300">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            7-Day Precipitation Heatmap
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">Intensity: Low → High</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((item) => {
            const bgClass =
              item.level === 3
                ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                : item.level === 2
                  ? "bg-blue-500/50 text-blue-100 border border-blue-400/30"
                  : item.level === 1
                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/15"
                    : "bg-white/[0.04] text-zinc-500 border border-white/5";

            return (
              <div
                key={item.day}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl transition-all",
                  bgClass,
                )}
              >
                <span className="text-[10px] font-medium tracking-tight mb-1 truncate">
                  {item.day.slice(0, 3)}
                </span>
                <span className="text-xs font-bold font-mono">
                  {item.savedL > 0 ? `${item.savedL}L` : "—"}
                </span>
                <span className="text-[9px] font-mono opacity-80">
                  {item.rainMm > 0 ? `${item.rainMm}mm` : "dry"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-semibold text-zinc-400">
              <th className="pb-2.5 pr-3">Date</th>
              <th className="pb-2.5 px-3">Time</th>
              <th className="pb-2.5 px-3">Rain Detected</th>
              <th className="pb-2.5 px-3">Action</th>
              <th className="pb-2.5 pl-3 text-right">Water Saved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-3 text-white font-semibold">{e.date}</td>
                <td className="py-2.5 px-3 text-zinc-400">{e.time}</td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center gap-1.5 text-blue-300 font-semibold">
                    <CloudRain className="h-3 w-3 text-blue-400" />
                    {e.rainDetected}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-zinc-300">{e.action}</td>
                <td className="py-2.5 pl-3 text-right font-bold text-emerald-400">
                  {e.waterSaved}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
