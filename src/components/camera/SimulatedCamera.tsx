"use client";

import { useEffect, useRef, useState } from "react";
import { useFarmStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

export const CAM_VIEW_W = 640;
export const CAM_VIEW_H = 360;
const SCENE_W = 1920;

export function zoneForPan(pan: number): "A" | "B" | "C" {
  if (pan < 60) return "A";
  if (pan < 120) return "B";
  return "C";
}

function skyColors(hour: number): [string, string] {
  const h = ((hour % 24) + 24) % 24;
  if (h < 5 || h >= 20) return ["#020617", "#1e293b"]; // night
  if (h < 7) return ["#312e81", "#f97316"]; // dawn
  if (h < 10) return ["#38bdf8", "#fdba74"]; // morning
  if (h < 16) return ["#7dd3fc", "#38bdf8"]; // midday
  if (h < 18.5) return ["#38bdf8", "#fbbf24"]; // golden hour
  return ["#312e81", "#f97316"]; // dusk
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatCamTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface Detection {
  id: string;
  /** scene-space coords */
  sx: number;
  sy: number;
  w: number;
  h: number;
  label: string;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

/** Deterministic plant layout: 6 per zone across the 1920px scene. */
const PLANTS: { x: number; y: number; s: number; zone: "A" | "B" | "C" }[] = (() => {
  const out: { x: number; y: number; s: number; zone: "A" | "B" | "C" }[] = [];
  const zoneX = [40, 680, 1320];
  const ids: ("A" | "B" | "C")[] = ["A", "B", "C"];
  for (let z = 0; z < 3; z++) {
    for (let i = 0; i < 6; i++) {
      out.push({
        x: zoneX[z] + 60 + i * 88 + (i % 2) * 22,
        y: 242 + (i % 2) * 48,
        s: 0.9 + (i % 3) * 0.15,
        zone: ids[z],
      });
    }
  }
  return out;
})();

const TANK_SX = 1810;

function drawPlant(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  healthy: boolean,
) {
  const leaf = healthy ? "#4ade80" : "#b8a52e";
  const leafDark = healthy ? "#16a34a" : "#8a7a1e";
  const stem = healthy ? "#15803d" : "#713f12";
  // soil mound
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 16 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3f2a18";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 13 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // stem
  ctx.strokeStyle = stem;
  ctx.lineWidth = 3 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 26 * s);
  ctx.stroke();
  // leaves
  ctx.fillStyle = leaf;
  ctx.beginPath();
  ctx.ellipse(x - 11 * s, y - 16 * s, 12 * s, 5.5 * s, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = leafDark;
  ctx.beginPath();
  ctx.ellipse(x + 11 * s, y - 20 * s, 12 * s, 5.5 * s, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // crown
  ctx.fillStyle = healthy ? "#22c55e" : "#a16207";
  ctx.beginPath();
  ctx.arc(x, y - 29 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
}

/* ------------------------------------------------------------------ */
/* SimulatedCamera — canvas pan-tilt farm feed (640×360)                */
/* ------------------------------------------------------------------ */

export default function SimulatedCamera() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionsRef = useRef<Detection[]>([]);
  const [detectionsTick, setDetectionsTick] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const smoothRef = useRef({ pan: 90, tilt: 90 });

  // Live tick for the HTML overlay (timestamp + zone label).
  const snapshotTs = useFarmStore((s) => s.snapshot.timestamp);
  const panAngle = useFarmStore((s) => s.panAngle);
  const tiltAngle = useFarmStore((s) => s.tiltAngle);
  const pumpRunning = useFarmStore((s) => s.pump.running);

  /* AI detections refresh every 2s from live store data. */
  useEffect(() => {
    const update = () => {
      const st = useFarmStore.getState();
      const camX = (st.panAngle / 180) * (SCENE_W - CAM_VIEW_W);
      const low = st.settings.thresholds.moistureLow;
      const visible = PLANTS.filter(
        (p) => p.x > camX - 40 && p.x < camX + CAM_VIEW_W + 40,
      ).slice(0, 4);
      const dets: Detection[] = visible.map((p, i) => {
        const zone = st.zones.find((z) => z.id === p.zone);
        const m = zone?.soilMoisture ?? 40;
        const dry = m < low;
        const conf = 82 + Math.floor(Math.random() * 14);
        return {
          id: `det-${i}`,
          sx: p.x - 46 * p.s,
          sy: p.y - 62 * p.s,
          w: 92 * p.s,
          h: 68 * p.s,
          label: dry
            ? `Soil: Dry ${conf}%`
            : `Plant: Healthy ${conf}%`,
          color: dry ? "#fbbf24" : "#4ade80",
        };
      });
      // Tank telemetry box when the tank is in frame.
      if (TANK_SX > camX - 60 && TANK_SX < camX + CAM_VIEW_W + 60) {
        dets.push({
          id: "det-tank",
          sx: TANK_SX - 55,
          sy: 120,
          w: 110,
          h: 92,
          label: `Tank: ${st.snapshot.tankLevelPercent.toFixed(0)}%`,
          color: "#38bdf8",
        });
      }
      detectionsRef.current = dets;
      setDetectionsTick((v) => v + 1);
    };
    update();
    const id = setInterval(update, 2000);
    return () => clearInterval(id);
  }, []);

  /* Main render loop. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const frame = () => {
      const st = useFarmStore.getState();
      const targetPanX = (st.panAngle / 180) * (SCENE_W - CAM_VIEW_W);
      const targetTiltY = (st.tiltAngle - 90) * 0.9;
      // Smooth-animated pan/tilt (eases toward store values like a real head).
      const sm = smoothRef.current;
      sm.pan += (targetPanX - sm.pan) * 0.08;
      sm.tilt += (targetTiltY - sm.tilt) * 0.08;
      if (Math.abs(targetPanX - sm.pan) < 0.05) sm.pan = targetPanX;
      if (Math.abs(targetTiltY - sm.tilt) < 0.05) sm.tilt = targetTiltY;
      const camX = sm.pan;
      const tiltY = sm.tilt;

      const d = new Date(st.snapshot.timestamp);
      const hour = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
      const [skyTop, skyBottom] = skyColors(hour);
      const isDay = hour >= 6 && hour <= 19;

      const zoneA = st.zones.find((z) => z.id === "A");
      const zoneB = st.zones.find((z) => z.id === "B");
      const zoneC = st.zones.find((z) => z.id === "C");
      const moistureOf = (id: string) =>
        id === "A"
          ? (zoneA?.soilMoisture ?? 45)
          : id === "B"
            ? (zoneB?.soilMoisture ?? 22)
            : (zoneC?.soilMoisture ?? 33);

      /* ---- base (fills tilt gaps) ---- */
      const base = ctx.createLinearGradient(0, 0, 0, CAM_VIEW_H);
      base.addColorStop(0, skyTop);
      base.addColorStop(0.45, skyBottom);
      base.addColorStop(0.46, "#14532d");
      base.addColorStop(1, "#1c1008");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, CAM_VIEW_W, CAM_VIEW_H);

      ctx.save();
      ctx.translate(-Math.round(camX), Math.round(tiltY));

      /* ---- sky ---- */
      const sky = ctx.createLinearGradient(0, -90, 0, 175);
      sky.addColorStop(0, skyTop);
      sky.addColorStop(1, skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(camX - 10, -90, CAM_VIEW_W + 20, 265);

      // sun / moon drift across the wide scene with the hour
      const sunX = camX + 80 + (hour / 24) * (CAM_VIEW_W - 160);
      const sunY = isDay ? 62 - Math.sin(((hour - 6) / 13) * Math.PI) * 28 : 52;
      if (isDay) {
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(sunX, sunY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(253,224,71,0.25)";
        ctx.beginPath();
        ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.arc(sunX, sunY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = skyTop;
        ctx.beginPath();
        ctx.arc(sunX + 6, sunY - 4, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // distant hills
      ctx.fillStyle = isDay ? "#166534" : "#0b1f16";
      ctx.beginPath();
      ctx.moveTo(camX - 10, 175);
      for (let x = 0; x <= CAM_VIEW_W + 20; x += 40) {
        const wx = camX + x;
        const hill = Math.sin(wx * 0.008) * 18 + Math.sin(wx * 0.021 + 2) * 8;
        ctx.lineTo(camX + x, 175 - 22 - hill);
      }
      ctx.lineTo(camX + CAM_VIEW_W + 10, 175);
      ctx.closePath();
      ctx.fill();

      /* ---- field base + 3 zone bands ---- */
      ctx.fillStyle = "#2a1a0e";
      ctx.fillRect(camX - 10, 175, CAM_VIEW_W + 20, 275);
      const bands: { x0: number; x1: number; id: "A" | "B" | "C" }[] = [
        { x0: 0, x1: 640, id: "A" },
        { x0: 640, x1: 1280, id: "B" },
        { x0: 1280, x1: 1920, id: "C" },
      ];
      for (const b of bands) {
        const m = moistureOf(b.id);
        ctx.fillStyle = m < 20 ? "#4a2c12" : m < 30 ? "#3d2b14" : "#274d1e";
        ctx.fillRect(b.x0, 175, b.x1 - b.x0, 275);
        // zone sign post
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(b.x0 + 18, 186, 86, 22);
        ctx.fillStyle = "#e7f5ec";
        ctx.font = "bold 12px monospace";
        ctx.fillText(`ZONE ${b.id} · ${m.toFixed(0)}%`, b.x0 + 24, 201);
      }
      // dry cracks in Zone B
      ctx.strokeStyle = "rgba(20,8,2,0.8)";
      ctx.lineWidth = 1.5;
      for (const [cx, cy, len] of [
        [760, 250, 46],
        [900, 300, 60],
        [1050, 260, 52],
      ] as const) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + len * 0.5, cy + 10);
        ctx.lineTo(cx + len * 0.3, cy + 22);
        ctx.lineTo(cx + len, cy + 30);
        ctx.stroke();
      }

      // soil furrow rows
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 2;
      for (let r = 0; r < 6; r++) {
        const y = 215 + r * 38;
        ctx.beginPath();
        ctx.moveTo(camX - 10, y);
        ctx.lineTo(camX + CAM_VIEW_W + 10, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let x = Math.floor((camX - 10) / 46) * 46; x < camX + CAM_VIEW_W + 10; x += 46) {
        ctx.beginPath();
        ctx.moveTo(x, 178);
        ctx.lineTo(x - 14, 450);
        ctx.stroke();
      }

      // drip line
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(camX - 10, 228);
      ctx.lineTo(camX + CAM_VIEW_W + 10, 228);
      ctx.stroke();

      /* ---- water tank (far right of scene) ---- */
      const tankH = 110;
      const tankY = 175 - tankH;
      const pct = Math.max(0, Math.min(100, st.snapshot.tankLevelPercent));
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(TANK_SX - 45, tankY, 90, tankH);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(TANK_SX - 45, tankY, 90, tankH);
      const wh = (tankH - 8) * (pct / 100);
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(TANK_SX - 41, tankY + tankH - 4 - wh, 82, wh);
      ctx.fillStyle = "#e7f5ec";
      ctx.font = "bold 11px monospace";
      ctx.fillText(`TANK ${pct.toFixed(0)}%`, TANK_SX - 38, tankY + tankH + 16);

      /* ---- plants ---- */
      const low = st.settings.thresholds.moistureLow;
      const sorted = [...PLANTS].sort((a, b) => a.y - b.y);
      for (const p of sorted) {
        if (p.x < camX - 60 || p.x > camX + CAM_VIEW_W + 60) continue;
        drawPlant(ctx, p.x, p.y, p.s, moistureOf(p.zone) >= low);
      }

      /* ---- water spray particles while the pump runs ---- */
      if (st.pump.running) {
        const active = zoneForPan((camX / (SCENE_W - CAM_VIEW_W)) * 180 || 0);
        const zx = active === "A" ? 320 : active === "B" ? 960 : 1600;
        const parts = particlesRef.current;
        for (let k = 0; k < 4; k++) {
          parts.push({
            x: zx - 90 + Math.random() * 180,
            y: 214,
            vx: (Math.random() - 0.5) * 1.6,
            vy: -2.2 - Math.random() * 1.8,
            life: 0,
            maxLife: 34 + Math.random() * 18,
          });
        }
        if (parts.length > 420) parts.splice(0, parts.length - 420);
      }
      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++;
        p.vy += 0.09;
        p.x += p.vx;
        p.y += p.vy;
        if (p.life > p.maxLife || p.y > 330) {
          parts.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(125,211,252,${(1 - p.life / p.maxLife) * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ---- AI bounding boxes ---- */
      void detectionsTick;
      for (const det of detectionsRef.current) {
        const x = det.sx;
        const y = det.sy;
        const L = 10;
        ctx.strokeStyle = det.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = det.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x, y + L);
        ctx.lineTo(x, y);
        ctx.lineTo(x + L, y);
        ctx.moveTo(x + det.w - L, y);
        ctx.lineTo(x + det.w, y);
        ctx.lineTo(x + det.w, y + L);
        ctx.moveTo(x + det.w, y + det.h - L);
        ctx.lineTo(x + det.w, y + det.h);
        ctx.lineTo(x + det.w - L, y + det.h);
        ctx.moveTo(x + L, y + det.h);
        ctx.lineTo(x, y + det.h);
        ctx.lineTo(x, y + det.h - L);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = "bold 11px monospace";
        const tw = ctx.measureText(det.label).width;
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(x, y - 18, tw + 12, 16);
        ctx.fillStyle = det.color;
        ctx.fillText(det.label, x + 6, y - 6);
      }

      ctx.restore();

      /* ---- CCTV vignette + scanlines ---- */
      const vg = ctx.createRadialGradient(
        CAM_VIEW_W / 2,
        CAM_VIEW_H / 2,
        CAM_VIEW_H * 0.35,
        CAM_VIEW_W / 2,
        CAM_VIEW_H / 2,
        CAM_VIEW_W * 0.62,
      );
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, CAM_VIEW_W, CAM_VIEW_H);
      ctx.fillStyle = "rgba(255,255,255,0.025)";
      for (let y = 0; y < CAM_VIEW_H; y += 3) {
        ctx.fillRect(0, y, CAM_VIEW_W, 1);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [detectionsTick]);

  const zone = zoneForPan(panAngle);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-black">
      <canvas
        ref={canvasRef}
        width={CAM_VIEW_W}
        height={CAM_VIEW_H}
        className="h-auto w-full"
        aria-label="Simulated live farm camera feed"
      />
      {/* HTML overlay: REC / timestamp / cam id */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 text-[11px] font-mono">
        <div className="flex items-center gap-2 rounded-md bg-black/60 px-2 py-1">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
          <span className="font-bold tracking-widest text-red-400">REC</span>
          <span className="text-zinc-200">{formatCamTimestamp(snapshotTs)}</span>
        </div>
        <div className="rounded-md bg-black/60 px-2 py-1 font-bold tracking-wider text-emerald-300">
          CAM-01 • ZONE {zone} sweep
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2.5 font-mono text-[11px]">
        <span className="rounded-md bg-black/60 px-2 py-1 text-zinc-300">
          PAN {Math.round(panAngle)}° · TILT {Math.round(tiltAngle)}°
        </span>
        {pumpRunning && (
          <span className="animate-pulse rounded-md border border-sky-400/50 bg-sky-500/20 px-2 py-1 font-bold text-sky-200">
            IRRIGATION ON
          </span>
        )}
      </div>
    </div>
  );
}
