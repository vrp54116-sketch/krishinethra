"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Leaf,
  Snowflake,
  SprayCan,
  Sun,
  Thermometer,
  Wind,
  CloudRain,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  climateAdvice,
  type ClimateAdvice,
  type ClimateAdviceIcon,
  type ClimateForecastDay,
} from "@/lib/ai-engine";
import { useFarmStore } from "@/lib/store";
import { Card, CardHeader } from "@/components/dashboard/ui";

const ICONS: Record<ClimateAdviceIcon, LucideIcon> = {
  heat: Thermometer,
  frost: Snowflake,
  fungus: Leaf,
  rain: CloudRain,
  air: Wind,
  spray: SprayCan,
  clear: Sun,
};

const SEVERITY_STYLES: Record<ClimateAdvice["severity"], string> = {
  critical: "border-red-400/40 bg-red-500/[0.08]",
  warning: "border-amber-400/30 bg-amber-500/[0.07]",
  info: "border-sky-400/30 bg-sky-500/[0.07]",
  good: "border-emerald-400/30 bg-emerald-500/[0.07]",
};

const SEVERITY_DOT: Record<ClimateAdvice["severity"], string> = {
  critical: "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
  warning: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
  info: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]",
  good: "bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]",
};

const SEVERITY_TINT: Record<ClimateAdvice["severity"], string> = {
  critical: "bg-red-500/15 text-red-300",
  warning: "bg-amber-500/15 text-amber-300",
  info: "bg-sky-500/15 text-sky-300",
  good: "bg-emerald-500/15 text-emerald-300",
};

export default function AdvisorCard({
  forecast,
}: {
  forecast: ClimateForecastDay[];
}) {
  const snapshot = useFarmStore((s) => s.snapshot);

  const advices = climateAdvice({ snapshot }, forecast);

  return (
    <Card className="h-full">
      <CardHeader
        title="AI Climate Advisor"
        subtitle={`${advices.length} active ${advices.length === 1 ? "advice" : "advices"} · ranked by urgency`}
        action={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-lg shadow-[0_0_16px_rgba(34,197,94,0.3)]">
            🤖
          </span>
        }
      />
      <div className="space-y-2">
        {advices.map((a, idx) => {
          const Icon = ICONS[a.icon] ?? Sun;
          return (
            <div
              key={a.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3",
                SEVERITY_STYLES[a.severity],
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  SEVERITY_TINT[a.severity],
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[13px] font-bold text-white">
                  <span
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", SEVERITY_DOT[a.severity])}
                  />
                  <span className="truncate">
                    #{idx + 1} {a.title}
                  </span>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-300">
                  {a.message}
                </p>
                {a.actionHref && (
                  <Link
                    href={a.actionHref}
                    className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition-colors hover:border-emerald-500/50 hover:text-white"
                  >
                    {a.actionLabel ?? "Open"} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
