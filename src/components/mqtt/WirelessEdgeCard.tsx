"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  PlugZap,
  RefreshCw,
  Unplug,
  Volume2,
  Lightbulb,
  Radar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { DEFAULT_BROKERS, topicsFor } from "@/lib/mqtt-bridge";
import { Card, CardHeader } from "@/components/dashboard/ui";
import ShareFarmLink from "./ShareFarmLink";
import DemoTourButton from "./DemoTourButton";

const BROKER_OPTIONS = [
  { id: DEFAULT_BROKERS[0], label: "EMQX public (wss)" },
  { id: DEFAULT_BROKERS[1], label: "HiveMQ public (wss)" },
  { id: "custom", label: "Custom wss URL…" },
];

function randomToken(): string {
  const rand = Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/gi, "");
  return `farm${rand || "01"}`.slice(0, 16).toLowerCase();
}

function rssiPct(rssi: number | null): number {
  if (rssi == null) return 0;
  return Math.min(100, Math.max(0, Math.round(((rssi + 90) / 60) * 100)));
}

function subscribeNow(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}
function getNowSec(): number {
  return Math.floor(Date.now() / 1000);
}
function getServerSnapshot(): number {
  return 0;
}

/**
 * WirelessEdgeCard — Settings → "Wireless Edge Bridge".
 * Token (default patelfarm01) with Copy + Regenerate, broker dropdown
 * (EMQX / HiveMQ / custom), Connect/Disconnect, live stats row
 * (status dot, msgs received, last-seen seconds ago, WiFi RSSI bar),
 * hardware test buttons (R2 / buzzer / sweep / servo), Demo Tour,
 * Share Farm Link + QR, and the public-broker security note.
 */
