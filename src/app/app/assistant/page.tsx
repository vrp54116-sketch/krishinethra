"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mic, Send, Square, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore, type FarmSource } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Card, CardHeader } from "@/components/dashboard/ui";

type ChatRole = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  offline?: boolean;
};
type FarmContext = {
  soil: number;
  temp: number;
  hum: number;
  aqi: number;
  rain: boolean;
  pump: boolean;
  mode: string;
};
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

const SUGGESTIONS = [
  "What is farming?",
  "Why do tomato leaves curl?",
  "How much urea for 10 tomato plants?",
  "Explain MQTT like I'm 5",
  "What is the weather risk this week?",
];

const OFFLINE_ANSWERS: Array<{ terms: string[]; answer: string }> = [
  {
    terms: ["leaf curl", "curling leaves", "leaves curl"],
    answer:
      "Tomato leaf curl can come from whiteflies carrying a virus, heat, or uneven watering. Check the undersides of leaves for whiteflies, remove badly affected plants, keep weeds down, and use insect netting where possible. Neem oil at 5 ml per litre can help reduce soft-bodied pests; test a few leaves first and spray in the evening.",
  },
  {
    terms: ["blight", "late blight", "early blight"],
    answer:
      "For suspected tomato blight, remove spotted leaves and fruit and discard them away from the field. Avoid wetting leaves, water near the soil in the morning, and give plants good airflow. Blight can spread quickly in wet weather; confirm the disease locally before choosing a treatment.",
  },
  {
    terms: ["watering", "water tomato", "irrigat", "weather risk", "weather this week"],
    answer:
      "Water tomatoes deeply near the roots when the top layer of soil begins to dry. Keep moisture steady, especially while plants flower and fruit, and avoid frequent shallow watering. Your offline knowledge base has no forecast, so it cannot assess this week's rain risk.",
  },
  {
    terms: ["what is farming", "farming", "agriculture", "kheti"],
    answer:
      "Farming (agriculture) is the science and practice of cultivating soil, growing crops, and raising livestock to produce food, fiber, and essential resources. In India, it forms the backbone of the rural economy across Kharif (monsoon), Rabi (winter), and Zaid (summer) seasons, balancing soil biology, water stewardship, and climate-resilient crop care.",
  },
  {
    terms: ["mqtt", "what is mqtt"],
    answer:
      "MQTT (Message Queuing Telemetry Transport) is an ultra-lightweight publish/subscribe messaging protocol designed for low-power IoT hardware like ESP32 microcontrollers. It allows sensors and water pumps to exchange telemetry and commands instantly over local networks with minimal battery and bandwidth overhead.",
  },
  {
    terms: ["urea", "nitrogen dose", "fertilizer dose"],
    answer:
      "Urea needs vary with soil tests, crop stage, and other fertilizers already applied, so a safe per-plant dose cannot be set from plant count alone. Avoid applying it directly against stems or just before heavy rain. Ask your local agriculture officer for a soil-test-based dose; organic compost is a gentler first step.",
  },
];

