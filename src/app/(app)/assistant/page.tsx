"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Info,
  MessageCircle,
  Mic,
  Send,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import {
  QUICK_QUESTIONS,
  askKrishiGPTDetailed,
  type KrishiGptAction,
} from "@/lib/krishi-gpt";
import { Card, CardHeader, useMounted } from "@/components/dashboard/ui";

function voiceLang(lang: string): string {
  switch (lang) {
    case "hi":
      return "hi-IN";
    case "gu":
      return "gu-IN";
    case "mr":
      return "mr-IN";
    default:
      return "en-IN";
  }
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface SpeechRec {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognition(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    webkitSpeechRecognition?: new () => SpeechRec;
    SpeechRecognition?: new () => SpeechRec;
  };
  return w.webkitSpeechRecognition ?? w.SpeechRecognition ?? null;
}

/**
 * /assistant — KrishiGPT chat. Offline rule-based engine answers from live
 * farm data; chat persists in the store; mic fills the input; voice output
 * reads answers aloud; action chips (pump / links / follow-ups) work inline.
 */
export default function AssistantPage() {
  const t = useT();
  const router = useRouter();
  const mounted = useMounted();

  const chat = useFarmStore((s) => s.chat);
  const settings = useFarmStore((s) => s.settings);
  const addChatMessage = useFarmStore((s) => s.addChatMessage);
  const setPumpManual = useFarmStore((s) => s.setPumpManual);
  const updateSettings = useFarmStore((s) => s.updateSettings);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speak = (text: string, lang: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = voiceLang(lang);
    synth.speak(utter);
  };

  // Stop any speech when leaving the page.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (typingTimer.current) clearTimeout(typingTimer.current);
      recRef.current?.stop();
    };
  }, []);

  // Auto-scroll to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.length, typing]);

  const send = (raw: string) => {
    const q = raw.trim();
    if (!q || typing) return;
    addChatMessage({ role: "user", text: q });
    setInput("");
    setTyping(true);
    typingTimer.current = setTimeout(() => {
      const st = useFarmStore.getState();
      const ans = askKrishiGPTDetailed(q, st);
      addChatMessage({ role: "assistant", text: ans.text, actions: ans.actions });
      setTyping(false);
      if (st.settings.voiceOutput) speak(ans.text, st.settings.language);
    }, 800);
  };

  const handleAction = (a: KrishiGptAction) => {
    if (a.kind === "link" && a.href) {
      router.push(a.href);
      return;
    }
    if (a.kind === "ask") {
      send(a.label);
      return;
    }
    if (a.kind === "pump10") {
      const st = useFarmStore.getState();
      const tank = st.snapshot.tankLevelPercent;
      const zb =
        st.zones.find((z) => z.id === "B")?.soilMoisture ?? st.snapshot.soilMoistureB;
      if (tank < 5) {
        const warn =
          `Tank sirf ${Math.round(tank)}% hai — pehle tank refill karo, pump start nahi hoga. ` +
          `Irrigation page par tank status dekho?`;
        addChatMessage({ role: "assistant", text: warn, actions: [] });
        if (st.settings.voiceOutput) speak(warn, st.settings.language);
        return;
      }
      setPumpManual(true, 10);
      const msg =
        `✅ Pump started for 10 seconds. Zone B ${((Math.round(zb * 10) / 10)).toFixed(1)}% ` +
        `se nami badh rahi hai, tank ${Math.round(tank)}% hai. 10 sec baad pump apne-aap band ho jayega. ` +
        `Aur paani chahiye to dobara dabayein?`;
      addChatMessage({ role: "assistant", text: msg, actions: [] });
      toast.success("Pump ON for 10s");
      if (st.settings.voiceOutput) speak("Pump started for 10 seconds.", st.settings.language);
    }
  };

  const toggleMic = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    try {
      const rec = new SR();
      rec.lang = voiceLang(settings.language);
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const t = e.results[0][0].transcript;
        if (t) setInput(t);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => {
        setListening(false);
        toast.error("Mic error — please try again");
      };
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      toast.error("Mic error — please try again");
    }
  };

  const toggleVoice = () => {
    const next = !settings.voiceOutput;
    updateSettings({ voiceOutput: next });
    if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    toast.success(next ? "Voice output ON" : "Voice output OFF");
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      {/* Header note */}
      <div className="flex items-start gap-2 rounded-2xl border border-sky-500/25 bg-sky-500/[0.06] p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
          <Info className="h-4 w-4" />
        </span>
        <p className="text-xs leading-relaxed text-sky-100/80">
          KrishiGPT v1.0 — offline rule-based engine. Future: connected to agricultural
          knowledge base.
        </p>
      </div>

      <Card className="flex flex-col">
        <CardHeader
          title={t("assistant.title")}
          subtitle={t("assistant.subtitle")}
          action={
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={settings.voiceOutput ? "Mute voice output" : "Enable voice output"}
              title={settings.voiceOutput ? "Voice output ON" : "Voice output OFF"}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
                settings.voiceOutput
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200 shadow-[0_0_16px_rgba(34,197,94,0.4)]"
                  : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-200",
              )}
            >
              {settings.voiceOutput ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
          }
        />

        {/* Quick question chips */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={typing}
              className="shrink-0 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/[0.07] px-3 py-1.5 text-xs font-semibold text-emerald-100 transition-all hover:bg-emerald-500/20 active:scale-[0.97] disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="h-[52vh] space-y-3 overflow-y-auto py-2 pr-1 sm:h-[56vh]"
        >
          {chat.map((m, i) => {
            const key = `${m.timestamp}-${i}`;
            if (m.role === "user") {
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-end"
                >
                  <div className="max-w-[85%]">
                    <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-emerald-500 px-3 py-2.5 text-sm font-medium leading-relaxed text-black shadow-[0_0_16px_rgba(34,197,94,0.3)]">
                      {m.text}
                    </div>
                    <p className="mt-1 text-right text-[10px] text-zinc-600">
                      {mounted ? fmtTime(m.timestamp) : " "}
                    </p>
                  </div>
                </motion.div>
              );
            }
            const actions: KrishiGptAction[] = m.actions ?? [];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-end gap-2"
              >
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-base"
                >
                  🌾
                </span>
                <div className="max-w-[85%]">
                  <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm leading-relaxed text-zinc-100">
                    {m.text}
                  </div>
                  {actions.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {actions.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => handleAction(a)}
                          className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition-all hover:bg-emerald-500/25 active:scale-[0.97]"
                        >
                          {a.kind === "pump10" ? (
                            <Zap className="h-3 w-3" />
                          ) : a.kind === "link" ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <MessageCircle className="h-3 w-3" />
                          )}
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[10px] text-zinc-600">
                    {mounted ? fmtTime(m.timestamp) : " "}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          {typing && (
            <div className="flex items-end gap-2">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-base"
              >
                🌾
              </span>
              <div
                aria-label="KrishiGPT typing"
                className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-3.5"
              >
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-2 w-2 animate-bounce rounded-full bg-emerald-400"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-2 flex items-center gap-2 border-t border-white/5 pt-3"
        >
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Stop listening" : "Voice input"}
            title={`Mic (${voiceLang(settings.language)})`}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-[0.96]",
              listening
                ? "animate-pulse border-red-400/60 bg-red-500/20 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.5)]"
                : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-200",
            )}
          >
            <Mic className="h-4 w-4" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("assistant.placeholder")}
            className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            aria-label="Send"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all active:scale-[0.96]",
              input.trim() && !typing
                ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-emerald-400"
                : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-zinc-600",
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </Card>
    </div>
  );
}
