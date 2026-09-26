"use client";

import React, { useState } from "react";
import { Plus, X, Cpu, Droplets, Wind, ShieldCheck } from "lucide-react";
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
  SquareToggle,
  CreamButton,
  ThemeToggleBox,
} from "@/components/editorial";

export default function EditorialShowcasePage() {
  const [toggleActive, setToggleActive] = useState(false);
  const [selectedChip, setSelectedChip] = useState("ALL SYSTEMS");

  return (
    <div className="relative min-h-screen w-full bg-[var(--bg)] text-[var(--ink)] overflow-x-hidden selection:bg-[var(--terra-soft)] selection:text-[var(--ink)]">
      {/* Floating Navigation */}
      <FloatingNav
        logoText="KRISHINETHRA // FIELD"
        ctaLabel="OPEN OS"
        ctaHref="/dashboard"
      />

      {/* Background Particles Field (6 floating outlines + 3 filled 4px squares) */}
      <ParticlesField />

      {/* Main Content Area */}
      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto flex flex-col gap-12">
        {/* Top MetaBar */}
        <MetaBar
          items={[
            "FIELD EDITORIAL",
            "RECLAIM R-LIARD SPEC",
            "KRISHINETHRA AGRO-OS",
            "OCT 2026",
          ]}
          scrollText="SCROLL TO EXPLORE"
        />

        {/* Hero Section */}
        <section className="flex flex-col gap-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Eyebrow dot color="moss" label="AGRONOMIC RESEARCH BULLETIN // EDITION 04" />
            <StampBox label="OFFICIAL FIELD DISPATCH" color="terra" sublabel="AUTHENTICATED" />
          </div>

          <ChapterLabel n={1} title="SOIL MICRO-TELEMETRY & AUTONOMOUS IRRIGATION" color="terra" />

          {/* WordReveal heading */}
          <WordReveal
            as="h1"
            heading="Engineering Climate Resilient Farms With Autonomous Edge Intelligence"
            className="max-w-4xl"
          />

          {/* RevealParagraph with scroll-linked line brightening */}
          <RevealParagraph
            text={`KrishiNethra field nodes deploy solar-powered micro-controllers directly along root zones across semi-arid terrains.
Each node registers soil moisture, electrical conductivity, canopy temperature, and transpiration velocity in millisecond bursts.
When localized thresholds dip below target baselines, precision solenoids pulse water and micronutrients with zero waste.
The result is closed-loop autonomous cultivation that stands resilient against heatwaves, unseasonal downpours, and water stress.`}
            className="max-w-3xl mt-2 text-[var(--ink-2)]"
          />

          {/* Call to action & button primitives */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <CreamButton label="EXPLORE TELEMETRY" arrow href="/sensors" />
            <GhostChip
              icon={<Cpu className="w-3.5 h-3.5" />}
              label="ESP32 HARDWARE"
              active={selectedChip === "ESP32 HARDWARE"}
              onClick={() => setSelectedChip("ESP32 HARDWARE")}
            />
            <GhostChip
              icon={<Droplets className="w-3.5 h-3.5" />}
              label="DRIP SOLENOIDS"
              active={selectedChip === "DRIP SOLENOIDS"}
              onClick={() => setSelectedChip("DRIP SOLENOIDS")}
            />
            <GhostChip
              icon={<Wind className="w-3.5 h-3.5" />}
              label="WEATHER RADAR"
              active={selectedChip === "WEATHER RADAR"}
              onClick={() => setSelectedChip("WEATHER RADAR")}
            />
          </div>
        </section>

        <Hairline />

        {/* Chapter 02 Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <ChapterLabel n={2} title="MODULAR PRIMITIVES AUDIT" color="moss" />
            <StampBox label="0PX SHARP SPEC" color="moss" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Panel 1 */}
            <div className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col gap-4">
              <Eyebrow dot color="moss" label="STAMP & CHIP TOKENS" />
              <p className="font-editorial-body text-sm text-[var(--ink-2)]">
                Every component is constrained to sharp 0px radii. Only floating nav
                and icon buttons feature 2px corners.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <GhostChip icon={<ShieldCheck className="w-3.5 h-3.5" />} label="STAMPED" />
                <StampBox label="APPROVED" color="terra" />
              </div>
            </div>

            {/* Panel 2 */}
            <div className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col gap-4">
              <Eyebrow dot color="terra" label="SQUARE CONTROLS" />
              <p className="font-editorial-body text-sm text-[var(--ink-2)]">
                40px bordered square toggle button for status modifiers and state toggling.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <SquareToggle
                  icon={toggleActive ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  active={toggleActive}
                  onClick={() => setToggleActive(!toggleActive)}
                  ariaLabel="Toggle expansion"
                />
                <span className="font-editorial-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-2)]">
                  STATE: {toggleActive ? "ACTIVE (X)" : "INACTIVE (+)"}
                </span>
              </div>
            </div>

            {/* Panel 3 */}
            <div className="border border-[var(--line)] bg-[var(--panel)] p-6 flex flex-col gap-4">
              <Eyebrow dot color="ink" label="THEME PERSISTENCE" />
              <p className="font-editorial-body text-sm text-[var(--ink-2)]">
                Three-state bordered toggle box supporting Light (Paper), Dark (Carbon),
                and System sync.
              </p>
              <div className="pt-2">
                <ThemeToggleBox />
              </div>
            </div>
          </div>
        </section>

        <Hairline />

        {/* Chapter 03 Section */}
        <section className="flex flex-col gap-6 pb-12">
          <ChapterLabel n={3} title="MANIFESTO & OBSERVATION" color="terra" />
          <WordReveal
            as="h2"
            heading="Zero Radius. High Contrast Ink. Sovereign Land Data."
            className="max-w-3xl text-2xl md:text-3xl"
          />
          <RevealParagraph
            text={`Editorial typography pairs Helvetica / Inter Tight heavy weights with monospaced instrumentation headers.
Contrast boundaries between #0A0F0B void and #EDEAE3 ink ensure supreme legibility under midday direct sunlight.
Agricultural sensors require neither superfluous shadows nor decorative curves—only precise telemetry and actionable intelligence.`}
            className="max-w-2xl text-[var(--ink-2)]"
          />
        </section>

        {/* Bottom MetaBar */}
        <MetaBar
          items={["END OF DISPATCH", "KRISHINETHRA 2026", "ALL RIGHTS RESERVED"]}
          scrollText="BACK TO TOP"
        />
      </main>
    </div>
  );
}
