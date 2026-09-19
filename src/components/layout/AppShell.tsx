"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * c;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
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
    if (!mounted) return;
    if (!onboardingDone) {
      router.replace("/");
      return;
    }
    if (appPinHash && !isAuthenticated) {
      router.replace("/");
    }
  }, [mounted, onboardingDone, appPinHash, isAuthenticated, router]);

  const [langOpen, setLangOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const unread = alerts.filter((a) => !a.read).length;
  const lastFive = alerts.slice(0, 5);

  const activeItem = NAV_ITEMS.find((n) => pathname === n.href || pathname?.startsWith(n.href + "/"));
  const pageTitle = activeItem ? t(activeItem.titleKey) : t("titles.dashboard");

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
      className="min-h-screen bg-transparent text-[#e7f5ec]"
      suppressHydrationWarning
    >
      {/* ============ DESKTOP SIDEBAR — floating glass panel (md+) ============ */}
      <aside className="glass-strong fixed bottom-4 left-4 top-4 z-40 hidden w-60 flex-col rounded-3xl md:flex">
        {/* Logo — leaf inside a glass circle with emerald glow */}
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <div className="glass-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-emerald-300 shadow-[0_0_18px_rgba(34,197,94,0.45)]">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-white">KrishiNethra AI</p>
            <p className="truncate text-[11px] text-emerald-200/60">{t("tagline").split("—")[0].trim() || "Har Khet Ka AI Doctor"}</p>
          </div>
        </div>

        {/* Nav — rounded-2xl rows; active = glass-inset pill + left glow bar */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            const showBadge = href === "/alerts" && unread > 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition-all",
                  active
                    ? "glass-inset pl-4 text-emerald-200"
                    : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-emerald-100",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                  />
                )}
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-emerald-300" : "text-zinc-500")} />
                <span className="truncate">{t(labelKey)}</span>
                {mounted && showBadge && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: health ring in glass circle + mode badge glass pill */}
        <div className="p-4">
          <div className="glass-inset flex items-center justify-between gap-3 rounded-2xl p-3">
            <div className="flex flex-col items-center gap-1">
              <div className="glass-pill rounded-full p-1.5">
                {mounted ? (
                  <HealthRing score={farmHealthScore} />
                ) : (
                  <div
                    aria-hidden
                    className="animate-pulse rounded-full bg-white/10"
                    style={{ width: 56, height: 56 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {t("common.farmHealth")}
              </span>
            </div>
            <span
              className="glass-pill rounded-full px-3 py-1.5 text-[11px] font-bold tracking-widest"
              style={
                isLive
                  ? {
                      borderColor: "rgba(52,211,153,0.5)",
                      color: "#a7f3d0",
                      boxShadow: "0 0 12px rgba(34,197,94,0.4)",
                    }
                  : {
                      borderColor: "rgba(251,191,36,0.45)",
                      color: "#fcd34d",
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
      <div className="flex min-h-screen flex-col md:pl-[272px]">
        {/* Top header — slim glass strip */}
        <header className="sticky top-0 z-30 px-4 pt-4 md:px-6">
          <div
            className="glass mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3"
            style={{ borderRadius: 16 }}
          >
            {/* Mobile logo */}
            <div className="glass-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-emerald-300 md:hidden">
              <Leaf className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-white sm:text-lg">{pageTitle}</h1>
              {mounted && (farmProfile?.farmerName || farmProfile?.farmName) && (
                <p className="truncate text-[11px] text-emerald-200/60">
                  {farmProfile?.farmerName ? `Namaste, ${farmProfile.farmerName.split(" ")[0]} 🌾` : ""}
                  {farmProfile?.farmerName && farmProfile?.farmName ? " · " : ""}
                  {farmProfile?.farmName || ""}
                </p>
              )}
            </div>

            {/* Live clock */}
            <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-zinc-300 sm:block">
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
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-emerald-500/40"
                aria-label={t("common.language")}
              >
                <span>{activeLang?.nativeLabel ?? "English"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              </button>
              {langOpen && (
                <>
                  <button aria-label="close" className="fixed inset-0 z-40 cursor-default" onClick={closeOverlays} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-emerald-500/25 bg-[#0a120c] shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l.code);
                          setLangOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition-colors",
                          language === l.code
                            ? "bg-emerald-500/15 font-bold text-white"
                            : "text-zinc-300 hover:bg-emerald-500/10 hover:text-white",
                        )}
                      >
                        <span>{l.nativeLabel}</span>
                        <span className="text-[10px] text-zinc-500">{l.label}</span>
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
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-200 transition-colors hover:border-emerald-500/40"
                aria-label={t("nav.alerts")}
              >
                <Bell className="h-4 w-4" />
                {mounted && unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
              {alertsOpen && (
                <>
                  <button aria-label="close" className="fixed inset-0 z-40 cursor-default" onClick={closeOverlays} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-emerald-500/25 bg-[#0a120c] shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
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
                        <div key={a.id} className="border-b border-white/5 px-3 py-2.5 last:border-0">
                          <p className="truncate text-xs font-semibold text-white">{a.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-400">{a.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Health pill chip */}
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-200 xs:flex sm:flex"
              title={t("common.farmHealthScore")}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  !mounted
                    ? "bg-zinc-600"
                    : farmHealthScore >= 70
                      ? "bg-emerald-400"
                      : farmHealthScore >= 40
                        ? "bg-amber-400"
                        : "bg-red-400",
                )}
              />
              {mounted ? Math.round(farmHealthScore) : "–"}
            </Link>
          </div>
        </header>

        {/* Page content — max-w-7xl centered, 24px gutters */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="flex-1 px-6 pb-56 pt-5 md:pb-14"
        >
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<PageSkeleton rows={2} />}>
              {mounted ? children : <PageSkeleton rows={2} />}
            </Suspense>
          </div>
        </motion.main>
      </div>

      {/* Signature Live Farm Pill — above tab bar / bottom-right */}
      <LiveFarmPill />

      {/* Floating voice trigger — every page */}
      <FloatingMicButton />

      {/* ============ MOBILE BOTTOM NAV — floating glass pill bar ============ */}
      <nav
        className="fixed inset-x-4 bottom-4 z-40 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="glass-strong rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="grid grid-cols-5 px-2 py-2">
            {MOBILE_TABS.map((tab) => {
              if ("key" in tab) {
                return (
                  <button
                    key="more"
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className="flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-emerald-200"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                    {t("nav.more")}
                    <span className="h-1 w-1 rounded-full bg-transparent" />
                  </button>
                );
              }
              const Icon = tab.icon;
              const active =
                pathname === tab.href || pathname?.startsWith(tab.href + "/");
              const showBadge = tab.href === "/alerts" && unread > 0;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-medium transition-colors",
                    active
                      ? "text-emerald-300"
                      : "text-gray-400 hover:bg-white/5 hover:text-emerald-100",
                  )}
                >
                  <span className={cn(active && "drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]")}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {t(tab.labelKey)}
                  {/* soft emerald glow dot under active icon */}
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full",
                      active
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                        : "bg-transparent",
                    )}
                  />
                  {mounted && showBadge && (
                    <span className="absolute right-1/2 top-0.5 flex h-4 min-w-4 translate-x-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
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
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-3xl border-t border-emerald-500/25 bg-[#060b08] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-white">{t("nav.more")}</span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-300"
                  aria-label={t("common.close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {NAV_ITEMS.filter((n) => !MOBILE_TABS.some((m) => "href" in m && m.href === n.href)).map(({ href, labelKey, icon: Icon }) => {
                  const showBadge = href === "/alerts" && unread > 0;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className="relative flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-2 py-4 text-center text-[11px] font-medium text-zinc-300 transition-colors hover:border-emerald-500/30 hover:text-white"
                    >
                      <Icon className="h-5 w-5 text-emerald-300" />
                      {t(labelKey)}
                      {mounted && showBadge && (
                        <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
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
