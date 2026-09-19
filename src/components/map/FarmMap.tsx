"use client";

import { useFarmStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Zone } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function hourFromTimestamp(ts: number): number {
  const d = new Date(ts);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/** Sky gradient stops per hour: [top, bottom]. */
function skyColors(hour: number): [string, string] {
  const h = ((hour % 24) + 24) % 24;
  if (h < 5 || h >= 20) return ["#020617", "#0f172a"]; // night
  if (h < 7) return ["#312e81", "#f97316"]; // dawn
  if (h < 10) return ["#38bdf8", "#fdba74"]; // morning
  if (h < 16) return ["#7dd3fc", "#38bdf8"]; // midday
  if (h < 18.5) return ["#38bdf8", "#fbbf24"]; // golden hour
  return ["#312e81", "#f97316"]; // dusk
}

function zoneTheme(status: Zone["status"]): {
  fill: string;
  stroke: string;
  glow: string;
  soil: string;
  label: string;
} {
  switch (status) {
    case "healthy":
      return {
        fill: "#14532d",
        stroke: "#22c55e",
        glow: "rgba(34,197,94,0.35)",
        soil: "#166534",
        label: "#4ade80",
      };
    case "warning":
      return {
        fill: "#78350f",
        stroke: "#f59e0b",
        glow: "rgba(245,158,11,0.35)",
        soil: "#a16207",
        label: "#fbbf24",
      };
    case "critical":
      return {
        fill: "#450a0a",
        stroke: "#ef4444",
        glow: "rgba(239,68,68,0.4)",
        soil: "#991b1b",
        label: "#fca5a5",
      };
  }
}

/** Small top-down plant: soil mound + stem + two leaves. */
function Plant({
  x,
  y,
  scale = 1,
  wilted = false,
}: {
  x: number;
  y: number;
  scale?: number;
  wilted?: boolean;
}) {
  const leaf = wilted ? "#a3a32e" : "#4ade80";
  const stem = wilted ? "#713f12" : "#16a34a";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={10} rx={11} ry={4} fill="#000" opacity={0.35} />
      <line x1={0} y1={10} x2={0} y2={-8} stroke={stem} strokeWidth={3} strokeLinecap="round" />
      <ellipse
        cx={-8}
        cy={wilted ? 2 : -4}
        rx={9}
        ry={4.5}
        fill={leaf}
        opacity={wilted ? 0.7 : 1}
        transform={`rotate(${wilted ? 12 : -28} -8 ${wilted ? 2 : -4})`}
      />
      <ellipse
        cx={8}
        cy={wilted ? 4 : -6}
        rx={9}
        ry={4.5}
        fill={leaf}
        opacity={wilted ? 0.55 : 1}
        transform={`rotate(${wilted ? -8 : 28} 8 ${wilted ? 4 : -6})`}
      />
      <circle cx={0} cy={-10} r={3} fill={wilted ? "#a16207" : "#22c55e"} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* FarmMap — code-drawn 2D digital twin (3ft x 2ft plot, top-down)      */
/* ------------------------------------------------------------------ */

export const ZONE_PAN: Record<string, number> = { A: 30, B: 90, C: 150 };

export default function FarmMap({
  selectedZone,
  onSelectZone,
}: {
  selectedZone: string | null;
  onSelectZone: (id: "A" | "B" | "C") => void;
}) {
  const zones = useFarmStore((s) => s.zones);
  const snapshot = useFarmStore((s) => s.snapshot);
  const pump = useFarmStore((s) => s.pump);
  const panAngle = useFarmStore((s) => s.panAngle);
  const tiltAngle = useFarmStore((s) => s.tiltAngle);

  const hour = hourFromTimestamp(snapshot.timestamp);
  const isDay = hour >= 6 && hour <= 19;
  const [skyTop, skyBottom] = skyColors(hour);

  const zoneA = zones.find((z) => z.id === "A");
  const zoneB = zones.find((z) => z.id === "B");
  const zoneC = zones.find((z) => z.id === "C");
  const tA = zoneTheme(zoneA?.status ?? "healthy");
  const tB = zoneTheme(zoneB?.status ?? "warning");
  const tC = zoneTheme(zoneC?.status ?? "healthy");

  const tankPct = Math.max(0, Math.min(100, snapshot.tankLevelPercent));
  const waterH = (48 * tankPct) / 100;
  const waterY = 388 - waterH;

  // Camera mast geometry.
  const camX = 400;
  const camY = 60;
  const coneLen = 46 + tiltAngle * 0.35;
  const coneHalf = 26 + tiltAngle * 0.08;

  const running = pump.running;

  const zoneBox = (
    id: "A" | "B" | "C",
    x: number,
    w: number,
    theme: ReturnType<typeof zoneTheme>,
    zone: Zone | undefined,
  ) => (
    <g
      onClick={() => onSelectZone(id)}
      className="cursor-pointer"
      role="button"
      aria-label={`${zone?.name ?? id} details`}
    >
      <rect
        x={x}
        y={92}
        width={w}
        height={200}
        rx={10}
        fill={theme.fill}
        fillOpacity={0.88}
        stroke={selectedZone === id ? "#ffffff" : theme.stroke}
        strokeWidth={selectedZone === id ? 3 : 1.5}
        style={{ filter: `drop-shadow(0 0 ${selectedZone === id ? 14 : 8}px ${theme.glow})` }}
      />
      {/* soil texture dots */}
      {Array.from({ length: 12 }).map((_, i) => (
        <circle
          key={i}
          cx={x + 18 + ((i * 53) % (w - 36))}
          cy={150 + ((i * 37) % 120)}
          r={2.2}
          fill={theme.soil}
          opacity={0.8}
        />
      ))}
    </g>
  );

  return (
    <div className="card-surface overflow-hidden rounded-2xl">
      <svg
        viewBox="0 0 800 500"
        className="h-auto w-full select-none"
        role="img"
        aria-label="Interactive 2D map of the 3ft by 2ft farm plot"
      >
        <defs>
          <linearGradient id="twin-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="100%" stopColor={skyBottom} />
          </linearGradient>
          <linearGradient id="twin-tank-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        {/* ===== Sky strip (top, color by hour) ===== */}
        <rect x={0} y={0} width={800} height={56} fill="url(#twin-sky)" />
        <text x={20} y={24} fill="#fff" fontSize={13} fontWeight={800} opacity={0.95}>
          3ft × 2ft farm plot · top-down
        </text>
        <text x={20} y={42} fill="#fff" fontSize={11} opacity={0.75}>
          {isDay ? "Day" : "Night"} · {Math.floor(hour)}:{String(Math.floor((hour % 1) * 60)).padStart(2, "0")}
          {"  "}· CAM pan {Math.round(panAngle)}° tilt {Math.round(tiltAngle)}°
        </text>

        {/* Sun / moon */}
        {isDay ? (
          <g transform="translate(748 28)">
            <circle r={13} fill="#fde047" stroke="#f59e0b" strokeWidth={2} />
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * Math.PI) / 4;
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * 17}
                  y1={Math.sin(a) * 17}
                  x2={Math.cos(a) * 22}
                  y2={Math.sin(a) * 22}
                  stroke="#fde047"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        ) : (
          <g transform="translate(748 28)">
            <circle r={12} fill="#e2e8f0" />
            <circle cx={5} cy={-3} r={10} fill={skyTop} />
          </g>
        )}

        {/* ===== Outer fence ===== */}
        <rect
          x={16}
          y={66}
          width={768}
          height={352}
          rx={14}
          fill="#071009"
          stroke="rgba(34,197,94,0.35)"
          strokeWidth={2}
        />

        {/* ===== Zones (clickable) ===== */}
        {zoneBox("A", 28, 238, tA, zoneA)}
        {zoneBox("B", 274, 238, tB, zoneB)}
        {zoneBox("C", 520, 252, tC, zoneC)}

        {/* Zone B dry cracks (always visible — problem zone) */}
        <g stroke="#451a03" strokeWidth={1.6} opacity={0.85} fill="none">
          <path d="M310 180 l18 10 l-8 14 l16 8" />
          <path d="M400 230 l-14 12 l12 10 l-10 12" />
          <path d="M460 170 l14 12 l-12 10" />
        </g>

        {/* Zone headers */}
        <g fontWeight={800} fontSize={13} textAnchor="middle">
          <text x={147} y={112} fill={tA.label}>ZONE A · {zoneA?.crop.toUpperCase()}</text>
          <text x={393} y={112} fill={tB.label}>ZONE B · {zoneB?.crop.toUpperCase()}</text>
          <text x={646} y={112} fill={tC.label}>ZONE C · {zoneC?.crop.toUpperCase()}</text>
        </g>
        <g fontSize={11} textAnchor="middle" fill="#e7f5ec" opacity={0.9}>
          <text x={147} y={128}>{zoneA?.soilMoisture.toFixed(1)}% · {zoneA?.status}</text>
          <text x={393} y={128}>{zoneB?.soilMoisture.toFixed(1)}% · {zoneB?.status}</text>
          <text x={646} y={128}>{zoneC?.soilMoisture.toFixed(1)}% · {zoneC?.status}</text>
        </g>

        {/* Plants: A lush, B wilted/dry, C young inspection crop */}
        <Plant x={90} y={225} />
        <Plant x={147} y={240} scale={1.15} />
        <Plant x={204} y={225} />
        <Plant x={336} y={225} wilted />
        <Plant x={393} y={240} scale={1.15} wilted />
        <Plant x={450} y={225} wilted />
        <Plant x={590} y={230} scale={0.9} />
        <Plant x={646} y={242} />
        <Plant x={702} y={230} scale={0.9} />

        {/* Zone C leaf-scan station icon */}
        <g transform="translate(646 165)">
          <rect x={-34} y={-6} width={68} height={10} rx={3} fill="#1f2937" stroke="#94a3b8" strokeWidth={1.5} />
          <line x1={-26} y1={4} x2={-26} y2={18} stroke="#94a3b8" strokeWidth={2} />
          <line x1={26} y1={4} x2={26} y2={18} stroke="#94a3b8" strokeWidth={2} />
          <ellipse cx={0} cy={-16} rx={10} ry={6} fill="#4ade80" transform="rotate(-24)" />
          <circle cx={12} cy={-20} r={11} fill="none" stroke="#38bdf8" strokeWidth={2.5} />
          <line x1={20} y1={-12} x2={30} y2={-2} stroke="#38bdf8" strokeWidth={3} strokeLinecap="round" />
          <text y={32} textAnchor="middle" fontSize={10} fill="#bae6fd" fontWeight={700}>
            leaf-scan station
          </text>
        </g>

        {/* ===== Drip pipes (tank → each zone) ===== */}
        <g fill="none" strokeLinecap="round">
          <line x1={132} y1={330} x2={740} y2={330} stroke="#475569" strokeWidth={7} />
          <line x1={147} y1={330} x2={147} y2={150} stroke="#475569" strokeWidth={5} />
          <line x1={393} y1={330} x2={393} y2={150} stroke="#475569" strokeWidth={5} />
          <line x1={646} y1={330} x2={646} y2={150} stroke="#475569" strokeWidth={5} />
          {/* emitters */}
          {[170, 210, 250].map((y) => (
            <g key={y}>
              <circle cx={147} cy={y} r={3.5} fill={running ? "#38bdf8" : "#1e293b"} stroke="#7dd3fc" strokeWidth={1} />
              <circle cx={393} cy={y} r={3.5} fill={running ? "#38bdf8" : "#1e293b"} stroke="#7dd3fc" strokeWidth={1} />
              <circle cx={646} cy={y} r={3.5} fill={running ? "#38bdf8" : "#1e293b"} stroke="#7dd3fc" strokeWidth={1} />
            </g>
          ))}
        </g>

        {/* Animated water dots when pump is running */}
        {running && (
          <g fill="#38bdf8">
            <circle r={4.5}>
              <animateMotion dur="1.8s" repeatCount="indefinite" path="M132,330 H740" />
            </circle>
            <circle r={4.5}>
              <animateMotion dur="1.8s" begin="-0.6s" repeatCount="indefinite" path="M132,330 H740" />
            </circle>
            <circle r={4.5}>
              <animateMotion dur="1.8s" begin="-1.2s" repeatCount="indefinite" path="M132,330 H740" />
            </circle>
            <circle r={4}>
              <animateMotion dur="1.2s" repeatCount="indefinite" path="M147,330 V150" />
            </circle>
            <circle r={4}>
              <animateMotion dur="1.2s" repeatCount="indefinite" path="M393,330 V150" />
            </circle>
            <circle r={4}>
              <animateMotion dur="1.2s" begin="-0.6s" repeatCount="indefinite" path="M393,330 V150" />
            </circle>
            <circle r={4}>
              <animateMotion dur="1.2s" repeatCount="indefinite" path="M646,330 V150" />
            </circle>
          </g>
        )}

        {/* Sprinkler droplets in watered zones (A + B) */}
        {running && (
          <g fill="#7dd3fc">
            {[0, 1, 2].map((i) => (
              <g key={`a${i}`}>
                <circle cx={120 + i * 28} cy={212} r={2.6}>
                  <animate attributeName="cy" values="206;232" dur="0.7s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.1" dur="0.7s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                </circle>
              </g>
            ))}
            {[0, 1, 2].map((i) => (
              <g key={`b${i}`}>
                <circle cx={366 + i * 28} cy={212} r={2.6}>
                  <animate attributeName="cy" values="206;232" dur="0.7s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.1" dur="0.7s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                </circle>
              </g>
            ))}
          </g>
        )}

        {/* ===== Zone D: utilities strip ===== */}
        <rect
          x={28}
          y={300}
          width={744}
          height={106}
          rx={10}
          fill="#0b1220"
          stroke="rgba(56,189,248,0.4)"
          strokeWidth={1.5}
        />
        <text x={44} y={318} fill="#7dd3fc" fontSize={11} fontWeight={800}>
          ZONE D · UTILITIES
        </text>

        {/* Water tank cylinder with animated fill */}
        <g>
          <rect x={52} y={336} width={64} height={56} rx={8} fill="#0f172a" stroke="#38bdf8" strokeWidth={2} />
          <rect
            x={56}
            y={waterY}
            width={56}
            height={waterH}
            rx={5}
            fill="url(#twin-tank-water)"
            style={{ transition: "y 0.8s ease, height 0.8s ease" }}
          />
          <ellipse cx={84} cy={336} rx={32} ry={7} fill="#1e293b" stroke="#38bdf8" strokeWidth={2} />
          <text x={84} y={404} textAnchor="middle" fontSize={10.5} fill="#bae6fd" fontWeight={700}>
            Tank {tankPct.toFixed(0)}%
          </text>
        </g>

        {/* Pump icon */}
        <g>
          <rect
            x={150}
            y={344}
            width={64}
            height={38}
            rx={9}
            fill={running ? "#0369a1" : "#1f2937"}
            stroke={running ? "#38bdf8" : "#475569"}
            strokeWidth={2}
            style={{ transition: "fill 0.4s ease" }}
          />
          <circle cx={182} cy={363} r={10} fill="none" stroke="#e2e8f0" strokeWidth={2} />
          {running ? (
            <g stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round">
              <line x1={182} y1={363} x2={182} y2={355}>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`0 182 363`}
                  to={`360 182 363`}
                  dur="0.9s"
                  repeatCount="indefinite"
                />
              </line>
              <line x1={174} y1={363} x2={190} y2={363} stroke="#7dd3fc">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`0 182 363`}
                  to={`360 182 363`}
                  dur="0.9s"
                  repeatCount="indefinite"
                />
              </line>
            </g>
          ) : (
            <line x1={174} y1={363} x2={190} y2={363} stroke="#64748b" strokeWidth={2} strokeLinecap="round" />
          )}
          <text x={182} y={404} textAnchor="middle" fontSize={10.5} fill={running ? "#7dd3fc" : "#94a3b8"} fontWeight={700}>
            Pump {running ? "ON" : "OFF"}
          </text>
        </g>

        {/* ESP32 hub with antenna waves */}
        <g>
          <rect x={250} y={344} width={64} height={38} rx={7} fill="#052e16" stroke="#22c55e" strokeWidth={2} />
          <text x={282} y={367} textAnchor="middle" fontSize={11} fill="#4ade80" fontWeight={800}>
            ESP32
          </text>
          <line x1={282} y1={344} x2={282} y2={330} stroke="#4ade80" strokeWidth={2.5} />
          <circle cx={282} cy={330} r={2.5} fill="#4ade80" />
          {[0, 1].map((i) => (
            <circle key={i} cx={282} cy={330} r={5} fill="none" stroke="#4ade80" strokeWidth={1.5}>
              <animate attributeName="r" values="5;15" dur="1.6s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0" dur="1.6s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <text x={282} y={404} textAnchor="middle" fontSize={10.5} fill="#4ade80" fontWeight={700}>
            Hub · live
          </text>
        </g>

        {/* Pipe legend note inside Zone D */}
        <g fontSize={10.5} fill="#94a3b8">
          <line x1={350} y1={352} x2={392} y2={352} stroke="#475569" strokeWidth={5} strokeLinecap="round" />
          <text x={400} y={356}>drip line</text>
          <circle cx={356} cy={372} r={4} fill={running ? "#38bdf8" : "#1e293b"} stroke="#7dd3fc" />
          <text x={400} y={376}>{running ? "water flowing" : "pipe idle"}</text>
        </g>

        {/* Plot scale note */}
        <text x={756} y={400} textAnchor="end" fontSize={10} fill="#64748b">
          scale ≈ 3ft × 2ft
        </text>

        {/* ===== Camera mast (pan rotates, tilt sets cone) ===== */}
        <g>
          <line x1={camX} y1={92} x2={camX} y2={camY} stroke="#64748b" strokeWidth={4} strokeLinecap="round" />
          <rect x={camX - 12} y={88} width={24} height={8} rx={2} fill="#334155" />
          <g
            style={{
              transform: `rotate(${panAngle - 90}deg)`,
              transformOrigin: `${camX}px ${camY}px`,
              transition: "transform 0.6s ease",
            }}
          >
            <polygon
              points={`${camX},${camY} ${camX - coneHalf},${camY + coneLen} ${camX + coneHalf},${camY + coneLen}`}
              fill="#fde047"
              opacity={0.14}
            />
            <rect x={camX - 14} y={camY - 8} width={28} height={15} rx={5} fill="#e2e8f0" stroke="#0f172a" strokeWidth={1.5} />
            <circle cx={camX} cy={camY} r={4.5} fill="#0ea5e9" stroke="#0f172a" strokeWidth={1.5} />
            <line x1={camX} y1={camY} x2={camX} y2={camY + coneLen} stroke="#fde047" strokeWidth={2} strokeDasharray="5 4" />
          </g>
          <g fontSize={10} fontWeight={800}>
            <rect x={camX + 20} y={camY - 14} width={118} height={30} rx={7} fill="#0f172a" stroke="#fde047" strokeWidth={1.2} opacity={0.95} />
            <text x={camX + 79} y={camY - 1} textAnchor="middle" fill="#fde047">
              CAM {Math.round(panAngle)}°
            </text>
          </g>
        </g>

        {/* Tap hint */}
        <text x={400} y={438} textAnchor="middle" fontSize={11.5} fill="#64748b">
          Tap a zone (A / B / C) for live details, irrigation &amp; camera actions
        </text>
      </svg>
    </div>
  );
}

export function zoneStatusTone(status: Zone["status"]): "good" | "warn" | "bad" {
  return status === "healthy" ? "good" : status === "warning" ? "warn" : "bad";
}

export function zoneRowClass(status: Zone["status"]): string {
  return cn(
    status === "healthy" && "border-emerald-500/30",
    status === "warning" && "border-amber-500/40",
    status === "critical" && "border-red-500/40",
  );
}
