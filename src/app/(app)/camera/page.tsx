"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Info, ScanSearch, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import SimulatedCamera from "@/components/camera/SimulatedCamera";
import PanTiltPad from "@/components/camera/PanTiltPad";
import LeafScanner from "@/components/camera/LeafScanner";

type CameraTab = "live" | "scanner";

/** Tab defs use translation keys so the header language toggle applies instantly. */
const TABS: { id: CameraTab; labelKey: string; icon: typeof Video }[] = [
  { id: "live", labelKey: "camera.liveView", icon: Video },
  { id: "scanner", labelKey: "camera.leafScanner", icon: ScanSearch },
];

/** LIVE-mode MJPEG frame (Raspberry Pi camera) in the same CCTV frame. */
function StreamFrame({ url }: { url: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Live MJPEG stream from the Raspberry Pi camera"
        className="h-auto w-full"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 font-mono text-[11px]">
        <div className="flex items-center gap-2 rounded-md bg-black/60 px-2 py-1">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
          <span className="font-bold tracking-widest text-red-400">LIVE</span>
        </div>
        <div className="rounded-md bg-black/60 px-2 py-1 font-bold tracking-wider text-emerald-300">
          CAM-01 · MJPEG
        </div>
      </div>
    </div>
  );
}

export default function CameraPage() {
  return (
    <Suspense fallback={null}>
      <CameraInner />
    </Suspense>
  );
}

function CameraInner() {
  const t = useT();
  const searchParams = useSearchParams();
  // Voice command deep-link: /camera?tab=scanner opens the leaf scanner.
  // Derived (no effect): a fresh mount reads the query, manual taps override.
  const requestedTab = searchParams?.get("tab");
  const [manualTab, setManualTab] = useState<CameraTab | null>(null);
  const tab: CameraTab =
    manualTab ?? (requestedTab === "scanner" ? "scanner" : "live");
  const setTab = (t: CameraTab) => setManualTab(t);
  const cameraSource = useFarmStore((s) => s.settings.cameraSource);
  const cameraStreamUrl = useFarmStore((s) => s.settings.cameraStreamUrl);
  const useStream = cameraSource === "stream" && cameraStreamUrl.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* Tabs */}
      <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/40 p-1 sm:w-fit sm:min-w-96">
        {TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold transition-all sm:text-sm",
              tab === id
                ? "bg-emerald-500 text-black shadow-[0_0_16px_rgba(34,197,94,0.4)]"
                : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" /> {t(labelKey)}
          </button>
        ))}
      </div>

      {tab === "live" ? (
        <motion.div
          key="live"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {useStream ? (
            <StreamFrame url={cameraStreamUrl} />
          ) : (
            <>
              <SimulatedCamera />
              <PanTiltPad />
            </>
          )}
          <div className="flex items-start gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/[0.07] p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
              <Info className="h-4 w-4" />
            </span>
            <p className="text-xs leading-relaxed text-sky-100/70">
              {cameraSource === "stream" ? t("camera.streamNote") : t("camera.simNote")}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="scanner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LeafScanner />
        </motion.div>
      )}
    </div>
  );
}
