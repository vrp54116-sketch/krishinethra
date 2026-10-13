"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Brain,
  Cpu,
  Mic,
  Send,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFarmStore, type FarmSource } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Card, CardHeader } from "@/components/dashboard/ui";
import memory from "@/lib/brain/memory";
import {
  answerQuestion,
  type AnswerBadge,
  type FarmLiveContext,
} from "@/lib/brain/engine";
import { getLearnedCount } from "@/lib/brain/learned";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  badge?: AnswerBadge;
  latencyMs?: number;
  intent?: string;
  offline?: boolean;
}

type SpeechRecognitionResultItem = { transcript: string };
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: SpeechRecognitionResultItem }>;
};
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const SUGGESTIONS_BY_LANG: Record<string, string[]> = {
  gu: [
    "હમણે પાણી આપું?",
    "પીળા પાન કેમ પડે છે?",
    "યુરિયા કેટલું આપવું?",
    "અર્લી બ્લાઇટનો ઉપચાર",
    "પંપ ચાલુ છે કે બંધ?",
    "કેટલા રૂપિયા બચ્યા?",
  ],
  mr: [
    "आता पाणी द्यावं का?",
    "पाने पिवळी का पडत आहेत?",
    "युरिया किती टाकावा?",
    "अर्ली ब्लाइट (करपा) वर उपाय",
    "पंप चालू आहे की बंद?",
    "किती पैसे वाचले?",
  ],
  hi: [
    "क्या मुझे अभी पानी देना चाहिए?",
    "टमाटर की पत्तियां पीली क्यों हैं?",
    "यूरिया की सही मात्रा क्या है?",
    "अगेती झुलसा का इलाज",
    "पंप चालू है कि बंद?",
    "कितने रुपये बचे?",
  ],
  en: [
    "Should I irrigate now?",
    "Why are tomato leaves turning yellow?",
    "How much urea for tomato plants?",
    "Early blight treatment",
    "Is the pump running?",
    "How much money have I saved?",
  ],
};

function currentFarmContext(): FarmLiveContext {
  const state = useFarmStore.getState();
  const live = state.live;
  const activeLive: boolean =
    (state.source as FarmSource) === "LIVE" || state.settings.mode === "live";
  const snapshot = state.snapshot;
  return {
    soil: activeLive
      ? live?.soil ?? snapshot.soil ?? snapshot.soilMoistureB
      : snapshot.soil ?? snapshot.soilMoistureA,
    temp: activeLive
      ? live?.temp ?? snapshot.temp ?? snapshot.tempC
      : snapshot.temp ?? snapshot.tempC,
    hum: activeLive
      ? live?.hum ?? snapshot.hum ?? snapshot.humidity
      : snapshot.hum ?? snapshot.humidity,
    aqi: activeLive ? live?.aqi ?? snapshot.aqi : snapshot.aqi,
    rain: activeLive
      ? Boolean(live?.rain ?? snapshot.rain)
      : Boolean(snapshot.rain),
    pump: activeLive
      ? Boolean(live?.pump ?? state.pump.running)
      : state.pump.running,
    mode: activeLive
      ? live?.mode ?? (state.pump.mode === "auto" ? "AUTO" : "MANUAL")
      : state.pump.mode.toUpperCase(),
  };
}

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const target = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return target.SpeechRecognition ?? target.webkitSpeechRecognition ?? null;
}

function recognitionLanguage(language: string): string {
  return (
    ({ hi: "hi-IN", gu: "gu-IN", mr: "mr-IN" } as Record<string, string>)[
      language
    ] ?? "en-IN"
  );
}

function speechLanguage(language: string): string {
  switch (language) {
    case "hi":
      return "hi-IN";
    case "gu":
      return "gu-IN";
    case "mr":
      return "mr-IN";
    case "en":
    default:
      return "en-IN";
  }
}

