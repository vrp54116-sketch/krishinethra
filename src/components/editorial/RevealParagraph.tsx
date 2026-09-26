"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface RevealParagraphProps {
  text?: string;
  lines?: string[];
  children?: React.ReactNode;
  className?: string;
}

export function RevealParagraph({
  text,
  lines,
  children,
  className,
}: RevealParagraphProps) {
  const lineStrings = useMemo(() => {
    if (lines && lines.length > 0) return lines;
    const raw = typeof text === "string" ? text : typeof children === "string" ? children : "";
    if (!raw) return [];
    if (raw.includes("\n")) {
      return raw.split("\n").map((l) => l.trim()).filter(Boolean);
    }
    // If no newlines, split by sentence boundaries for editorial reading rhythm
    const matched = raw.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
    if (matched && matched.length > 1) {
      return matched.map((s) => s.trim()).filter(Boolean);
    }
    return [raw];
  }, [lines, text, children]);

  return (
    <div
      className={cn(
        "font-editorial-body text-[var(--ink)] text-base md:text-lg leading-relaxed space-y-2",
        className,
      )}
    >
      {lineStrings.length > 0
        ? lineStrings.map((line, idx) => (
            <RevealLine key={idx} text={line} index={idx} />
          ))
        : children}
    </div>
  );
}

function RevealLine({ text }: { text: string; index: number }) {
  const lineRef = useRef<HTMLParagraphElement>(null);
  const [isCrossed, setIsCrossed] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const el = lineRef.current;
    if (!el || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    // Observe element crossing the viewport center line (top 50% root margin)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsCrossed(entry.isIntersecting);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -50% 0px",
        threshold: 0,
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [shouldReduceMotion]);

  const active = Boolean(shouldReduceMotion) || isCrossed;

  return (
    <p
      ref={lineRef}
      style={{
        opacity: active ? 1 : 0.25,
        transform: active ? "translateY(0px)" : "translateY(4px)",
      }}
      className={cn(
        "transition-all duration-300 ease-out",
        "will-change-[transform,opacity]",
      )}
    >
      {text}
    </p>
  );
}

export default RevealParagraph;
