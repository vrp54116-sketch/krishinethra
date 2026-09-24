"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
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
import AppToaster from "@/components/layout/AppToaster";
import QuickActionsFAB from "@/components/layout/QuickActionsFAB";
import LiveAnnouncer from "@/components/layout/LiveAnnouncer";
import { AmbientBackground, LiquidButton, ThemeToggle } from "@/components/ui/glass";
import { useFocusTrap } from "@/components/ui/glass/useFocusTrap";
import { useMounted } from "@/components/dashboard/ui";
import { getSectionAccent } from "@/lib/theme";

/** V2.5: active nav item always uses the emerald tint + left glow bar. */
const ACTIVE_EMERALD = {
  color: "#34D399",
  borderActive: "rgba(52, 211, 153, 0.60)",
  bgLight: "rgba(52, 211, 153, 0.12)",
  glowSubtle: "rgba(52, 211, 153, 0.10)",
};

/**
 * RouteLiquidMorph — liquid glass morph effect using SVG gooey filter:
 * - Wrap all route content in AnimatePresence with mode="wait"
 * - Exit: current page scales to 0.95, opacity 1→0, blur 0→20px in 300ms
 * - Enter: new page scales 1.05→1, opacity 0→1, blur 20px→0 in 300ms
 */
function RouteLiquidMorph({
  children,
  routeKey,
}: {
  children: React.ReactNode;
  routeKey: string;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={{
          opacity: 0,
          scale: 1.05,
          filter: "blur(20px)",
        }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
          filter: "blur(20px)",
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="w-full liquid-gooey"
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
  { href: "/dashboard", labelKey: "nav.dashboard", titleKey: "titles.dashboard", icon: LayoutDashboard },
  { href: "/camera", label: "📷 Leaf Scanner", labelKey: "nav.camera", titleKey: "titles.camera", icon: Camera },
  { href: "/irrigation", labelKey: "nav.irrigation", titleKey: "titles.irrigation", icon: Droplets },
  { href: "/climate", labelKey: "nav.climate", titleKey: "titles.climate", icon: CloudSun },
  { href: "/sensors", label: "🔌 Sensor Health", labelKey: "nav.sensors", titleKey: "titles.sensors", icon: Activity },
  { href: "/spray", labelKey: "nav.spray", titleKey: "titles.spray", icon: SprayCan },
  { href: "/fertilizer", labelKey: "nav.fertilizer", titleKey: "titles.fertilizer", icon: FlaskConical },
  { href: "/market", labelKey: "nav.market", titleKey: "titles.market", icon: TrendingUp },
  { href: "/schemes", labelKey: "nav.schemes", titleKey: "titles.schemes", icon: Landmark },
  { href: "/diary", labelKey: "nav.diary", titleKey: "titles.diary", icon: BookOpen },
  { href: "/tasks", labelKey: "nav.tasks", titleKey: "titles.tasks", icon: CheckSquare },
  { href: "/assistant", labelKey: "nav.assistant", titleKey: "titles.assistant", icon: MessageCircle },
  { href: "/reports", labelKey: "nav.reports", titleKey: "titles.reports", icon: BarChart3 },
  { href: "/alerts", labelKey: "nav.alerts", titleKey: "titles.alerts", icon: Bell },
  { href: "/voice", labelKey: "nav.voice", titleKey: "titles.voice", icon: Mic },
  { href: "/settings", labelKey: "nav.settings", titleKey: "titles.settings", icon: Settings },
];

const MOBILE_TABS: Array<NavItem | { key: "more" }> = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[9],
  { key: "more" },
];

function HealthRing({ score, size = 44 }: { score: number; size?: number }) {
  const strokeWidth = 4;
  const r = (size - strokeWidth * 2) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * c;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-white">
        {Math.round(score)}
      </span>
    </div>
  );
}

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
  const t = useT();
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="liquid-glass-strong flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.45)]">
        <Leaf className="h-5 w-5 text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold tracking-tight text-white">KrishiNethra AI</p>
        <p className="truncate text-[11px] font-medium text-emerald-200/60">
          {t("tagline").split("—")[0].trim() || "Har Khet Ka AI Doctor"}
        </p>
      </div>
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
  return (
    <div
      className={cn(
        "liquid-glass flex flex-col justify-between rounded-2xl p-3 border border-white/10 overflow-visible",
        className,
      )}
    >
      {/* Row 1: Farm Health ring in a liquid glass circle + score + LIVE badge */}
      <div className="flex items-center gap-3">
        <div className="liquid-glass-pill liquid-glass-strong shrink-0 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-emerald-500/30 shadow-[0_0_16px_rgba(52,211,153,0.3)]">
          {mounted ? (
            <HealthRing score={score} size={44} />
          ) : (
            <div
              aria-hidden
              className="h-[44px] w-[44px] animate-pulse rounded-full bg-white/10"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[18px] font-bold leading-tight text-white tracking-tight">
              {mounted ? `${Math.round(score)}/100` : "–/100"}
            </span>
            {mounted && chip === "live" && (
              <span className="liquid-glass-pill inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-1.5 py-px text-[9px] font-extrabold tracking-widest text-emerald-300 shadow-[0_0_8px_rgba(34,197,94,0.35)]">
                <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                LIVE
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            FARM HEALTH
          </span>
        </div>
      </div>

      {/* Row 2: full-width mode badge (SIMULATION / EDGE-LIVE / EDGE-LIVE·STALE) */}
      <div className="mt-2.5 w-full">
        <span
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-xl py-1 text-[11px] font-bold tracking-wider uppercase border",
            chip === "live"
              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
              : chip === "stale"
                ? "border-rose-400/50 bg-rose-500/10 text-rose-300"
                : "border-amber-400/40 bg-amber-500/10 text-amber-300",
          )}
        >
          {chip === "live" && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          )}
          {chip === "live"
            ? "EDGE-LIVE"
            : chip === "stale"
              ? "EDGE-LIVE·STALE"
              : t("common.simulation")}
        </span>
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
  const farmProfile = useFarmStore((s) => s.settings.farmProfile);
  const snapshot = useFarmStore((s) => s.snapshot);

  // Routing guard: wizard first, PIN-locked second.
  useEffect(() => {
    if (!mounted || !hydrated) return;
    if (!onboardingDone) {
      router.replace("/");
      return;
    }
    if (appPinHash && !isAuthenticated) {
      router.replace("/");
    }
  }, [mounted, hydrated, onboardingDone, appPinHash, isAuthenticated, router]);

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
  const pageTitle = activeItem ? t(activeItem.titleKey) : t("titles.dashboard");
  const currentAccent = getSectionAccent(pathname);

  const isLive = mode === "live";
  const activeLang = LANGUAGES.find((l) => l.code === language);

  const closeOverlays = () => {
    setLangOpen(false);
    setAlertsOpen(false);
  };

  // V2.5 a11y — trap focus inside the mobile "More" sheet, restore on close.
  const moreSheetRef = useFocusTrap<HTMLDivElement>(moreOpen, () => setMoreOpen(false));

  return (
    <MotionConfig reducedMotion="user">
    <div
      className="relative flex h-dvh w-full overflow-hidden bg-[#070B09] text-white"
      style={
        {
          "--section-accent": currentAccent.color,
          "--section-accent-rgb": currentAccent.rgb,
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <AmbientBackground />

      {/* V2.5 a11y — skip link jumps straight to the main scroll region */}
      <a
        href="#main-scroll"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] liquid-glass-pill liquid-glass-strong px-4 py-2 text-sm font-bold text-emerald-200 border border-emerald-400/40"
      >
        Skip to content
      </a>

      {/* ============ DESKTOP SIDEBAR (liquid glass panel, 16px margins) ============ */}
      <aside className="relative z-30 hidden md:flex w-64 shrink-0 h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col liquid-glass-strong m-4 mr-0 rounded-3xl">
        <LogoBlock className="shrink-0 px-4 pt-4 pb-2" />

        <nav aria-label="Primary" className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, labelKey, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            const showBadge = href === "/alerts" && unread > 0;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "liquid-glass-pill relative flex items-center gap-3 rounded-full px-3 py-2.5 text-[13px] font-medium transition-colors",
                  active
                    ? "pl-4"
                    : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-white",
                )}
                style={active ? { color: ACTIVE_EMERALD.color } : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    aria-hidden
                    className="absolute inset-0 rounded-full liquid-glass border"
                    style={{
                      borderColor: ACTIVE_EMERALD.borderActive,
                      backgroundColor: ACTIVE_EMERALD.bgLight,
                    }}
                  />
                )}
                {active && (
                  <motion.span
                    layoutId="sidebar-active-bar"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    aria-hidden
                    className="absolute left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full z-10"
                    style={{
                      backgroundColor: ACTIVE_EMERALD.color,
                      boxShadow: `0 0 10px ${ACTIVE_EMERALD.color}`,
                    }}
                  />
                )}
                <Icon
                  className="relative z-10 h-[18px] w-[18px] shrink-0 transition-colors"
                  style={{ color: active ? ACTIVE_EMERALD.color : "#9CA3AF" }}
                />
                <span className="relative z-10 truncate">{label ?? t(labelKey)}</span>
                {mounted && showBadge && (
                  <motion.span
                    key={unread}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(251,113,133,0.7)]"
                  >
                    {unread > 99 ? "99+" : unread}
                  </motion.span>
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
          className="shrink-0 m-3"
        />
      </aside>

      {/* ============ MAIN COLUMN ============ */}
      <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col">
        {/* Header: shrink-0 z-40 mx-3 mt-3 rounded-2xl glass */}
        <header className="shrink-0 z-40 mx-3 mt-3 rounded-2xl liquid-glass px-3.5 py-2.5 flex items-center gap-2 sm:gap-3">
          {/* Mobile logo */}
          <div className="liquid-glass-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.4)] md:hidden">
            <Leaf className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg sm:text-[22px] font-semibold text-white tracking-tight leading-tight">
              {pageTitle}
            </h1>
            {mounted && (farmProfile?.farmerName || farmProfile?.farmName) && (
              <p className="truncate text-[11px] font-medium text-emerald-200/60">
                {farmProfile?.farmerName ? `Namaste, ${farmProfile.farmerName.split(" ")[0]} 🌾` : ""}
                {farmProfile?.farmerName && farmProfile?.farmName ? " · " : ""}
                {farmProfile?.farmName || ""}
              </p>
            )}
          </div>

          {/* Live clock */}
          <span               className="liquid-glass-pill hidden items-center px-3 py-1.5 font-mono text-xs text-zinc-300 sm:inline-flex border border-white/10">
            {clock}
          </span>

          {/* LIVE gateway reachability (only in live mode) */}
          <LivePill />

          {/* WiFi RSSI Signal Indicator */}
          {mounted && (
            <div
              className="liquid-glass-pill hidden xs:inline-flex sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-white/10"
              title={`WiFi RSSI: ${snapshot.rssi ?? -55} dBm (${(snapshot.rssi ?? -55) >= -60 ? "Strong" : (snapshot.rssi ?? -55) >= -80 ? "Medium" : "Weak"})`}
            >
              <Wifi
                className={cn(
                  "h-3.5 w-3.5",
                  (snapshot.rssi ?? -55) >= -60
                    ? "text-emerald-400"
                    : (snapshot.rssi ?? -55) >= -80
                      ? "text-amber-400"
                      : "text-rose-400",
                )}
              />
              <span className="font-mono text-[11px] text-zinc-300">
                {snapshot.rssi ?? -55} dBm
              </span>
            </div>
          )}

          {/* PWA install (mobile only, appears when installable) */}
          <InstallAppButton />

          {/* Theme mode toggle */}
          <ThemeToggle />

          {/* Language switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAlertsOpen(false);
                setLangOpen((v) => !v);
              }}
              className="liquid-glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-white cursor-pointer"
              aria-label={t("common.language")}
            >
              <span>{activeLang?.nativeLabel ?? "English"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>
            {langOpen && (
              <>
                <button aria-label="close" className="fixed inset-0 z-40 cursor-default" onClick={closeOverlays} />
                <div className="liquid-glass-strong absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-emerald-500/25 p-1">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setLangOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors",
                        language === l.code
                          ? "bg-emerald-500/20 font-bold text-white shadow-[inset_0_0_8px_rgba(34,197,94,0.2)]"
                          : "text-zinc-300 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <span>{l.nativeLabel}</span>
                      <span className="text-[10px] text-zinc-400">{l.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Alerts bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setLangOpen(false);
                if (!alertsOpen) markAlertsRead();
                setAlertsOpen((v) => !v);
              }}
              className={cn(
                "liquid-glass-pill relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-white cursor-pointer",
                mounted && unread > 0 && "border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.35)]",
              )}
              aria-label={t("nav.alerts")}
            >
              <Bell className={cn("h-4 w-4", mounted && unread > 0 && "text-red-400 bell-pulse-red")} />
              {mounted && unread > 0 && (
                <motion.span
                  key={unread}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white shadow-[0_0_8px_rgba(239,68,68,0.9)] ring-2 ring-[#070B09]"
                >
                  {unread > 99 ? "99+" : unread}
                </motion.span>
              )}
            </button>
            {alertsOpen && (
              <>
                <button aria-label="close" className="fixed inset-0 z-40 cursor-default" onClick={closeOverlays} />
                <div className="liquid-glass-strong absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-emerald-500/25 p-1">
                  <div className="flex items-center justify-between border-b border-white/5 px-3 py-2.5">
                    <span className="text-xs font-bold text-white">{t("common.recentAlerts")}</span>
                    <Link href="/alerts" onClick={closeOverlays} className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200">
                      {t("common.viewAll")}
                    </Link>
                  </div>
                  {lastFive.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-zinc-500">{t("common.noAlerts")}</p>
                  ) : (
                    lastFive.map((a) => (
                      <div key={a.id} className="border-b border-white/5 px-3 py-2.5 last:border-0 hover:bg-white/[0.03] rounded-xl transition-colors">
                        <p className="truncate text-xs font-semibold text-white">{a.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-400">{a.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Health score chip */}
          <Link
            href="/dashboard"
            className="liquid-glass-pill hidden items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-200 border border-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.2)] transition-all hover:border-emerald-400/50 xs:flex sm:flex"
            title={t("common.farmHealthScore")}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                !mounted
                  ? "bg-zinc-600"
                  : farmHealthScore >= 70
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                    : farmHealthScore >= 40
                      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                      : "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.9)]",
              )}
            />
            <span>{mounted ? Math.round(farmHealthScore) : "–"}</span>
          </Link>
        </header>

        {/* main id="main-scroll" is the ONLY scrollable container */}
        <main
          id="main-scroll"
          tabIndex={-1}
          aria-label="Main content"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 md:px-6 pb-28 md:pb-10 pt-4 relative z-10 outline-none"
        >
          <div className="relative mx-auto max-w-7xl">
            <RouteLiquidMorph routeKey={pathname}>
              <Suspense fallback={<PageSkeleton rows={3} />}>
                {mounted && hydrated ? children : <PageSkeleton rows={3} />}
              </Suspense>
            </RouteLiquidMorph>
          </div>
        </main>
      </div>

      {/* ============ MOBILE BOTTOM NAV (liquid glass, mx-4 mb-4, rounded-full) ============ */}
      <nav aria-label="Primary" className="md:hidden fixed bottom-0 inset-x-0 z-50 pointer-events-none">
        <div className="liquid-glass-strong pointer-events-auto mx-4 mb-4 max-w-lg ml-auto mr-auto rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.65)] border border-white/12">
          <div className="grid grid-cols-5 px-2 py-1.5">
            {MOBILE_TABS.map((tab) => {
              if ("key" in tab) {
                return (
                  <button
                    key="more"
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-[10px] font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-emerald-200 cursor-pointer"
                  >
                    <div className="relative flex flex-col items-center">
                      <MoreHorizontal className="h-5 w-5 text-gray-400" />
                      <span className="mt-0.5 h-1 w-1 rounded-full bg-transparent" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 leading-tight">
                      {t("nav.more")}
                    </span>
                  </button>
                );
              }
              const Icon = tab.icon;
              const active = pathname === tab.href || pathname?.startsWith(tab.href + "/");
              const showBadge = tab.href === "/alerts" && unread > 0;
              const tabAccent = getSectionAccent(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="relative flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1 transition-colors"
                >
                  <div className="relative flex flex-col items-center">
                    <Icon
                      className="h-5 w-5 transition-transform"
                      style={
                        active
                          ? {
                              color: tabAccent.color,
                              filter: `drop-shadow(0 0 8px ${tabAccent.color})`,
                            }
                          : { color: "#9CA3AF" }
                      }
                    />
                    <span
                      className="mt-0.5 h-1 w-1 rounded-full transition-all"
                      style={
                        active
                          ? {
                              backgroundColor: tabAccent.color,
                              boxShadow: `0 0 8px ${tabAccent.color}`,
                            }
                          : { backgroundColor: "transparent" }
                      }
                    />
                    {mounted && showBadge && (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(251,113,133,0.8)]">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] leading-tight font-medium transition-colors"
                    style={
                      active
                        ? { color: tabAccent.color, fontWeight: 700 }
                        : { color: "#9CA3AF" }
                    }
                  >
                    {"label" in tab && tab.label ? tab.label : t(tab.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Floating live farm pill: fixed z-50 bottom-20 md:bottom-6 right-4 */}
      <LiveFarmPill className="fixed z-50 bottom-20 md:bottom-6 right-4" />

      {/* Wireless edge supervisor: auto LIVE/SIM + LCD mirror (no UI) */}
      <MqttManager />

      {/* V2.5 a11y — screen-reader announcements for pump state + new alerts */}
      <LiveAnnouncer />

      {/* Floating mic trigger */}
      <FloatingMicButton />

      {/* V2.1 mobile liquid FAB — Ask AI, left side clear of mic/pill/tabs */}
      <div className="fixed bottom-24 left-4 z-50 md:hidden">
        <LiquidButton
          icon={MessageCircle}
          iconOnly
          href="/assistant"
          variant="primary"
          aria-label="Ask KrishiGPT"
          title="Ask KrishiGPT"
        />
      </div>

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
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm md:hidden"
            />
            <motion.div
              ref={moreSheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="More destinations"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="liquid-glass-strong fixed inset-x-0 bottom-0 z-[60] max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-emerald-500/25 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-white">{t("nav.more")}</span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="liquid-glass-pill flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-white"
                  aria-label={t("common.close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {NAV_ITEMS.filter((n) => !MOBILE_TABS.some((m) => "href" in m && m.href === n.href)).map(({ href, label, labelKey, icon: Icon }) => {
                  const showBadge = href === "/alerts" && unread > 0;
                  const itemAccent = getSectionAccent(href);
                  const active = pathname === href || pathname?.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "glass-inset relative flex flex-col items-center gap-2 rounded-2xl p-3 text-center text-[11px] font-medium transition-all hover:bg-white/5",
                        active ? "border" : "text-zinc-300",
                      )}
                      style={
                        active
                          ? {
                              borderColor: itemAccent.borderActive,
                              backgroundColor: itemAccent.bgLight,
                              color: itemAccent.color,
                              boxShadow: `0 0 16px ${itemAccent.glowSubtle}`,
                            }
                          : undefined
                      }
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: active ? itemAccent.color : "#9CA3AF" }}
                      />
                      <span className="truncate w-full">{label ?? t(labelKey)}</span>
                      {mounted && showBadge && (
                        <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(251,113,133,0.8)]">
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
