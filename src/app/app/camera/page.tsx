"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, History, Info, ScanSearch, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import SimulatedCamera from "@/components/camera/SimulatedCamera";
import PanTiltPad from "@/components/camera/PanTiltPad";
import PhoneCamera from "@/components/camera/PhoneCamera";
import { setPendingCapture } from "@/components/camera/field-capture";
import LeafScanner, { diseaseDot } from "@/components/camera/LeafScanner";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { StatusPill } from "@/components/dashboard/ui";

type CameraTab = "live" | "scanner" | "history";

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
  const router = useRouter();
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
  const scans = useFarmStore((s) => s.scans);
  const useStream = cameraSource === "stream" && cameraStreamUrl.trim().length > 0;

  const tabs: Array<{ id: CameraTab; label: string; icon: typeof Video }> = [
    { id: "live", label: "Phone/Laptop Camera", icon: Camera },
    { id: "scanner", label: t("camera.leafScanner") || "Leaf Scanner", icon: ScanSearch },
    { id: "history", label: "Scan History", icon: History },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* Tabs with SegmentedControl */}
      <div className="w-full sm:w-fit sm:min-w-[420px]">
        <SegmentedControl
          options={tabs}
          value={tab}
          onChange={setTab}
          layoutId="camera-tabs"
          aria-label="Camera modes"
        />
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
              <PhoneCamera
                onCapture={(canvas, dataUrl) => {
                  setPendingCapture(canvas, dataUrl);
                  toast.success("Leaf captured — opening scanner", {
                    description: "Press SCAN to run on-device analysis.",
                  });
                  setTab("scanner");
                  router.push("/camera?tab=scanner");
                }}
              />
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.07] p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <Info className="h-4 w-4" />
                </span>
                <p className="text-xs leading-relaxed text-emerald-100/70">
                  Point your phone camera at a leaf and tap Capture — analysis
                  runs on-device, image never uploads. This is the field
                  scanner: walk the field and scan leaves live.
                </p>
              </div>
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
      ) : tab === "scanner" ? (
        <motion.div
          key="scanner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LeafScanner />
        </motion.div>
      ) : (
        <motion.div
          key="history"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card-surface rounded-2xl p-5"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              <History className="h-5 w-5 text-emerald-300" /> Plant Disease Diagnosis History
            </h3>
            <span className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-xs text-zinc-400">
              {scans.length} scan{scans.length === 1 ? "" : "s"} recorded
            </span>
          </div>
          {scans.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              No scans recorded yet. Use the Leaf Scanner tab to analyze crop leaves.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {scans.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/5 bg-black/40 p-4 transition-all hover:border-emerald-500/30"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: diseaseDot(s.disease) }}
                        />
                        <h4 className="text-sm font-bold text-white">{s.disease}</h4>
                      </div>
                      <StatusPill tone={s.severity === "none" ? "good" : s.severity === "mild" ? "info" : "warn"}>
                        {s.severity}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">
                      Confidence: {(s.confidence * 100).toFixed(0)}% · {s.imageName}
                    </p>
                    {s.treatmentNatural?.[0] && (
                      <p className="mt-2 rounded-lg bg-white/[0.03] p-2 text-[11px] leading-relaxed text-zinc-300">
                        🌱 {s.treatmentNatural[0]}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-zinc-500">
                    <span>{new Date(s.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className={s.resolved ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {s.resolved ? "Resolved" : "Active Plan"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
