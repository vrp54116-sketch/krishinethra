"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  History,
  Languages,
  Mic,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { settingsLangToSpeechLang } from "@/lib/speech";
import {
  VOICE_COMMAND_REFERENCE,
  clearVoiceLog,
  useVoiceCommands,
} from "@/lib/useVoiceCommands";
import { Card, CardHeader, useMounted } from "@/components/dashboard/ui";

const REC_LANGS = [
  { code: "en-IN", label: "English (en-IN)" },
  { code: "hi-IN", label: "हिंदी (hi-IN)" },
  { code: "gu-IN", label: "ગુજરાતી (gu-IN)" },
  { code: "mr-IN", label: "मराठी (mr-IN)" },
];

function MicOrb({ listening, onTap }: { listening: boolean; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={listening ? "Stop listening" : "Start listening"}
      className="relative flex h-36 w-36 items-center justify-center outline-none"
    >
      {/* Pulsing green rings while listening */}
      {listening && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
              animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 0.45,
              }}
            />
          ))}
        </>
      )}
      {/* Soft glow halo */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-2 rounded-full transition-all",
          listening
            ? "bg-emerald-500/25 shadow-[0_0_60px_rgba(34,197,94,0.55)]"
            : "bg-emerald-500/10 shadow-[0_0_30px_rgba(34,197,94,0.25)]",
        )}
      />
      <motion.span
        aria-hidden
        className={cn(
          "relative flex h-24 w-24 items-center justify-center rounded-full transition-colors",
          listening
            ? "bg-red-500 text-white shadow-[0_0_36px_rgba(239,68,68,0.6)]"
            : "bg-emerald-500 text-black shadow-[0_0_36px_rgba(34,197,94,0.5)]",
        )}
        animate={listening ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={listening ? { duration: 1.1, repeat: Infinity } : undefined}
        whileTap={{ scale: 0.94 }}
      >
        <Mic className="h-10 w-10" strokeWidth={2.25} />
      </motion.span>
    </button>
  );
}

