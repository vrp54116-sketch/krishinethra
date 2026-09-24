"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

function subscribeDesktop(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getDesktop() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 768px)").matches;
}
function getServerDesktop() {
  return false;
}

/**
 * Global toaster — Apple-style liquid glass pill with vibrant colored circular icons.
 * Bottom-right on desktop (md+), top-center on mobile.
 */
export default function AppToaster() {
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, getServerDesktop);

  return (
    <Toaster
      theme="dark"
      position={isDesktop ? "bottom-right" : "top-center"}
      duration={5000}
      className="z-[70]"
      icons={{
        success: (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
        ),
        error: (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-400/30">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
        ),
        info: (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30">
            <Info className="h-3.5 w-3.5" />
          </div>
        ),
        warning: (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/30">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
        ),
      }}
      toastOptions={{
        className: "liquid-glass-pill text-xs font-medium shadow-2xl",
        duration: 5000,
      }}
    />
  );
}
