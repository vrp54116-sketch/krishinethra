"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  Camera,
  Cpu,
  DatabaseBackup,
  Eye,
  EyeOff,
  Globe2,
  Languages,
  Loader2,
  Mic,
  Send,
  SlidersHorizontal,
  Thermometer,
  Tractor,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore, DEFAULT_SETTINGS } from "@/lib/store";
import { LANGUAGES } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { Card, CardHeader, useMounted } from "@/components/dashboard/ui";
import { MANDI_PRICES, mandiById } from "@/lib/market-data";
import { exportFarmBackup } from "@/lib/report-export";

function Rise({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors placeholder:font-normal placeholder:text-zinc-600 focus:border-emerald-500/50 [&>option]:bg-[#0a120c]";

const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500";

const STATES = [
  "Gujarat",
  "Maharashtra",
  "Rajasthan",
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Punjab",
  "Haryana",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "West Bengal",
  "Bihar",
  "Odisha",
  "Kerala",
  "Assam",
];

const REC_LANGS = [
  { code: "en-IN", label: "English (en-IN)" },
  { code: "hi-IN", label: "हिंदी (hi-IN)" },
  { code: "gu-IN", label: "ગુજરાતી (gu-IN)" },
  { code: "mr-IN", label: "मराठी (mr-IN)" },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]" : "bg-white/10",
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
          checked ? "left-6" : "left-1",
        )}
      />
    </button>
  );
}

/** Slider + number input pair bound to one threshold value. Live, no reload. */
function ThresholdRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-white">{label}</span>
        <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1 focus-within:border-emerald-500/50">
          <input
            value={String(value)}
            aria-label={`${label} value`}
            inputMode="decimal"
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9.]/g, ""));
              if (Number.isFinite(n)) onChange(clamp(Math.round((n / step)) * step));
            }}
            className="w-16 bg-transparent text-right font-mono text-[13px] font-bold text-white outline-none"
          />
          <span className="text-[11px] font-semibold text-zinc-500">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-label={label}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-600">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

/**
 * /settings — every section binds to store.settings and applies live
 * (zustand + persist, no reload). Language switches instantly via
 * setLanguage; thresholds feed the auto-pump relay + alerts engine.
 */
