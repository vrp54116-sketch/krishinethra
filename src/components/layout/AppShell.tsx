"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useIsPresent } from "framer-motion";
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
  Map,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Settings,
  SprayCan,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/types";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import FloatingMicButton from "@/components/voice/FloatingMicButton";
import LiveFarmPill from "@/components/layout/LiveFarmPill";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import PageSkeleton from "@/components/layout/PageSkeleton";
import { useMounted } from "@/components/dashboard/ui";
import { getSectionAccent } from "@/lib/theme";

function RouteTransitionWrapper({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "w-full",
        !isPresent && "absolute inset-0 w-full pointer-events-none",
      )}
    >
      {children}
    </motion.div>
  );
}

interface NavItem {
  href: string;
  labelKey: string;
  titleKey: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", titleKey: "titles.dashboard", icon: LayoutDashboard },
  { href: "/map", labelKey: "nav.map", titleKey: "titles.map", icon: Map },
  { href: "/camera", labelKey: "nav.camera", titleKey: "titles.camera", icon: Camera },
  { href: "/irrigation", labelKey: "nav.irrigation", titleKey: "titles.irrigation", icon: Droplets },
  { href: "/climate", labelKey: "nav.climate", titleKey: "titles.climate", icon: CloudSun },
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
  NAV_ITEMS[10],
  { key: "more" },
];

