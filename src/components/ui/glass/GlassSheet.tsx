"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "./useFocusTrap";

export interface GlassSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
}

export function GlassSheet({
  open,
  onClose,
  children,
  className,
  showClose = true,
}: GlassSheetProps) {
  // V2.5 a11y — trap focus while open, Escape closes, focus restored on close.
  const sheetRef = useFocusTrap<HTMLDivElement>(open, onClose);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={cn(
              "glass-strong w-full max-w-lg p-6",
              "rounded-t-[28px] sm:rounded-[24px]",
              "max-h-[88vh] overflow-y-auto",
              className,
            )}
            initial={{ opacity: 0, y: 64, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 48, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              aria-hidden
              className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden"
            />
            {showClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sheet"
                className="glass-pill absolute top-4 right-4 z-[2] flex h-8 w-8 cursor-pointer items-center justify-center text-[#e7f5ec]/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            <div className="relative z-[1]">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default GlassSheet;
