"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, BarChart2, CheckCircle2, RefreshCw, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, useMounted } from "@/components/dashboard/ui";
import {
  getAnalyticsCounts,
  logAnalyticsEvent,
  resetAnalyticsCounts,
  type AnalyticsCounters,
  type AnalyticsEventName,
  ANALYTICS_STORAGE_KEY,
} from "@/lib/analytics";

export default function DiagnosticsCard() {
  const mounted = useMounted();
  const [counters, setCounters] = useState<AnalyticsCounters>(getAnalyticsCounts);

  const refresh = useCallback(() => {
    setCounters(getAnalyticsCounts());
  }, []);

  useEffect(() => {
    // Listen to analytics custom event
    const handleAnalyticsChange = () => {
      refresh();
    };

    window.addEventListener("krishinethra:analytics", handleAnalyticsChange);
    window.addEventListener("storage", handleAnalyticsChange);

    return () => {
      window.removeEventListener("krishinethra:analytics", handleAnalyticsChange);
      window.removeEventListener("storage", handleAnalyticsChange);
    };
  }, [refresh]);

  const handleSimulate = (name: AnalyticsEventName) => {
    logAnalyticsEvent(name, { source: "settings_diagnostics_test" });
    refresh();
    toast.success(`Logged event "${name}"`, {
      description: "Counter incremented in localStorage and output logged to console.",
    });
  };

  const handleReset = () => {
    resetAnalyticsCounts();
    refresh();
    toast.info("Analytics counters reset", {
      description: "All local counters set back to 0.",
    });
  };

  return (
    <div id="diagnostics">
      <Card>
      <CardHeader
        title="Diagnostics"
        subtitle="Local analytics counters, event telemetry & storage diagnostics"
        action={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={refresh}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Refresh telemetry"
              aria-label="Refresh telemetry"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-8 items-center gap-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 font-mono text-[11px] font-bold text-[var(--accent)]">
              <Activity className="h-3 w-3 text-[var(--accent)]" />
              <span>DIAG // LIVE</span>
            </span>
          </div>
        }
      />

      {/* Counter Metrics Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: try_krishinethra */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3.5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-2)]">
              try_krishinethra
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--terra,#C4503A)] shadow-[0_0_6px_var(--terra,#C4503A)]" />
          </div>
          <div>
            <div className="font-mono text-3xl font-extrabold text-[var(--text)] tabular-nums">
              {mounted ? counters.try_krishinethra : 0}
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--text-2)]">
              Hero &amp; Nav marketing CTA clicks
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSimulate("try_krishinethra")}
            className="w-full py-1.5 px-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-mono font-bold text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Send className="h-2.5 w-2.5" /> +1 TEST EVENT
          </button>
        </div>

        {/* Metric 2: reclaim_mine */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3.5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-2)]">
              reclaim_mine
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--moss,#5F8B6A)] shadow-[0_0_6px_var(--moss,#5F8B6A)]" />
          </div>
          <div>
            <div className="font-mono text-3xl font-extrabold text-[var(--text)] tabular-nums">
              {mounted ? counters.reclaim_mine : 0}
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--text-2)]">
              Water Drain simulator reclaim clicks
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSimulate("reclaim_mine")}
            className="w-full py-1.5 px-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-mono font-bold text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Send className="h-2.5 w-2.5" /> +1 TEST EVENT
          </button>
        </div>

        {/* Metric 3: queue_signup */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3.5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-2)]">
              queue_signup
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--gold,#C69B3D)] shadow-[0_0_6px_var(--gold,#C69B3D)]" />
          </div>
          <div>
            <div className="font-mono text-3xl font-extrabold text-[var(--text)] tabular-nums">
              {mounted ? counters.queue_signup : 0}
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--text-2)]">
              Early access farm audit requests
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSimulate("queue_signup")}
            className="w-full py-1.5 px-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-mono font-bold text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Send className="h-2.5 w-2.5" /> +1 TEST EVENT
          </button>
        </div>

        {/* Metric 4: Total Events */}
        <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-3.5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
              TOTAL LOGGED
            </span>
            <BarChart2 className="h-3.5 w-3.5 text-[var(--accent)]" />
          </div>
          <div>
            <div className="font-mono text-3xl font-extrabold text-[var(--text)] tabular-nums">
              {mounted ? counters.total : 0}
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--text-2)]">
              Aggregate client events in storage
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-1.5 px-2 rounded-lg border border-red-500/30 bg-red-500/10 text-[10px] font-mono font-bold text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <RotateCcw className="h-2.5 w-2.5" /> RESET COUNTERS
          </button>
        </div>
      </div>

      {/* Diagnostics Telemetry Details */}
      <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 p-3.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
          <span className="text-[var(--text-2)]">
            STORAGE KEY: <code className="text-[var(--text)]">{ANALYTICS_STORAGE_KEY}</code>
          </span>
          {counters.lastEvent && (
            <span className="text-[var(--text-2)]">
              LAST EVENT: <strong className="text-[var(--accent)]">{counters.lastEvent}</strong>
              {counters.lastTimestamp && (
                <span className="ml-1 opacity-75">
                  ({new Date(counters.lastTimestamp).toLocaleTimeString()})
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-2)] font-mono">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--moss,#5F8B6A)] shrink-0" />
          <span>Console stub active: all events echo to <code>console.log(&apos;[KrishiNethra Analytics]&apos;, ...)</code></span>
        </div>
      </div>
    </Card>
    </div>
  );
}
