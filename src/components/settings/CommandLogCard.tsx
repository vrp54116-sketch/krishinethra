"use client";

import { useEffect, useState } from "react";
import { Terminal, ArrowDownToLine, Trash2, CheckCircle2, Clock, Activity } from "lucide-react";
import { toast } from "sonner";
import { clearCommandLog, exportCommandLogCSV, getCommandLog } from "@/lib/command-logger";
import type { CommandLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CommandLogCard({ className }: { className?: string }) {
  const [logs, setLogs] = useState<CommandLogEntry[]>([]);

  useEffect(() => {
    setLogs(getCommandLog());

    const handleLogged = () => {
      setLogs(getCommandLog());
    };

    window.addEventListener("krishi-command-logged", handleLogged);
    return () => window.removeEventListener("krishi-command-logged", handleLogged);
  }, []);

  const handleClear = () => {
    clearCommandLog();
    setLogs([]);
    toast.success("Command log cleared");
  };

  const handleExport = () => {
    if (logs.length === 0) {
      toast.info("No commands to export");
      return;
    }
    exportCommandLogCSV(logs);
    toast.success("Exported commands CSV");
  };

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
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-400/25">
            <Terminal className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              ESP32 Command History
            </h3>
            <p className="text-[11px] text-zinc-400">
              Audit log of last 50 MQTT instructions sent to edge firmware
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/90 bg-white/10 hover:bg-white/15 border border-white/15 transition-all disabled:opacity-40"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/20 transition-all disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Table of commands */}
      {logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 font-mono">
          No commands dispatched in this session yet.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-hide">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#0d1218]/90 backdrop-blur-md z-10">
              <tr className="border-b border-white/10 text-[11px] font-semibold text-zinc-400">
                <th className="pb-2.5 pr-3">Time</th>
                <th className="pb-2.5 px-3">Command</th>
                <th className="pb-2.5 px-3">Status</th>
                <th className="pb-2.5 pl-3 text-right">Response Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {logs.map((e) => {
                const timeStr = new Date(e.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                return (
                  <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 pr-3 text-zinc-400 text-[11px] flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-zinc-500 shrink-0" />
                      {timeStr}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold text-[11px] border border-white/10">
                        {e.command}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-semibold",
                          e.status === "Success"
                            ? "text-emerald-400"
                            : e.status === "Pending"
                              ? "text-amber-400"
                              : "text-rose-400",
                        )}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2 pl-3 text-right text-zinc-400 text-[11px]">
                      {e.responseTimeMs} ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
