"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { useVoiceCommands } from "@/lib/useVoiceCommands";
import { cn } from "@/lib/utils";

/**
 * FloatingMicButton — global single-shot voice trigger.
 * Rendered by AppShell: sharp 0-radius square button with editorial tokens.
 */
export default function FloatingMicButton() {
  const router = useRouter();

  const { listening, transcript, status, startListening, stopListening } =
    useVoiceCommands({
      onResult: (result) => {
        if (result.navigateTo) router.push(result.navigateTo);
        if (result.success) {
          const short =
            result.spoken.length > 140
              ? `${result.spoken.slice(0, 140)}…`
              : result.spoken;
          toast.success(`“${result.transcript}” → ${short}`);
        } else {
          toast.warning(result.spoken);
        }
      },
      onError: (message) => {
        toast.error(message);
      },
    });

  const toggle = () => {
    if (listening) stopListening();
    else startListening();
  };

  return (
    <div className="fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))] right-4 z-50 flex flex-col items-end gap-2 md:bottom-24 md:right-6 font-editorial-mono">
      {/* Live transcript bubble while listening */}
      {listening && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-60 rounded-none border border-[var(--terra)] bg-[var(--panel)] p-2.5 shadow-xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--terra)]">
            {status === "processing" ? "PROCESSING…" : "LISTENING…"}
          </p>
          <p className="mt-0.5 min-h-4 text-xs font-medium text-[var(--ink)]">
            {transcript || "Speak now…"}
          </p>
        </motion.div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={listening ? "Stop listening" : "Voice command"}
        className={cn(
          "relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-none border transition-all cursor-pointer select-none",
          listening
            ? "border-[var(--terra)] bg-[var(--terra)] text-white shadow-[0_0_16px_var(--terra)]"
            : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:border-[var(--ink-2)] hover:shadow-[3px_3px_0_var(--terra)]",
        )}
      >
        <Mic className="h-5 w-5" strokeWidth={2} />
      </button>
    </div>
  );
}
