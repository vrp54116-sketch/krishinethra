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
 * Global toaster — M1 Field Editorial square panel, terra/moss left bar, mono text.
 * Bottom-right on desktop (md+), top-center on mobile.
 */
export default function AppToaster() {
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, getServerDesktop);

  return (
    <Toaster
      position={isDesktop ? "bottom-right" : "top-center"}
      duration={5000}
      visibleToasts={6}
      className="z-[70]"
      icons={{
        success: (
          <div className="flex h-5 w-5 items-center justify-center rounded-none bg-[var(--moss-soft)] text-[var(--moss)] border border-[var(--moss)]">
            <CheckCircle2 className="h-3 w-3" />
          </div>
        ),
        error: (
          <div className="flex h-5 w-5 items-center justify-center rounded-none bg-[var(--terra-soft)] text-[var(--terra)] border border-[var(--terra)]">
            <AlertCircle className="h-3 w-3" />
          </div>
        ),
        info: (
          <div className="flex h-5 w-5 items-center justify-center rounded-none bg-[var(--panel-2)] text-[var(--ink-2)] border border-[var(--line)]">
            <Info className="h-3 w-3" />
          </div>
        ),
        warning: (
          <div className="flex h-5 w-5 items-center justify-center rounded-none bg-[#B98A3E]/15 text-[#E4C57E] border border-[#B98A3E]">
            <AlertTriangle className="h-3 w-3" />
          </div>
        ),
      }}
      toastOptions={{
        className:
          "rounded-none border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] font-editorial-mono text-[11px] shadow-2xl p-3 tracking-wide",
        duration: 5000,
      }}
    />
  );
}
