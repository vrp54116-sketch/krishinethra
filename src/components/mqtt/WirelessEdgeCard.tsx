"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  PlugZap,
  RefreshCw,
  Unplug,
  Volume2,
  Lightbulb,
  Radio,
  Power,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm, useFarmStore } from "@/lib/store";
import { DEFAULT_BROKERS } from "@/lib/mqtt-config";
import { Card, CardHeader } from "@/components/dashboard/ui";
import { LiquidToggle } from "@/components/ui/glass";
import ShareFarmLink from "./ShareFarmLink";
import DemoTourButton from "./DemoTourButton";

const BROKER_OPTIONS = [
  { id: DEFAULT_BROKERS[0], label: "EMQX public (wss://broker.emqx.io:8084/mqtt)" },
  { id: DEFAULT_BROKERS[1], label: "HiveMQ public (wss://broker.hivemq.com:8884/mqtt)" },
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

function formatUptime(uptimeSec: number): string {
  if (!uptimeSec || uptimeSec < 0) return "0s";
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = Math.floor(uptimeSec % 60);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Settings Card: "EDGE BRIDGE // CONNECTION"
 * Token input (default patelfarm01) [Copy][Regenerate]
 * Broker dropdown (EMQX/HiveMQ/custom wss)
 * [Connect][Disconnect]
 * Stats: state dot, msgs received, "last seen Xs ago" countdown, RSSI bar, uptime.
 * Persist token + autoConnect.
 */
export default function WirelessEdgeCard() {
  const farm = useFarm();
  const settings = useFarmStore((s) => s.settings);
  const updateSettings = useFarmStore((s) => s.updateSettings);
  const mqttStatus = useFarmStore((s) => s.mqttStatus);
  const mqttMsgCount = useFarmStore((s) => s.mqttMsgCount);
  const mqttLastSeen = useFarmStore((s) => s.mqttLastSeen);
  const mqttRssi = useFarmStore((s) => s.mqttRssi);

  const token = settings.mqttToken || "patelfarm01";
  const brokerUrl = settings.mqttBrokerUrl || DEFAULT_BROKERS[0];
  const autoConnect = settings.autoConnect ?? true;

  const isCustom = !DEFAULT_BROKERS.includes(brokerUrl as (typeof DEFAULT_BROKERS)[number]);
  const [customUrl, setCustomUrl] = useState(isCustom ? brokerUrl : "");
  const [copied, setCopied] = useState(false);

  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const connected = mqttStatus === "online";
  const connecting = mqttStatus === "connecting";

  const ageSec =
    mqttLastSeen != null && nowSec > 0
      ? Math.max(0, nowSec - Math.round(mqttLastSeen / 1000))
      : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      /* ignore */
    }
    setCopied(true);
    toast.success("Farm token copied", { description: token });
    setTimeout(() => setCopied(false), 1600);
  };

  const handleRegenerate = () => {
    const next = randomToken();
    updateSettings({ mqttToken: next });
    toast.success("New farm token generated", {
      description: `${next} — flash your ESP32 node with this token.`,
    });
  };

  const handleBrokerSelect = (id: string) => {
    if (id === "custom") {
      updateSettings({
        mqttBrokerUrl: customUrl.trim() || DEFAULT_BROKERS[0],
      });
      return;
    }
    updateSettings({ mqttBrokerUrl: id });
  };

  const handleConnect = async () => {
    const b = (isCustom ? customUrl : brokerUrl).trim();
    if (!b.startsWith("wss://")) {
      toast.error("Broker must be a wss:// WebSocket URL", {
        description: "Browser requires secure WebSocket (e.g. wss://broker.emqx.io:8084/mqtt)",
      });
      return;
    }
    const { connect } = await import("@/lib/mqtt-bridge");
    connect(token, b);
    toast.info("Connecting to Edge node…", {
      description: `${b} · topic krishinethra/${token}/up`,
    });
  };

  const handleDisconnect = async () => {
    const { disconnect } = await import("@/lib/mqtt-bridge");
    disconnect();
    const s = useFarmStore.getState();
    s.setSource("SIM");
    s.updateSettings({ mode: "simulation" });
    s.startSimulation();
    toast.info("Edge disconnected", { description: "Simulation resumed." });
  };

  return (
    <Card>
      <CardHeader
        title="EDGE BRIDGE // CONNECTION"
        subtitle="ESP32 single edge node MQTT bridge · Telemetry contract: {node,soil,temp,hum,aqi,rain,pump,r2,mode,stale,rssi,up}"
        action={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <Radio className="h-4 w-4" />
          </span>
        }
      />

      {/* Token row */}
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        Edge Node Token (krishinethra/{"{token}"}/up)
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
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-emerald-200 sm:flex-none cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-emerald-200 sm:flex-none cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Regenerate
          </button>
        </div>
      </div>

      {/* Broker row */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            MQTT WebSocket Broker (Failover: EMQX ↔ HiveMQ)
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
            className="flex items-center justify-center gap-2 self-end rounded-xl border border-red-400/50 bg-red-500/15 px-5 py-2.5 text-sm font-extrabold text-red-200 transition-all hover:bg-red-500/25 active:scale-[0.98] cursor-pointer"
          >
            <Unplug className="h-4 w-4" /> Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleConnect()}
            className="flex items-center justify-center gap-2 self-end rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98] cursor-pointer"
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

      {/* Auto-connect toggle */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <div>
          <p className="text-xs font-semibold text-white">Auto-connect on load</p>
          <p className="text-[11px] text-zinc-400">Connect to edge node automatically when app opens</p>
        </div>
        <LiquidToggle
          checked={autoConnect}
          onChange={(v) => updateSettings({ autoConnect: v })}
          label="Auto-connect"
        />
      </div>

      {/* Stats row: state dot, msgs received, last seen countdown, RSSI bar, uptime */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {/* 1. State dot */}
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">State</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-extrabold text-white">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
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

        {/* 2. Msgs received */}
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Msgs Received</p>
          <p className="mt-1 font-mono text-xs font-extrabold text-white">{mqttMsgCount}</p>
        </div>

        {/* 3. Last seen countdown */}
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Last Seen</p>
          <p className="mt-1 font-mono text-xs font-extrabold text-white">
            {ageSec == null ? "—" : ageSec < 2 ? "now" : `${ageSec}s ago`}
          </p>
        </div>

        {/* 4. RSSI bar */}
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            RSSI {mqttRssi != null ? `(${mqttRssi} dBm)` : ""}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
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

        {/* 5. Uptime */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Uptime</p>
          <p className="mt-1 font-mono text-xs font-extrabold text-white">
            {formatUptime(farm.uptime)}
          </p>
        </div>
      </div>

      {farm.isLive && (
        <p className="mt-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-200">
          EDGE-LIVE active — Commands route directly to ESP32 over MQTT.
        </p>
      )}

      {/* Hardware Commands EXACT: PUMP_ON, PUMP_OFF, MODE_AUTO, MODE_MANUAL, R2_ON, R2_OFF, BUZZ */}
      <p className="mb-1 mt-4 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        Hardware Edge Commands (EXACT Contract)
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            farm.farmCmd(farm.pump ? "PUMP_OFF" : "PUMP_ON");
            toast.success(farm.pump ? "Command: PUMP_OFF" : "Command: PUMP_ON");
          }}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98] cursor-pointer",
            farm.pump
              ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
              : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-emerald-500/40",
          )}
        >
          <Power className="h-4 w-4" /> {farm.pump ? "PUMP_OFF" : "PUMP_ON"}
        </button>

        <button
          type="button"
          onClick={() => {
            const nextMode = farm.mode === "AUTO" ? "MODE_MANUAL" : "MODE_AUTO";
            farm.farmCmd(nextMode);
            toast.success(`Command: ${nextMode}`);
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-cyan-500/40 active:scale-[0.98] cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 text-cyan-400" />
          {farm.mode === "AUTO" ? "MODE_MANUAL" : "MODE_AUTO"}
        </button>

        <button
          type="button"
          onClick={() => {
            farm.setEdgeR2(!farm.r2);
            toast.success(farm.r2 ? "Command: R2_OFF" : "Command: R2_ON");
          }}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98] cursor-pointer",
            farm.r2
              ? "border-amber-400/60 bg-amber-500/15 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-amber-500/40",
          )}
        >
          <Lightbulb className="h-4 w-4" /> {farm.r2 ? "R2_OFF" : "R2_ON"}
        </button>

        <button
          type="button"
          onClick={() => {
            farm.sendEdgeBuzz();
            toast.success("Command: BUZZ:2:150");
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-emerald-500/40 active:scale-[0.98] cursor-pointer"
        >
          <Volume2 className="h-4 w-4 text-yellow-400" /> BUZZ:2:150
        </button>
      </div>

      {/* Demo tour + share */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <DemoTourButton className="flex-1" />
      </div>
      <div className="mt-2">
        <ShareFarmLink />
      </div>
    </Card>
  );
}
