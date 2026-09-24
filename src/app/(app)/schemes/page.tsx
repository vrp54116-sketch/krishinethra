"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  Droplets,
  ExternalLink,
  FileText,
  FlaskConical,
  Globe2,
  HandCoins,
  Landmark,
  ListChecks,
  MapPin,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Tractor,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { Card, CardHeader } from "@/components/dashboard/ui";
import {
  getStatePortal,
  getVisibleSchemes,
  recommendSchemes,
  SCHEME_FILTERS,
  SCHEMES_LAST_VERIFIED,
  scoreAllSchemes,
  type GovScheme,
  type SchemeFilter,
  type StatePortal,
} from "@/lib/schemes-data";

function Rise({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const SCHEME_ICONS: Record<string, LucideIcon> = {
  "pm-kisan": HandCoins,
  pmfby: ShieldCheck,
  pmksy: Droplets,
  "pm-kusum": Sun,
  "soil-health-card": FlaskConical,
  kcc: CreditCard,
  nhm: Sprout,
  enam: Globe2,
  "gj-ikhedut-drip": Droplets,
  "gj-ikhedut-machinery": Tractor,
  "mh-mahadbt-drip": Droplets,
  "mh-mahadbt-solar": Sun,
  "other-state-dbt": Landmark,
};

const CATEGORY_TONE: Record<string, string> = {
  Insurance: "border-sky-400/40 bg-sky-500/10 text-sky-300",
  Subsidy: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  Loan: "border-violet-400/40 bg-violet-500/10 text-violet-300",
  Solar: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  "Income Support": "border-teal-400/40 bg-teal-500/10 text-teal-300",
};

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Printable one-page application checklist for a scheme.
 * Opens a minimal print window and calls window.print().
 */
function printSchemeChecklist(
  scheme: GovScheme,
  profile: { state: string; farmSizeAcres: number; hasPump: boolean; crops: string[] },
  portal: StatePortal,
  score?: number,
  reason?: string,
): void {
  const li = (items: string[]) =>
    items.map((t) => `<li><span class="box">☐</span><span>${escHtml(t)}</span></li>`).join("");
  const steps = scheme.howToApply
    .map((t, i) => `<li><span class="step">${i + 1}</span><span>${escHtml(t)}</span></li>`)
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<title>Application Checklist — ${escHtml(scheme.shortName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 24px; font-size: 12px; line-height: 1.5; }
  h1 { font-size: 18px; margin: 0 0 2px; }
  h2 { font-size: 13px; margin: 14px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
  .hindi { color: #444; font-size: 13px; margin-bottom: 6px; }
  .meta { color: #555; font-size: 11px; margin: 2px 0; }
  .benefit { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 8px 10px; margin: 10px 0; font-weight: bold; }
  .reason { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 8px 10px; margin: 8px 0; }
  ul, ol { list-style: none; padding: 0; margin: 6px 0; }
  li { display: flex; gap: 8px; margin: 4px 0; align-items: flex-start; }
  .box { font-size: 14px; line-height: 1.3; }
  .step { display: inline-flex; width: 18px; height: 18px; border-radius: 50%; background: #111; color: #fff; font-size: 11px; font-weight: bold; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .grid { display: flex; gap: 16px; }
  .grid > div { flex: 1; }
  .footer { margin-top: 14px; border-top: 1px solid #ddd; padding-top: 8px; font-size: 10.5px; color: #555; }
  .sign { display: flex; gap: 32px; margin-top: 18px; }
  .sign div { flex: 1; border-top: 1px solid #999; padding-top: 4px; font-size: 11px; color: #555; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>${escHtml(scheme.name)}</h1>
<div class="hindi">${escHtml(scheme.nameHindi)} · ${escHtml(scheme.shortName)} · ${escHtml(scheme.category)}</div>
<p class="meta">Farmer profile: ${escHtml(profile.state)} · ${escHtml(String(profile.farmSizeAcres))} acre(s) · ${profile.hasPump ? "has pump" : "no pump"} · grows ${escHtml((profile.crops || []).join(", ") || "—")}</p>
${typeof score === "number" ? `<p class="meta">Match score for your farm: <b>${score}/100</b></p>` : ""}
${reason ? `<div class="reason">${escHtml(reason)}</div>` : ""}
<div class="benefit">Benefit: ${escHtml(scheme.benefit)}</div>
<div class="grid"><div>
<h2>Eligibility — tick what applies to you</h2>
<ul>${li(scheme.eligibility)}</ul>
</div><div>
<h2>Documents needed — pack these</h2>
<ul>${li(scheme.documents)}</ul>
</div></div>
<h2>How to apply — 4 steps</h2>
<ol>${steps}</ol>
<h2>Where to apply</h2>
<p class="meta">Official portal: <b>${escHtml(scheme.websiteLabel)}</b> — ${escHtml(scheme.website)}<br />
Your state portal: <b>${escHtml(portal.name)}</b> — ${escHtml(portal.url)}</p>
<div class="sign"><div>Applicant signature + date</div><div>CSC / Taluka officer stamp + date</div></div>
<div class="footer">Last verified: ${escHtml(SCHEMES_LAST_VERIFIED)} · Verify on official portal before applying — subsidy rates and cut-off dates change by season.</div>
</body></html>`;
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  // Let the new document finish rendering before printing.
  w.setTimeout(() => w.print(), 350);
}

function MatchBadge({ score }: { score?: number }) {
  if (typeof score !== "number") return null;
  const tone =
    score >= 85
      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
      : score >= 70
        ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
        : "border-white/15 bg-white/[0.04] text-zinc-300";
  return (
    <span
      title="Eligibility match for your farm profile (0–100)"
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold tabular-nums",
        tone,
      )}
    >
      {score}/100 match
    </span>
  );
}

function SchemeCard({
  scheme,
  reason,
  score,
  profile,
  portal,
  defaultOpen = false,
}: {
  scheme: GovScheme;
  reason?: string;
  score?: number;
  profile: { state: string; farmSizeAcres: number; hasPump: boolean; crops: string[] };
  portal: StatePortal;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = SCHEME_ICONS[scheme.id] ?? BadgeCheck;

  return (
    <div className="card-surface overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 shadow-[0_0_16px_rgba(34,197,94,0.25)]">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm font-extrabold leading-snug text-white">{scheme.name}</h3>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-zinc-400">{scheme.nameHindi}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  CATEGORY_TONE[scheme.category] ?? "border-white/15 text-zinc-300",
                )}
              >
                {scheme.category}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                {scheme.shortName}
              </span>
              {scheme.scope === "state" && (
                <span className="inline-flex items-center rounded-full border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  {scheme.states?.includes("Other") ? "Your state" : scheme.states?.join(", ")}
                </span>
              )}
              <MatchBadge score={score} />
            </div>
          </div>
        </div>

        {/* Benefit — highlighted green */}
        <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2.5 text-[13px] font-bold leading-relaxed text-emerald-200">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          {scheme.benefit}
        </p>

        {reason && (
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-amber-200/90">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            {reason}
          </p>
        )}

        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Last verified: {SCHEMES_LAST_VERIFIED}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-white active:scale-[0.98]"
          >
            {open ? "Hide details" : "View details"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </button>
          <a
            href={scheme.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-extrabold text-black shadow-[0_0_16px_rgba(34,197,94,0.35)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
          >
            Apply <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
          </a>
        </div>
        <button
          type="button"
          onClick={() => printSchemeChecklist(scheme, profile, portal, score, reason)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-white active:scale-[0.98]"
        >
          <Printer className="h-3.5 w-3.5" /> 📋 Save Scheme Details
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-white/5 bg-black/40 p-4 text-[13px] leading-relaxed">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                  <UserCheck className="h-3.5 w-3.5" /> Eligibility
                </p>
                <ul className="mt-1.5 space-y-1">
                  {scheme.eligibility.map((e) => (
                    <li key={e} className="flex gap-2 text-zinc-200">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                  <ListChecks className="h-3.5 w-3.5" /> How to apply
                </p>
                <ol className="mt-1.5 space-y-1.5">
                  {scheme.howToApply.map((s, i) => (
                    <li key={s} className="flex gap-2 text-zinc-200">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-extrabold text-emerald-300">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                  <FileText className="h-3.5 w-3.5" /> Documents needed
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {scheme.documents.map((d) => (
                    <span
                      key={d}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-300"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={scheme.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 transition-colors hover:bg-emerald-500/20"
              >
                Official portal: {scheme.websiteLabel}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <p className="text-[11px] leading-relaxed text-zinc-500">
                Last verified: {SCHEMES_LAST_VERIFIED} · Verify on official portal before applying.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FALLBACK_PROFILE = {
  state: "Gujarat",
  farmSizeAcres: 1,
  hasPump: true,
  crops: ["tomato", "chili", "spinach"],
};

export default function SchemesPage() {
  const farmProfile = useFarmStore((s) => s.settings.farmProfile);
  const [filter, setFilter] = useState<SchemeFilter>("All");
  const [query, setQuery] = useState("");

  const profile = useMemo(() => {
    const p = farmProfile ?? FALLBACK_PROFILE;
    return {
      ...p,
      crops: Array.isArray(p.crops) && p.crops.length > 0 ? p.crops : FALLBACK_PROFILE.crops,
    };
  }, [farmProfile]);
  const portal = getStatePortal(profile.state);
  const visible = useMemo(() => getVisibleSchemes(profile.state), [profile.state]);

  const recommended = useMemo(() => recommendSchemes(profile), [profile]);

  /** All visible schemes scored 0-100 for this farm, best match first. */
  const scored = useMemo(() => scoreAllSchemes(profile), [profile]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scored.filter(({ scheme }) => {
      const s = scheme;
      if (filter !== "All" && s.category !== filter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.nameHindi.includes(query.trim()) ||
        s.shortName.toLowerCase().includes(q) ||
        s.benefit.toLowerCase().includes(q) ||
        s.eligibility.some((e) => e.toLowerCase().includes(q))
      );
    });
  }, [scored, filter, query]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* ===== Your state portal ===== */}
      <Rise>
        <Card className="border-sky-400/25">
          <CardHeader
            title={`Your state portal: ${portal.name}`}
            subtitle={`${profile.state} · ${portal.description}`}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                <MapPin className="h-4 w-4" />
              </span>
            }
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-200 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-100"
            >
              {portal.label} <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-extrabold text-black shadow-[0_0_16px_rgba(56,189,248,0.35)] transition-all hover:bg-sky-400 active:scale-[0.98]"
            >
              Open {portal.name} <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
            </a>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
            State-specific schemes below apply through this portal. Last verified: {SCHEMES_LAST_VERIFIED} ·
            Verify on official portal before applying.
          </p>
        </Card>
      </Rise>

      {/* ===== Recommended for YOU ===== */}
      <Rise>
        <Card className="border-amber-400/25">
          <CardHeader
            title="Recommended for YOU"
            subtitle={`${profile.state} · ${profile.farmSizeAcres} acre${profile.farmSizeAcres === 1 ? "" : "s"} · ${profile.hasPump ? "has pump" : "no pump"} · grows ${(profile.crops || []).join(", ") || "—"} · edit in Settings`}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <Sparkles className="h-4 w-4" />
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recommended.map(({ scheme, reason, score }, i) => (
              <div key={scheme.id} className="relative">
                <span className="absolute -top-2 left-3 z-10 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-black shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                  #{i + 1} for you · {score}/100
                </span>
                <div className="pt-1">
                  <SchemeCard
                    scheme={scheme}
                    reason={reason}
                    score={score}
                    profile={profile}
                    portal={portal}
                    defaultOpen={i === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Rise>

      {/* ===== Browse all: filters + search ===== */}
      <Rise delay={0.06}>
        <Card>
          <CardHeader
            title={`All Schemes for ${profile.state}`}
            subtitle={`${filtered.length}/${visible.length} schemes · sorted by match · Last verified: ${SCHEMES_LAST_VERIFIED}`}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                <Search className="h-4 w-4" />
              </span>
            }
          />
          <div className="mb-3 flex flex-wrap gap-2">
            {SCHEME_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition-all active:scale-[0.97]",
                  filter === f
                    ? "border-emerald-400/60 bg-emerald-500 text-black shadow-[0_0_16px_rgba(34,197,94,0.4)]"
                    : "border-white/10 bg-black/30 text-zinc-400 hover:border-emerald-500/30 hover:text-white",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <label className="relative mb-4 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search schemes… e.g. solar, insurance, KCC"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/50"
            />
          </label>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-500">
              No schemes match — try a different filter or search word.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {filtered.map(({ scheme, reason, score }) => (
                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  reason={reason}
                  score={score}
                  profile={profile}
                  portal={portal}
                />
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
            Summaries are for guidance only — subsidy rates and cut-off dates change by season. Last verified:{" "}
            {SCHEMES_LAST_VERIFIED}. Verify on official portal before applying, or check with your taluka
            agriculture office.
          </p>
        </Card>
      </Rise>
    </div>
  );
}
