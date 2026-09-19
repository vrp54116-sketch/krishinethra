"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { useVoiceCommands } from "@/lib/useVoiceCommands";
import { cn } from "@/lib/utils";

/**
 * FloatingMicButton — global single-shot voice trigger.
 * Rendered by AppShell so it exists on EVERY page: one tap listens once,
 * executes the matched command, toasts the result and speaks the
 * confirmation when settings.voiceOutput is on (handled in the hook).
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

  // G2: lifted above the LiveFarmPill + floating tab bar on mobile.
  return (
    <div className="fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))] right-4 z-40 flex flex-col items-end gap-2 md:bottom-24 md:right-6">
      {/* Live transcript bubble while listening */}
      {listening && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="max-w-60 rounded-2xl border border-emerald-500/30 bg-[#0a120c]/95 px-3 py-2 shadow-[0_0_24px_rgba(34,197,94,0.3)] backdrop-blur-md"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            {status === "processing" ? "Processing…" : "Listening…"}
          </p>
          <p className="mt-0.5 min-h-4 text-xs text-zinc-200">
            {transcript || "Speak now…"}
          </p>
        </motion.div>
      )}

      <motion.button
        type="button"
        onClick={toggle}
        aria-label={listening ? "Stop listening" : "Voice command"}
        whileTap={{ scale: 0.92 }}
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full transition-colors",
          listening
            ? "bg-red-500 text-white shadow-[0_0_28px_rgba(239,68,68,0.55)]"
            : "bg-emerald-500 text-black shadow-[0_0_24px_rgba(34,197,94,0.5)] hover:bg-emerald-400",
        )}
      >
        {listening && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-red-400"
            animate={{ scale: [1, 1.45], opacity: [0.7, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <Mic className="h-6 w-6" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