export default function AssistantPage() {
  const t = useT();
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") ?? searchParams?.get("query") ?? "";
  const language = useFarmStore((state) => state.settings.language);
  const brainLearnedFromYou = useFarmStore(
    (state) => state.brainLearnedFromYou,
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setInput(query);
  }

  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [eli5, setEli5] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("krishigpt-eli5") === "true"
      : false,
  );
  const [readAloud, setReadAloud] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("krishigpt-read-aloud") === "true"
      : false,
  );
  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);
  const [hasRecognition] = useState(() => Boolean(recognitionConstructor()));
  const [farmContext, setFarmContext] = useState<FarmLiveContext | null>(
    () => (typeof window !== "undefined" ? currentFarmContext() : null),
  );
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down">>(
    {},
  );
  const [citation, setCitation] = useState<{ days: number; rows: number }>({
    days: 0,
    rows: 0,
  });
  const [learnedCount, setLearnedCount] = useState<number>(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const interimRef = useRef("");

  const refreshCitationAndLearned = useCallback(async () => {
    try {
      const c = await memory.citation();
      setCitation(c);
      const l = getLearnedCount();
      setLearnedCount(Math.max(l, brainLearnedFromYou ?? 0));
    } catch {
      // ignore
    }
  }, [brainLearnedFromYou]);

  useEffect(() => {
    void refreshCitationAndLearned();

    const handleMemoryUpdated = () => {
      void refreshCitationAndLearned();
    };
    const handleLearnedUpdated = () => {
      void refreshCitationAndLearned();
    };

    window.addEventListener("kn-memory-updated", handleMemoryUpdated);
    window.addEventListener("kn-learned-updated", handleLearnedUpdated);

    return () => {
      window.removeEventListener("kn-memory-updated", handleMemoryUpdated);
      window.removeEventListener("kn-learned-updated", handleLearnedUpdated);
    };
  }, [refreshCitationAndLearned]);

  useEffect(() => {
    if (query && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`;
    }
  }, [query]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setActiveSpeech(null);
  }, []);

  const speak = useCallback(
    (id: string, text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;
      window.speechSynthesis.cancel();

      // Strip bracketed citations for cleaner speech audio
      const cleanText = text.replace(/\[.*?\]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLang = speechLanguage(language);
      utterance.lang = targetLang;

      // Match voice for Indian language if available
      try {
        const voices = window.speechSynthesis.getVoices();
        const matched = voices.find(
          (v) =>
            v.lang.toLowerCase() === targetLang.toLowerCase() ||
            v.lang.toLowerCase().startsWith(language.toLowerCase()),
        );
        if (matched) utterance.voice = matched;
      } catch {
        // ignore
      }

      utterance.rate = 0.95;
      utterance.onend = () =>
        setActiveSpeech((current) => (current === id ? null : current));
      utterance.onerror = () =>
        setActiveSpeech((current) => (current === id ? null : current));
      setActiveSpeech(id);
      window.speechSynthesis.speak(utterance);
    },
    [language],
  );

  const send = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || typing) return;

      const userMessage: ChatMessage = {
        id: `${Date.now()}-user`,
        role: "user",
        text: question,
      };

      const previousMessages = messages;
      setMessages((current) => [...current, userMessage]);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      setTyping(true);

      const liveContext = currentFarmContext();
      setFarmContext(liveContext);

      try {
        // Execute Answer Engine
        const result = await answerQuestion(
          question,
          language,
          liveContext,
          {
            eli5,
            history: previousMessages.map(({ role, text }) => ({
              role,
              text,
            })),
          },
        );

        const assistantMessageId = `${Date.now()}-assistant`;

        // If GEMINI badge: stream response word by word for live feel
        if (result.badge === "GEMINI") {
          const fullText = result.text;
          const words = fullText.split(" ");
          let displayed = "";

          // Create initial message
          setMessages((current) => [
            ...current,
            {
              id: assistantMessageId,
              role: "assistant",
              text: "",
              badge: "GEMINI",
              latencyMs: result.latencyMs,
              offline: false,
            },
          ]);

          // Stream words in fast intervals
          for (let i = 0; i < words.length; i++) {
            displayed += (i === 0 ? "" : " ") + words[i];
            const currentText = displayed;
            setMessages((current) =>
              current.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, text: currentText }
                  : m,
              ),
            );
            // Yield every 2 words
            if (i % 2 === 0) {
              await new Promise((r) => setTimeout(r, 16));
            }
          }
        } else {
          // Instant response for BRAIN or LEARNED
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: "assistant",
            text: result.text,
            badge: result.badge,
            latencyMs: result.latencyMs,
            intent: result.intent,
            offline: result.offline,
          };
          setMessages((current) => [...current, assistantMessage]);
        }

        // Log to Farm Memory
        void memory.logEvent({
          type: "chat",
          payload: {
            question,
            answer: result.text,
            badge: result.badge,
            latencyMs: result.latencyMs,
            intent: result.intent,
            language,
          },
        });

        if (readAloud) speak(assistantMessageId, result.text);
      } catch (err) {
        console.error("Answer engine error", err);
        const errMsg: ChatMessage = {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: "KrishiNethra Farm Brain: Temporary error processing request. Please try again.",
          badge: "BRAIN",
          latencyMs: 10,
          offline: true,
        };
        setMessages((current) => [...current, errMsg]);
      } finally {
        setTyping(false);
        void refreshCitationAndLearned();
      }
    },
    [eli5, language, messages, readAloud, refreshCitationAndLearned, speak, typing],
  );

  const handleFeedback = useCallback(
    (messageId: string, rating: "up" | "down", answerText: string) => {
      setFeedbackMap((prev) => ({ ...prev, [messageId]: rating }));
      const lastUser = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      void memory.logEvent({
        type: "feedback",
        payload: {
          messageId,
          rating,
          helpful: rating === "up",
          answer: answerText,
          question: lastUser?.text ?? "",
        },
      });
      toast.success(
        rating === "up" ? "Feedback recorded: Helpful" : "Feedback recorded: Needs fix",
        {
          description: "Logged to Farm Memory (IndexedDB: kn_farm) for model learning.",
        },
      );
    },
    [messages],
  );

  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Recognition = recognitionConstructor();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = recognitionLanguage(language);
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    interimRef.current = "";
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalTranscript += result[0].transcript;
        else interimTranscript += result[0].transcript;
      }
      interimRef.current += finalTranscript;
      setInput(`${interimRef.current} ${interimTranscript}`.trimStart());
      if (finalTranscript.trim())
        void send(`${interimRef.current} ${interimTranscript}`);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const toggleEli5 = () => {
    setEli5((current) => {
      localStorage.setItem("krishigpt-eli5", String(!current));
      return !current;
    });
  };

  const toggleReadAloud = () => {
    setReadAloud((current) => {
      localStorage.setItem("krishigpt-read-aloud", String(!current));
      if (current) stopSpeech();
      return !current;
    });
  };

  const suggestions =
    SUGGESTIONS_BY_LANG[language] ?? SUGGESTIONS_BY_LANG.en;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <Card className="flex flex-col">
        <CardHeader
          title={t("assistant.title")}
          subtitle="Instant, offline, personalized farming intelligence in 4 languages"
          action={
            <button
              type="button"
              onClick={toggleReadAloud}
              aria-pressed={readAloud}
              className={cn(
                "flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all",
                readAloud
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                  : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white",
              )}
            >
              {readAloud ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              Read aloud
            </button>
          }
        />

        {/* Brain Meta Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-2 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={eli5}
              onChange={toggleEli5}
              className="h-4 w-4 accent-emerald-400"
            />
            Explain Like I&apos;m 5
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            {citation.rows > 0 && (
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-zinc-300">
                Memory: {citation.days}d ({citation.rows} rows)
              </span>
            )}
            {learnedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[11px] text-amber-300">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Learned: {learnedCount}
              </span>
            )}
            {farmContext && (
              <span className="hidden sm:inline font-mono text-[11px] text-emerald-400">
                {farmContext.soil.toFixed(0)}% soil · {farmContext.temp.toFixed(1)}°C · {farmContext.mode}
              </span>
            )}
          </div>
        </div>

        {/* Multilingual Suggestion Chips */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              disabled={typing}
              className="shrink-0 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/[0.07] px-3 py-1.5 text-xs font-semibold text-emerald-100 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Message Stream Viewport */}
        <div
          className="h-[52vh] space-y-3 overflow-y-auto py-2 pr-1 sm:h-[56vh]"
          aria-live="polite"
        >
          {messages.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-zinc-300">
              <p className="font-semibold text-emerald-400 mb-1">
                🌾 Namaste! KrishiNethra 4-Language Knowledge Brain is ready.
              </p>
              <p className="text-xs text-zinc-400">
                Ask in English, Hindi, Gujarati, or Marathi. Answers run 100%
                offline with your farm&apos;s live sensors, memory citation, and
                soil crossing forecast.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "items-end gap-2",
              )}
            >
              {message.role === "assistant" && (
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-base"
                >
                  🌾
                </span>
              )}
              <div className="max-w-[88%]">
                {/* Engine Badge Strip */}
                {message.role === "assistant" && message.badge && (
                  <div className="mb-1.5 flex items-center gap-2">
                    {/* BRAIN Badge (Moss) */}
                    {message.badge === "BRAIN" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/40 bg-[#1b3a24] px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
                        <Brain className="h-3 w-3 text-emerald-400" />
                        BRAIN
                      </span>
                    )}

                    {/* LEARNED Badge (Gold) */}
                    {message.badge === "LEARNED" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-[#3d2a0e] px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        LEARNED
                      </span>
                    )}

                    {/* GEMINI Badge (Muted) */}
                    {message.badge === "GEMINI" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-900 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
                        <Cpu className="h-3 w-3 text-zinc-400" />
                        GEMINI
                      </span>
                    )}

                    {/* Latency in mono font */}
                    {typeof message.latencyMs === "number" && (
                      <span className="font-mono text-[11px] text-zinc-400">
                        {message.latencyMs}ms
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed transition-shadow",
                    message.role === "user"
                      ? "rounded-br-md bg-emerald-500 font-medium text-black shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                      : "rounded-bl-md border border-white/10 bg-white/[0.04] text-zinc-100",
                    activeSpeech === message.id &&
                      "border-emerald-300 bg-emerald-500/15 shadow-[0_0_22px_rgba(52,211,153,0.3)]",
                  )}
                >
                  {message.text}
                </div>

                {message.role === "assistant" && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {/* Listen [🔊] Button */}
                    <button
                      type="button"
                      onClick={() => speak(message.id, message.text)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 transition-all hover:border-emerald-400/40 hover:text-emerald-100"
                    >
                      <Volume2 className="h-3 w-3" />
                      Listen
                    </button>

                    <button
                      type="button"
                      onClick={stopSpeech}
                      className="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 transition-all hover:border-red-400/40 hover:text-red-100"
                    >
                      <Square className="h-3 w-3" /> Stop
                    </button>

                    {/* Thumbs Feedback Controls */}
                    <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleFeedback(message.id, "up", message.text)
                        }
                        aria-label="Helpful answer"
                        title="Mark helpful — logged to Farm Memory"
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition-all",
                          feedbackMap[message.id] === "up"
                            ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold"
                            : "border-white/10 text-zinc-400 hover:border-emerald-400/40 hover:text-emerald-200",
                        )}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span className="hidden sm:inline">Helpful</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleFeedback(message.id, "down", message.text)
                        }
                        aria-label="Not helpful answer"
                        title="Mark not helpful — logged to Farm Memory"
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition-all",
                          feedbackMap[message.id] === "down"
                            ? "border-amber-400 bg-amber-500/20 text-amber-300 font-bold"
                            : "border-white/10 text-zinc-400 hover:border-amber-400/40 hover:text-amber-200",
                        )}
                      >
                        <ThumbsDown className="h-3 w-3" />
                        <span className="hidden sm:inline">Needs fix</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Knowledge Brain thinking…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-white/5 pt-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder={
                  language === "gu"
                    ? "ટામેટા કે ખેતી વિશે પૂછો... (દા.ત. હમણે પાણી આપું?)"
                    : language === "mr"
                      ? "शेतीबद्दल विचारा... (उदा. आता पाणी द्यावं का?)"
                      : language === "hi"
                        ? "खेती के बारे में पूछें... (उदा. क्या अभी पानी देना चाहिए?)"
                        : "Ask about farming... (e.g. Should I irrigate now?)"
                }
                rows={1}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>

            {hasRecognition && (
              <button
                type="button"
                onClick={toggleMic}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all",
                  listening
                    ? "border-red-500/60 bg-red-500/20 text-red-300 animate-pulse"
                    : "border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white",
                )}
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-black shadow-[0_0_16px_rgba(34,197,94,0.3)] transition-all hover:bg-emerald-400 disabled:opacity-40 disabled:shadow-none"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
