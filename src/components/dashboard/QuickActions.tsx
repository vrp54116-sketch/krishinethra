"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Camera, Droplets, Map, MessageCircle, type LucideIcon } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

interface Action {
  key: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  tint: string;
  href?: string;
  run?: () => void;
}

export default function QuickActions() {
  const t = useT();
  const snapshot = useFarmStore((s) => s.snapshot);
  const setPumpManual = useFarmStore((s) => s.setPumpManual);
  const addAlert = useFarmStore((s) => s.addAlert);

  const irrigateZoneB = () => {
    setPumpManual(true, 10);
    const msg = `Zone B at ${snapshot.soilMoistureB.toFixed(1)}% — 10s quick irrigation started.`;
    addAlert({ level: "info", title: "Irrigating Zone B (10s)", message: msg });
    toast.success("Irrigating Zone B — 10s", { description: msg });
  };

  const actions: Action[] = [
    { key: "scan", label: t("dashboard.scanLeaf"), sub: "Crop doctor", icon: Camera, tint: "bg-rose-500/15 text-rose-300", href: "/camera" },
    { key: "irrigate", label: t("dashboard.irrigateZoneB"), sub: "Run pump 10s", icon: Droplets, tint: "bg-sky-500/15 text-sky-300", run: irrigateZoneB },
    { key: "gpt", label: t("dashboard.openGPT"), sub: "Ask anything", icon: MessageCircle, tint: "bg-emerald-500/15 text-emerald-300", href: "/assistant" },
    { key: "map", label: t("dashboard.viewMap"), sub: "Field zones", icon: Map, tint: "bg-amber-500/15 text-amber-300", href: "/map" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
      {actions.map((a) => {
        const Icon = a.icon;
        const inner = (
          <>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.tint}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="mt-2 block text-sm font-bold text-white">{a.label}</span>
            <span className="block text-[11px] text-[#9CA3AF]">{a.sub}</span>
          </>
        );
        const cls =
          "card-surface rounded-[20px] p-4 text-left transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]";
        return a.href ? (
          <Link key={a.key} href={a.href} className={cls}>
            {inner}
          </Link>
        ) : (
          <button key={a.key} type="button" onClick={a.run} className={cls}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
