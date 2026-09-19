"use client";

import { useEffect } from "react";

/** Registers /sw.js once on the client so the app shell works offline. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Register in all envs (dev too) — harmless, and makes offline testing easy.
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline / unsupported — app still runs from localStorage */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
