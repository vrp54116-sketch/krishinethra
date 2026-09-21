"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Link2, QrCode } from "lucide-react";
import { useFarmStore } from "@/lib/store";

/**
 * ShareFarmLink — PWA + share: copies the hosted (Vercel) URL plus the farm
 * token instructions so a judge/farmer can open the app on ANY device and
 * join the same wireless edge. Shows a scannable QR of the URL.
 */
export function farmShareText(origin: string, token: string): string {
  return (
    `KrishiNethra AI — live farm link:\n${origin}\n\n` +
    `Join this farm:\n1. Open the link on any device\n` +
    `2. Settings → Wireless Edge Bridge → Farm token: ${token}\n` +
    `3. Press Connect — EDGE-LIVE starts when the ESP32 publishes.`
  );
}

export default function ShareFarmLink({ compact = false }: { compact?: boolean }) {
  const token = useFarmStore((s) => s.settings.mqttToken);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(!compact);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const url = origin || "https://your-vercel-app.vercel.app";

  const handleShare = async () => {
    const text = farmShareText(url, token || "patelfarm01");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success("Farm link copied", {
      description: "Share the URL + farm token — judges can join from any device.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-black shadow-[0_0_18px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {copied ? "Copied!" : "Share Farm Link"}
        </button>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          aria-expanded={showQr}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-bold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-emerald-200"
        >
          <QrCode className="h-4 w-4" /> QR
        </button>
      </div>
      <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-zinc-400">
        {url}
        <span className="text-zinc-600"> · token </span>
        <span className="font-bold text-emerald-300">{token || "patelfarm01"}</span>
      </p>
      {showQr && (
        <div className="mt-3 flex items-center gap-3">
          <div className="rounded-xl bg-white p-2.5">
            <QRCodeSVG value={url} size={112} level="M" />
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Judges scan to open this exact deployment, then paste the farm
            token in Settings → Wireless Edge Bridge and press Connect.
          </p>
        </div>
      )}
    </div>
  );
}
