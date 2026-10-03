"use client";

import { memo } from "react";
import { CheckCircle2, Wifi } from "lucide-react";
import { useT } from "@/lib/i18n";

export default memo(function OfflineResilienceCard() {
  const t = useT();
  return (
    <section aria-label="Offline resilience" className="h-full border border-[var(--line)] bg-[var(--panel)] p-5">
      <h2 className="mb-4 flex items-center gap-2 border-b border-[var(--line)] pb-3 font-editorial-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-2)]">
        <Wifi className="h-4 w-4 text-sky-400" /> {t("offline.title")}
      </h2>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-bold text-emerald-300">{t("offline.works")}</p>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-emerald-100"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{t("offline.worksList")}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-amber-300">{t("offline.needs")}</p>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-100"><Wifi className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />{t("offline.needsList")}</p>
        </div>
      </div>
    </section>
  );
});
