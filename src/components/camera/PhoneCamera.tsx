"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PhoneCamera — field scanner capture via getUserMedia.
 * Works on mobile Chrome (rear camera) and laptop browsers. The farmer walks
 * the field, points the phone at a leaf and taps Capture. The still frame is
 * handed back as a canvas + data URL; analysis runs on-device and the image
 * never uploads anywhere.
 */
export default function PhoneCamera({
  onCapture,
  disabled = false,
}: {
  onCapture: (canvas: HTMLCanvasElement, dataUrl: string) => void;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [retryKey, setRetryKey] = useState(0);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  };

  useEffect(() => {
    let cancelled = false;

    async function initCamera() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        queueMicrotask(() => {
          if (!cancelled) setError("Camera not supported in this browser — use Upload instead.");
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => undefined);
        }
        setActive(true);
      } catch {
        if (!cancelled) {
          setError("Camera blocked — allow camera permission, or use Upload instead.");
        }
      }
    }

    void initCamera();

    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, retryKey]);

  const flip = () => {
    setError(null);
    setFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !active || v.videoWidth < 2) {
      toast.error("Camera not ready yet", {
        description: "Wait a second for the preview, then tap Capture.",
      });
      return;
    }
    const max = 480;
    const scale = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(v.videoWidth * scale));
    c.height = Math.max(1, Math.round(v.videoHeight * scale));
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      toast.error("Could not capture that frame");
      return;
    }
    ctx.drawImage(v, 0, 0, c.width, c.height);
    onCapture(c, c.toDataURL("image/jpeg", 0.85));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div className="relative aspect-[4/3] w-full bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={cn("h-full w-full object-cover", !active && "hidden")}
        />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-zinc-400">
              <CameraOff className="h-6 w-6" />
            </span>
            <p className="max-w-60 text-xs leading-relaxed text-zinc-400">
              {error ?? "Starting camera…"}
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setRetryKey((k) => k + 1);
              }}
              className="mt-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-zinc-200 hover:border-emerald-500/40 hover:text-emerald-200"
            >
              Retry camera
            </button>
          </div>
        )}
        {active && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            <div className="flex items-center gap-2 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px]">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-bold tracking-widest text-emerald-300">FIELD CAM</span>
            </div>
            <button
              type="button"
              onClick={flip}
              className="pointer-events-auto flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] font-bold text-zinc-200 hover:text-white"
            >
              <RefreshCw className="h-3 w-3" /> flip
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={capture}
        disabled={disabled || !active}
        className="flex w-full items-center justify-center gap-2 bg-emerald-500 px-4 py-3 text-sm font-extrabold text-black transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Camera className="h-4 w-4" /> Capture leaf
      </button>
    </div>
  );
}
