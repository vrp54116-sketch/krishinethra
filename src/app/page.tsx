"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sprout,
  ArrowRight,
  WifiOff,
  Mic,
  Bot,
  Languages,
  LockKeyhole,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/types";
import { translations } from "@/lib/translations";
import { useFarmStore } from "@/lib/store";

const FEATURE_BADGES = [
  { icon: WifiOff, label: "Works Offline" },
  { icon: Mic, label: "Voice Control" },
  { icon: Bot, label: "AI Agents" },
  { icon: Languages, label: "Multi-Language" },
];

export default function LandingPage() {
  const router = useRouter();
  const { language, setLanguage, unlock } = useFarmStore();
  const t = translations[language];

  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    if (digit && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleEnterFarm();
    }
  };

  const handleEnterFarm = () => {
    const code = pin.join("");
    if (code.length !== 4) {
      toast.error(t.pinError);
      return;
    }
    // Any 4-digit PIN works for this foundation milestone.
    unlock();
    toast.success(t.welcome);
    router.push("/dashboard");
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#000000] px-4 py-12">
      {/* Animated gradient farm background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(34,197,94,0.22),transparent_70%)]" />
        <div className="animate-drift-slow absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="animate-drift-slow-reverse absolute -right-32 bottom-1/4 h-[28rem] w-[28rem] rounded-full bg-green-600/10 blur-[130px]" />
        <div className="animate-pulse-glow absolute left-1/2 top-1/3 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-400/8 blur-[100px]" />
        <div className="farm-grid absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card-surface rounded-3xl p-8 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="glow-green flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400"
            >
              <Sprout className="h-8 w-8" />
            </motion.div>

            <h1 className="glow-text mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              KrishiNethra{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-green-500 bg-clip-text text-transparent">
                AI
              </span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-emerald-100/70">
              {t.tagline}
            </p>
          </div>

          {/* Language selector */}
          <div className="mt-8">
            <p className="mb-3 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest text-emerald-200/60">
              <Languages className="h-3.5 w-3.5" />
              Select Language
            </p>
            <div className="grid grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-xs font-medium transition-all",
                    language === lang.code
                      ? "border-emerald-400/60 bg-emerald-500/15 text-white shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                      : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-emerald-500/30 hover:text-emerald-100"
                  )}
                >
                  {lang.nativeLabel}
                </button>
              ))}
            </div>
          </div>

          {/* PIN input */}
          <div className="mt-8">
            <p className="mb-3 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest text-emerald-200/60">
              <LockKeyhole className="h-3.5 w-3.5" />
              {t.pinLabel}
            </p>
            <div className="flex items-center justify-center gap-3">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  aria-label={`PIN digit ${i + 1}`}
                  className="h-14 w-14 rounded-2xl border border-emerald-500/20 bg-black text-center text-2xl font-bold text-white outline-none transition-all placeholder:text-zinc-700 focus:border-emerald-400/70 focus:shadow-[0_0_20px_rgba(34,197,94,0.35)]"
                  placeholder="•"
                />
              ))}
            </div>
          </div>

          {/* Enter button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEnterFarm}
            className="glow-green mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold tracking-wide text-black transition-colors hover:bg-emerald-400"
          >
            {t.enterFarm}
            <ArrowRight className="h-5 w-5" />
          </motion.button>

          <p className="mt-4 text-center text-xs text-zinc-500">
            Demo build — any 4-digit PIN works
          </p>
        </div>

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          {FEATURE_BADGES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-[#0a120c]/80 px-3 py-1.5 text-xs font-medium text-emerald-100/80 backdrop-blur"
            >
              <Icon className="h-3.5 w-3.5 text-emerald-400" />
              {label}
            </span>
          ))}
        </motion.div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Works Offline • Voice Control • AI Agents • Multi-Language
        </p>
      </motion.div>
    </main>
  );
}
