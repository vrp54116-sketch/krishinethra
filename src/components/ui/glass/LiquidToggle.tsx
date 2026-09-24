"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { playToggleClick } from "@/lib/audio";

/**
 * LiquidToggle — Apple-style liquid switch.
 *
 * - GSAP Draggable drives the handle with real drag physics (bounds = track).
 *   gsap is loaded via dynamic import so it never lands in the initial
 *   page bundle; a CSS-transition fallback covers the pre-load window.
 * - The whole track+handle group sits under the #liquid-gooey SVG filter so
 *   the handle visibly melts into the track while it travels.
 * - The handle morphs scale 1.1 → 1.65 during a drag and springs back with
 *   an elastic bounce on release.
 * - Track/handle colours interpolate in HSL from neutral gray → emerald as
 *   the switch travels (also on plain click / keyboard activation).
 * - Fully accessible: role="switch", aria-checked, focus-visible ring, and
 *   native button Enter/Space activation.
 */

type Gsap = typeof import("gsap")["default"];
type DraggablePlugin = typeof import("gsap/Draggable")["Draggable"];

let gsapPromise: Promise<{ gsap: Gsap; Draggable: DraggablePlugin }> | null =
  null;

function loadGsap(): Promise<{ gsap: Gsap; Draggable: DraggablePlugin }> {
  if (!gsapPromise) {
    gsapPromise = Promise.all([import("gsap"), import("gsap/Draggable")]).then(
      ([gsapMod, dragMod]) => {
        if (typeof window !== "undefined") {
          gsapMod.default.registerPlugin(dragMod.Draggable);
        }
        return { gsap: gsapMod.default, Draggable: dragMod.Draggable };
      },
    );
  }
  return gsapPromise;
}

