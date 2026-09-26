"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import CreamButton from "./CreamButton";
import ThemeToggleBox from "./ThemeToggleBox";

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface FloatingNavProps {
  logoText?: string;
  logoHref?: string;
  links?: NavLinkItem[];
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
}

const DEFAULT_LINKS: NavLinkItem[] = [
  { label: "DASHBOARD", href: "/dashboard" },
  { label: "SENSORS", href: "/sensors" },
  { label: "IRRIGATION", href: "/irrigation" },
  { label: "CLIMATE", href: "/climate" },
  { label: "MARKET", href: "/market" },
];

export function FloatingNav({
  logoText = "KRISHINETHRA",
  logoHref = "/dashboard",
  links = DEFAULT_LINKS,
  ctaLabel = "COMM CENTER",
  ctaHref = "/dashboard",
  onCtaClick,
  className,
}: FloatingNavProps) {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "fixed top-4 left-0 right-0 z-50 flex items-center justify-center px-3 sm:px-4 pointer-events-none",
        className,
      )}
    >
      <div className="flex items-center gap-2 max-w-full">
        {/* Centered Bordered Panel */}
        <nav
          aria-label="Field Editorial Navigation"
          className={cn(
            "pointer-events-auto flex items-center gap-4 sm:gap-6 md:gap-8 px-3.5 py-2 sm:px-5 sm:py-2.5",
            "border border-[var(--line)] bg-[var(--panel)] rounded-[2px]",
            "shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md",
            "select-none transition-all duration-300",
          )}
        >
          {/* Italic Bold Logo */}
          <Link
            href={logoHref}
            className="font-editorial-display-italic font-extrabold text-sm sm:text-base tracking-[-0.03em] text-[var(--ink)] shrink-0 hover:text-[var(--terra)] transition-colors duration-200"
          >
            {logoText}
          </Link>

          {/* Nav Links (hidden on mobile, collapses to logo + CTA) */}
          <div className="hidden md:flex items-center gap-5 lg:gap-6">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative font-editorial-mono text-[11px] uppercase tracking-[0.12em] py-1 transition-colors duration-200",
                    isActive
                      ? "text-[var(--ink)] font-bold"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                  )}
                >
                  <span>{link.label}</span>
                  {/* Terra underline for active state */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--terra)] rounded-none"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* CreamButton CTA */}
          <div className="shrink-0">
            <CreamButton
              label={ctaLabel}
              arrow
              href={ctaHref}
              onClick={onCtaClick}
              className="py-1.5 px-3 text-[10px] sm:text-[11px]"
            />
          </div>
        </nav>

        {/* Separate ThemeToggleBox to its right */}
        <div className="pointer-events-auto shrink-0">
          <ThemeToggleBox />
        </div>
      </div>
    </header>
  );
}

export default FloatingNav;