function HealthRing({ score, size = 56 }: { score: number; size?: number }) {
  const strokeWidth = size < 44 ? 4 : 5;
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
      <span className={cn("absolute inset-0 flex items-center justify-center font-bold text-white", size < 44 ? "text-[11px]" : "text-sm")}>
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

/** LIVE-mode gateway reachability pill (green/red dot). Rendered only
 *  when settings.mode === "live"; driven by the store's 2s hw poller. */
function LivePill() {
  const t = useT();
  const mode = useFarmStore((s) => s.settings.mode);
  const hwConnected = useFarmStore((s) => s.hwConnected);
  const hwLatencyMs = useFarmStore((s) => s.hwLatencyMs);
  if (mode !== "live") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold tracking-wider",
        hwConnected
          ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
          : "border-red-400/50 bg-red-500/10 text-red-200",
      )}
      title={
        hwConnected
          ? `Gateway reachable${hwLatencyMs != null ? ` · ${hwLatencyMs}ms` : ""}`
          : "Gateway unreachable — check Settings → Hardware Bridge"
      }
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          hwConnected ? "animate-pulse bg-emerald-400" : "bg-red-400",
        )}
      />
      {t("common.live")} •{" "}
      {hwConnected ? t("common.connected") : t("common.failed")}
    </span>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const clock = useClock();
  // Hydration gate: the farm store is seeded from Date.now() and the 1s
  // simulation tick applies Math.random() noise, so live values can never
  // match the server prerender. Everything derived from the store renders a
  // stable placeholder until mount, making the first client paint identical
  // to the server HTML (no hydration mismatch), then goes live.
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

  return (
    // suppressHydrationWarning: this shell is fully client-live (localStorage
    // store seeded from Date.now() + 1s random-noise tick), so its text can
    // legitimately differ from the server prerender — e.g. when the browser
    // hydrates with a stale HMR chunk. React then silently client-patches
    // instead of showing a hydration overlay. The mounted-gates above already
    // keep the consistent-version path exact; this is only a safety net.
    // NOTE: no opaque bg here — the ambient blobs must show around the
    // floating glass edges.
    <div
      className="min-h-screen bg-transparent text-[#F3F4F6]"
      suppressHydrationWarning
    >
      {/* ============ DESKTOP SIDEBAR — floating glass panel (md+) ============ */}
      <aside className="glass-strong fixed left-4 top-4 z-40 hidden h-[calc(100vh-32px)] w-60 flex-col rounded-3xl md:flex">
        {/* Logo — leaf inside a glass circle with emerald glow */}
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <div className="glass-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.45)]">
            <Leaf className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-white">KrishiNethra AI</p>
            <p className="truncate text-[11px] font-medium text-emerald-200/60">{t("tagline").split("—")[0].trim() || "Har Khet Ka AI Doctor"}</p>
          </div>
        </div>

        {/* Nav — rounded-2xl rows; active = glass-inset pill + left glow bar */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            const showBadge = href === "/alerts" && unread > 0;
            const itemAccent = getSectionAccent(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition-all",
                  active
                    ? "glass-inset pl-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                    : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-white",
                )}
                style={
                  active
                    ? {
                        color: itemAccent.color,
                        borderColor: itemAccent.borderActive,
                        backgroundColor: itemAccent.bgLight,
                      }
                    : undefined
                }
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full"
                    style={{
                      backgroundColor: itemAccent.color,
                      boxShadow: `0 0 10px ${itemAccent.color}`,
                    }}
                  />
                )}
                <Icon
                  className="h-[18px] w-[18px] shrink-0 transition-colors"
                  style={{ color: active ? itemAccent.color : "#9CA3AF" }}
                />
                <span className="truncate">{t(labelKey)}</span>
                {mounted && showBadge && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(251,113,133,0.7)]">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: health ring + mode badge in ONE row inside fixed-height glass card (h-[76px]) */}
        <div className="px-3 pb-4">
          <div className="glass-inset flex h-[76px] items-center justify-between gap-2.5 rounded-2xl px-3 py-2 border border-white/10 bg-black/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="glass-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 shadow-[0_0_12px_rgba(0,0,0,0.3)]">
                {mounted ? (
                  <HealthRing score={farmHealthScore} size={38} />
                ) : (
                  <div
                    aria-hidden
                    className="h-[38px] w-[38px] animate-pulse rounded-full bg-white/10"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {mounted ? Math.round(farmHealthScore) : "–"}/100
                </p>
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  {t("common.farmHealth")}
                </p>
              </div>
            </div>
            <span
              className="glass-pill shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase border"
              style={
                isLive
                  ? {
                      borderColor: "rgba(52,211,153,0.5)",
                      color: "#a7f3d0",
                      backgroundColor: "rgba(16,185,129,0.12)",
                      boxShadow: "0 0 12px rgba(34,197,94,0.4)",
                    }
                  : {
                      borderColor: "rgba(251,191,36,0.45)",
                      color: "#fcd34d",
                      backgroundColor: "rgba(245,158,11,0.10)",
                    }
              }
            >
              {isLive ? t("common.live") : t("common.simulation")}
            </span>
          </div>
        </div>
      </aside>

      {/* ============ MAIN COLUMN ============ */}
      {/* 272px = 16px margin + 240px floating sidebar + 16px gap */}
      <div
        className="flex min-h-screen flex-col md:pl-[272px]"
        style={
          {
            "--section-accent": currentAccent.color,
            "--section-accent-rgb": currentAccent.rgb,
          } as React.CSSProperties
        }
      >
        {/* Top header — slim glass strip */}
        <header className="sticky top-0 z-40 px-4 pt-4 md:px-6">
          <div className="glass mx-auto flex max-w-7xl items-center gap-2 px-3.5 py-2.5 rounded-2xl sm:gap-3 bg-[#070B09]/80 backdrop-blur-xl border border-white/10 shadow-lg">
            {/* Mobile logo */}
            <div className="glass-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-emerald-300 md:hidden border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_12px_rgba(52,211,153,0.4)]">
              <Leaf className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl sm:text-[28px] font-semibold text-white tracking-tight leading-tight">{pageTitle}</h1>
              {mounted && (farmProfile?.farmerName || farmProfile?.farmName) && (
                <p className="truncate text-[11px] font-medium text-emerald-200/60">
                  {farmProfile?.farmerName ? `Namaste, ${farmProfile.farmerName.split(" ")[0]} 🌾` : ""}
                  {farmProfile?.farmerName && farmProfile?.farmName ? " · " : ""}
                  {farmProfile?.farmName || ""}
                </p>
              )}
            </div>

            {/* Live clock */}
            <span className="glass-pill hidden items-center px-3 py-1.5 font-mono text-xs text-zinc-300 sm:inline-flex border border-white/10">
              {clock}
            </span>

            {/* LIVE gateway reachability (only in live mode) */}
            <LivePill />

            {/* PWA install (mobile only, appears when installable) */}
            <InstallAppButton />

            {/* Language switcher — glass pill chip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAlertsOpen(false);
                  setLangOpen((v) => !v);
                }}
                className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-white cursor-pointer"
                aria-label={t("common.language")}
              >
                <span>{activeLang?.nativeLabel ?? "English"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              </button>
              {langOpen && (
                <>
                  <button aria-label="close" className="fixed inset-0 z-40 cursor-default" onClick={closeOverlays} />
                  <div className="glass-strong absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-emerald-500/25 p-1 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
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

            {/* Alerts bell — glass circle button with red dot */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangOpen(false);
                  if (!alertsOpen) markAlertsRead();
                  setAlertsOpen((v) => !v);
                }}
                className="glass-pill relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-white cursor-pointer"
                aria-label={t("nav.alerts")}
              >
                <Bell className="h-4 w-4" />
                {mounted && unread > 0 && (
                  <span className="absolute right-1 top-1 flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] ring-2 ring-[#0a120c]" />
                )}
              </button>
              {alertsOpen && (
                <>
                  <button aria-label="close" className="fixed inset-0 z-40 cursor-default" onClick={closeOverlays} />
                  <div className="glass-strong absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-emerald-500/25 p-1 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
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
              className="glass-pill hidden items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-200 border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_12px_rgba(34,197,94,0.2)] transition-all hover:border-emerald-400/50 xs:flex sm:flex"
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
          </div>
        </header>

        {/* Page content — max-w-7xl centered, 24px gutters (px-6) */}
        <main className="relative z-10 flex-1 px-6 pb-60 pt-5 md:pb-16">
          <div className="relative mx-auto max-w-7xl">
            <AnimatePresence mode="wait" initial={false}>
              <RouteTransitionWrapper key={pathname} pathname={pathname}>
                <Suspense fallback={<PageSkeleton rows={3} />}>
                  {mounted && hydrated ? children : <PageSkeleton rows={3} />}
                </Suspense>
              </RouteTransitionWrapper>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Signature Live Farm Pill — above tab bar / bottom-right */}
      <LiveFarmPill />

      {/* Floating voice trigger — every page */}
      <FloatingMicButton />

      {/* ============ MOBILE BOTTOM NAV — floating glass pill bar ============ */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 pointer-events-none md:hidden px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="glass-strong pointer-events-auto mx-auto max-w-lg rounded-full backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] border border-white/12">
          <div className="grid grid-cols-5 px-2 py-1.5">
            {MOBILE_TABS.map((tab) => {
              if ("key" in tab) {
                return (
                  <button
                    key="more"
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-[10px] font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-emerald-200"
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
              const active =
                pathname === tab.href || pathname?.startsWith(tab.href + "/");
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
                    {/* section accent glow dot under icon */}
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
                    {t(tab.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ============ MORE SHEET ============ */}
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
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="glass-strong fixed inset-x-0 bottom-0 z-[60] max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-emerald-500/25 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:hidden backdrop-blur-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-white">{t("nav.more")}</span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="glass-pill flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-white"
                  aria-label={t("common.close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {NAV_ITEMS.filter((n) => !MOBILE_TABS.some((m) => "href" in m && m.href === n.href)).map(({ href, labelKey, icon: Icon }) => {
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
                      <span className="truncate w-full">{t(labelKey)}</span>
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
    </div>
  );
}
