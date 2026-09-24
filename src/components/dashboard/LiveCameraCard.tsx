"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Aperture, Camera, CameraOff, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "./ui";

/**
 * LiveCameraCard — laptop/phone webcam live feed for the dashboard.
 * Uses getUserMedia; snapshots are captured to a JPEG data URL and rendered
 * with next/image (quality 80) so stills stay optimized.
 */
export default function LiveCameraCard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Webcam not supported on this device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setActive(true);
      setError(null);
    } catch {
      setError("Camera unavailable — permission denied or no device found.");
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setSnapshot(canvas.toDataURL("image/jpeg", 0.8));
    toast.success("Snapshot captured");
  }, []);

  return (
    <Card interactive={false} className="overflow-hidden">
      <CardHeader
        title="Live Camera"
        subtitle="Laptop / device webcam"
        action={
          <div className="flex items-center gap-1.5">
            <span
              className={
                active
                  ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold tracking-widest text-emerald-300"
                  : "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold tracking-widest text-zinc-400"
              }
            >
              <span
                className={
                  active
                    ? "h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
                    : "h-1.5 w-1.5 rounded-full bg-zinc-600"
                }
              />
              {active ? "LIVE" : "OFF"}
            </span>
            <button
              type="button"
              onClick={active ? stop : start}
              aria-label={active ? "Stop webcam live feed" : "Start webcam live feed"}
              className="liquid-glass-pill inline-flex items-center gap-1.5 border border-white/15 px-3 py-1 text-[11px] font-bold text-zinc-200 transition-colors hover:border-emerald-400/50 hover:text-white cursor-pointer"
            >
              {active ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
              {active ? "Stop" : "Start"}
            </button>
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        {snapshot ? (
          <div className="relative aspect-video w-full">
            <Image
              src={snapshot}
              alt="Webcam snapshot of the farm feed"
              width={640}
              height={360}
              quality={80}
              className="h-full w-full object-cover"
              priority={false}
            />
            <button
              type="button"
              onClick={() => setSnapshot(null)}
              aria-label="Discard snapshot and return to live feed"
              className="liquid-glass-pill absolute right-2 top-2 inline-flex items-center gap-1 border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md transition-colors hover:border-emerald-400/50 cursor-pointer"
            >
              <RefreshCcw className="h-3 w-3" /> Live view
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              aria-label="Live webcam feed"
              className="aspect-video w-full object-cover"
            />
            {!active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-center">
                <Aperture className="h-7 w-7 text-emerald-400/80" />
                <p className="max-w-[28ch] px-4 text-xs text-zinc-400">
                  {error ?? "Start the webcam to watch the field feed from this device."}
                </p>
                {!error && (
                  <button
                    type="button"
                    onClick={start}
                    aria-label="Turn on webcam"
                    className="liquid-button liquid-button-primary mt-1 text-xs cursor-pointer"
                  >
                    <span className="liquid-button-label">Turn on camera</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {active && !snapshot && (
        <button
          type="button"
          onClick={capture}
          aria-label="Capture webcam snapshot"
          className="liquid-button liquid-button-primary mt-3 w-full text-sm cursor-pointer"
        >
          <span className="liquid-button-label inline-flex items-center gap-2">
            <Aperture className="h-4 w-4" /> Capture snapshot
          </span>
        </button>
      )}
    </Card>
  );
}
