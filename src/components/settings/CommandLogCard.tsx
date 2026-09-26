"use client";

import { useEffect, useState } from "react";
import { Terminal, ArrowDownToLine, Trash2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { clearCommandLog, exportCommandLogCSV, getCommandLog } from "@/lib/command-logger";
import type { CommandLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CommandLogCard({ className }: { className?: string }) {
  const [logs, setLogs] = useState<CommandLogEntry[]>(() => getCommandLog());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
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

  const visibleLogs = showAll ? logs : logs.slice(0, 20);

  return (
    <div
      className={cn(
        "rounded-none border border-[var(--line)] bg-[var(--panel)] p-4 md:p-5 space-y-4 font-editorial-mono",
        className,
      )}
    >
      {/* Header row = mono uppercase label left + status stamp right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-none border border-[var(--line)] bg-[var(--panel-2)] text-[var(--terra)]">
            <Terminal className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              ESP32 COMMAND LOG
            </h3>
            <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wide">
              AUDIT TRAIL OF MQTT INSTRUCTIONS TO EDGE
            </p>
          </div>
        </div>

        {/* Action Buttons: Editorial Ghost Chips */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider text-[var(--ink)] bg-[var(--panel-2)] hover:bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--ink-2)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowDownToLine className="h-3 w-3" />
            <span>EXPORT CSV</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider text-[var(--terra)] bg-[var(--terra-soft)] hover:bg-[var(--terra-soft)]/80 border border-[var(--terra)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3 w-3" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Table: mono 12px rows, hairline separators, header uppercase ink-3 */}
      {logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--ink-3)] font-editorial-mono uppercase tracking-wider">
          NO COMMANDS DISPATCHED IN THIS SESSION YET.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-hide">
          <table className="w-full text-left font-editorial-mono text-[12px]">
            <thead className="sticky top-0 bg-[var(--panel)] z-10">
              <tr className="border-b border-[var(--line)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                <th className="pb-2.5 pr-3">TIME</th>
                <th className="pb-2.5 px-3">COMMAND</th>
                <th className="pb-2.5 px-3">STATUS</th>
                <th className="pb-2.5 pl-3 text-right">LATENCY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {visibleLogs.map((e) => {
                const timeStr = new Date(e.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                });
                return (
                  <tr key={e.id} className="hover:bg-[var(--panel-2)] transition-colors">
                    <td className="py-2 pr-3 text-[var(--ink-2)] text-[11px] tabular-nums whitespace-nowrap">
                      {timeStr}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded-none bg-[var(--panel-2)] text-[var(--ink)] font-bold text-[11px] border border-[var(--line)]">
                        {e.command}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 border rounded-none",
                          e.status === "Success"
                            ? "border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)]"
                            : e.status === "Pending"
                              ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                              : "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]",
                        )}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2 pl-3 text-right text-[var(--ink-2)] text-[11px] tabular-nums">
                      {e.responseTimeMs}ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {logs.length > 20 && (
            <div className="pt-2 text-center border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-2)] hover:text-[var(--terra)] transition-colors cursor-pointer"
              >
                {showAll ? "SHOW LESS" : `SHOW MORE (${logs.length - 20} REMAINING)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
