"use client";

import type { LeafSampleId } from "@/lib/ai-engine";

/* ------------------------------------------------------------------ */
/* Inline SVG "leaf photos" — 5 gallery samples, no assets needed        */
/* ------------------------------------------------------------------ */

function LeafFrame({
  id,
  body,
  midrib,
  children,
}: {
  id: string;
  body: string;
  midrib: string;
  children?: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-hidden>
      <defs>
        <radialGradient id={id} cx="42%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.28} />
          <stop offset="45%" stopColor={body} />
          <stop offset="100%" stopColor={body} stopOpacity={0.55} />
        </radialGradient>
      </defs>
      {/* backdrop */}
      <rect x={0} y={0} width={200} height={200} fill="#0b120d" />
      <circle cx={100} cy={100} r={86} fill="#101a12" />
      {/* leaf body */}
      <path
        d="M100 12 C 152 55, 162 125, 100 188 C 38 125, 48 55, 100 12 Z"
        fill={`url(#${id})`}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={2}
      />
      {/* veins */}
      <g stroke={midrib} strokeWidth={2} opacity={0.8} strokeLinecap="round">
        <line x1={100} y1={22} x2={100} y2={180} />
        <line x1={100} y1={55} x2={128} y2={78} />
        <line x1={100} y1={55} x2={72} y2={78} />
        <line x1={100} y1={92} x2={134} y2={112} />
        <line x1={100} y1={92} x2={66} y2={112} />
        <line x1={100} y1={128} x2={128} y2={144} />
        <line x1={100} y1={128} x2={72} y2={144} />
      </g>
      {children}
      {/* stem */}
      <line x1={100} y1={188} x2={100} y2={198} stroke="#4a3419" strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

export function HealthyLeaf() {
  return <LeafFrame id="leaf-hg" body="#22c55e" midrib="#14532d" />;
}

export function SpotLeaf() {
  return (
    <LeafFrame id="leaf-sp" body="#2fae56" midrib="#14532d">
      <g>
        <circle cx={82} cy={70} r={11} fill="#78350f" stroke="#451a03" strokeWidth={2.5} />
        <circle cx={82} cy={70} r={4} fill="#451a03" />
        <circle cx={120} cy={105} r={13} fill="#78350f" stroke="#451a03" strokeWidth={2.5} />
        <circle cx={120} cy={105} r={5} fill="#451a03" />
        <circle cx={92} cy={140} r={9} fill="#92400e" stroke="#451a03" strokeWidth={2.5} />
        <circle cx={126} cy={62} r={7} fill="#92400e" stroke="#451a03" strokeWidth={2} />
      </g>
    </LeafFrame>
  );
}

export function RustLeaf() {
  return (
    <LeafFrame id="leaf-ru" body="#35a854" midrib="#14532d">
      <g opacity={0.92}>
        <ellipse cx={78} cy={80} rx={16} ry={11} fill="#ea580c" transform="rotate(-18 78 80)" />
        <ellipse cx={78} cy={80} rx={7} ry={4.5} fill="#9a3412" transform="rotate(-18 78 80)" />
        <ellipse cx={122} cy={118} rx={19} ry={12} fill="#f97316" transform="rotate(14 122 118)" />
        <ellipse cx={122} cy={118} rx={8} ry={5} fill="#9a3412" transform="rotate(14 122 118)" />
        <ellipse cx={96} cy={150} rx={12} ry={8} fill="#ea580c" />
        <circle cx={118} cy={60} r={6} fill="#fdba74" />
        <circle cx={70} cy={128} r={5} fill="#fdba74" />
      </g>
    </LeafFrame>
  );
}

export function NutrientLeaf() {
  return (
    <LeafFrame id="leaf-nu" body="#eab308" midrib="#854d0e">
      <g opacity={0.85}>
        <ellipse cx={80} cy={75} rx={14} ry={20} fill="#fef08a" />
        <ellipse cx={122} cy={125} rx={13} ry={22} fill="#fde047" />
        <path d="M100 12 C 120 60, 128 120, 100 188 C 92 130, 90 60, 100 12 Z" fill="#4ade80" opacity={0.35} />
      </g>
    </LeafFrame>
  );
}

export function AphidLeaf() {
  return (
    <LeafFrame id="leaf-ap" body="#2ca653" midrib="#14532d">
      <g fill="#1c1917">
        <circle cx={88} cy={62} r={2.6} />
        <circle cx={94} cy={66} r={2.2} />
        <circle cx={84} cy={70} r={2.4} />
        <circle cx={112} cy={100} r={2.6} />
        <circle cx={118} cy={104} r={2.2} />
        <circle cx={108} cy={108} r={2.4} />
        <circle cx={114} cy={110} r={1.8} />
        <circle cx={92} cy={132} r={2.6} />
        <circle cx={98} cy={136} r={2.2} />
        <circle cx={86} cy={138} r={1.9} />
        <circle cx={124} cy={76} r={2.2} />
        <circle cx={76} cy={108} r={2} />
      </g>
      <g fill="none" stroke="#a8a29e" strokeWidth={1} opacity={0.7}>
        <circle cx={88} cy={62} r={4.5} />
        <circle cx={112} cy={100} r={4.5} />
        <circle cx={92} cy={132} r={4.5} />
      </g>
    </LeafFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery metadata                                                     */
/* ------------------------------------------------------------------ */

export interface LeafSampleMeta {
  id: LeafSampleId;
  name: string;
  hint: string;
  /** thumbnail / history dot color */
  dot: string;
  Component: () => React.JSX.Element;
}

export const LEAF_SAMPLES: LeafSampleMeta[] = [
  { id: "healthy", name: "Healthy leaf", hint: "Deep green", dot: "#22c55e", Component: HealthyLeaf },
  { id: "leaf-spot", name: "Leaf spot", hint: "Brown rings", dot: "#a16207", Component: SpotLeaf },
  { id: "rust", name: "Rust", hint: "Orange patches", dot: "#ea580c", Component: RustLeaf },
  { id: "nutrient", name: "Yellow leaf", hint: "Nutrient gap", dot: "#eab308", Component: NutrientLeaf },
  { id: "aphids", name: "Aphids", hint: "Tiny black dots", dot: "#a855f7", Component: AphidLeaf },
];

export function sampleMeta(id: string | null | undefined): LeafSampleMeta {
  return LEAF_SAMPLES.find((s) => s.id === id) ?? LEAF_SAMPLES[0];
}
