"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CreamButtonProps {
  label?: string;
  arrow?: boolean;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  target?: string;
  rel?: string;
}

export function CreamButton({
  label,
  arrow = true,
  children,
  onClick,
  href,
  type = "button",
  disabled = false,
  className,
  target,
  rel,
}: CreamButtonProps) {
  const content = label || children;

  const baseStyles = cn(
    "group inline-flex items-center justify-center gap-2 px-4 py-2",
    "bg-[var(--ink)] text-[var(--bg)]",
    "rounded-none border border-[var(--ink)]",
    "font-editorial-mono text-[11px] uppercase tracking-[0.12em] font-bold",
    "cursor-pointer select-none",
    "transition-all duration-200 ease-out",
    "hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_var(--terra)]",
    "active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0_var(--terra)]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none",
    className,
  );

  const hasArrowGlyph =
    typeof content === "string" &&
    (content.includes("↗") || content.includes("↘") || content.includes("→"));
  const showArrow = arrow && !hasArrowGlyph;

  const inner = (
    <>
      <span className="leading-none">{content}</span>
      {showArrow && (
        <ArrowRight
          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (href && !disabled) {
    const isExternal = href.startsWith("http") || href.startsWith("//");
    if (isExternal) {
      return (
        <a
          href={href}
          onClick={onClick}
          className={baseStyles}
          target={target || "_blank"}
          rel={rel || "noopener noreferrer"}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} onClick={onClick} className={baseStyles}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseStyles}
    >
      {inner}
    </button>
  );
}

export default CreamButton;