function currentFarmContext(): FarmContext {
  const state = useFarmStore.getState();
  const live = state.live;
  const activeLive: boolean = (state.source as FarmSource) === "LIVE" || state.settings.mode === "live";
  const snapshot = state.snapshot;
  return {
    soil: activeLive
      ? live?.soil ?? snapshot.soil ?? snapshot.soilMoistureB
      : snapshot.soil ?? snapshot.soilMoistureA,
    temp: activeLive ? live?.temp ?? snapshot.temp ?? snapshot.tempC : snapshot.temp ?? snapshot.tempC,
    hum: activeLive
      ? live?.hum ?? snapshot.hum ?? snapshot.humidity
      : snapshot.hum ?? snapshot.humidity,
    aqi: activeLive ? live?.aqi ?? snapshot.aqi : snapshot.aqi,
    rain: activeLive ? Boolean(live?.rain ?? snapshot.rain) : Boolean(snapshot.rain),
    pump: activeLive ? Boolean(live?.pump ?? state.pump.running) : state.pump.running,
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
  return ({ hi: "hi-IN", gu: "gu-IN", mr: "mr-IN" } as Record<string, string>)[language] ?? "en-IN";
}

function speechLanguage(language: string): string {
  return language === "hi" ? "hi-IN" : "en-IN";
}

function offlineAnswer(question: string, isEli5 = false): string {
  const normalized = question.toLowerCase();
  if (isEli5 && (normalized.includes("farming") || normalized.includes("agriculture") || normalized.includes("kheti"))) {
    return "Farming is growing our own food from the soil! Think of the earth as a big kitchen where the farmer plants a tiny seed in the soft brown dirt, gives it water and sunshine, and watches it grow into green plants that make wheat for soft rotis and fresh vegetables for your plate.";
  }
  if (isEli5 && normalized.includes("mqtt")) {
    return "MQTT is like a WhatsApp group for your farm's machines! The soil sensor sends a quick message saying 'I need water', and the water pump reads it and turns itself on immediately.";
  }
  return (
    OFFLINE_ANSWERS.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.answer ??
    "KrishiGPT agronomist intelligence is ready to answer questions about crop care, irrigation schedules, tomato diseases, soil health, and farm inputs. Feel free to ask about your crop status or pest management."
  );
}

export default function AssistantPage() {
  const t = useT();
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") ?? searchParams?.get("query") ?? "";
  const language = useFarmStore((state) => state.settings.language);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(query);
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [eli5, setEli5] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);
  const [hasRecognition, setHasRecognition] = useState(false);
  const [farmContext, setFarmContext] = useState<FarmContext | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const interimRef = useRef("");

  useEffect(() => {
    setFarmContext(currentFarmContext());
    setHasRecognition(Boolean(recognitionConstructor()));
    setEli5(localStorage.getItem("krishigpt-eli5") === "true");
    setReadAloud(localStorage.getItem("krishigpt-read-aloud") === "true");
  }, []);

  useEffect(() => {
    if (query) setInput(query);
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
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLanguage(language);
      utterance.rate = 0.9;
      utterance.onend = () => setActiveSpeech((current) => (current === id ? null : current));
      utterance.onerror = () => setActiveSpeech((current) => (current === id ? null : current));
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

      let answer: string;
      let offline = false;
      try {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: question,
            history: previousMessages
              .map(({ role, text }) => ({ role, text })),
            eli5,
            lang: language,
            context: liveContext,
          }),
        });
        const payload = (await response.json()) as { reply?: string; error?: string };
        if (!response.ok || !payload.reply) throw new Error(payload.error || "Gemini request failed");
        answer = payload.reply;
      } catch {
        answer = offlineAnswer(question, eli5);
        offline = true;
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text: answer,
        offline,
      };
      setMessages((current) => [...current, assistantMessage]);
      setTyping(false);
      if (readAloud) speak(assistantMessage.id, answer);
    },
    [eli5, language, messages, readAloud, speak, typing],
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
      if (finalTranscript.trim()) void send(`${interimRef.current} ${interimTranscript}`);
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <Card className="flex flex-col">
        <CardHeader
          title={t("assistant.title")}
          subtitle="Ask KrishiGPT about farming or anything else"
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
              {readAloud ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              Read aloud
            </button>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-1 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={eli5}
              onChange={toggleEli5}
              className="h-4 w-4 accent-emerald-400"
            />
            Explain Like I&apos;m 5
          </label>
          <span className="text-xs text-zinc-500">
            {farmContext
              ? `Farm context ready · ${farmContext.soil.toFixed(0)}% soil moisture · ${farmContext.temp.toFixed(1)}°C`
              : "Loading farm context…"}
          </span>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-3">
          {SUGGESTIONS.map((suggestion) => (
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

        <div className="h-[52vh] space-y-3 overflow-y-auto py-2 pr-1 sm:h-[56vh]" aria-live="polite">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-zinc-300">
              Namaste! I&apos;m KrishiGPT. Ask a farming question or anything you&apos;re curious about.
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex", message.role === "user" ? "justify-end" : "items-end gap-2")}
            >
              {message.role === "assistant" && (
                <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-base">
                  🌾
                </span>
              )}
              <div className="max-w-[88%]">
                {message.offline && (
                  <div className="mb-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-200">
                    Gemini unreachable — showing offline knowledge base answer
                  </div>
                )}
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm leading-relaxed transition-shadow",
                    message.role === "user"
                      ? "rounded-br-md bg-emerald-500 font-medium text-black shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                      : "rounded-bl-md border border-white/10 bg-white/[0.04] text-zinc-100",
                    activeSpeech === message.id && "border-emerald-300 bg-emerald-500/15 shadow-[0_0_22px_rgba(52,211,153,0.3)]",
                  )}
                >
                  {message.text}
                </div>
                {message.role === "assistant" && (
                  <div className="mt-1.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => speak(message.id, message.text)}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-emerald-400/40 hover:text-emerald-100"
                    >
                      Listen
                    </button>
                    <button
                      type="button"
                      onClick={stopSpeech}
                      className="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-red-400/40 hover:text-red-100"
                    >
                      <Square className="h-3 w-3" /> Stop
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-end gap-2">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">🌾</span>
              <div aria-label="KrishiGPT is thinking" className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-3.5">
                {[0, 1, 2].map((dot) => (
                  <span key={dot} className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: `${dot * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto border-t border-white/5 px-1 pt-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex w-full items-end gap-2"
          >
            {hasRecognition && (
              <button
                type="button"
                onClick={toggleMic}
                aria-label={listening ? "Stop listening" : "Speak your question"}
                title={`Voice input (${recognitionLanguage(language)})`}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all",
                  listening
                    ? "animate-pulse border-red-400/60 bg-red-500/20 text-red-200"
                    : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-200",
                )}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                event.currentTarget.style.height = "auto";
                event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 160)}px`;
              }}
              placeholder={t("assistant.placeholder")}
              className="max-h-40 min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm leading-5 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Send"
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all",
                input.trim() && !typing
                  ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-emerald-400"
                  : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-zinc-600",
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
