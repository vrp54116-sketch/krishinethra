"use client";

import { CircleCheck, CircleX, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Card, CardHeader } from "@/components/dashboard/ui";

export default function AiExplainerCard() {
  const t = useT();
  const snapshot = useFarmStore((s) => s.snapshot);
  const thresholds = useFarmStore((s) => s.settings.thresholds);
  const pumpMode = useFarmStore((s) => s.pump.mode);

  const soil = snapshot.soil;
  const rain = snapshot.rain;

  const rules = [
    {
      label: `Soil moisture ${soil.toFixed(1)}% < ${thresholds.moistureLow}% threshold`,
      met: soil < thresholds.moistureLow,
      detail: soil < thresholds.moistureLow ? "Soil needs hydration" : "Moisture is sufficient",
    },
    {
      label: `Rain sensor dry (No rain detected)`,
      met: !rain,
      detail: !rain ? "No natural precipitation" : "Rain detected — natural watering active",
    },
    {
      label: `Soil not saturated (${soil.toFixed(1)}% ≤ ${thresholds.moistureHigh}%)`,
      met: soil <= thresholds.moistureHigh,
      detail: soil <= thresholds.moistureHigh ? "Safe from waterlogging" : "Root zone saturated",
    },
  ];

  const irrigate = rules.every((r) => r.met);
  const metCount = rules.filter((r) => r.met).length;

  return (
    <Card className="border-emerald-500/25">
      <CardHeader
        title={t("irrigation.autoAI")}
        subtitle="Jal Agent Rule Engine · Live Decision Logic"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            live
          </span>
        }
      />

      <div className="space-y-2">
        {rules.map((r) => (
          <div
            key={r.label}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium",
              r.met
                ? "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-100"
                : "border-red-500/25 bg-red-500/[0.06] text-red-100",
            )}
          >
            {r.met ? (
              <CircleCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <CircleX className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.label}</p>
              <p className="text-[11px] opacity-70">{r.detail}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wider",
                r.met ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300",
              )}
            >
              {r.met ? "✓ MET" : "✗ NOT MET"}
            </span>
          </div>
        ))}
      </div>

      {/* Verdict */}
      <div
        className={cn(
          "mt-3 flex items-center gap-3 rounded-xl border px-4 py-3",
          irrigate
            ? "border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_24px_rgba(34,197,94,0.25)]"
            : "border-amber-400/40 bg-amber-500/10",
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            irrigate ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300",
          )}
        >
          <Cpu className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-extrabold tracking-wide",
              irrigate ? "text-emerald-300" : "text-amber-300",
            )}
          >
            DECISION: {irrigate ? "IRRIGATE" : "WAIT"}
          </p>
          <p className="text-[11px] text-zinc-400">
            {metCount}/3 conditions met
            {pumpMode !== "auto" && (
              <> · pump is in {pumpMode === "manual" ? "Manual" : "Schedule"} mode, AI is advisory only</>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}