export default function VoicePage() {
  const router = useRouter();
  const mounted = useMounted();
  const settingsLanguage = useFarmStore((s) => s.settings.language);
  const voiceOutput = useFarmStore((s) => s.settings.voiceOutput);
  const storedRecLang = useFarmStore((s) => s.settings.voiceLang);
  const updateSettings = useFarmStore((s) => s.updateSettings);

  // Recognition lang lives in Settings → Voice (persisted), local override here.
  const [recLang, setRecLang] = useState<string | null>(null);
  const effectiveRecLang =
    recLang ?? storedRecLang ?? settingsLangToSpeechLang(settingsLanguage);
  const hindi = !effectiveRecLang.toLowerCase().startsWith("en");

  const {
    listening,
    status,
    transcript,
    response,
    error,
    isSupported,
    log,
    startListening,
    stopListening,
  } = useVoiceCommands({
    lang: effectiveRecLang,
    onResult: (result) => {
      if (result.navigateTo) router.push(result.navigateTo);
      if (!result.success) toast.warning(result.spoken);
    },
    onError: (message) => {
      toast.error(message);
    },
  });

  const statusBlock = useMemo(() => {
    if (!isSupported) {
      return {
        title: "Not supported",
        body: "Voice recognition is not supported in this browser — try Chrome on Android or desktop.",
        tone: "text-red-300",
      };
    }
    if (listening) {
      return {
        title: "Listening…",
        body: transcript || "Speak now — e.g. “pump chalu karo”…",
        tone: "text-emerald-300",
      };
    }
    if (status === "processing") {
      return { title: "Processing…", body: transcript, tone: "text-amber-300" };
    }
    if (error && status === "error") {
      return { title: "Microphone issue", body: error, tone: "text-red-300" };
    }
    if (response) {
      return { title: "Response", body: response, tone: "text-zinc-100" };
    }
    return {
      title: "Ready",
      body: "Tap Start Listening and speak a command — e.g. “turn on pump” or “रिपोर्ट सुनाओ”.",
      tone: "text-zinc-400",
    };
  }, [isSupported, listening, status, transcript, response, error]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-5">
      {/* Mic hero */}
      <Card className="flex flex-col items-center px-6 py-8 text-center">
        <MicOrb listening={listening} onTap={listening ? stopListening : startListening} />
        <p className={cn("mt-5 text-sm font-extrabold tracking-wide", statusBlock.tone)}>
          {statusBlock.title}
        </p>
        <p className="mt-1.5 min-h-10 max-w-xl text-sm leading-relaxed text-zinc-300">
          {statusBlock.body}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={startListening}
            disabled={listening || !isSupported}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Mic className="h-4 w-4" strokeWidth={2.5} /> Start Listening
          </button>
          <button
            type="button"
            onClick={stopListening}
            disabled={!listening}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-bold text-zinc-200 transition-all hover:border-red-400/50 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Square className="h-4 w-4" /> Stop
          </button>
        </div>

        {/* Voice output toggle + recognition language */}
        <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              {voiceOutput ? (
                <Volume2 className="h-4 w-4 text-emerald-300" />
              ) : (
                <VolumeX className="h-4 w-4 text-zinc-500" />
              )}
              Voice output
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={voiceOutput}
              onClick={() => updateSettings({ voiceOutput: !voiceOutput })}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                voiceOutput ? "bg-emerald-500" : "bg-white/10",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                  voiceOutput ? "left-[22px]" : "left-0.5",
                )}
              />
            </button>
          </div>
          <label className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Languages className="h-4 w-4 text-emerald-300" /> Recognition
            </span>
            <select
              value={effectiveRecLang}
              onChange={(e) => {
                setRecLang(e.target.value);
                updateSettings({ voiceLang: e.target.value });
              }}
              className="rounded-lg border border-white/10 bg-[#0a120c] px-2 py-1.5 text-xs font-bold text-white outline-none focus:border-emerald-500/50 [&>option]:bg-[#0a120c]"
            >
              {REC_LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!isSupported && (
          <p className="mt-3 text-[11px] text-zinc-500">
            Tip: Chrome exposes the mic permission icon in the address bar — allow access and reload.
          </p>
        )}
      </Card>

      {/* Command reference */}
      <Card>
        <CardHeader
          title={hindi ? "कमांड सूची" : "Command reference"}
          subtitle={hindi ? "यह बोलें → यह होगा" : "Say this → this happens"}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-105 text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-2 py-2 font-bold">{hindi ? "कमांड" : "Command"}</th>
                <th className="px-2 py-2 font-bold">{hindi ? "क्या होगा" : "What it does"}</th>
              </tr>
            </thead>
            <tbody>
              {VOICE_COMMAND_REFERENCE.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0">
                  <td className="px-2 py-2.5 font-bold text-emerald-200">
                    “{hindi ? c.hiSay : c.enSay}”
                    <span className="mt-0.5 block font-mono text-[11px] font-normal text-zinc-500">
                      {hindi ? c.enSay : c.hiSay}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-zinc-300">
                    {hindi ? c.hiDoes : c.enDoes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent commands */}
      <Card>
        <CardHeader
          title="Recent commands"
          subtitle="Latest first — shared with the floating mic"
          action={
            log.length > 0 ? (
              <button
                type="button"
                onClick={clearVoiceLog}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 transition-colors hover:border-red-400/40 hover:text-red-200"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                <History className="h-4 w-4" />
              </span>
            )
          }
        />
        {!mounted ? (
          <p className="py-4 text-center text-xs text-zinc-600">Loading history…</p>
        ) : log.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-500">
            No voice commands yet — tap Start Listening above or use the floating mic on any page.
          </p>
        ) : (
          <ul className="space-y-2">
            {log.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-white/5 bg-black/30 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      entry.success
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-400/40 bg-amber-500/10 text-amber-300",
                    )}
                  >
                    {entry.success ? "Done" : "Missed"}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {new Date(entry.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-bold text-white">“{entry.transcript}”</p>
                <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-zinc-400">
                  {entry.response}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
