"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  Shield,
  Cpu,
  Droplets,
  Wind,
  CloudRain,
  Flame,
  Plus,
  X,
  AlertTriangle,
  TrendingUp,
  Quote,
} from "lucide-react";
import {
  FloatingNav,
  ParticlesField,
  MetaBar,
  Eyebrow,
  ChapterLabel,
  WordReveal,
  StampBox,
  RevealParagraph,
  Hairline,
  GhostChip,
  CreamButton,
} from "@/components/editorial";
import { logAnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

/* --------------------------------------------------------------------------
   SIMULATOR CALCULATOR LOGIC
   Baseline: 70% over-irrigation in conventional Indian flood practices
   Pump discharge: ~2,400 L / hour per acre
   -------------------------------------------------------------------------- */
function computeFarmLedger(acres: number, hoursPerDay: number) {
  // Baseline liters pumped per day
  const litersPerDay = acres * hoursPerDay * 2400;
  // 70% is bleed/over-irrigation
  const dailyBleedLiters = litersPerDay * 0.7;
  const monthlyBleedLiters = Math.round(dailyBleedLiters * 30);

  // Financial rot: electricity/diesel + nutrient leaching + fungal dampening losses (~₹0.045 / L wasted)
  const monthlyLossRupees = Math.round(monthlyBleedLiters * 0.045);
  const annualLossRupees = monthlyLossRupees * 12;

  // 10-Year compounding reclaimed wealth at 1.9x compound yield multiplier
  const tenYearReclaimedWealth = Math.round(annualLossRupees * 10 * 1.9);

  return {
    monthlyBleedLiters,
    annualLossRupees,
    tenYearReclaimedWealth,
    dailyBleedLiters: Math.round(dailyBleedLiters),
  };
}

export default function MarketingLandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const emailInputId = useId();

  // Navigation Links
  const navLinks = useMemo(
    () => [
      { label: "Overview", href: "#overview" },
      { label: "Field Deck", href: "#field-deck" },
      { label: "Crop Ledger", href: "#crop-ledger" },
      { label: "Agent Garden", href: "#agent-garden" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Farm Studio", href: "#farm-studio" },
    ],
    [],
  );

  // Date formatted for header MetaBar
  const [todayDate] = useState(() => {
    try {
      const now = new Date();
      const d = now.getDate();
      const m = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
      const y = now.getFullYear();
      return `${d} ${m} ${y}`;
    } catch {
      return "26 SEP 2026";
    }
  });

  // Step 01: Live Sensor Telemetry ticking
  const [soilMoisture, setSoilMoisture] = useState(64.0);
  const [dhtTemp, setDhtTemp] = useState(31.2);
  const [mqAqi, setMqAqi] = useState(88);

  useEffect(() => {
    const interval = setInterval(() => {
      setSoilMoisture((prev) => {
        const delta = (Math.random() - 0.5) * 0.4;
        return Number(Math.max(62, Math.min(66, prev + delta)).toFixed(1));
      });
      setDhtTemp((prev) => {
        const delta = (Math.random() - 0.5) * 0.2;
        return Number(Math.max(30.5, Math.min(32.0, prev + delta)).toFixed(1));
      });
      setMqAqi((prev) => {
        const delta = Math.floor((Math.random() - 0.5) * 3);
        return Math.max(84, Math.min(92, prev + delta));
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Chapter 04: Simulator State
  const [farmSize, setFarmSize] = useState(2.5); // acres
  const [irrigationHours, setIrrigationHours] = useState(4); // hours/day

  const computedMetrics = useMemo(() => {
    return computeFarmLedger(farmSize, irrigationHours);
  }, [farmSize, irrigationHours]);

  // Chapter 08: Live Queue Ticker (increments +1 every 4-9s)
  const [queueCount, setQueueCount] = useState(1475);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 5000) + 4000; // 4-9s
      timer = setTimeout(() => {
        setQueueCount((q) => q + 1);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timer);
  }, []);

  // Chapter 08: Email Request submission
  const [email, setEmail] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setRequestSubmitted(true);
    logAnalyticsEvent("queue_signup", { email });
  };

  // Chapter 09: FAQ Open/Close state
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true, // first open by default
  });

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <ErrorBoundary name="MarketingLandingPage">
      <div className="relative min-h-screen w-full bg-[var(--bg)] text-[var(--ink)] overflow-x-hidden selection:bg-[var(--terra-soft)] selection:text-[var(--ink)]">
      {/* Floating Navigation */}
      <FloatingNav
        logoText="KrishiNethra"
        logoHref="#overview"
        links={navLinks}
        ctaLabel="Try KrishiNethra AI ↗"
        ctaHref="/app/dashboard"
        onCtaClick={() => logAnalyticsEvent("try_krishinethra", { source: "floating_nav" })}
      />

      {/* ====================================================================
          HERO (100vh)
          ==================================================================== */}
      <section
        id="overview"
        className="relative min-h-screen flex flex-col justify-between pt-24 sm:pt-28 pb-4 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto overflow-hidden select-none"
      >
        {/* Background Particles Field (6 floating outlines + 3 filled squares) */}
        <ParticlesField />

        {/* Radial Moss Glow in Hero Background */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_40%,rgba(95,139,106,0.18)_0%,transparent_65%)]"
          aria-hidden="true"
        />

        {/* Hero Top Content */}
        <div className="relative z-10 flex flex-col gap-6 pt-6 sm:pt-10">
          {/* Eyebrow */}
          <Eyebrow
            dot
            color="moss"
            label="A PRECISION-AGRICULTURE INTERVENTION"
            className="text-xs sm:text-[11px]"
          />

          {/* 96px Display Headline */}
          <h1 className="font-editorial-display text-5xl sm:text-7xl md:text-8xl lg:text-[96px] font-extrabold tracking-[-0.03em] leading-[0.92] text-[var(--ink)]">
            KrishiNethra
          </h1>

          {/* 32px Italic Subline */}
          <p className="font-editorial-display-italic text-2xl sm:text-3xl md:text-[32px] tracking-[-0.02em] leading-snug text-[var(--ink)] max-w-3xl">
            Stop the{" "}
            <span className="text-[var(--terra)] font-editorial-display-italic italic">
              guesswork
            </span>
            . Start the growth.
          </p>

          {/* CTA & Status Chip Row */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <CreamButton
              label="Try KrishiNethra AI ↘"
              arrow={false}
              href="/app/dashboard"
              onClick={() => logAnalyticsEvent("try_krishinethra", { source: "hero" })}
              className="py-3 px-6 text-xs sm:text-sm font-bold shadow-[3px_3px_0_var(--terra)]"
            />
            <GhostChip
              icon={<Shield className="w-3.5 h-3.5 text-[var(--terra)]" />}
              label="ON-DEVICE EDGE IRRIGATION ENGINE"
              className="py-2 px-3 text-[10px] sm:text-[11px] border-[var(--line)] bg-[var(--panel)]"
            />
          </div>
        </div>

        {/* Hero MetaBar at bottom of 100vh viewport */}
        <div className="relative z-10 pt-12 pb-2">
          <MetaBar
            items={[
              `${todayDate} • AHMEDABAD, IN • SYSTEM VER 4.0.0`,
            ]}
            scrollText="SCROLL TO EXPLORE"
          />
        </div>
      </section>

      {/* Main Narrative Container */}
      <main className="relative z-10 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto flex flex-col gap-20 sm:gap-28 md:gap-32 py-16">
        {/* ====================================================================
            CHAPTER 01 // THE INVISIBLE THIRST
            ==================================================================== */}
        <section id="field-deck" className="flex flex-col gap-8 scroll-mt-24">
          <ChapterLabel
            n={1}
            title="THE INVISIBLE THIRST"
            color="terra"
          />

          {/* RevealParagraph (big 28px) */}
          <RevealParagraph
            className="text-xl sm:text-2xl md:text-[28px] !leading-relaxed max-w-5xl text-[var(--ink)]"
            text={`Every day, Indian farms pour 70% more water than crops need.
Flood-irrigation guesses, rain-blind schedules and undetected disease drain ₹90,000 crore from harvests each year — silently, beneath the soil line.
KrishiNethra exists to halt this entropy: edge sensors audit the field locally, an on-device agent decides every litre, and every reclaimed drop compounds into yield.
Stop watering guesses. Start growing data.`}
          />

          {/* Footer Meta Row */}
          <div className="mt-4 border-y border-[var(--line)] py-3 px-4 flex flex-wrap items-center justify-between gap-3 font-editorial-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-2)] bg-[var(--panel)]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--terra)] shrink-0" aria-hidden="true" />
              <span>ESTIMATED ANNUAL BLEED: 70% OF IRRIGATION WATER</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--moss)]">
              <span className="w-2 h-2 rounded-full bg-[var(--moss)] shadow-[0_0_8px_var(--moss)] animate-pulse shrink-0" />
              <span>EDGE AGENT ACTIVE</span>
            </div>
          </div>
        </section>

        <Hairline />

        {/* ====================================================================
            CHAPTER 02 // THE SILENT HARVEST TAX
            ==================================================================== */}
        <section id="crop-ledger" className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 scroll-mt-24">
          {/* Sticky Left Column */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 self-start flex flex-col gap-6">
            <ChapterLabel n={2} title="THE SILENT HARVEST TAX" color="terra" />

            <div className="relative">
              {/* WordReveal headline 64px */}
              <WordReveal
                as="h2"
                heading="You are bleeding water in your sleep."
                className="text-3xl sm:text-5xl lg:text-[64px] font-extrabold !leading-[1.05] text-[var(--ink)]"
              />

              {/* Hand-drawn terra underline SVG stroke (draws in on viewport reveal) */}
              <div className="mt-2 w-full max-w-md h-6 overflow-visible" aria-hidden="true">
                <svg
                  viewBox="0 0 420 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <motion.path
                    d="M3 18C85 8 210 22 415 6C340 18 180 26 45 22"
                    stroke="var(--terra)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 1 : 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: shouldReduceMotion ? 0.01 : 1.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
              </div>
            </div>

            <p className="font-editorial-body text-sm sm:text-base text-[var(--ink-2)] leading-relaxed mt-2">
              Uncalibrated flood cycles leach soluble nitrogen past root depth,
              suffocate microbial respiration, and induce fungal damping before canopy stress
              appears. KrishiNethra reverses this structural decay drop by calibrated drop.
            </p>
          </div>

          {/* Right Column Numbered Items with Hairlines */}
          <div className="lg:col-span-7 flex flex-col divide-y divide-[var(--line)]">
            {/* Item 01 */}
            <article className="py-7 first:pt-0 flex flex-col gap-2">
              <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--moss)] font-semibold">
                01 // RUNOFF ENTROPY
              </span>
              <h3 className="font-editorial-display text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight">
                SILENT OVER-IRRIGATION
              </h3>
              <p className="font-editorial-body text-sm sm:text-[15px] text-[var(--ink-2)] leading-relaxed mt-1">
                Flooding root zones beyond soil saturation capacity suffocates aerobic respiration
                in the rhizosphere. It washes away topsoil nitrates and leaches ₹14,000/acre in wasted
                fertilizer directly into deep aquifers before plants can metabolize it.
              </p>
            </article>

            {/* Item 02 */}
            <article className="py-7 flex flex-col gap-2">
              <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--moss)] font-semibold">
                02 // PATHOGEN INCUBATION
              </span>
              <h3 className="font-editorial-display text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight">
                UNDETECTED LEAF DECAY
              </h3>
              <p className="font-editorial-body text-sm sm:text-[15px] text-[var(--ink-2)] leading-relaxed mt-1">
                Early fungal blight and yellow mosaic virus incubate undetected under excessive canopy
                humidity and standing water. By the time symptoms are visible from the bund, harvest damage
                has compounded past reversible thresholds.
              </p>
            </article>

            {/* Item 03 */}
            <article className="py-7 flex flex-col gap-2">
              <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--moss)] font-semibold">
                03 // CLIMATE BLINDSPOT
              </span>
              <h3 className="font-editorial-display text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight">
                RAIN-BLIND SCHEDULING
              </h3>
              <p className="font-editorial-body text-sm sm:text-[15px] text-[var(--ink-2)] leading-relaxed mt-1">
                Running electric tube-wells hours before an unseasonal cloudburst saturates the field
                entirely, drowning tender seedlings and burning expensive grid electricity units that could
                have been preserved by local barometric and radar checks.
              </p>
            </article>

            {/* Item 04 */}
            <article className="py-7 last:pb-0 flex flex-col gap-2">
              <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--moss)] font-semibold">
                04 // HUMAN LATENCY
              </span>
              <h3 className="font-editorial-display text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight">
                MANUAL MONITORING TAX
              </h3>
              <p className="font-editorial-body text-sm sm:text-[15px] text-[var(--ink-2)] leading-relaxed mt-1">
                Farms dependent on twice-daily manual soil inspections react hours too late to scorching
                midday heat fluxes. By the time the pump is manually engaged, moisture deficits have already
                triggered permanent yield depression and blossom drop.
              </p>
            </article>
          </div>
        </section>

        {/* ====================================================================
            QUOTE SECTION
            ==================================================================== */}
        <section className="relative py-14 sm:py-20 border-y border-[var(--line)] bg-[var(--panel)] px-6 sm:px-12 flex flex-col items-center justify-center overflow-hidden">
          {/* Giant Terra " Marks */}
          <span
            className="absolute top-2 left-4 sm:left-8 font-serif text-8xl sm:text-9xl text-[var(--terra)] opacity-25 select-none leading-none pointer-events-none"
            aria-hidden="true"
          >
            “
          </span>
          <span
            className="absolute bottom-[-20px] right-4 sm:right-8 font-serif text-8xl sm:text-9xl text-[var(--terra)] opacity-25 select-none leading-none pointer-events-none"
            aria-hidden="true"
          >
            ”
          </span>

          <blockquote className="relative z-10 max-w-4xl text-center">
            <p className="font-editorial-display-italic text-2xl sm:text-4xl md:text-[56px] text-[var(--ink)] leading-[1.12] tracking-[-0.02em]">
              “Every litre over-watered is a rupee borrowed from tomorrow&apos;s harvest.”
            </p>
            <cite className="font-editorial-mono text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[var(--moss)] mt-6 block not-italic">
              — KRISHINETRA FIELD MANIFESTO // PRINCIPLE 04
            </cite>
          </blockquote>
        </section>

        {/* ====================================================================
            CHAPTER 03 // THE METHOD (Stacked Pinned Cards)
            ==================================================================== */}
        <section id="agent-garden" className="flex flex-col gap-10 scroll-mt-24">
          <div className="flex flex-col gap-2">
            <ChapterLabel n={3} title="THE METHOD" color="moss" />
            <h2 className="font-editorial-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)]">
              Closed-Loop Agronomic Autonomy
            </h2>
            <p className="font-editorial-body text-sm sm:text-base text-[var(--ink-2)] max-w-2xl">
              Three synchronized edge stages audit, resolve, and compound hydration value
              without external server round-trips.
            </p>
          </div>

          {/* Stacked Pinned Cards Container */}
          <div className="relative flex flex-col gap-8 pb-12">
            {/* STEP 01 CARD (sticky top-20 / top-24) */}
            <div className="sticky top-20 sm:top-24 z-10 border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8 md:p-10 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Step Details */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <GhostChip
                      icon={<ShieldCheck className="w-3.5 h-3.5 text-[var(--terra)]" />}
                      label="PRIVACY FIRST • ZERO CLOUD DEPENDENCY"
                      active
                    />
                  </div>

                  <div>
                    <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--terra)] font-bold">
                      STEP 01 // INTAKE
                    </span>
                    <h3 className="font-editorial-display text-4xl sm:text-5xl font-extrabold text-[var(--ink)] tracking-tight">
                      SENSE
                    </h3>
                    <p className="font-editorial-mono text-xs uppercase tracking-[0.12em] text-[var(--ink-2)] mt-1">
                      Edge Sensor Telemetry
                    </p>
                  </div>

                  <p className="font-editorial-body text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
                    Four edge sensors sample root-zone dielectric permittivity, canopy dry-bulb
                    flux, atmospheric VOC levels, and precipitation resistance in millisecond
                    pulses directly at the soil line.
                  </p>
                </div>

                {/* Right Inner Panel: Live Field Readings */}
                <div className="lg:col-span-5 border border-[var(--line)] bg-[var(--bg)] p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5 font-editorial-mono text-[11px] uppercase tracking-[0.12em]">
                    <span className="text-[var(--ink)] font-bold">LIVE FIELD READINGS</span>
                    <span className="text-[var(--terra)] font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--terra)] animate-ping" />
                      4 SENSORS ONLINE
                    </span>
                  </div>

                  <div className="flex flex-col divide-y divide-[var(--line)]">
                    {/* Soil Moisture */}
                    <div className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[2px] bg-[var(--terra-soft)] border border-[var(--terra)] flex items-center justify-center text-[var(--terra)]">
                          <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--ink)]">Soil Moisture</p>
                          <p className="text-[10px] text-[var(--ink-2)] font-editorial-mono">ZONE A ROOT PROBE</p>
                        </div>
                      </div>
                      <span className="font-editorial-mono text-sm font-bold text-[var(--ink)] tabular-nums">
                        {soilMoisture}%
                      </span>
                    </div>

                    {/* DHT22 Climate */}
                    <div className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[2px] bg-[var(--moss-soft)] border border-[var(--moss)] flex items-center justify-center text-[var(--moss)]">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--ink)]">DHT22</p>
                          <p className="text-[10px] text-[var(--ink-2)] font-editorial-mono">CANOPY AIR FLUX</p>
                        </div>
                      </div>
                      <span className="font-editorial-mono text-sm font-bold text-[var(--ink)] tabular-nums">
                        {dhtTemp}°C
                      </span>
                    </div>

                    {/* MQ-135 */}
                    <div className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[2px] bg-[var(--panel-2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)]">
                          <Wind className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--ink)]">MQ-135</p>
                          <p className="text-[10px] text-[var(--ink-2)] font-editorial-mono">CO2 / NH3 / NOX</p>
                        </div>
                      </div>
                      <span className="font-editorial-mono text-sm font-bold text-[var(--ink)] tabular-nums">
                        AQI {mqAqi}
                      </span>
                    </div>

                    {/* Rain Plate */}
                    <div className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[2px] bg-[var(--panel-2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)]">
                          <CloudRain className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--ink)]">Rain Plate</p>
                          <p className="text-[10px] text-[var(--ink-2)] font-editorial-mono">SKY PRECIPITATION</p>
                        </div>
                      </div>
                      <span className="font-editorial-mono text-sm font-bold text-[var(--moss)]">
                        NO
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 02 CARD (sticky top-28) */}
            <div className="sticky top-24 sm:top-28 z-20 border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8 md:p-10 shadow-[0_-8px_32px_rgba(0,0,0,0.7)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Step Details */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <GhostChip
                      icon={<Cpu className="w-3.5 h-3.5 text-[var(--terra)]" />}
                      label="DETERMINISTIC INFERENCE"
                    />
                  </div>

                  <div>
                    <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--terra)] font-bold">
                      STEP 02 // REASONING
                    </span>
                    <h3 className="font-editorial-display text-4xl sm:text-5xl font-extrabold text-[var(--ink)] tracking-tight">
                      DECIDE
                    </h3>
                    <p className="font-editorial-mono text-xs uppercase tracking-[0.12em] text-[var(--terra)] mt-1">
                      EXPLAINABLE AGENT LOGIC
                    </p>
                  </div>

                  <p className="font-editorial-body text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
                    The on-device agent compares real-time root saturation against diurnal
                    evapotranspiration curves. When rain is sensed or moisture crosses safety
                    ceilings, hardware locks engage to halt irrigation instantly.
                  </p>
                </div>

                {/* Right Inner Panel: Agent Decisions */}
                <div className="lg:col-span-5 border border-[var(--line)] bg-[var(--bg)] p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5 font-editorial-mono text-[11px] uppercase tracking-[0.12em]">
                    <span className="text-[var(--ink)] font-bold">AGENT DECISIONS</span>
                    <span className="text-[var(--terra)] font-bold">2 LOCKS TODAY</span>
                  </div>

                  <div className="flex flex-col gap-3 font-editorial-mono text-xs">
                    {/* Log Row 1 with LOCKED stamp */}
                    <div className="p-3 border border-[var(--line)] bg-[var(--panel)] flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] text-[var(--ink-3)]">14:20:00 • HARVEST-BRAIN</p>
                        <p className="text-xs text-[var(--ink)] font-bold mt-0.5">
                          ZONE 1: PREDICTED RAIN 2.4MM
                        </p>
                        <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
                          SKIP IRRIGATION // PRESERVED
                        </p>
                      </div>
                      <div className="rotate-[-6deg] shrink-0 border border-[var(--terra)] px-2 py-0.5 text-[10px] font-bold text-[var(--terra)] bg-[var(--terra-soft)]">
                        LOCKED
                      </div>
                    </div>

                    {/* Log Row 2 with LOCKED stamp */}
                    <div className="p-3 border border-[var(--line)] bg-[var(--panel)] flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] text-[var(--ink-3)]">09:12:00 • HARVEST-BRAIN</p>
                        <p className="text-xs text-[var(--ink)] font-bold mt-0.5">
                          ZONE 2: MOISTURE CAP SATISFIED
                        </p>
                        <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
                          SOIL @ 68% // OVERFLOW BLOCKED
                        </p>
                      </div>
                      <div className="rotate-[-6deg] shrink-0 border border-[var(--terra)] px-2 py-0.5 text-[10px] font-bold text-[var(--terra)] bg-[var(--terra-soft)]">
                        LOCKED
                      </div>
                    </div>

                    {/* Log Row 3 */}
                    <div className="p-3 border border-[var(--line)] bg-[var(--panel)] flex items-start justify-between gap-3 opacity-75">
                      <div>
                        <p className="text-[10px] text-[var(--ink-3)]">05:30:00 • DAWN CYCLE</p>
                        <p className="text-xs text-[var(--ink)] font-bold mt-0.5">
                          ZONE 1: TRANSPIRATION PULSE
                        </p>
                        <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
                          12 MIN CYCLE // 480L DELIVERED
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[var(--moss)] uppercase border border-[var(--moss)] px-2 py-0.5 bg-[var(--moss-soft)]">
                        COMPLETED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 03 CARD (sticky top-32) - Moss Variant */}
            <div className="sticky top-28 sm:top-32 z-30 border border-[var(--moss)]/40 bg-[var(--panel)] p-6 sm:p-8 md:p-10 shadow-[0_-8px_32px_rgba(0,0,0,0.8)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Step Details */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <GhostChip
                      icon={<TrendingUp className="w-3.5 h-3.5 text-[var(--moss)]" />}
                      label="ACCRETION EFFECT"
                      active
                      className="border-[var(--moss)] text-[var(--moss)] bg-[var(--moss-soft)]"
                    />
                  </div>

                  <div>
                    <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--moss)] font-bold">
                      STEP 03 // VALUE ACCRETION
                    </span>
                    <h3 className="font-editorial-display text-4xl sm:text-5xl font-extrabold text-[var(--ink)] tracking-tight">
                      GROW
                    </h3>
                    <p className="font-editorial-mono text-xs uppercase tracking-[0.12em] text-[var(--moss)] mt-1 font-bold">
                      COMPOUNDING WATER WEALTH
                    </p>
                  </div>

                  <p className="font-editorial-body text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
                    Closed-loop precision prevents nitrate leaching and soil crusting.
                    Every cubic metre saved remains banked in the local aquifer, while
                    optimal root respiration triggers compounding vegetative vigour.
                  </p>
                </div>

                {/* Right Inner Panel: Moss Tinted Chart */}
                <div className="lg:col-span-5 border border-[var(--moss)]/40 bg-[var(--moss-soft)] p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[var(--moss)]/30 pb-2.5 font-editorial-mono text-[11px] uppercase tracking-[0.12em] text-[var(--moss)]">
                    <span className="font-bold">WATER WEALTH TRAJECTORY</span>
                    <span className="text-[var(--ink)]">100% AGENT CONTROL</span>
                  </div>

                  {/* Line Chart SVG Draw-in */}
                  <div className="h-28 w-full relative flex items-end">
                    <svg
                      viewBox="0 0 300 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-full overflow-visible"
                    >
                      {/* Grid hairlines */}
                      <line x1="0" y1="25" x2="300" y2="25" stroke="var(--line)" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="300" y2="50" stroke="var(--line)" strokeDasharray="3 3" />
                      <line x1="0" y1="75" x2="300" y2="75" stroke="var(--line)" strokeDasharray="3 3" />

                      {/* Area Fill */}
                      <path
                        d="M0 90 Q 60 80, 120 55 T 240 25 T 300 10 L 300 100 L 0 100 Z"
                        fill="rgba(95, 139, 106, 0.2)"
                      />

                      {/* Moss Stroke Path */}
                      <motion.path
                        d="M0 90 Q 60 80, 120 55 T 240 25 T 300 10"
                        stroke="var(--moss)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: shouldReduceMotion ? 0.01 : 1.4, ease: "easeOut" }}
                      />
                    </svg>
                  </div>

                  <div className="border-t border-[var(--moss)]/30 pt-3 flex items-center justify-between font-editorial-mono text-[11px] uppercase tracking-[0.12em]">
                    <span className="text-[var(--ink-2)]">RECOVERY METRIC</span>
                    <span className="text-[var(--ink)] font-bold">
                      12 L/day → 4,380 L/yr @ 100% agent control
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 03 Footer Row */}
              <div className="mt-8 pt-5 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
                <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-2)]">
                  KRISHINETRA PROTOCOL // PHASE 03
                </span>
                <CreamButton
                  label="Execute GROW ↗"
                  arrow={false}
                  href="/app/dashboard"
                  className="py-2.5 px-5"
                />
              </div>
            </div>
          </div>
        </section>

        <Hairline />

        {/* ====================================================================
            CHAPTER 04 // FIELD LEDGER SIMULATOR
            ==================================================================== */}
        <section id="how-it-works" className="flex flex-col gap-8 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <ChapterLabel n={4} title="WATER DRAIN SIMULATOR" color="terra" />
              <h2 className="font-editorial-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] mt-1">
                Calculate Your Bleed
              </h2>
            </div>
            <span className="font-editorial-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-2)]">
              WATER DRAIN SIMULATOR
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Bordered Panel: Farm Parameters */}
            <div className="lg:col-span-5 border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8 flex flex-col gap-6">
              <div className="border-b border-[var(--line)] pb-3">
                <h3 className="font-editorial-mono text-xs uppercase tracking-[0.12em] font-bold text-[var(--ink)]">
                  Farm Parameters
                </h3>
              </div>

              {/* Slider 1: Farm Size */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between font-editorial-mono text-xs">
                  <span className="text-[var(--ink-2)] uppercase tracking-wider">FARM SIZE</span>
                  <span className="text-[var(--ink)] font-bold text-sm">{farmSize.toFixed(1)} ACRES</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.5"
                  value={farmSize}
                  onChange={(e) => setFarmSize(parseFloat(e.target.value))}
                  className="editorial-slider"
                  aria-label="Farm size in acres"
                />
                <div className="flex items-center justify-between font-editorial-mono text-[10px] text-[var(--ink-3)]">
                  <span>0.5 ACRES</span>
                  <span>10.0 ACRES</span>
                </div>
              </div>

              {/* Slider 2: Irrigation Hours Per Day */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between font-editorial-mono text-xs">
                  <span className="text-[var(--ink-2)] uppercase tracking-wider">IRRIGATION HOURS/DAY</span>
                  <span className="text-[var(--ink)] font-bold text-sm">{irrigationHours} HRS/DAY</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={irrigationHours}
                  onChange={(e) => setIrrigationHours(parseInt(e.target.value, 10))}
                  className="editorial-slider"
                  aria-label="Irrigation hours per day"
                />
                <div className="flex items-center justify-between font-editorial-mono text-[10px] text-[var(--ink-3)]">
                  <span>1 HR</span>
                  <span>12 HRS</span>
                </div>
              </div>

              {/* Warning Note Box with Terra Triangle */}
              <div className="border border-[var(--terra)]/40 bg-[var(--terra-soft)] p-3.5 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-[var(--terra)] shrink-0 mt-0.5" />
                <p className="font-editorial-body text-xs text-[var(--ink)] leading-relaxed">
                  Models 70% over-irrigation baseline vs agent-controlled drip equivalence.
                </p>
              </div>
            </div>

            {/* Right Stacked Metric Rows (Bordered) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Metric 1: Monthly Bleed Water */}
              <div className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col gap-1">
                <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--terra)] font-bold">
                  MONTHLY BLEED // WATER
                </span>
                <p className="font-editorial-display text-4xl sm:text-5xl font-extrabold text-[var(--terra)] tracking-tight tabular-nums">
                  −{computedMetrics.monthlyBleedLiters.toLocaleString("en-IN")} L
                </p>
              </div>

              {/* Metric 2: Annual Rot Loss */}
              <div className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col gap-1">
                <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--terra)] font-bold">
                  ANNUAL ROT // LOSS
                </span>
                <p className="font-editorial-display text-3xl sm:text-4xl font-extrabold text-[var(--terra)] tracking-tight tabular-nums">
                  −₹{computedMetrics.annualLossRupees.toLocaleString("en-IN")}
                </p>
              </div>

              {/* Metric 3: 10-Yr Reclaimed Wealth (Moss Tinted) */}
              <div className="border border-[var(--moss)] bg-[var(--moss-soft)] p-6 flex flex-col gap-1">
                <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--moss)] font-bold">
                  10-YR RECLAIMED WEALTH // GROWTH
                </span>
                <p className="font-editorial-display text-3xl sm:text-4xl font-extrabold text-[var(--moss)] tracking-tight tabular-nums">
                  +₹{computedMetrics.tenYearReclaimedWealth.toLocaleString("en-IN")}
                </p>
              </div>

              {/* Panel: 10-Year Compounding Multiplier */}
              <div className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink)]">
                  <span>10-YEAR COMPOUNDING MULTIPLIER</span>
                  <span className="text-[var(--moss)] font-bold">MULTIPLIER: 1.9x</span>
                </div>

                {/* Animated Bars */}
                <div className="space-y-3">
                  {/* Terra Bar: Cumulative Waste */}
                  <div>
                    <div className="flex justify-between text-[11px] font-editorial-mono text-[var(--ink-2)] mb-1">
                      <span>CUMULATIVE WASTE</span>
                      <span className="text-[var(--terra)]">70% BASELINE</span>
                    </div>
                    <div className="w-full h-3 bg-[var(--bg)] border border-[var(--line)]">
                      <div
                        className="h-full bg-[var(--terra)] transition-all duration-300 ease-out"
                        style={{ width: "70%" }}
                      />
                    </div>
                  </div>

                  {/* Moss Bar: Reclaimed Water Wealth */}
                  <div>
                    <div className="flex justify-between text-[11px] font-editorial-mono text-[var(--ink-2)] mb-1">
                      <span>RECLAIMED WATER WEALTH</span>
                      <span className="text-[var(--moss)] font-bold">AGENT DRIP ACCRETION</span>
                    </div>
                    <div className="w-full h-3 bg-[var(--bg)] border border-[var(--line)]">
                      <div
                        className="h-full bg-[var(--moss)] transition-all duration-300 ease-out"
                        style={{
                          width: `${Math.min(100, Math.max(30, (farmSize / 10) * 85 + 15))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Mono + CTA */}
                <div className="border-t border-[var(--line)] pt-4 flex flex-wrap items-center justify-between gap-4">
                  <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-2)]">
                    MULTIPLIER: 1.9x
                  </span>
                  <CreamButton
                    label="Reclaim mine → →"
                    arrow={false}
                    href="/app/dashboard"
                    onClick={() =>
                      logAnalyticsEvent("reclaim_mine", {
                        farmSize,
                        irrigationHours,
                        annualLossRupees: computedMetrics.annualLossRupees,
                      })
                    }
                    className="py-2.5 px-5"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <Hairline />

        {/* ====================================================================
            CHAPTER 05 // HARDWARE MANIFEST
            ==================================================================== */}
        <section id="farm-studio" className="flex flex-col gap-8 scroll-mt-24">
          <div className="flex flex-col gap-2">
            <ChapterLabel n={5} title="SOVEREIGN EDGE SPECIFICATION" color="terra" />
            <h2 className="font-editorial-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)]">
              Hardware Manifest
            </h2>
            <p className="font-editorial-body text-sm sm:text-base text-[var(--ink-2)] max-w-2xl">
              Commercial-grade industrial sensors and dual-bus microcontrollers wired
              for hostile agricultural dust, extreme summer heat, and monsoon downpours.
            </p>
          </div>

          {/* Mono Table Rows Hairline-Separated */}
          <div className="border border-[var(--line)] bg-[var(--panel)] overflow-x-auto">
            <div className="min-w-[640px] divide-y divide-[var(--line)]">
              {/* Header */}
              <div className="grid grid-cols-12 px-6 py-3 bg-[var(--bg)] font-editorial-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)] font-bold">
                <span className="col-span-4">COMPONENT // CHIP</span>
                <span className="col-span-4">SPECIFICATION // PROTOCOL</span>
                <span className="col-span-4 text-right">ROLE IN FIELD OS</span>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-12 px-6 py-3.5 items-center font-editorial-mono text-xs">
                <span className="col-span-4 font-bold text-[var(--ink)]">ESP32-WROOM</span>
                <span className="col-span-4 text-[var(--ink-2)]">XTENSA DUAL-CORE</span>
                <span className="col-span-4 text-right text-[var(--terra)] font-semibold">EDGE CONTROLLER</span>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-12 px-6 py-3.5 items-center font-editorial-mono text-xs">
                <span className="col-span-4 font-bold text-[var(--ink)]">MQTT BRIDGE</span>
                <span className="col-span-4 text-[var(--ink-2)]">WIFI / WSS</span>
                <span className="col-span-4 text-right text-[var(--terra)] font-semibold">CLOUD TELEMETRY</span>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-12 px-6 py-3.5 items-center font-editorial-mono text-xs">
                <span className="col-span-4 font-bold text-[var(--ink)]">DHT22</span>
                <span className="col-span-4 text-[var(--ink-2)]">±0.5°C</span>
                <span className="col-span-4 text-right text-[var(--moss)] font-semibold">CLIMATE</span>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-12 px-6 py-3.5 items-center font-editorial-mono text-xs">
                <span className="col-span-4 font-bold text-[var(--ink)]">CAPACITIVE PROBE</span>
                <span className="col-span-4 text-[var(--ink-2)]">0-100%</span>
                <span className="col-span-4 text-right text-[var(--moss)] font-semibold">SOIL</span>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-12 px-6 py-3.5 items-center font-editorial-mono text-xs">
                <span className="col-span-4 font-bold text-[var(--ink)]">MQ-135</span>
                <span className="col-span-4 text-[var(--ink-2)]">CO2-NH3-NOX</span>
                <span className="col-span-4 text-right text-[var(--ink-2)] font-semibold">AIR</span>
              </div>

              {/* Row 6 */}
              <div className="grid grid-cols-12 px-6 py-3.5 items-center font-editorial-mono text-xs">
                <span className="col-span-4 font-bold text-[var(--ink)]">RAIN PLATE</span>
                <span className="col-span-4 text-[var(--ink-2)]">BOOLEAN</span>
                <span className="col-span-4 text-right text-[var(--moss)] font-semibold">SKY</span>
              </div>

              {/* Row 7 */}
              <div className="grid grid-cols-12 px-6 py-3.5 items-center font-editorial-mono text-xs">
                <span className="col-span-4 font-bold text-[var(--ink)]">2-CH RELAY</span>
                <span className="col-span-4 text-[var(--ink-2)]">10A / AC250V</span>
                <span className="col-span-4 text-right text-[var(--terra)] font-semibold">PUMP + R2 AUX</span>
              </div>

              {/* Row 8 */}
              <div className="grid grid-cols-12 px-6 py-3.5 items-center font-editorial-mono text-xs">
                <span className="col-span-4 font-bold text-[var(--ink)]">ACTIVE BUZZER</span>
                <span className="col-span-4 text-[var(--ink-2)]">GPIO / 5V</span>
                <span className="col-span-4 text-right text-[var(--ink-2)] font-semibold">FIELD ALARM</span>
              </div>
            </div>
          </div>
        </section>

        <Hairline />

        {/* ====================================================================
            CHAPTER 06 // FIELD REPORTS
            ==================================================================== */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <ChapterLabel n={6} title="PROVEN AGRONOMIC AUDITS" color="moss" />
              <h2 className="font-editorial-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] mt-1">
                Field Reports
              </h2>
            </div>
            <span className="font-editorial-mono text-xs uppercase tracking-[0.14em] text-[var(--moss)] font-bold">
              VERIFIED FARM RECOVERIES
            </span>
          </div>

          {/* 5 Tilted Postcard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {/* Postcard 1 */}
            <div
              className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col justify-between gap-6 transition-all duration-300 ease-out hover:rotate-0 hover:-translate-y-2 hover:shadow-[4px_4px_0_var(--terra)]"
              style={{ transform: "rotate(-1.8deg)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-editorial-mono text-xs font-bold text-[var(--moss)] border border-[var(--moss)] px-2 py-0.5 bg-[var(--moss-soft)]">
                  ₹21,600/YR SAVED
                </span>
                <Quote className="w-4 h-4 text-[var(--terra)]" />
              </div>
              <p className="font-editorial-display-italic text-base text-[var(--ink)] leading-snug">
                “We used to run our tube-well for 5 hours every morning blindly. KrishiNethra cut
                it down to 1 hour 45 minutes on sensor feedback. The soil holds moisture without rotting tomato roots.”
              </p>
              <div className="border-t border-[var(--line)] pt-3 flex items-center justify-between font-editorial-mono text-xs">
                <span className="font-bold text-[var(--ink)]">Ramesh Patel</span>
                <span className="text-[var(--ink-2)]">Anand, Gujarat</span>
              </div>
            </div>

            {/* Postcard 2 */}
            <div
              className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col justify-between gap-6 transition-all duration-300 ease-out hover:rotate-0 hover:-translate-y-2 hover:shadow-[4px_4px_0_var(--terra)]"
              style={{ transform: "rotate(1.5deg)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-editorial-mono text-xs font-bold text-[var(--moss)] border border-[var(--moss)] px-2 py-0.5 bg-[var(--moss-soft)]">
                  ₹34,200/YR SAVED
                </span>
                <Quote className="w-4 h-4 text-[var(--terra)]" />
              </div>
              <p className="font-editorial-display-italic text-base text-[var(--ink)] leading-snug">
                “During the unseasonal rains in October, the rain-skip lock stopped three irrigation
                cycles automatically while my neighbors flooded their wheat. Yield increased 18%.”
              </p>
              <div className="border-t border-[var(--line)] pt-3 flex items-center justify-between font-editorial-mono text-xs">
                <span className="font-bold text-[var(--ink)]">Gurpreet Singh</span>
                <span className="text-[var(--ink-2)]">Karnal, Haryana</span>
              </div>
            </div>

            {/* Postcard 3 */}
            <div
              className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col justify-between gap-6 transition-all duration-300 ease-out hover:rotate-0 hover:-translate-y-2 hover:shadow-[4px_4px_0_var(--terra)]"
              style={{ transform: "rotate(-1.2deg)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-editorial-mono text-xs font-bold text-[var(--moss)] border border-[var(--moss)] px-2 py-0.5 bg-[var(--moss-soft)]">
                  ₹18,500/YR SAVED
                </span>
                <Quote className="w-4 h-4 text-[var(--terra)]" />
              </div>
              <p className="font-editorial-display-italic text-base text-[var(--ink)] leading-snug">
                “The offline ESP32 brain runs even when grid internet drops for days. Drip solenoids
                trigger when root moisture actually hits 42%, not on a clock timer.”
              </p>
              <div className="border-t border-[var(--line)] pt-3 flex items-center justify-between font-editorial-mono text-xs">
                <span className="font-bold text-[var(--ink)]">Annasaheb Shinde</span>
                <span className="text-[var(--ink-2)]">Nashik, Maharashtra</span>
              </div>
            </div>

            {/* Postcard 4 */}
            <div
              className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col justify-between gap-6 transition-all duration-300 ease-out hover:rotate-0 hover:-translate-y-2 hover:shadow-[4px_4px_0_var(--terra)]"
              style={{ transform: "rotate(2.0deg)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-editorial-mono text-xs font-bold text-[var(--moss)] border border-[var(--moss)] px-2 py-0.5 bg-[var(--moss-soft)]">
                  ₹27,800/YR SAVED
                </span>
                <Quote className="w-4 h-4 text-[var(--terra)]" />
              </div>
              <p className="font-editorial-display-italic text-base text-[var(--ink)] leading-snug">
                “Cotton leaf decay was caught on the pan-tilt camera two weeks before yellow rust spread
                across our plot. Saved two pesticide spray cycles alone.”
              </p>
              <div className="border-t border-[var(--line)] pt-3 flex items-center justify-between font-editorial-mono text-xs">
                <span className="font-bold text-[var(--ink)]">Mahadev Gowda</span>
                <span className="text-[var(--ink-2)]">Mandya, Karnataka</span>
              </div>
            </div>

            {/* Postcard 5 */}
            <div
              className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col justify-between gap-6 transition-all duration-300 ease-out hover:rotate-0 hover:-translate-y-2 hover:shadow-[4px_4px_0_var(--terra)] md:col-span-2 lg:col-span-1"
              style={{ transform: "rotate(-2.0deg)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-editorial-mono text-xs font-bold text-[var(--moss)] border border-[var(--moss)] px-2 py-0.5 bg-[var(--moss-soft)]">
                  ₹42,000/YR SAVED
                </span>
                <Quote className="w-4 h-4 text-[var(--terra)]" />
              </div>
              <p className="font-editorial-display-italic text-base text-[var(--ink)] leading-snug">
                “Groundwater levels in our taluka dropped 40 feet in three years. KrishiNethra saved over
                5 lakh litres on our 4-acre pomegranate orchard last season.”
              </p>
              <div className="border-t border-[var(--line)] pt-3 flex items-center justify-between font-editorial-mono text-xs">
                <span className="font-bold text-[var(--ink)]">Bhikhabhai Vala</span>
                <span className="text-[var(--ink-2)]">Junagadh, Gujarat</span>
              </div>
            </div>
          </div>
        </section>

        <Hairline />

        {/* ====================================================================
            CHAPTER 07 // DISPATCHES
            ==================================================================== */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <ChapterLabel n={7} title="AGRONOMY PAPERS & MONOGRAPHS" color="terra" />
            <h2 className="font-editorial-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)]">
              Dispatches
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Terra Leaf-Vein */}
            <article className="border border-[var(--line)] bg-[var(--panel)] flex flex-col justify-between hover:border-[var(--terra)] transition-colors duration-200">
              {/* Top SVG Line-Art */}
              <div className="h-44 w-full bg-[var(--bg)] border-b border-[var(--line)] p-4 flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 160 100" fill="none" className="w-36 h-28 opacity-80">
                  <path d="M80 90 L80 15" stroke="var(--terra)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M80 75 Q110 65 130 50" stroke="var(--terra)" strokeWidth="1.5" />
                  <path d="M80 60 Q50 50 30 35" stroke="var(--terra)" strokeWidth="1.5" />
                  <path d="M80 45 Q115 35 125 20" stroke="var(--terra)" strokeWidth="1.5" />
                  <path d="M80 30 Q45 22 35 10" stroke="var(--terra)" strokeWidth="1.5" />
                  <ellipse cx="80" cy="50" rx="60" ry="40" stroke="rgba(196, 80, 58, 0.3)" strokeDasharray="3 3" />
                </svg>
                <div className="absolute bottom-2 right-3 font-editorial-mono text-[9px] text-[var(--terra)] tracking-wider">
                  FIG. 01 // VASCULAR
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4 flex-1 justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 font-editorial-mono text-[11px]">
                    <span className="text-[var(--moss)] font-bold border border-[var(--moss)] px-2 py-0.5 bg-[var(--moss-soft)]">
                      ESSAY
                    </span>
                    <span className="text-[var(--ink-2)]">OCT 14, 2026</span>
                  </div>
                  <h3 className="font-editorial-display text-lg font-bold text-[var(--ink)] leading-snug">
                    Thermodynamics of Soil Line Entropy: Why Indian Aquifers Are Vanishing
                  </h3>
                  <p className="font-editorial-body text-xs text-[var(--ink-2)] leading-relaxed mt-2">
                    Analyzing hydrological data across 1,200 semi-arid canal commands reveals that
                    68% of flood irrigation never reaches transpiration sinks, escaping into sub-crust salinity zones.
                  </p>
                </div>

                <div className="border-t border-[var(--line)] pt-3 font-editorial-mono text-[11px] text-[var(--ink)] hover:text-[var(--terra)] cursor-pointer flex items-center justify-between transition-colors">
                  <span>READ DISPATCH</span>
                  <span>↗</span>
                </div>
              </div>
            </article>

            {/* Card 2: Terra Soil-Strata */}
            <article className="border border-[var(--line)] bg-[var(--panel)] flex flex-col justify-between hover:border-[var(--terra)] transition-colors duration-200">
              {/* Top SVG Line-Art */}
              <div className="h-44 w-full bg-[var(--bg)] border-b border-[var(--line)] p-4 flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 160 100" fill="none" className="w-36 h-28 opacity-80">
                  <path d="M10 20 Q 80 15, 150 22" stroke="var(--terra)" strokeWidth="1.5" />
                  <path d="M10 40 Q 80 48, 150 38" stroke="var(--terra)" strokeWidth="1.5" />
                  <path d="M10 60 Q 80 55, 150 64" stroke="var(--terra)" strokeWidth="2" strokeDasharray="4 2" />
                  <path d="M10 80 Q 80 85, 150 78" stroke="var(--terra)" strokeWidth="2.5" />
                  <circle cx="50" cy="50" r="3" fill="var(--terra)" />
                  <circle cx="110" cy="30" r="2.5" fill="var(--terra)" />
                  <circle cx="90" cy="70" r="2" fill="var(--terra)" />
                </svg>
                <div className="absolute bottom-2 right-3 font-editorial-mono text-[9px] text-[var(--terra)] tracking-wider">
                  FIG. 02 // STRATIGRAPHY
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4 flex-1 justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 font-editorial-mono text-[11px]">
                    <span className="text-[var(--moss)] font-bold border border-[var(--moss)] px-2 py-0.5 bg-[var(--moss-soft)]">
                      RESEARCH
                    </span>
                    <span className="text-[var(--ink-2)]">SEP 28, 2026</span>
                  </div>
                  <h3 className="font-editorial-display text-lg font-bold text-[var(--ink)] leading-snug">
                    Edge Neural Reasoning Under Zero Connectivity Constraints
                  </h3>
                  <p className="font-editorial-body text-xs text-[var(--ink-2)] leading-relaxed mt-2">
                    How running 8-bit quantized micro-models locally on dual-core microcontrollers
                    eliminates cloud latency failures and isolates telemetry in sovereign farm perimeters.
                  </p>
                </div>

                <div className="border-t border-[var(--line)] pt-3 font-editorial-mono text-[11px] text-[var(--ink)] hover:text-[var(--terra)] cursor-pointer flex items-center justify-between transition-colors">
                  <span>READ DISPATCH</span>
                  <span>↗</span>
                </div>
              </div>
            </article>

            {/* Card 3: Moss Growth-Curve */}
            <article className="border border-[var(--line)] bg-[var(--panel)] flex flex-col justify-between hover:border-[var(--moss)] transition-colors duration-200">
              {/* Top SVG Line-Art */}
              <div className="h-44 w-full bg-[var(--bg)] border-b border-[var(--line)] p-4 flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 160 100" fill="none" className="w-36 h-28 opacity-80">
                  <path d="M15 85 C 45 80, 75 65, 100 40 S 145 15, 145 15" stroke="var(--moss)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M15 85 L 145 85" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="100" cy="40" r="4" fill="var(--moss)" />
                  <circle cx="145" cy="15" r="4" fill="var(--moss)" />
                </svg>
                <div className="absolute bottom-2 right-3 font-editorial-mono text-[9px] text-[var(--moss)] tracking-wider">
                  FIG. 03 // LOGISTIC GROWTH
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4 flex-1 justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 font-editorial-mono text-[11px]">
                    <span className="text-[var(--moss)] font-bold border border-[var(--moss)] px-2 py-0.5 bg-[var(--moss-soft)]">
                      ALGORITHM
                    </span>
                    <span className="text-[var(--ink-2)]">SEP 04, 2026</span>
                  </div>
                  <h3 className="font-editorial-display text-lg font-bold text-[var(--ink)] leading-snug">
                    Closed-Loop Evapotranspiration Dampening in High Heat Waves
                  </h3>
                  <p className="font-editorial-body text-xs text-[var(--ink-2)] leading-relaxed mt-2">
                    Modulating pre-dawn pulse wetting against noon vapour deficit index to eliminate
                    leaf scorch and optimize stomatal conductance in Saurashtra red soils.
                  </p>
                </div>

                <div className="border-t border-[var(--line)] pt-3 font-editorial-mono text-[11px] text-[var(--ink)] hover:text-[var(--moss)] cursor-pointer flex items-center justify-between transition-colors">
                  <span>READ DISPATCH</span>
                  <span>↗</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <Hairline />

        {/* ====================================================================
            CHAPTER 08 // EARLY ACCESS
            ==================================================================== */}
        <section className="flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Headline */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              <ChapterLabel n={8} title="DEPLOYMENT COHORT" color="moss" />
              <h2 className="font-editorial-display text-4xl sm:text-6xl lg:text-[72px] font-extrabold tracking-[-0.03em] leading-[1.02] text-[var(--ink)]">
                Get your{" "}
                <span className="text-[var(--moss)] font-editorial-display-italic italic">
                  free
                </span>{" "}
                farm audit
              </h2>
              <p className="font-editorial-body text-sm sm:text-base text-[var(--ink-2)] max-w-2xl mt-1">
                Enter your farm coordinates or contact email to queue an autonomous edge sensor audit.
                Our engineering team provisions telemetry mapping profiles within 48 hours.
              </p>
            </div>

            {/* Right Mono Stack with Moss Right-Border */}
            <div className="lg:col-span-4 border-r-2 border-[var(--moss)] pr-4 flex flex-col items-start lg:items-end justify-center font-editorial-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-2)]">
              <span>№ KN-2026-EARLY-ACCESS</span>
              <span className="text-[var(--moss)] font-bold mt-1">BATCH 04 // OPEN</span>
              <span className="text-[var(--ink-3)] mt-1">BUILD V4.0.0-PROD</span>
            </div>
          </div>

          {/* Bordered Panel with Top Gradient Line (moss -> gold) */}
          <div className="relative border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-10 flex flex-col gap-8">
            {/* Top gradient line moss -> gold */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--moss)] via-[#E4C57E] to-[#B98A3E]"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left "THE PROTOCOL" Rows 01-03 */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <span className="font-editorial-mono text-xs uppercase tracking-[0.14em] font-bold text-[var(--ink)]">
                  THE PROTOCOL
                </span>

                <div className="flex flex-col gap-3 font-editorial-mono text-xs">
                  {/* Row 01 */}
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border border-[var(--line)]">
                    <div className="w-7 h-7 rounded-[2px] bg-[var(--moss-soft)] border border-[var(--moss)] flex items-center justify-center text-[var(--moss)] font-bold text-xs">
                      01
                    </div>
                    <span className="text-[var(--ink)] font-bold tracking-wide">
                      On-device field scan
                    </span>
                  </div>

                  {/* Row 02 */}
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border border-[var(--line)]">
                    <div className="w-7 h-7 rounded-[2px] bg-[var(--moss-soft)] border border-[var(--moss)] flex items-center justify-center text-[var(--moss)] font-bold text-xs">
                      02
                    </div>
                    <span className="text-[var(--ink)] font-bold tracking-wide">
                      One-tap pump control
                    </span>
                  </div>

                  {/* Row 03 */}
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border border-[var(--line)]">
                    <div className="w-7 h-7 rounded-[2px] bg-[var(--moss-soft)] border border-[var(--moss)] flex items-center justify-center text-[var(--moss)] font-bold text-xs">
                      03
                    </div>
                    <span className="text-[var(--ink)] font-bold tracking-wide">
                      Agent irrigation routing
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Dashed Box: Queue Position + Live Ticker */}
              <div className="lg:col-span-5 border-2 border-dashed border-[var(--line)] p-6 bg-[var(--bg)] flex flex-col items-center justify-center text-center gap-2">
                <span className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-2)]">
                  YOUR QUEUE POSITION
                </span>
                <span className="font-editorial-display text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-[#E4C57E] to-[#B98A3E] bg-clip-text text-transparent tabular-nums">
                  #{queueCount.toLocaleString("en-IN")}
                </span>
                <span className="font-editorial-mono text-xs uppercase tracking-[0.12em] text-[var(--ink-2)]">
                  IN LINE
                </span>
                <div className="mt-2">
                  <StampBox label="BATCH 04 // OPEN" color="moss" />
                </div>
              </div>
            </div>

            {/* Email Input Row */}
            <form onSubmit={handleAuditSubmit} className="flex flex-col gap-3 pt-4 border-t border-[var(--line)]">
              <label
                htmlFor={emailInputId}
                className="font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-2)] font-semibold"
              >
                YOUR EMAIL ADDRESS
              </label>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                <input
                  id={emailInputId}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@khet.in"
                  className="flex-1 border-b-2 border-[var(--line)] bg-transparent py-2 px-1 text-base text-[var(--ink)] font-editorial-mono placeholder:text-[var(--ink-3)] focus:border-[var(--ink)] outline-none rounded-none"
                />
                <CreamButton
                  type="submit"
                  label="Request audit access →"
                  arrow={false}
                  className="py-3 px-6 text-xs sm:text-sm font-bold whitespace-nowrap"
                />
              </div>

              {/* Feedback on submit */}
              {requestSubmitted && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="rotate-[-6deg] inline-block border-2 border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)] font-editorial-mono text-xs uppercase tracking-[0.14em] font-bold px-3 py-1">
                    REQUEST LOGGED
                  </div>
                  <span className="font-editorial-mono text-xs text-[var(--moss)]">
                    Audit profile scheduled. Look for dispatch in 48 hours.
                  </span>
                </div>
              )}
            </form>

            {/* Footer Row */}
            <div className="border-t border-[var(--line)] pt-4 flex flex-wrap items-center justify-between gap-3 font-editorial-mono text-[11px] uppercase tracking-[0.12em]">
              <span className="text-[var(--moss)] flex items-center gap-1.5 font-bold">
                <span className="inline-block w-2 h-2 bg-[var(--moss)] rounded-none" />
                QUEUE POSITION: #live
              </span>
              <span className="text-[var(--ink-2)]">RESPONSE WINDOW: 48 HRS</span>
              <span className="text-[var(--ink-2)]">ZERO SPAM // ON-DEVICE SCAN</span>
            </div>
          </div>
        </section>

        <Hairline />

        {/* ====================================================================
            CHAPTER 09 // CLEAR CLARIFICATIONS (FAQ)
            ==================================================================== */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <ChapterLabel n={9} title="FREQUENTLY ASKED QUESTIONS" color="terra" />
            <h2 className="font-editorial-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)]">
              Clear Clarifications
            </h2>
          </div>

          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {[
              {
                q: "What is the total hardware setup cost for a typical farm?",
                a: "A complete KrishiNethra edge hub with an ESP32 microcontroller, capacitive moisture probe, DHT22 climate sensor, MQ-135 air monitor, rain sensor and 2-channel relay module costs under ₹2,500 total. Payback is achieved within 45 days through reduced electricity and pump wear.",
              },
              {
                q: "Does KrishiNethra work without internet connectivity?",
                a: "Yes. The edge irrigation agent runs 100% locally on the microcontroller. Sensor sampling, evapotranspiration calculation, and pump relay switching happen on-device. Internet (via WiFi or GSM hotspot) is only used for remote phone syncing.",
              },
              {
                q: "Can I control the pump and check soil moisture from my phone when away?",
                a: "Yes. KrishiNethra connects over lightweight MQTT broker queues with sub-second latency. When your edge node is online, you can monitor moisture curves, override relay schedules, or trigger auxiliary farm loads from anywhere in the world.",
              },
              {
                q: "How many crop varieties are supported by the agronomy engine?",
                a: "Over 40 Indian staples, cash crops, and vegetables are built into the agronomy database, including Tomato, Cotton, Wheat, Mustard, Chili, Groundnut, Sugarcane, and Paddy, with precise moisture threshold curves calibrated for Indian soil strata.",
              },
              {
                q: "What happens to my farm telemetry and harvest data?",
                a: "Your data remains entirely sovereign on your local hardware node and browser storage. We never sell, monetize, or harvest farmer telemetry. KrishiNethra operates on zero-cloud telemetry tracking principles.",
              },
              {
                q: "Is there an interactive demonstration mode for exhibitions or research review?",
                a: "Yes. KrishiNethra includes a full virtual farm simulation engine with dynamic diurnals, rain events, and sensor fault injection, allowing comprehensive demonstration and testing even without physical hardware plugged in.",
              },
            ].map((item, idx) => {
              const isOpen = Boolean(faqOpen[idx]);
              return (
                <div key={idx} className="py-5 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer select-none group bg-transparent border-0 p-0"
                  >
                    <h3 className="font-editorial-display text-base sm:text-lg font-bold text-[var(--ink)] group-hover:text-[var(--terra)] transition-colors">
                      {item.q}
                    </h3>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "w-10 h-10 shrink-0 inline-flex items-center justify-center border border-[var(--line)] rounded-[2px] bg-[var(--panel)] text-[var(--ink-2)] transition-all duration-200",
                        "group-hover:text-[var(--ink)] group-hover:border-[var(--ink-2)] group-hover:bg-[var(--panel-2)]",
                        isOpen && "border-[var(--terra)] text-[var(--ink)] bg-[var(--terra-soft)]",
                      )}
                    >
                      {isOpen ? <X className="w-4 h-4 text-[var(--terra)]" /> : <Plus className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <motion.p
                      id={`faq-answer-${idx}`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-editorial-body text-sm sm:text-base text-[var(--ink-2)] leading-relaxed max-w-4xl pr-8"
                    >
                      {item.a}
                    </motion.p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ====================================================================
            FOOTER
            ==================================================================== */}
        <footer className="pt-12 pb-16 flex flex-col gap-6 border-t border-[var(--line)]">
          <div className="flex flex-wrap items-center justify-between gap-4 font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-2)]">
            <span className="font-bold text-[var(--ink)]">
              BUILT BY VANSH PATEL • AHMEDABAD, IN
            </span>
            <span>DEPLOYED ON VERCEL • MQTT EDGE</span>
            <span>© 2026 KRISHINETHRA AI</span>
          </div>
        </footer>
      </main>
    </div>
    </ErrorBoundary>
  );
}