export interface LiquidToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/** Travel distance of the 24px handle inside the 56px track (12px padding). */
const TRAVEL = 24;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** HSL endpoints: unchecked gray → checked emerald (#10B981). */
const OFF = { h: 215, s: 8, l: 30 };
const ON = { h: 160, s: 84, l: 39 };

function shortestHueDelta(a: number, b: number): number {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/** Linear HSL interpolation with shortest-path hue rotation. */
function mixHsl(t: number): { h: number; s: number; l: number } {
  return {
    h: OFF.h + shortestHueDelta(OFF.h, ON.h) * t,
    s: OFF.s + (ON.s - OFF.s) * t,
    l: OFF.l + (ON.l - OFF.l) * t,
  };
}

export const LiquidToggle = React.forwardRef<HTMLButtonElement, LiquidToggleProps>(
  ({ checked, onChange, disabled = false, label, className }, ref) => {
    const trackRef = React.useRef<HTMLSpanElement>(null);
    const handleRef = React.useRef<HTMLSpanElement>(null);
    const progressRef = React.useRef(checked ? 1 : 0);
    const checkedRef = React.useRef(checked);
    const movedRef = React.useRef(false);
    const pressProgressRef = React.useRef(checked ? 1 : 0);
    const reduceMotionRef = React.useRef(false);
    const gsapRef = React.useRef<Gsap | null>(null);

    /** Position the handle; uses gsap when loaded, plain CSS otherwise. */
    const applyHandle = React.useCallback((x: number, scale = 1) => {
      const handle = handleRef.current;
      if (!handle) return;
      const g = gsapRef.current;
      if (g) {
        g.set(handle, { x, scale });
      } else {
        handle.style.transition = "none";
        handle.style.transform = `translate(${x}px, 0) scale(${scale})`;
      }
    }, []);

    /** Paint track + handle colours for a 0→1 progress value. */
    const paint = React.useCallback((p: number) => {
      const track = trackRef.current;
      const handle = handleRef.current;
      if (!track || !handle) return;
      const c = mixHsl(p);
      const hsl = (h: number, s: number, l: number, a = 1) =>
        `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${a})`;

      track.style.backgroundColor = hsl(c.h, c.s, c.l, 0.24 + 0.42 * p);
      track.style.boxShadow = [
        "inset 2px 2px 6px rgba(0,0,0,0.5)",
        "inset -1px -1px 3px rgba(255,255,255,0.10)",
        p > 0.03 ? `0 0 ${(18 * p).toFixed(1)}px hsla(${c.h.toFixed(1)},84%,45%,${(0.45 * p).toFixed(2)})` : "0 0 0 rgba(0,0,0,0)",
      ].join(", ");

      handle.style.background = `linear-gradient(180deg, ${hsl(
        c.h,
        Math.min(100, c.s + 6),
        Math.min(88, c.l + 16),
      )} 0%, ${hsl(c.h, c.s, Math.max(8, c.l - 8))} 100%)`;
      handle.style.boxShadow = [
        "3px 3px 8px rgba(0,0,0,0.5)",
        "-2px -2px 6px rgba(255,255,255,0.10)",
        "inset 0 1px 0 rgba(255,255,255,0.35)",
        p > 0.03
          ? `0 0 ${(16 * p).toFixed(1)}px hsla(${c.h.toFixed(1)},84%,45%,${(0.7 * p).toFixed(2)})`
          : "0 0 0 rgba(0,0,0,0)",
      ].join(", ");
    }, []);

    /** Commit a settled position (with spring bounce). */
    const settle = React.useCallback(
      (next: boolean) => {
        checkedRef.current = next;
        progressRef.current = next ? 1 : 0;
        paint(progressRef.current);
        const handle = handleRef.current;
        if (handle) {
          const x = (next ? 1 : 0) * TRAVEL;
          const g = gsapRef.current;
          if (g) {
            g.to(handle, {
              x,
              scale: 1,
              duration: reduceMotionRef.current ? 0 : 0.7,
              ease: reduceMotionRef.current ? "none" : "elastic.out(1, 0.45)",
              overwrite: "auto",
            });
          } else {
            // gsap chunk not loaded yet — spring with a plain CSS transition.
            handle.style.transition = reduceMotionRef.current
              ? "none"
              : "transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)";
            handle.style.transform = `translate(${x}px, 0) scale(1)`;
          }
        }
        if (next !== checked) {
          playToggleClick();
          onChange(next);
        }
      },
      [checked, onChange, paint],
    );

    // Always call the freshest settle from Draggable callbacks without
    // re-instantiating the drag proxy on every checked change.
    const settleRef = React.useRef(settle);
    React.useEffect(() => {
      settleRef.current = settle;
    }, [settle]);

    // Initial paint + keep in sync when the parent flips `checked` externally.
    React.useLayoutEffect(() => {
      reduceMotionRef.current =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      paint(progressRef.current);
      applyHandle(progressRef.current * TRAVEL, 1);
      // Only repaint when the prop actually changed externally.
      if (checkedRef.current !== checked) {
        checkedRef.current = checked;
        progressRef.current = checked ? 1 : 0;
        paint(progressRef.current);
        applyHandle(progressRef.current * TRAVEL, 1);
      }
    }, [checked, paint, applyHandle]);

    // Physics-driven drag (gsap loaded lazily on first mount).
    React.useLayoutEffect(() => {
      const handle = handleRef.current;
      const track = trackRef.current;
      if (!handle || !track) return;

      let killed = false;
      let instances: { kill: () => void }[] = [];

      loadGsap()
        .then(({ gsap, Draggable }) => {
          if (killed) return;
          gsapRef.current = gsap;
          // Sync position via gsap and cancel any CSS fallback transition.
          handle.style.transition = "none";
          gsap.set(handle, {
            x: progressRef.current * TRAVEL,
            scale: 1,
          });
          instances = Draggable.create(handle, {
            type: "x",
            bounds: track,
            edgeResistance: 0.72,
            dragResistance: 0.08,
            onPress() {
              movedRef.current = false;
              pressProgressRef.current = progressRef.current;
              gsap.killTweensOf(handle);
            },
            onDrag() {
              movedRef.current = true;
              const x = Number(gsap.getProperty(handle, "x")) || 0;
              const p = clamp01(x / TRAVEL);
              progressRef.current = p;
              // Stretch: 1.1 at grab → up to 1.65 the further you throw it.
              const stretch = Math.abs(p - pressProgressRef.current);
              gsap.set(handle, {
                scale: reduceMotionRef.current ? 1 : 1.1 + 0.55 * clamp01(stretch),
              });
              paint(p);
            },
            onDragEnd() {
              const x = Number(gsap.getProperty(handle, "x")) || 0;
              const next = x / TRAVEL > 0.5;
              settleRef.current(next);
            },
          });
        })
        .catch(() => {
          /* offline/guest — CSS fallback stays in effect */
        });

      return () => {
        killed = true;
        instances.forEach((d) => d.kill());
      };
    }, [paint]);

    const handleClick = React.useCallback(() => {
      if (disabled) return;
      if (movedRef.current) {
        // A real drag just finished — swallow the trailing click.
        movedRef.current = false;
        return;
      }
      settleRef.current(!checkedRef.current);
    }, [disabled]);

    const onKeyDown = (e: React.KeyboardEvent) => {
      // Native buttons already fire click on Enter/Space — just stop Space
      // from scrolling the page while the switch has focus.
      if (e.key === " " || e.key === "Spacebar") e.preventDefault();
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={onKeyDown}
        className={cn(
          "group relative inline-flex cursor-pointer items-center gap-2.5 rounded-full outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070B09]",
          className,
        )}
      >
        {/* Gooey host — track + handle morph together under #liquid-gooey */}
        <span aria-hidden className="liquid-gooey relative inline-flex shrink-0">
          <span
            ref={trackRef}
            className="relative flex h-8 w-14 items-center rounded-full px-1"
            style={{
              backgroundColor: "hsla(215, 8%, 30%, 0.24)",
              WebkitBackdropFilter: "blur(12px)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span
              ref={handleRef}
              className="block h-6 w-6 rounded-full"
              style={{ willChange: "transform" }}
            />
          </span>
        </span>
        {label ? (
          <span className="text-sm font-medium text-[#e7f5ec]/90">{label}</span>
        ) : null}
      </button>
    );
  },
);
LiquidToggle.displayName = "LiquidToggle";

export default LiquidToggle;
