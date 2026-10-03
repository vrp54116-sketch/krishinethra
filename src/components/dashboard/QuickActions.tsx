"use client";

import { memo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Camera, Droplets, Map, MessageCircle, type LucideIcon } from "lucide-react";
import { useFarm, useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Card, CardHeader } from "./ui";

interface Action {
  key: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  tint: string;
  href?: string;
  run?: () => void;
}

export default memo(function QuickActions() {
  const t = useT();
  const farm = useFarm();
  const setPumpManual = farm.setPumpManual;
  const addAlert = useFarmStore((s) => s.addAlert);

  const irrigateQuick = () => {
    setPumpManual(true, 10);
    const soilVal = farm.soil.toFixed(1);
    const msg = `Soil at ${soilVal}% — 10s quick irrigation started.`;
    addAlert({ level: "info", title: "Quick Irrigation (10s)", message: msg });
    toast.success("Quick Irrigation — 10s", { description: msg });
  };

  const actions: Action[] = [
    { key: "scan", label: t("dashboard.scanLeaf"), sub: "Crop doctor", icon: Camera, tint: "bg-rose-500/15 text-rose-300", href: "/leaf-scanner" },
    { key: "irrigate", label: t("dashboard.irrigateZoneB"), sub: "Run pump 10s", icon: Droplets, tint: "bg-sky-500/15 text-sky-300", run: irrigateQuick },
    { key: "gpt", label: t("dashboard.openGPT"), sub: "Ask anything", icon: MessageCircle, tint: "bg-emerald-500/15 text-emerald-300", href: "/app/assistant" },
    { key: "map", label: t("dashboard.viewMap"), sub: "Field zones", icon: Map, tint: "bg-amber-500/15 text-amber-300", href: "/app/map" },
  ];

  return (
    <Card className="rounded-[12px] p-6 border border-[var(--line)] bg-[var(--panel)] flex flex-col justify-between">
      <CardHeader
        title={t("dashboard.quickActions")}
        subtitle="One-tap farm operations"
      />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          const inner = (
            <>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.tint}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="mt-2 block text-xs sm:text-sm font-bold text-white truncate">{a.label}</span>
              <span className="block text-[10px] text-[#9CA3AF] truncate">{a.sub}</span>
            </>
          );
          const cls =
            "rounded-[12px] border border-white/10 bg-[rgba(18,26,22,0.85)] p-3 text-left transition-all hover:border-white/20 hover:bg-[rgba(18,26,22,0.95)] active:scale-[0.98]";
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
    </Card>
  );
});
