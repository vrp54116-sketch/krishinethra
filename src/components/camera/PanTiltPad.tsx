"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* PanTiltPad — hold-to-move D-pad driving store.panAngle / tiltAngle   */
/* ------------------------------------------------------------------ */

export default function PanTiltPad() {
  const panAngle = useFarmStore((s) => s.panAngle);
  const tiltAngle = useFarmStore((s) => s.tiltAngle);
  const setPanAngle = useFarmStore((s) => s.setPanAngle);
  const setCameraAngles = useFarmStore((s) => s.setCameraAngles);

  const [sweep, setSweep] = useState(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nudge = useCallback(
    (dPan: number, dTilt: number) => {
      const st = useFarmStore.getState();
      // Settings → Camera → pan speed scales each step (1° slow … 10° fast).
      const k = (st.settings.cameraPanSpeed ?? 5) / 5;
      setCameraAngles(st.panAngle + dPan * k, st.tiltAngle + dTilt * k);
    },
    [setCameraAngles],
  );

  const stopHold = useCallback(() => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  }, []);

  const startHold = useCallback(
    (dPan: number, dTilt: number, e: React.PointerEvent) => {
      e.preventDefault();
      if (holdRef.current) {
        clearInterval(holdRef.current);
        holdRef.current = null;
      }
      setSweep(false);
      nudge(dPan * 2, dTilt * 2);
      holdRef.current = setInterval(() => nudge(dPan, dTilt), 60);
    },
    [nudge],
  );

  useEffect(() => {
    window.addEventListener("pointerup", stopHold);
    return () => {
      stopHold();
      window.removeEventListener("pointerup", stopHold);
    };
  }, [stopHold]);

  /* Auto-Sweep: slow 20° → 160° → 20° oscillation (~14s period). */
  useEffect(() => {
    if (!sweep) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const t = (Date.now() - t0) / 1000;
      const pan = 90 + 70 * Math.sin((2 * Math.PI * t) / 14 - Math.PI / 2);
      setPanAngle(pan);
    }, 100);
    return () => clearInterval(id);
  }, [sweep, setPanAngle]);

  const padBtn =
    "flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-100 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/15 hover:shadow-[0_0_18px_rgba(34,197,94,0.35)] active:scale-95 touch-none select-none";

  return (
    <div className="card-surface rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white">Pan-Tilt Control</h3>
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[11px] text-zinc-300">
          PAN {Math.round(panAngle)}° · TILT {Math.round(tiltAngle)}°
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        {/* D-pad */}
        <div
          className="grid shrink-0 grid-cols-3 gap-1.5"
          onPointerLeave={stopHold}
        >
          <span />
          <button
            type="button"
            aria-label="Tilt up"
            className={padBtn}
            onPointerDown={(e) => startHold(0, 3, e)}
            onClick={() => nudge(0, 4)}
          >
            <ChevronUp className="h-7 w-7" />
          </button>
          <span />
          <button
            type="button"
            aria-label="Pan left"
            className={cn(padBtn, "h-16 w-16")}
            onPointerDown={(e) => startHold(-3, 0, e)}
            onClick={() => nudge(-5, 0)}
          >
            <ChevronLeft className="h-9 w-9" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSweep(false);
              setCameraAngles(90, 90);
            }}
            aria-label="Center camera"
            className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-[10px] font-extrabold tracking-wider text-emerald-200 transition-all hover:bg-emerald-500/20 active:scale-95"
          >
            <Crosshair className="h-5 w-5" />
            CENTER
          </button>
          <button
            type="button"
            aria-label="Pan right"
            className={cn(padBtn, "h-16 w-16")}
            onPointerDown={(e) => startHold(3, 0, e)}
            onClick={() => nudge(5, 0)}
          >
            <ChevronRight className="h-9 w-9" />
          </button>
          <span />
          <button
            type="button"
            aria-label="Tilt down"
            className={padBtn}
            onPointerDown={(e) => startHold(0, -3, e)}
            onClick={() => nudge(0, -4)}
          >
            <ChevronDown className="h-7 w-7" />
          </button>
          <span />
        </div>

        {/* Sweep + hints */}
        <div className="min-w-52 flex-1 space-y-3">
          <button
            type="button"
            onClick={() => setSweep((v) => !v)}
            aria-pressed={sweep}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold transition-all active:scale-[0.98]",
              sweep
                ? "border-sky-400/60 bg-sky-500/15 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-sky-500/40 hover:text-sky-200",
            )}
          >
            <RefreshCw className={cn("h-4 w-4", sweep && "animate-spin")} />
            {sweep ? "Auto-Sweep ON · 20°↔160°" : "Auto-Sweep OFF"}
          </button>
          <p className="text-xs leading-relaxed text-zinc-500">
            Hold an arrow to glide the camera head — the feed eases after it
            like a real pan-tilt mount. CENTER returns to 90° / 90°.
          </p>
          {/* pan track */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-500">0°</span>
            <input
              type="range"
              min={0}
              max={180}
              value={Math.round(panAngle)}
              onChange={(e) => {
                setSweep(false);
                setPanAngle(Number(e.target.value));
              }}
              aria-label="Pan angle"
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
            />
            <span className="font-mono text-[10px] text-zinc-500">180°</span>
          </div>
        </div>
      </div>
    </div>
  );
}