export default function WirelessEdgeCard() {
  const settings = useFarmStore((s) => s.settings);
  const updateSettings = useFarmStore((s) => s.updateSettings);
  const mqttStatus = useFarmStore((s) => s.mqttStatus);
  const mqttMsgCount = useFarmStore((s) => s.mqttMsgCount);
  const mqttLastSeen = useFarmStore((s) => s.mqttLastSeen);
  const mqttRssi = useFarmStore((s) => s.mqttRssi);
  const liveSource = useFarmStore((s) => s.liveSource);
  const edgeR2 = useFarmStore((s) => s.edgeR2);
  const edgeServo = useFarmStore((s) => s.edgeServo);
  const setEdgeR2 = useFarmStore((s) => s.setEdgeR2);
  const sendEdgeBuzz = useFarmStore((s) => s.sendEdgeBuzz);
  const sendEdgeSweep = useFarmStore((s) => s.sendEdgeSweep);
  const sendEdgeServo = useFarmStore((s) => s.sendEdgeServo);

  const token = settings.mqttToken || "patelfarm01";
  const brokerUrl = settings.mqttBrokerUrl || DEFAULT_BROKERS[0];
  const isCustom = !DEFAULT_BROKERS.includes(brokerUrl as (typeof DEFAULT_BROKERS)[number]);
  const [customUrl, setCustomUrl] = useState(isCustom ? brokerUrl : "");
  const [copied, setCopied] = useState(false);

  const nowSec = useSyncExternalStore(subscribeNow, getNowSec, getServerSnapshot);

  const topics = topicsFor(token);
  const connected = mqttStatus === "online";
  const connecting = mqttStatus === "connecting";
  const ageSec =
    mqttLastSeen != null && nowSec > 0
      ? Math.max(0, nowSec - Math.round(mqttLastSeen / 1000))
      : null;
  const edgeLive =
    settings.mode === "live" && liveSource === "mqtt" && connected && (ageSec ?? 99) < 5;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      /* clipboard unavailable — still toast the token */
    }
    setCopied(true);
    toast.success("Farm token copied", { description: token });
    setTimeout(() => setCopied(false), 1600);
  };

  const handleRegenerate = () => {
    const next = randomToken();
    updateSettings({ mqttToken: next });
    toast.success("New farm token", {
      description: `${next} — update the ESP32 sketch to match, then reconnect.`,
    });
  };

  const handleBrokerSelect = (id: string) => {
    if (id === "custom") {
      updateSettings({
        mqttBrokerUrl: customUrl.trim() || "wss://broker.emqx.io:8084/mqtt",
      });
      return;
    }
    updateSettings({ mqttBrokerUrl: id });
  };

  const handleConnect = async () => {
    const b = brokerUrl.trim();
    if (!b.startsWith("wss://")) {
      toast.error("Broker must be a wss:// URL", {
        description: "Browsers require secure WebSocket (wss) — e.g. wss://broker.emqx.io:8084/mqtt",
      });
      return;
    }
    const { connect } = await import("@/lib/mqtt-bridge");
    connect(b, token);
    toast.info("Connecting to edge broker…", {
      description: `${b} · token ${token} · auto-failover armed.`,
    });
  };

  const handleDisconnect = async () => {
    const { disconnect } = await import("@/lib/mqtt-bridge");
    disconnect();
    const s = useFarmStore.getState();
    s.setLiveSource("sim");
    s.updateSettings({ mode: "simulation" });
    s.startSimulation();
    toast.info("Edge disconnected", { description: "Simulation resumed." });
  };

  return (
    <Card>
      <CardHeader
        title="Wireless Edge Bridge"
        subtitle="ESP32 telemetry over MQTT — no laptop needed"
        action={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <PlugZap className="h-4 w-4" />
          </span>
        }
      />

      {/* Token row */}
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        Farm token (farm password)
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={token}
          onChange={(e) =>
            updateSettings({
              mqttToken: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "patelfarm01",
            })
          }
          spellCheck={false}
          autoComplete="off"
          aria-label="Farm token"
          className="w-full flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm font-bold text-white outline-none transition-colors focus:border-emerald-500/50"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-emerald-200 sm:flex-none"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-emerald-200 sm:flex-none"
          >
            <RefreshCw className="h-4 w-4" /> Regenerate
          </button>
        </div>
      </div>

      {/* Broker row */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Public broker
          </span>
          <select
            value={isCustom ? "custom" : brokerUrl}
            onChange={(e) => handleBrokerSelect(e.target.value)}
            aria-label="MQTT broker"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors focus:border-emerald-500/50 [&>option]:bg-[#0a120c]"
          >
            {BROKER_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {connected || connecting ? (
          <button
            type="button"
            onClick={() => void handleDisconnect()}
            className="flex items-center justify-center gap-2 self-end rounded-xl border border-red-400/50 bg-red-500/15 px-5 py-2.5 text-sm font-extrabold text-red-200 transition-all hover:bg-red-500/25 active:scale-[0.98]"
          >
            <Unplug className="h-4 w-4" /> Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleConnect()}
            className="flex items-center justify-center gap-2 self-end rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
          >
            <PlugZap className="h-4 w-4" strokeWidth={2.5} /> Connect
          </button>
        )}
      </div>
      {isCustom && (
        <input
          value={customUrl}
          onChange={(e) => {
            setCustomUrl(e.target.value);
            updateSettings({ mqttBrokerUrl: e.target.value.trim() });
          }}
          placeholder="wss://your-broker:8084/mqtt"
          spellCheck={false}
          autoComplete="off"
          aria-label="Custom broker URL"
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/50"
        />
      )}

      {/* Live stats row */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-extrabold text-white">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                connected
                  ? "animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                  : connecting
                    ? "animate-pulse bg-amber-400"
                    : "bg-zinc-600",
              )}
            />
            {connected ? "online" : connecting ? "connecting" : "offline"}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Msgs received</p>
          <p className="mt-1 font-mono text-xs font-extrabold text-white">{mqttMsgCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Last seen</p>
          <p className="mt-1 font-mono text-xs font-extrabold text-white">
            {ageSec == null ? "—" : ageSec < 2 ? "now" : `${ageSec}s ago`}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            WiFi RSSI{mqttRssi != null ? ` · ${mqttRssi} dBm` : ""}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                rssiPct(mqttRssi) > 60
                  ? "bg-emerald-400"
                  : rssiPct(mqttRssi) > 30
                    ? "bg-amber-400"
                    : "bg-rose-400",
              )}
              style={{ width: `${rssiPct(mqttRssi)}%` }}
            />
          </div>
        </div>
      </div>
      {edgeLive && (
        <p className="mt-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-200">
          EDGE-LIVE — pump, mode, R2, buzzer, sweep and pan controls below route over MQTT.
        </p>
      )}

      {/* Topics hint */}
      <div className="mt-2 rounded-xl border border-dashed border-white/10 p-3 font-mono text-[11px] leading-relaxed text-zinc-500">
        <p>ESP32 publishes → <span className="text-emerald-300">{topics.up}</span> + <span className="text-emerald-300">{topics.state}</span></p>
        <p>App publishes → <span className="text-sky-300">{topics.cmd}</span> (PUMP:ON/OFF/5/10/30 · MODE:AUTO/MANUAL · R2:ON/OFF · BUZZ:2:150 · SWEEP · SERVO:90 · LCD1/LCD2)</p>
      </div>

      {/* Hardware tests */}
      <p className="mb-1 mt-3 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        Hardware tests {edgeLive ? "" : "(connect for live control)"}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            setEdgeR2(!edgeR2);
            toast.success(edgeR2 ? "R2 OFF sent" : "R2 ON sent");
          }}
          disabled={!edgeLive}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
            edgeR2
              ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
              : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-amber-500/40",
          )}
        >
          <Lightbulb className="h-4 w-4" /> R2 {edgeR2 ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={() => {
            sendEdgeBuzz();
            toast.success("Buzzer test sent (BUZZ:2:150)");
          }}
          disabled={!edgeLive}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-emerald-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Volume2 className="h-4 w-4" /> Buzzer
        </button>
        <button
          type="button"
          onClick={() => {
            sendEdgeSweep();
            toast.success("Pan sweep sent (SWEEP)");
          }}
          disabled={!edgeLive}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-emerald-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Radar className="h-4 w-4" /> Sweep
        </button>
        <button
          type="button"
          onClick={() => {
            sendEdgeServo(90);
            toast.success("Servo centred (SERVO:90)");
          }}
          disabled={!edgeLive}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-emerald-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          SERVO:90
        </button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-zinc-500">
        Edge servo mirror: {Math.round(edgeServo)}° · Pump/mode/pan controls across the app auto-route over MQTT in EDGE-LIVE.
      </p>

      {/* Demo tour + share */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <DemoTourButton className="flex-1" />
      </div>
      <div className="mt-2">
        <ShareFarmLink />
      </div>

      <p className="mt-2 rounded-xl border border-dashed border-amber-400/25 bg-amber-500/[0.06] p-3 text-[11px] leading-relaxed text-amber-200/80">
        Security note: Public broker = use a unique token as your password. For
        production use a private broker (HiveMQ Cloud free tier) with
        username/password.
      </p>
    </Card>
  );
}