export default function SettingsPage() {
  const t = useT();
  const mounted = useMounted();
  const settings = useFarmStore((s) => s.settings);
  const zones = useFarmStore((s) => s.zones);
  const updateSettings = useFarmStore((s) => s.updateSettings);
  const setLanguage = useFarmStore((s) => s.setLanguage);
  const resetFarm = useFarmStore((s) => s.resetFarm);
  void zones;

  const profile = settings.farmProfile ?? DEFAULT_SETTINGS.farmProfile;
  const location = settings.location ?? DEFAULT_SETTINGS.location;
  const thresholds = settings.thresholds;
  const telegram = settings.telegram;

  // Hardware bridge test state.
  const [hwTesting, setHwTesting] = useState(false);
  const [hwResult, setHwResult] = useState<string | null>(null);
  const [hwOk, setHwOk] = useState<boolean | null>(null);

  // Telegram card state (mirrors /alerts).
  const [showToken, setShowToken] = useState(false);
  const [tgTesting, setTgTesting] = useState(false);

  // Data section state.
  const [resetOpen, setResetOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Browser notification permission display.
  const [notifPerm, setNotifPerm] = useState<string>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );

  // Stable signature for the thresholds object (strings compare by value in deps).
  const thresholdsSig = JSON.stringify(settings.thresholds);
  const storageUsage = useMemo(() => {
    if (!mounted) return "…";
    try {
      let bytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const v = localStorage.getItem(k) ?? "";
        bytes += (k.length + v.length) * 2;
      }
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    } catch {
      return "—";
    }
    // Recompute whenever persisted slices change (import/reset/threshold edits).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, settings.language, settings.mode, thresholdsSig]);

  const toggleCrop = (id: string) => {
    const has = profile.crops.includes(id);
    const next = has ? profile.crops.filter((c) => c !== id) : [...profile.crops, id];
    updateSettings({ farmProfile: { crops: next } });
    // Sync zone crops: first 3 selected crops → Zones A/B/C display names.
    const names = next.slice(0, 3).map((cid) => mandiById(cid)?.crop ?? cid);
    if (names.length > 0) {
      useFarmStore.setState((s) => ({
        zones: s.zones.map((z, i) =>
          i < names.length ? { ...z, crop: names[i] } : z,
        ),
      }));
    }
  };

  const handleHwTest = async () => {
    const gw = settings.hardwareGatewayUrl.trim().replace(/\/+$/, "");
    if (!gw) {
      toast.error("Add your gateway URL first", {
        description: "e.g. http://raspberrypi.local:8000",
      });
      setHwOk(false);
      setHwResult("No gateway URL set.");
      return;
    }
    setHwTesting(true);
    setHwResult(null);
    const t0 = Date.now();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      // Via the Next.js hardware bridge (same path LIVE mode polls):
      // /api/hw/status?gw=<gateway>&mode=live → proxies <gateway>/status.
      const res = await fetch(
        `/api/hw/status?gw=${encodeURIComponent(gw)}&mode=live`,
        { signal: ctrl.signal },
      );
      clearTimeout(timer);
      const ms = Date.now() - t0;
      const body = await res.text().catch(() => "");
      if (res.ok) {
        setHwOk(true);
        setHwResult(`OK ${res.status} · ${ms}ms — ${body.slice(0, 220) || "no body"}`);
        toast.success("Hardware gateway reachable", {
          description: `${gw} responded in ${ms}ms.`,
        });
      } else {
        setHwOk(false);
        setHwResult(`HTTP ${res.status} · ${ms}ms — ${body.slice(0, 220) || "no body"}`);
        toast.error("Gateway responded with an error", {
          description: `HTTP ${res.status} from ${gw}.`,
        });
      }
    } catch (err) {
      setHwOk(false);
      const msg = err instanceof Error ? err.message : "Network error";
      setHwResult(`Unreachable — ${msg}. Is the Pi on the same Wi-Fi?`);
      toast.error("Gateway unreachable", { description: msg });
    } finally {
      setHwTesting(false);
    }
  };

  const handleTgTest = async () => {
    const botToken = telegram.botToken.trim();
    const chatId = telegram.chatId.trim();
    if (!botToken || !chatId) {
      toast.error("Add your bot token + chat ID first");
      return;
    }
    setTgTesting(true);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, chatId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (res.ok && data.success) {
        toast.success("Telegram connected!", {
          description: "Check your chat for the confirmation message.",
        });
      } else {
        toast.error("Telegram test failed", {
          description: data.error ?? `HTTP ${res.status}`,
        });
      }
    } catch (err) {
      toast.error("Telegram test failed", {
        description: err instanceof Error ? err.message : "Network error.",
      });
    } finally {
      setTgTesting(false);
    }
  };

  const handleNotif = async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        toast.error("Browser notifications not supported here");
        return;
      }
      const perm = await Notification.requestPermission();
      setNotifPerm(perm);
      if (perm === "granted") {
        toast.success("Notifications enabled", {
          description: "New critical alerts will pop up as system notifications.",
        });
      } else {
        toast.info(`Permission: ${perm}`, {
          description: "Allow notifications in the browser address bar to enable.",
        });
      }
    } catch {
      toast.error("Could not request notification permission");
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Record<string, unknown>;
      const patch: Record<string, unknown> = {};
      for (const k of [
        "settings",
        "zones",
        "snapshot",
        "sensorHistory",
        "pump",
        "manualPumpRemainingSec",
        "totalWaterUsedL",
        "alerts",
        "scans",
        "diary",
        "tasks",
        "sprayPlans",
        "chat",
        "farmHealthScore",
        "panAngle",
        "tiltAngle",
        "dailySummaries",
        "language",
      ]) {
        if (data[k] !== undefined) patch[k] = data[k];
      }
      if (!patch.settings && !patch.zones) {
        toast.error("Not a KrishiNethra backup", {
          description: "No settings/zones found in this file.",
        });
        return;
      }
      useFarmStore.setState(patch as never);
      // Keep mirrored language field consistent with settings.language.
      const lang = (patch.settings as { language?: string } | undefined)?.language;
      if (lang === "en" || lang === "hi" || lang === "gu" || lang === "mr") {
        useFarmStore.setState({ language: lang } as never);
      }
      toast.success("Backup restored", {
        description: `${file.name} applied live — no reload needed.`,
      });
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "Invalid JSON file.",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* ============ 1. FARM PROFILE ============ */}
      <Rise>
        <Card>
          <CardHeader
            title={t("settings.farmProfile")}
            subtitle={t("settings.farmProfileSub")}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Tractor className="h-4 w-4" />
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>{t("settings.farmName")}</span>
              <input
                value={profile.farmName ?? ""}
                onChange={(e) =>
                  updateSettings({ farmProfile: { farmName: e.target.value.slice(0, 40) } })
                }
                placeholder="Patel Farm"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>{t("settings.farmerName")}</span>
              <input
                value={profile.farmerName ?? ""}
                onChange={(e) =>
                  updateSettings({ farmProfile: { farmerName: e.target.value.slice(0, 40) } })
                }
                placeholder="e.g. Ramesh Patel"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>{t("settings.state")}</span>
              <select
                value={profile.state}
                onChange={(e) => updateSettings({ farmProfile: { state: e.target.value } })}
                className={inputCls}
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>{t("settings.farmSize")}</span>
              <input
                value={String(profile.farmSizeAcres)}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^0-9.]/g, ""));
                  if (Number.isFinite(n))
                    updateSettings({
                      farmProfile: { farmSizeAcres: Math.min(500, Math.max(0.1, n || 0.1)) },
                    });
                }}
                inputMode="decimal"
                className={inputCls}
              />
            </label>
          </div>

          <div className="mt-3">
            <span className={labelCls}>{t("settings.crops")}</span>
            <div className="flex flex-wrap gap-2">
              {MANDI_PRICES.map((m) => {
                const active = profile.crops.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleCrop(m.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.97]",
                      active
                        ? "border-emerald-400/60 bg-emerald-500/15 text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                        : "border-white/10 bg-black/30 text-zinc-400 hover:border-emerald-500/30 hover:text-white",
                    )}
                  >
                    🌱 {m.crop}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">
              Zone A/B/C crops follow your first 3 picks — schemes + market advice update instantly.
            </p>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>{t("settings.latitude")}</span>
              <input
                value={String(location.latitude)}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^0-9.\-]/g, ""));
                  if (Number.isFinite(n))
                    updateSettings({
                      location: { latitude: Math.min(90, Math.max(-90, n)) },
                    });
                }}
                inputMode="decimal"
                placeholder="23.02"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>{t("settings.longitude")}</span>
              <input
                value={String(location.longitude)}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^0-9.\-]/g, ""));
                  if (Number.isFinite(n))
                    updateSettings({
                      location: { longitude: Math.min(180, Math.max(-180, n)) },
                    });
                }}
                inputMode="decimal"
                placeholder="72.57"
                className={inputCls}
              />
            </label>
            <div>
              <span className={labelCls}>{t("settings.hasPump")}</span>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
                {[
                  { label: t("settings.pumpYes"), value: true },
                  { label: t("settings.pumpNo"), value: false },
                ].map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => updateSettings({ farmProfile: { hasPump: o.value } })}
                    aria-pressed={profile.hasPump === o.value}
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-bold transition-all",
                      profile.hasPump === o.value
                        ? "bg-emerald-500 text-black shadow-[0_0_14px_rgba(34,197,94,0.4)]"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-600">
            <Globe2 className="h-3.5 w-3.5" /> {t("settings.gps")} — {(location.label || "Custom").toString()} ·{" "}
            {Number(location.latitude).toFixed(2)}, {Number(location.longitude).toFixed(2)}
          </p>
        </Card>
      </Rise>

      {/* ============ 2. LANGUAGE ============ */}
      <Rise delay={0.04}>
        <Card>
          <CardHeader
            title={t("settings.language")}
            subtitle={t("settings.languageSub")}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Languages className="h-4 w-4" />
              </span>
            }
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LANGUAGES.map((l) => {
              const active = settings.language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-2xl border p-4 text-center transition-all active:scale-[0.97]",
                    active
                      ? "border-emerald-400/60 bg-emerald-500/15 shadow-[0_0_20px_rgba(34,197,94,0.35)]"
                      : "border-white/10 bg-black/30 hover:border-emerald-500/30",
                  )}
                >
                  <span className="block text-2xl font-extrabold text-white">{l.nativeLabel}</span>
                  <span className="mt-1 block text-xs font-semibold text-zinc-400">{l.label}</span>
                  {active && (
                    <span className="mt-2 inline-block rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-extrabold text-black">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </Rise>

      {/* ============ 3. IRRIGATION THRESHOLDS ============ */}
      <Rise delay={0.06}>
        <Card>
          <CardHeader
            title={t("settings.irrigationThresholds")}
            subtitle={t("settings.irrigationSub")}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ThresholdRow
              label={t("settings.moistureLow")}
              value={thresholds.moistureLow}
              min={5}
              max={60}
              step={1}
              unit="%"
              onChange={(v) => updateSettings({ thresholds: { moistureLow: v } })}
            />
            <ThresholdRow
              label={t("settings.moistureHigh")}
              value={thresholds.moistureHigh}
              min={40}
              max={95}
              step={1}
              unit="%"
              onChange={(v) => updateSettings({ thresholds: { moistureHigh: v } })}
            />
            <ThresholdRow
              label={t("settings.pumpDuration")}
              value={thresholds.pumpDurationSec}
              min={3}
              max={120}
              step={1}
              unit="s"
              onChange={(v) => updateSettings({ thresholds: { pumpDurationSec: v } })}
            />
            <ThresholdRow
              label={t("settings.tankLow")}
              value={thresholds.tankLow}
              min={5}
              max={60}
              step={1}
              unit="%"
              onChange={(v) => updateSettings({ thresholds: { tankLow: v } })}
            />
          </div>
        </Card>
      </Rise>

      {/* ============ 4. CLIMATE THRESHOLDS ============ */}
      <Rise delay={0.08}>
        <Card>
          <CardHeader
            title={t("settings.climateThresholds")}
            subtitle={t("settings.climateSub")}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <Thermometer className="h-4 w-4" />
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ThresholdRow
              label={t("settings.tempHigh")}
              value={thresholds.tempHigh}
              min={25}
              max={45}
              step={0.5}
              unit="°C"
              onChange={(v) => updateSettings({ thresholds: { tempHigh: v } })}
            />
            <ThresholdRow
              label={t("settings.humidityLow")}
              value={thresholds.humidityLow}
              min={10}
              max={60}
              step={1}
              unit="%"
              onChange={(v) => updateSettings({ thresholds: { humidityLow: v } })}
            />
            <ThresholdRow
              label={t("settings.aqiHigh")}
              value={thresholds.aqiHigh}
              min={50}
              max={300}
              step={5}
              unit="AQI"
              onChange={(v) => updateSettings({ thresholds: { aqiHigh: v } })}
            />
          </div>
        </Card>
      </Rise>

      {/* ============ 5. CAMERA ============ */}
      <Rise delay={0.1}>
        <Card>
          <CardHeader
            title={t("settings.camera")}
            subtitle={t("settings.cameraSub")}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <Camera className="h-4 w-4" />
              </span>
            }
          />
          <span className={labelCls}>{t("settings.source")}</span>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
            {[
              { id: "simulation", label: t("settings.simFeed") },
              { id: "stream", label: t("settings.liveStream") },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() =>
                  updateSettings({ cameraSource: o.id as "simulation" | "stream" })
                }
                aria-pressed={settings.cameraSource === o.id}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-xs font-bold transition-all",
                  settings.cameraSource === o.id
                    ? "bg-emerald-500 text-black shadow-[0_0_14px_rgba(34,197,94,0.4)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>{t("settings.streamUrl")}</span>
              <input
                value={settings.cameraStreamUrl}
                onChange={(e) => updateSettings({ cameraStreamUrl: e.target.value.trim() })}
                placeholder="http://raspberrypi.local:8080/stream"
                autoComplete="off"
                spellCheck={false}
                className={cn(inputCls, "font-mono")}
              />
            </label>
            <div>
              <span className={labelCls}>
                {t("settings.panSpeed")} — {settings.cameraPanSpeed ?? 5}°/tick
              </span>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={settings.cameraPanSpeed ?? 5}
                onChange={(e) => updateSettings({ cameraPanSpeed: Number(e.target.value) })}
                aria-label={t("settings.panSpeed")}
                className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-600">
                <span>1° slow</span>
                <span>10° fast</span>
              </div>
            </div>
          </div>
        </Card>
      </Rise>

      {/* ============ 6. HARDWARE BRIDGE ============ */}
      <Rise delay={0.12}>
        <Card>
          <CardHeader
            title={t("settings.hardware")}
            subtitle={t("settings.hardwareSub")}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Cpu className="h-4 w-4" />
              </span>
            }
          />
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
            {[
              { id: "simulation", label: t("settings.simMode") },
              { id: "live", label: t("settings.liveMode") },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => updateSettings({ mode: o.id as "simulation" | "live" })}
                aria-pressed={settings.mode === o.id}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-xs font-bold transition-all",
                  settings.mode === o.id
                    ? o.id === "live"
                      ? "bg-emerald-500 text-black shadow-[0_0_14px_rgba(34,197,94,0.4)]"
                      : "bg-amber-500 text-black shadow-[0_0_14px_rgba(245,158,11,0.4)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="block flex-1">
              <span className={labelCls}>{t("settings.gatewayUrl")}</span>
              <input
                value={settings.hardwareGatewayUrl}
                onChange={(e) =>
                  updateSettings({ hardwareGatewayUrl: e.target.value.trim() })
                }
                placeholder="http://raspberrypi.local:8000"
                autoComplete="off"
                spellCheck={false}
                className={cn(inputCls, "font-mono")}
              />
            </label>
            <button
              type="button"
              onClick={() => void handleHwTest()}
              disabled={hwTesting}
              className={cn(
                "flex items-center justify-center gap-2 self-end rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all active:scale-[0.98]",
                hwTesting
                  ? "cursor-wait border border-white/10 bg-white/[0.04] text-zinc-400"
                  : "bg-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-emerald-400",
              )}
            >
              {hwTesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("common.testing")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" strokeWidth={2.5} /> {t("settings.testConnection")}
                </>
              )}
            </button>
          </div>
          {hwResult && (
            <p
              className={cn(
                "mt-2 rounded-xl border px-3 py-2.5 font-mono text-[11px] leading-relaxed",
                hwOk
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                  : "border-red-400/40 bg-red-500/10 text-red-200",
              )}
            >
              GET /api/hw/status?gw=&lt;gateway&gt; → {hwResult}
            </p>
          )}
          <p className="mt-2 rounded-xl border border-dashed border-white/10 p-3 text-[11px] leading-relaxed text-zinc-500">
            {t("settings.liveNote")}
          </p>
        </Card>
      </Rise>

      {/* ============ 7. ALERTS ============ */}
      <Rise delay={0.14}>
        <Card>
          <CardHeader
            title={t("settings.alerts")}
            subtitle={t("settings.alertsSub")}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                <Bell className="h-4 w-4" />
              </span>
            }
          />
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">Telegram</p>
              <p className="truncate text-[11px] text-zinc-500">
                {telegram.enabled ? t("common.enabled") : t("common.disabled")} — App + Telegram
              </p>
            </div>
            <Toggle
              checked={telegram.enabled}
              onChange={(v) => updateSettings({ telegram: { enabled: v } })}
              label="Forward alerts to Telegram"
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Bot token</span>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={telegram.botToken}
                  onChange={(e) =>
                    updateSettings({ telegram: { botToken: e.target.value.trim() } })
                  }
                  placeholder="1234567890:AAH…"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-3 pr-10 font-mono text-sm text-white outline-none transition-colors placeholder:font-sans placeholder:text-zinc-600 focus:border-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  aria-label={showToken ? "Hide token" : "Show token"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:text-white"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className={labelCls}>Chat ID</span>
              <input
                value={telegram.chatId}
                onChange={(e) =>
                  updateSettings({ telegram: { chatId: e.target.value.trim() } })
                }
                placeholder="e.g. 987654321"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm text-white outline-none transition-colors placeholder:font-sans placeholder:text-zinc-600 focus:border-emerald-500/50"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void handleTgTest()}
            disabled={tgTesting}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all active:scale-[0.98]",
              tgTesting
                ? "cursor-wait border border-white/10 bg-white/[0.04] text-zinc-400"
                : "bg-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-emerald-400",
            )}
          >
            {tgTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("common.testing")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" strokeWidth={2.5} /> {t("settings.testConnection")}
              </>
            )}
          </button>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{t("settings.sound")}</p>
              <p className="truncate text-[11px] text-zinc-500">{t("settings.soundSub")}</p>
            </div>
            <Toggle
              checked={settings.soundEnabled !== false}
              onChange={(v) => updateSettings({ soundEnabled: v })}
              label={t("settings.sound")}
            />
          </div>

          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{t("settings.browserNotif")}</p>
              <p className="text-[11px] text-zinc-500">
                {t("settings.browserNotifSub")} · {notifPerm}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleNotif()}
              className="shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-extrabold text-emerald-200 transition-all hover:bg-emerald-500/20 active:scale-[0.98]"
            >
              {t("settings.enableNotif")}
            </button>
          </div>
        </Card>
      </Rise>

      {/* ============ 8. VOICE ============ */}
      <Rise delay={0.16}>
        <Card>
          <CardHeader
            title={t("settings.voice")}
            subtitle={t("settings.voiceSub")}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Mic className="h-4 w-4" />
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
              <span className="text-sm font-bold text-white">{t("settings.output")}</span>
              <Toggle
                checked={settings.voiceOutput}
                onChange={(v) => updateSettings({ voiceOutput: v })}
                label={t("settings.output")}
              />
            </div>
            <label className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
              <span className={cn(labelCls, "mb-0")}>{t("settings.recLang")}</span>
              <select
                value={settings.voiceLang || "hi-IN"}
                onChange={(e) => updateSettings({ voiceLang: e.target.value })}
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
        </Card>
      </Rise>

      {/* ============ 9. DATA ============ */}
      <Rise delay={0.18}>
        <Card>
          <CardHeader
            title={t("settings.data")}
            subtitle={t("settings.dataSub")}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <DatabaseBackup className="h-4 w-4" />
              </span>
            }
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={exportFarmBackup}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
            >
              <DatabaseBackup className="h-4 w-4" strokeWidth={2.5} /> {t("settings.exportBackup")}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-emerald-200 active:scale-[0.98] disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}{" "}
              {t("settings.importBackup")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImport(f);
              }}
            />
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-400/50 bg-red-500/15 px-4 py-2.5 text-sm font-extrabold text-red-200 transition-all hover:bg-red-500/25 active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" /> {t("settings.resetFarm")}
            </button>
          </div>
          <p className="mt-2 font-mono text-[11px] text-zinc-500">
            {t("settings.storageUsage")}: {storageUsage} · key krishinethra-v1 (localStorage)
          </p>
        </Card>
      </Rise>

      {/* Reset confirm modal */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Close"
            onClick={() => setResetOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="card-surface relative w-full max-w-md rounded-2xl p-5">
            <h3 className="text-base font-extrabold text-white">{t("settings.resetTitle")}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              {t("settings.resetMessage")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResetOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-zinc-200 hover:border-emerald-500/40"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFarm();
                  setResetOpen(false);
                  toast.success("Farm reset", {
                    description: "Fresh demo farm loaded — no reload needed.",
                  });
                }}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-red-400"
              >
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
