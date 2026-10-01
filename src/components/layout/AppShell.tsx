"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Bell,
  BookOpen,
  Camera,
  CheckSquare,
  ChevronDown,
  CloudSun,
  Droplets,
  FlaskConical,
  Landmark,
  LayoutDashboard,
  Leaf,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Settings,
  SprayCan,
  TrendingUp,
  Wifi,
  Activity,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/types";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import FloatingMicButton from "@/components/voice/FloatingMicButton";
import LiveFarmPill from "@/components/layout/LiveFarmPill";
import MqttManager from "@/components/mqtt/MqttManager";
import EdgeLiveChip, { edgeChipState } from "@/components/mqtt/EdgeLiveChip";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import PageSkeleton from "@/components/layout/PageSkeleton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AppToaster from "@/components/layout/AppToaster";
import QuickActionsFAB from "@/components/layout/QuickActionsFAB";
import LiveAnnouncer from "@/components/layout/LiveAnnouncer";
import { AmbientBackground } from "@/components/ui/glass";
import { ThemeToggleBox, SquareToggle } from "@/components/editorial";
import { useFocusTrap } from "@/components/ui/glass/useFocusTrap";
import { useMounted } from "@/components/dashboard/ui";
import { getSectionAccent } from "@/lib/theme";

/**
 * Page transition according to Animation Law Rule 9:
 * Allowed motion: page enter fade+12px slide 180ms (transform and opacity only).
 */
