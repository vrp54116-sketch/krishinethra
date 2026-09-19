"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

/**
 * Global toaster — dark theme with green accent.
 * bottom-right on desktop (md+), top-center on mobile.
 */
export default function AppToaster() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <Toaster
      theme="dark"
      position={isDesktop ? "bottom-right" : "top-center"}
      toastOptions={{
        style: {
          background: "#0a120c",
          border: "1px solid rgba(34,197,94,0.25)",
          color: "#e7f5ec",
        },
      }}
    />
  );
}
