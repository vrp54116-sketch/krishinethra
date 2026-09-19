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
  ListChecks,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { Card, CardHeader } from "@/components/dashboard/ui";
import {
  recommendSchemes,
  SCHEME_FILTERS,
  SCHEMES,
  type GovScheme,
  type SchemeFilter,
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
};

const CATEGORY_TONE: Record<string, string> = {
  Insurance: "border-sky-400/40 bg-sky-500/10 text-sky-300",
  Subsidy: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  Loan: "border-violet-400/40 bg-violet-500/10 text-violet-300",
  Solar: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  "Income Support": "border-teal-400/40 bg-teal-500/10 text-teal-300",
};

function SchemeCard({
  scheme,
  reason,
  defaultOpen = false,
}: {
  scheme: GovScheme;
  reason?: string;
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SchemesPage() {
  const farmProfile = useFarmStore((s) => s.settings.farmProfile);
  const [filter, setFilter] = useState<SchemeFilter>("All");
  const [query, setQuery] = useState("");

  const recommended = useMemo(
    () => recommendSchemes(farmProfile ?? { state: "Gujarat", farmSizeAcres: 1, hasPump: true, crops: ["tomato", "chili", "spinach"] }),
    [farmProfile],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SCHEMES.filter((s) => {
      if (filter !== "All" && s.category !== filter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.benefit.toLowerCase().includes(q) ||
        s.eligibility.some((e) => e.toLowerCase().includes(q))
      );
    });
  }, [filter, query]);

  const profile = farmProfile ?? { state: "Gujarat", farmSizeAcres: 1, hasPump: true, crops: ["tomato", "chili", "spinach"] };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* ===== Recommended for YOU ===== */}
      <Rise>
        <Card className="border-amber-400/25">
          <CardHeader
            title="Recommended for YOU"
            subtitle={`${profile.state} · ${profile.farmSizeAcres} acre${profile.farmSizeAcres === 1 ? "" : "s"} · ${profile.hasPump ? "has pump" : "no pump"} · grows ${profile.crops.join(", ")} · edit in Settings`}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <Sparkles className="h-4 w-4" />
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recommended.map(({ scheme, reason }, i) => (
              <div key={scheme.id} className="relative">
                <span className="absolute -top-2 left-3 z-10 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-black shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                  #{i + 1} for you
                </span>
                <div className="pt-1">
                  <SchemeCard scheme={scheme} reason={reason} defaultOpen={i === 0} />
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
            title="All Schemes"
            subtitle={`${filtered.length}/${SCHEMES.length} schemes · verify details on official portal`}
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
              {filtered.map((s) => (
                <SchemeCard key={s.id} scheme={s} />
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
            Summaries are for guidance only — subsidy rates and cut-off dates change by season.
            Always verify on the linked official portal or your taluka agriculture office.
          </p>
        </Card>
      </Rise>
    </div>
  );
}
