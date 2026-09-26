"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface WordRevealProps {
  heading?: string;
  children?: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div";
  className?: string;
}

export function WordReveal({
  heading,
  children,
  as: Component = "h2",
  className,
}: WordRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const rawText = typeof heading === "string" ? heading : typeof children === "string" ? children : "";
  const words = useMemo(() => {
    return rawText.split(/\s+/).filter(Boolean);
  }, [rawText]);

  const [activeWordsCount, setActiveWordsCount] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const el = containerRef.current;
    if (!el || typeof window === "undefined") {
      return;
    }

    let ticking = false;

    const updateScrollProgress = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start revealing when element is near bottom (85% from top of screen),
      // finish when element is near top third (35% from top of screen).
      const start = windowHeight * 0.85;
      const end = windowHeight * 0.35;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));

      const totalWords = words.length;
      const count = Math.min(totalWords, Math.floor(progress * (totalWords + 1)));
      setActiveWordsCount(count);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.requestAnimationFrame(updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [words.length, shouldReduceMotion]);

  return (
    <div ref={containerRef} className="inline-block">
      <Component
        className={cn(
          "font-editorial-display text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] leading-tight select-none",
          className,
        )}
      >
        {words.map((word, idx) => {
          const isRevealed = Boolean(shouldReduceMotion) || idx < activeWordsCount;
          return (
            <span
              key={idx}
              className={cn(
                "inline-block mr-[0.28em] transition-colors duration-250 ease-out will-change-[color]",
                isRevealed ? "text-[var(--ink)]" : "text-[var(--terra)]",
              )}
            >
              {word}
            </span>
          );
        })}
      </Component>
    </div>
  );
}

export default WordReveal;
