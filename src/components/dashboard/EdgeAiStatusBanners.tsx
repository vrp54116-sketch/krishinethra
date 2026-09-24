"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudOff,
  CloudRain,
  Radio,
  ShieldAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface BannerItem {
  id: string;
  type: "danger" | "warning" | "info";
  title: string;
  description: string;
  icon: LucideIcon;
  tone: {
    bg: string;
    border: string;
    text: string;
    iconColor: string;
    glow: string;
  };
}

export default function EdgeAiStatusBanners({ className }: { className?: string }) {
  const snapshot = useFarmStore((s) => s.snapshot);
  const pump = useFarmStore((s) => s.pump);
  const mqttStatus = useFarmStore((s) => s.mqttStatus);
  const mqttConnected = mqttStatus === "online";

  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  // Evaluate candidate banner
  const stale = snapshot.stale;
  const rain = snapshot.rain && !pump.running;
  const cloudOffline = !mqttConnected;
  const weakWifi = snapshot.rssi != null && snapshot.rssi < -80;

  let candidate: BannerItem | null = null;

  if (stale) {
    candidate = {
      id: "stale-node",
      type: "danger",
      title: "Sensor node offline (UNO link dead 5s+)",
      description: "Edge AI has locked auto-irrigation for crop safety. Manual override still available.",
      icon: ShieldAlert,
      tone: {
        bg: "bg-rose-500/15",
        border: "border-rose-500/35",
        text: "text-rose-200",
        iconColor: "text-rose-400",
        glow: "shadow-[0_0_24px_rgba(244,63,94,0.2)]",
      },
    };
  } else if (rain) {
    candidate = {
      id: "rain-lock",
      type: "warning",
      title: "Rain detected — pump locked OFF",
      description: `Precipitation active (${snapshot.rainMm.toFixed(1)} mm). Water savings algorithm engaged.`,
      icon: CloudRain,
      tone: {
        bg: "bg-amber-500/15",
        border: "border-amber-500/35",
        text: "text-amber-200",
        iconColor: "text-amber-400",
        glow: "shadow-[0_0_24px_rgba(245,158,11,0.2)]",
      },
    };
  } else if (cloudOffline) {
    candidate = {
      id: "cloud-offline",
      type: "info",
      title: "Cloud link offline — Edge AI active locally",
      description: "ESP32 autonomous control and local MQTT broker running uninterrupted on local network.",
      icon: CloudOff,
      tone: {
        bg: "bg-sky-500/15",
        border: "border-sky-500/35",
        text: "text-sky-200",
        iconColor: "text-sky-400",
        glow: "shadow-[0_0_24px_rgba(14,165,233,0.2)]",
      },
    };
  } else if (weakWifi) {
    candidate = {
      id: "wifi-weak",
      type: "warning",
      title: `Weak WiFi signal (${snapshot.rssi} dBm)`,
      description: "ESP32 telemetry may experience dropped packets. Consider adjusting antenna position.",
      icon: Radio,
      tone: {
        bg: "bg-amber-500/15",
        border: "border-amber-500/35",
        text: "text-amber-200",
        iconColor: "text-amber-400",
        glow: "shadow-[0_0_24px_rgba(245,158,11,0.2)]",
      },
    };
  }

  const activeBanner = candidate && !dismissed[candidate.id] ? candidate : null;

  const dismissBanner = useCallback((id: string) => {
    setDismissed((prev) => ({ ...prev, [id]: true }));
    // Auto-un-dismiss after 60s
    setTimeout(() => {
      setDismissed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 60000);
  }, []);

  // 10s auto-dismiss timer
  const activeId = activeBanner?.id;
  useEffect(() => {
    if (!activeId) return;
    const timer = setTimeout(() => {
      dismissBanner(activeId);
    }, 10000);
    return () => clearTimeout(timer);
  }, [activeId, dismissBanner]);

  const handleDismiss = () => {
    if (activeBanner) {
      dismissBanner(activeBanner.id);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <AnimatePresence>
        {activeBanner && (
          <motion.div
            key={activeBanner.id}
            initial={{ opacity: 0, y: -28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 28,
            }}
            className={cn(
              "liquid-glass-card relative overflow-hidden rounded-2xl p-4 border backdrop-blur-xl transition-all duration-300",
              activeBanner.tone.bg,
              activeBanner.tone.border,
              activeBanner.tone.glow,
              activeBanner.type === "danger" && "alert-shake-horizontal",
            )}
          >
            {/* Auto-dismiss progress bar (10s) */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 10, ease: "linear" }}
              className="absolute left-0 bottom-0 top-auto h-0.5 w-full bg-white/30 origin-left"
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15">
                  <activeBanner.icon className={cn("h-5 w-5", activeBanner.tone.iconColor)} />
                </div>
                <div>
                  <h4 className={cn("text-sm font-semibold tracking-wide", activeBanner.tone.text)}>
                    {activeBanner.title}
                  </h4>
                  <p className="text-xs text-white/70 mt-0.5">
                    {activeBanner.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Dismiss</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
