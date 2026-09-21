"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * DemoTourButton — guided hardware tour that works in SIMULATION and in
 * EDGE-LIVE. In EDGE-LIVE it asks first:
 *   "Tour will operate REAL hardware over the internet."
 * Steps: pump 5s → R2 on/off → buzzer → pan sweep → servo 90°.
 */
export default function DemoTourButton({ className }: { className?: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    return () => {
      setRunning(false);
    };
  }, []);

  const start = async () => {
    const s = useFarmStore.getState();
    const live =
      s.settings.mode === "live" &&
      s.liveSource === "mqtt" &&
      s.mqttStatus === "online";
    if (live && !confirmOpen) {
      setConfirmOpen(true);
      return;
    }
    await runTour();
  };

  const runTour = async () => {
    setConfirmOpen(false);
    setRunning(true);
    const s = useFarmStore.getState();
    const live =
      s.settings.mode === "live" &&
      s.liveSource === "mqtt" &&
      s.mqttStatus === "online";
    const where = live ? "REAL hardware over the internet" : "simulation";
    toast.info(`Demo tour started (${where})`, {
      description: "Pump → R2 → buzzer → sweep. Watch the dashboard.",
    });
    router.push("/dashboard");
    try {
      // 1. Pump 5s.
      s.setPumpManual(true, 5);
      toast.success("Tour 1/4 — pump ON for 5s");
      await sleep(6000);
      // 2. R2 on → off.
      s.setEdgeR2(true);
      toast.success("Tour 2/4 — R2 ON");
      await sleep(2500);
      s.setEdgeR2(false);
      toast.success("Tour 2/4 — R2 OFF");
      await sleep(1200);
      // 3. Buzzer test.
      s.sendEdgeBuzz();
      toast.success("Tour 3/4 — buzzer test (BUZZ:2:150)");
      await sleep(2500);
      // 4. Pan sweep → centre.
      s.sendEdgeSweep();
      toast.success("Tour 4/4 — pan sweep (SWEEP)");
      await sleep(4000);
      s.sendEdgeServo(90);
      toast.success("Tour done — servo centred (SERVO:90) 🌾");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void start()}
        disabled={running}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98]",
          running
            ? "cursor-wait border border-white/10 bg-white/[0.04] text-zinc-400"
            : "border border-violet-400/40 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25",
          className,
        )}
      >
        {running ? (
          <>
            <Square className="h-4 w-4 animate-pulse" /> Touring…
          </>
        ) : (
          <>
            <Play className="h-4 w-4" /> Demo Tour
          </>
        )}
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Close"
            onClick={() => setConfirmOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="card-surface relative w-full max-w-md rounded-2xl border border-amber-400/30 p-5">
            <h3 className="text-base font-extrabold text-white">Start demo tour?</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
              Tour will operate REAL hardware over the internet — the pump,
              relay R2, buzzer and servo will move on the field node.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-zinc-200 hover:border-emerald-500/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void runTour()}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-black hover:bg-amber-400"
              >
                Run tour
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