function RouteLiquidMorph({
  children,
  routeKey,
}: {
  children: React.ReactNode;
  routeKey: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={{
          opacity: 0,
          y: shouldReduceMotion ? 0 : 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: shouldReduceMotion ? 0 : -12,
        }}
        transition={{
          duration: shouldReduceMotion ? 0.05 : 0.18,
          ease: "easeOut",
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface NavItem {
  href: string;
  label?: string;
  labelKey: string;
  titleKey: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/app/dashboard", labelKey: "nav.dashboard", titleKey: "titles.dashboard", icon: LayoutDashboard },
  { href: "/app/camera", label: "📷 Leaf Scanner", labelKey: "nav.camera", titleKey: "titles.camera", icon: Camera },
  { href: "/app/irrigation", labelKey: "nav.irrigation", titleKey: "titles.irrigation", icon: Droplets },
  { href: "/app/climate", labelKey: "nav.climate", titleKey: "titles.climate", icon: CloudSun },
  { href: "/app/sensors", label: "🔌 Sensor Health", labelKey: "nav.sensors", titleKey: "titles.sensors", icon: Activity },
  { href: "/app/spray", labelKey: "nav.spray", titleKey: "titles.spray", icon: SprayCan },
  { href: "/app/fertilizer", labelKey: "nav.fertilizer", titleKey: "titles.fertilizer", icon: FlaskConical },
  { href: "/app/market", labelKey: "nav.market", titleKey: "titles.market", icon: TrendingUp },
  { href: "/app/schemes", labelKey: "nav.schemes", titleKey: "titles.schemes", icon: Landmark },
  { href: "/app/diary", labelKey: "nav.diary", titleKey: "titles.diary", icon: BookOpen },
  { href: "/app/tasks", labelKey: "nav.tasks", titleKey: "titles.tasks", icon: CheckSquare },
  { href: "/app/assistant", labelKey: "nav.assistant", titleKey: "titles.assistant", icon: MessageCircle },
  { href: "/app/reports", labelKey: "nav.reports", titleKey: "titles.reports", icon: BarChart3 },
  { href: "/app/alerts", labelKey: "nav.alerts", titleKey: "titles.alerts", icon: Bell },
  { href: "/app/voice", labelKey: "nav.voice", titleKey: "titles.voice", icon: Mic },
  { href: "/app/settings", labelKey: "nav.settings", titleKey: "titles.settings", icon: Settings },
];

const PAGE_STAMPS: Record<string, string> = {
  "/app/dashboard": "DASHBOARD // LIVE MONITORING",
  "/app/camera": "CAMERA // LEAF SCANNER",
  "/app/irrigation": "IRRIGATION // FLOW CONTROL",
  "/app/climate": "CLIMATE // AGRI-WEATHER",
  "/app/sensors": "SENSORS // TELEMETRY & HEALTH",
  "/app/spray": "SPRAY // SPRAY ADVISORY",
  "/app/fertilizer": "FERTILIZER // NPK NUTRIENT PLAN",
  "/app/market": "MARKET // APMC MANDI RATES",
  "/app/schemes": "SCHEMES // GOVT SUBSIDIES",
  "/app/diary": "DIARY // CROP LOG",
  "/app/tasks": "TASKS // FARM ACTIVITIES",
  "/app/assistant": "ASSISTANT // KRISHIGPT AI",
  "/app/reports": "REPORTS // DATA EXPORTS",
  "/app/alerts": "ALERTS // NOTIFICATIONS",
  "/app/voice": "VOICE // VOICE COPILOT",
  "/app/settings": "SETTINGS // SYSTEM PREFERENCES",
};

const MOBILE_TABS: Array<NavItem | { key: "more" }> = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[9],
  { key: "more" },
];

function useClock(): string {
  const [now, setNow] = useState("--:--:--");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** EDGE-LIVE header chip (SIMULATION / EDGE-LIVE / EDGE-LIVE·STALE). */
function LivePill() {
  return <EdgeLiveChip />;
}

function LogoBlock({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-3.5 border-b border-[var(--line)]", className)}>
      <span className="font-editorial-display-italic text-lg font-extrabold text-[var(--ink)] tracking-tight">
        KrishiNethra
      </span>
      <span className="font-editorial-mono text-[10px] font-bold text-[var(--ink-3)] uppercase tracking-[0.12em]">
        SYSTEM VER 4.0.0
      </span>
    </div>
  );
}

function HealthCard({
  score,
  mounted,
  isLive,
  t,
  className,
}: {
  score: number;
  mounted: boolean;
  isLive: boolean;
  t: (key: string) => string;
  className?: string;
}) {
  void isLive;
  return <HealthCardInner score={score} mounted={mounted} t={t} className={className} />;
}

function HealthCardInner({
  score,
  mounted,
  t,
  className,
}: {
  score: number;
  mounted: boolean;
  t: (key: string) => string;
  className?: string;
}) {
  const mode = useFarmStore((s) => s.settings.mode);
  const liveSource = useFarmStore((s) => s.liveSource);
  const mqttStatus = useFarmStore((s) => s.mqttStatus);
  const mqttLastSeen = useFarmStore((s) => s.mqttLastSeen);
  const chip = mounted
    ? edgeChipState({ mode, liveSource, mqttStatus, mqttLastSeen })
    : "sim";
  void t;
  const isLive = chip === "live";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 border-t border-[var(--line)] bg-[var(--panel-2)] rounded-none font-editorial-mono",
        className,
      )}
    >
      {/* Mono row: HEALTH 63/100 */}
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink)]">
        <span>HEALTH</span>
        <span className="tabular-nums">{mounted ? `${Math.round(score)}/100` : "--/100"}</span>
      </div>

      {/* Connection stamp (SIMULATION terra / EDGE-LIVE moss) */}
      <div
        className={cn(
          "w-full text-center py-1 text-[10px] font-bold uppercase tracking-[0.12em] border rounded-none select-none transition-all",
          isLive
            ? "border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)]"
            : "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]",
        )}
      >
        {isLive ? "LIVE" : "SIMULATION"}
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const clock = useClock();
  const mounted = useMounted();
  const router = useRouter();

  const hydrated = useFarmStore((s) => s.hydrated);
  const language = useFarmStore((s) => s.settings.language);
  const setLanguage = useFarmStore((s) => s.setLanguage);
  const mode = useFarmStore((s) => s.settings.mode);
  const farmHealthScore = useFarmStore((s) => s.farmHealthScore);
  const alerts = useFarmStore((s) => s.alerts);
  const markAlertsRead = useFarmStore((s) => s.markAlertsRead);
  const onboardingDone = useFarmStore((s) => s.onboardingDone);
  const appPinHash = useFarmStore((s) => s.appPinHash);
  const isAuthenticated = useFarmStore((s) => s.isAuthenticated);
  const snapshot = useFarmStore((s) => s.snapshot);

  // Bypass AppShell UI for onboarding / entry routes
  const isOnboarding = pathname === "/app/onboarding" || pathname === "/app";

  // Routing guard: wizard first, PIN-locked second.
  useEffect(() => {
    if (!mounted || !hydrated || isOnboarding) return;
    if (!onboardingDone) {
      router.replace("/app/onboarding");
      return;
    }
    if (appPinHash && !isAuthenticated) {
      router.replace("/app/onboarding");
    }
  }, [mounted, hydrated, onboardingDone, appPinHash, isAuthenticated, router, isOnboarding]);

  // Scroll restoration: on pathname change reset main-scroll to top
  useEffect(() => {
    const el = document.getElementById("main-scroll");
    if (el) {
      el.scrollTop = 0;
    }
  }, [pathname]);

  const [langOpen, setLangOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const unread = alerts.filter((a) => !a.read).length;
  const lastFive = alerts.slice(0, 5);

  const activeItem = NAV_ITEMS.find((n) => pathname === n.href || pathname?.startsWith(n.href + "/"));
  const currentAccent = getSectionAccent(pathname);

  const isLive = mode === "live";
  const activeLang = LANGUAGES.find((l) => l.code === language);

  const closeOverlays = () => {
    setLangOpen(false);
    setAlertsOpen(false);
  };

  // V2.5 a11y — trap focus inside the mobile "More" sheet, restore on close.
  const moreSheetRef = useFocusTrap<HTMLDivElement>(moreOpen, () => setMoreOpen(false));

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <MotionConfig reducedMotion="user">
    <div
      className="relative flex h-dvh w-full overflow-hidden bg-[var(--bg)] text-[var(--text)]"
      style={
        {
          "--section-accent": currentAccent.color,
          "--section-accent-rgb": currentAccent.rgb,
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <AmbientBackground />

      {/* Skip link */}
      <a
        href="#main-scroll"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] px-4 py-2 text-sm font-bold text-white bg-[#FF6B1A] rounded-full border border-white/20 shadow-lg"
      >
        Skip to content
      </a>

      {/* ============ DESKTOP SIDEBAR (Editorial Left Rail) ============ */}
      <aside className="relative z-30 hidden md:flex w-64 shrink-0 h-dvh flex-col border-r border-[var(--line)] bg-[var(--panel)] rounded-none m-0">
        <LogoBlock className="shrink-0" />

        <nav aria-label="Primary" className="flex-1 overflow-y-auto scrollbar-hide py-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, labelKey, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            const showBadge = href === "/app/alerts" && unread > 0;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-2 font-editorial-mono text-[12px] uppercase tracking-[0.08em] transition-colors rounded-none select-none",
                  active
                    ? "text-[var(--ink)] bg-[var(--terra-soft)] border-l-2 border-l-[var(--terra)] font-bold"
                    : "text-[var(--ink-2)] border-l-2 border-l-transparent hover:text-[var(--ink)] hover:bg-[var(--panel-2)]",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-[var(--terra)]" : "text-[var(--ink-3)]",
                  )}
                />
                <span className="truncate">{label ?? t(labelKey)}</span>
                {mounted && showBadge && (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-none bg-[var(--terra)] px-1 font-editorial-mono text-[9px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <HealthCard
          score={farmHealthScore}
          mounted={mounted}
          isLive={isLive}
          t={t}
          className="shrink-0"
        />
      </aside>

      {/* ============ MAIN COLUMN ============ */}
      <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col">
        {/* Top Header: Editorial bordered panel, 0 radius */}
        <header className="shrink-0 z-40 w-full border-b border-[var(--line)] bg-[var(--panel)] px-4 py-2.5 flex items-center justify-between gap-3 rounded-none m-0">
          {/* Left: Overview link & ChapterLabel-style page stamp */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-editorial-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-2)] hover:text-[var(--terra)] border border-[var(--line)] bg-[var(--panel-2)] px-2 py-1 sm:px-2.5 sm:py-1 transition-colors select-none shrink-0"
              title="Return to Marketing Overview"
            >
              ← BACK TO OVERVIEW
            </Link>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--line)] bg-[var(--panel-2)] md:hidden">
              <Leaf className="h-3.5 w-3.5 text-[var(--terra)]" />
            </div>
            <div className="inline-flex items-center gap-2.5 font-editorial-mono text-[11px] sm:text-[12px] uppercase tracking-[0.14em] font-semibold text-[var(--terra)] select-none truncate">
              <span className="truncate">
                {PAGE_STAMPS[pathname] || `${(activeItem?.label ?? t(activeItem?.labelKey || "nav.dashboard")).toUpperCase()} // LIVE MONITORING`}
              </span>
              <span className="hidden sm:inline-block w-8 sm:w-12 h-[1px] bg-[var(--line)] shrink-0 self-center" aria-hidden="true" />
            </div>
          </div>

          {/* Right Header items: clock mono, language, ThemeToggleBox, bell SquareToggle with terra dot */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live clock mono */}
            <span className="hidden lg:inline-flex items-center px-2 py-1 font-editorial-mono text-xs text-[var(--ink-2)] tabular-nums border border-[var(--line)] bg-[var(--panel-2)] rounded-none">
              {clock}
            </span>

            {/* Live gateway chip */}
            <div className="hidden xs:inline-flex">
              <LivePill />
            </div>

            {/* WiFi RSSI Signal Indicator */}
            {mounted && (
              <div
                className="hidden xl:inline-flex items-center gap-1.5 px-2 py-1 font-editorial-mono text-[11px] border border-[var(--line)] bg-[var(--panel-2)] rounded-none text-[var(--ink-2)]"
                title={`WiFi RSSI: ${snapshot.rssi ?? -55} dBm`}
              >
                <Wifi
                  className={cn(
                    "h-3 w-3",
                    (snapshot.rssi ?? -55) >= -60
                      ? "text-[var(--moss)]"
                      : (snapshot.rssi ?? -55) >= -80
                        ? "text-[var(--gold)]"
                        : "text-[var(--terra)]",
                  )}
                />
                <span className="tabular-nums">{snapshot.rssi ?? -55} dBm</span>
              </div>
            )}

            {/* PWA install (mobile only) */}
            <InstallAppButton />

            {/* Language dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAlertsOpen(false);
                  setLangOpen((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-editorial-mono text-xs border border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink)] hover:bg-[var(--panel)] transition-colors rounded-none cursor-pointer"
                aria-label={t("common.language")}
              >
                <span>{activeLang?.nativeLabel ?? "English"}</span>
                <ChevronDown className="h-3 w-3 text-[var(--ink-3)]" />
              </button>
              {langOpen && (
                <>
                  <button aria-label="close" className="fixed inset-0 z-40 cursor-default" onClick={closeOverlays} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 border border-[var(--line)] bg-[var(--panel)] p-1 rounded-none shadow-xl font-editorial-mono">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l.code);
                          setLangOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors rounded-none cursor-pointer",
                          language === l.code
                            ? "bg-[var(--terra-soft)] font-bold text-[var(--terra)]"
                            : "text-[var(--ink-2)] hover:bg-[var(--panel-2)] hover:text-[var(--ink)]",
                        )}
                      >
                        <span>{l.nativeLabel}</span>
                        <span className="text-[10px] text-[var(--ink-3)]">{l.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme mode toggle box */}
            <ThemeToggleBox />

            {/* Alerts bell SquareToggle with terra dot */}
            <div className="relative">
              <SquareToggle
                onClick={() => {
                  setLangOpen(false);
                  if (!alertsOpen) markAlertsRead();
                  setAlertsOpen((v) => !v);
                }}
                active={alertsOpen}
                title={t("nav.alerts")}
                ariaLabel={t("nav.alerts")}
                className="relative w-8 h-8 rounded-none border-[var(--line)] bg-[var(--panel-2)]"
              >
                <Bell className="h-3.5 w-3.5" />
                {mounted && unread > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--terra)] ring-2 ring-[var(--panel)]" />
                )}
              </SquareToggle>
              {alertsOpen && (
                <>
                  <button aria-label="close" className="fixed inset-0 z-40 cursor-default" onClick={closeOverlays} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] border border-[var(--line)] bg-[var(--panel)] p-2 rounded-none shadow-2xl font-editorial-mono">
                    <div className="flex items-center justify-between border-b border-[var(--line)] px-2 py-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                        {t("common.recentAlerts")}
                      </span>
                      <Link
                        href="/app/alerts"
                        onClick={closeOverlays}
                        className="text-[10px] font-bold text-[var(--terra)] hover:underline"
                      >
                        {t("common.viewAll")}
                      </Link>
                    </div>
                    {lastFive.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-[var(--ink-3)]">{t("common.noAlerts")}</p>
                    ) : (
                      lastFive.map((a) => (
                        <div
                          key={a.id}
                          className="border-b border-[var(--line)] px-2.5 py-2 last:border-0 hover:bg-[var(--panel-2)] transition-colors"
                        >
                          <p className="truncate text-xs font-bold text-[var(--ink)]">{a.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--ink-2)]">{a.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* main id="main-scroll" is the ONLY scrollable container */}
        <main
          key={pathname}
          id="main-scroll"
          tabIndex={-1}
          aria-label="Main content"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 md:px-6 pb-28 md:pb-10 pt-4 relative z-10 outline-none"
        >
          <div className="relative mx-auto max-w-7xl">
            <RouteLiquidMorph routeKey={pathname}>
              <ErrorBoundary name={pathname}>
                <Suspense fallback={<PageSkeleton rows={3} />}>
                  {mounted && hydrated ? children : <PageSkeleton rows={3} />}
                </Suspense>
              </ErrorBoundary>
            </RouteLiquidMorph>
          </div>
        </main>
      </div>

      {/* ============ MOBILE BOTTOM NAV (Editorial Bordered Rail) ============ */}
      <nav aria-label="Primary" className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--line)] bg-[var(--panel)]">
        <div className="grid grid-cols-5 px-1 py-1 max-w-lg mx-auto">
          {MOBILE_TABS.map((tab) => {
            if ("key" in tab) {
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors rounded-none cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4 text-[var(--ink-3)]" />
                  <span className="truncate">{t("nav.more")}</span>
                </button>
              );
            }
            const Icon = tab.icon;
            const active = pathname === tab.href || pathname?.startsWith(tab.href + "/");
            const showBadge = tab.href === "/app/alerts" && unread > 0;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-1.5 font-editorial-mono text-[10px] uppercase tracking-wider transition-colors rounded-none select-none",
                  active
                    ? "text-[var(--terra)] font-bold bg-[var(--terra-soft)]"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn("h-4 w-4", active ? "text-[var(--terra)]" : "text-[var(--ink-3)]")}
                  />
                  {mounted && showBadge && (
                    <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-none bg-[var(--terra)] px-1 font-editorial-mono text-[8px] font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
                <span className="truncate">
                  {"label" in tab && tab.label ? tab.label : t(tab.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating live farm pill: fixed z-50 bottom-20 md:bottom-6 right-4 */}
      <LiveFarmPill className="fixed z-50 bottom-16 md:bottom-6 right-4" />

      {/* Wireless edge supervisor: auto LIVE/SIM watchdog (no UI) */}
      <MqttManager />

      {/* V2.5 a11y — screen-reader announcements for pump state + new alerts */}
      <LiveAnnouncer />

      {/* Floating mic trigger */}
      <FloatingMicButton />

      {/* Mobile More Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              aria-label={t("common.close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-[60] bg-black/70 md:hidden"
            />
            <motion.div
              ref={moreSheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="More destinations"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-x-0 bottom-0 z-[60] max-h-[80vh] overflow-y-auto rounded-none border-t border-[var(--line)] bg-[var(--panel)] p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:hidden font-editorial-mono"
            >
              <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--terra)]">
                  {`${t("nav.more")} // NAVIGATION`}
                </span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex h-7 w-7 items-center justify-center border border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)] hover:text-[var(--ink)] rounded-none"
                  aria-label={t("common.close")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {NAV_ITEMS.filter((n) => !MOBILE_TABS.some((m) => "href" in m && m.href === n.href)).map(({ href, label, labelKey, icon: Icon }) => {
                  const showBadge = href === "/app/alerts" && unread > 0;
                  const active = pathname === href || pathname?.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 border p-3 text-center text-[10px] font-bold uppercase tracking-wider transition-colors rounded-none",
                        active
                          ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]"
                          : "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--panel)]",
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4", active ? "text-[var(--terra)]" : "text-[var(--ink-3)]")}
                      />
                      <span className="truncate w-full">{label ?? t(labelKey)}</span>
                      {mounted && showBadge && (
                        <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-none bg-[var(--terra)] px-1 text-[8px] font-bold text-white">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <QuickActionsFAB />
      <AppToaster />
    </div>
    </MotionConfig>
  );
}
