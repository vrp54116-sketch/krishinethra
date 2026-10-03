"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  FlaskConical,
  History,
  MessageCircle,
  Plus,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Sprout,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFarm, useFarmStore } from "@/lib/store";
import {
  loadModel,
  classifyLeafImage,
  DISEASE_INFO,
  REJECTION_MESSAGE,
  type LeafClassification,
} from "@/lib/leaf-model";

const STORAGE_KEY = "krishinethra_leaf_scans_v2";

export interface StoredScanItem {
  id: string;
  thumbnail: string; // 96px dataURL
  date: string;
  timestamp: number;
  label: string;
  friendly: string;
  scientific: string;
  confidence: number;
  severity: "Low" | "Medium" | "High";
  spreadRisk: "High" | "Low" | "none";
  spreadRiskText: string;
  natural: string;
  chemical: string;
  prevention: string[];
  isRejected: boolean;
  rejectionMessage: string | null;
}

export function diseaseDotColor(name: string): string {
  const d = name.toLowerCase();
  if (d.includes("healthy")) return "#22c55e"; // green
  if (d.includes("virus")) return "#ef4444"; // red
  if (d.includes("spider")) return "#f97316"; // orange
  if (d.includes("mold")) return "#eab308"; // yellow
  if (d.includes("blight")) return "#f43f5e"; // rose
  if (d.includes("spot")) return "#a855f7"; // purple
  return "#38bdf8"; // sky
}

export default function LeafScanner() {
  const router = useRouter();
  const farm = useFarm();
  const addSprayPlan = useFarmStore((s) => s.addSprayPlan);

  // Model loading state
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");

  // Scanner states
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<LeafClassification | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [history, setHistory] = useState<StoredScanItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Single-frame camera capture state
  const [cameraLoading, setCameraLoading] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Hidden file input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. On mount show spinner "Loading AI model…" via loadModel();
  // if null show honest error card "Model unavailable — check that public/model files exist"
  // and disable scan buttons.
  useEffect(() => {
    let isMounted = true;
    loadModel()
      .then((m) => {
        if (!isMounted) return;
        if (m) {
          setModelStatus("ready");
        } else {
          setModelStatus("error");
        }
      })
      .catch((err) => {
        console.error("Leaf model loading error:", err);
        if (isMounted) setModelStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load history from localStorage (last 10 scans)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 10));
        }
      }
    } catch (e) {
      console.error("Failed to load leaf scan history from localStorage", e);
    }
  }, []);

  // Save scan to history (last 10 scans in localStorage)
  const saveToHistory = (item: StoredScanItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.filter((i) => i.id !== item.id)].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to write leaf scan history to localStorage", e);
      }
      return updated;
    });
  };

  // Generate 96px thumbnail dataURL as requested
  const create96pxThumbnail = (sourceCanvas: HTMLCanvasElement): string => {
    try {
      const thumb = document.createElement("canvas");
      thumb.width = 96;
      thumb.height = 96;
      const ctx = thumb.getContext("2d");
      if (ctx) {
        ctx.drawImage(sourceCanvas, 0, 0, 96, 96);
        return thumb.toDataURL("image/jpeg", 0.85);
      }
    } catch {
      // fallback
    }
    return sourceCanvas.toDataURL("image/jpeg", 0.7);
  };

  // Run real analysis on 224x224 canvas
  const analyzeCanvas = async (sourceCanvas: HTMLCanvasElement) => {
    setScanning(true);
    setRejection(null);
    setResult(null);
    setSelectedHistoryId(null);

    try {
      const classification = await classifyLeafImage(sourceCanvas, farm.temp, farm.hum);

      if (!classification) {
        toast.error("Analysis failed", {
          description: "Model unavailable — check that public/model files exist",
        });
        setModelStatus("error");
        return;
      }

      const thumbnail96 = create96pxThumbnail(sourceCanvas);
      const scanDate = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      // REJECTION RULE: if label === "Not A Leaf" OR confidence < 0.60
      if (classification.isRejected) {
        setRejection(REJECTION_MESSAGE);
        setResult(null);

        const record: StoredScanItem = {
          id: `scan_${Date.now()}`,
          thumbnail: thumbnail96,
          date: scanDate,
          timestamp: Date.now(),
          label: classification.label,
          friendly: classification.friendly,
          scientific: classification.scientific,
          confidence: classification.confidence,
          severity: classification.severity,
          spreadRisk: classification.spreadRisk,
          spreadRiskText: classification.spreadRiskText,
          natural: classification.natural,
          chemical: classification.chemical,
          prevention: classification.prevention,
          isRejected: true,
          rejectionMessage: REJECTION_MESSAGE,
        };

        saveToHistory(record);
        setSelectedHistoryId(record.id);

        toast.error("Leaf not recognized", {
          description: "Please upload a clear photo of ONE tomato leaf.",
        });
        return;
      }

      // Valid leaf diagnosis
      setRejection(null);
      setResult(classification);

      const record: StoredScanItem = {
        id: `scan_${Date.now()}`,
        thumbnail: thumbnail96,
        date: scanDate,
        timestamp: Date.now(),
        label: classification.label,
        friendly: classification.friendly,
        scientific: classification.scientific,
        confidence: classification.confidence,
        severity: classification.severity,
        spreadRisk: classification.spreadRisk,
        spreadRiskText: classification.spreadRiskText,
        natural: classification.natural,
        chemical: classification.chemical,
        prevention: classification.prevention,
        isRejected: false,
        rejectionMessage: null,
      };

      saveToHistory(record);
      setSelectedHistoryId(record.id);

      toast.success(`Diagnosis: ${classification.friendly}`, {
        description: `Confidence ${Math.round(classification.confidence * 100)}% · Severity: ${classification.severity}`,
      });
    } catch (err) {
      console.error("Leaf inference error:", err);
      toast.error("Analysis failed", {
        description: "An error occurred during TensorFlow inference.",
      });
    } finally {
      setScanning(false);
    }
  };

  // Handle uploaded file (jpg/png)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/\.(jpe?g|png)$/i.test(file.name) || !["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a JPG or PNG leaf image.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0, 224, 224);
          setPreviewUrl(url);
          void analyzeCanvas(canvas);
        }
      };
      img.onerror = () => {
        toast.error("Could not load image file");
      };
      img.src = url;
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  // Start single-frame camera capture via getUserMedia
  const startCameraCapture = async () => {
    setCameraLoading(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error("Could not read frame from camera."));
      });
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Could not initialize image capture context.");

      ctx.drawImage(video, 0, 0, 224, 224);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      // Stop camera stream tracks immediately after capturing single frame
      stopCamera();

      setPreviewUrl(dataUrl);
      void analyzeCanvas(canvas);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Camera access denied.";
      toast.error("Camera unavailable", {
        description: msg,
      });
    } finally {
      stopCamera();
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // [Add to Spray Plan] button handler
  const handleAddToSprayPlan = () => {
    if (!result) return;

    const todayISO = new Date().toISOString().slice(0, 10);
    const steps = [
      {
        day: 1,
        action: `Natural treatment: ${result.natural}`,
        done: false,
      },
      {
        day: 3,
        action: "Inspect foliage for disease spread or new lesions",
        done: false,
      },
      ...(result.chemical &&
      result.chemical !== "None required" &&
      result.chemical !== "None effective against viruses"
        ? [
            {
              day: 7,
              action: `Chemical emergency fallback: ${result.chemical}`,
              done: false,
            },
          ]
        : [
            {
              day: 5,
              action: `Repeat application: ${result.natural}`,
              done: false,
            },
          ]),
    ];

    addSprayPlan({
      disease: result.friendly,
      zone: "Zone A",
      startDate: todayISO,
      steps,
    });

    toast.success("Added to spray plan");
  };

  // [Ask KrishiGPT about this] button handler
  const handleAskKrishiGPT = () => {
    if (!result) return;
    const query = `Tell me more about ${result.friendly} on tomato and how to stop it spreading`;
    router.push(`/assistant?q=${encodeURIComponent(query)}`);
  };

  // Click reopens that result card from history
  const handleReopenHistory = (item: StoredScanItem) => {
    setSelectedHistoryId(item.id);
    setPreviewUrl(item.thumbnail);

    if (item.isRejected) {
      setRejection(REJECTION_MESSAGE);
      setResult(null);
      toast.info("Reopened scan: Rejected non-leaf photo");
      return;
    }

    setRejection(null);

    // Recompute live risk with current temperature and humidity
    const info = DISEASE_INFO[item.label] || {
      friendly: item.friendly,
      scientific: item.scientific,
      natural: item.natural,
      chemical: item.chemical,
      prevention: item.prevention,
      risk: () => ({ level: item.spreadRisk, isHigh: item.spreadRisk === "High", text: item.spreadRiskText, toString: () => item.spreadRiskText, valueOf: () => item.spreadRiskText }),
    };

    const liveRisk = info.risk(farm.temp, farm.hum);

    const reloaded: LeafClassification = {
      label: item.label,
      friendly: item.friendly,
      scientific: item.scientific,
      confidence: item.confidence,
      severity: item.severity,
      spreadRisk: liveRisk.level,
      spreadRiskText: liveRisk.text,
      natural: item.natural,
      chemical: item.chemical,
      prevention: item.prevention,
      isRejected: false,
      rejectionMessage: null,
      allProbabilities: [],
    };

    setResult(reloaded);
    toast.info(`Reopened: ${item.friendly}`, {
      description: `Scanned on ${item.date}`,
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Model Loading Spinner */}
      {modelStatus === "loading" && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-500/20 border-t-emerald-400" />
          <p className="mt-3 text-sm font-bold text-emerald-300">Loading AI model…</p>
          <p className="mt-1 text-xs text-zinc-400">
            Initializing 11-class tomato neural network on-device
          </p>
        </div>
      )}

      {/* Honest Error Card */}
      {modelStatus === "error" && (
        <div className="rounded-2xl border-2 border-red-500/50 bg-red-950/60 p-6 text-center text-red-200">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-2" />
          <h4 className="text-base font-extrabold text-red-100">
            Model unavailable — check that public/model files exist
          </h4>
          <p className="mt-1 text-xs text-red-300/80">
            Could not load TensorFlow.js model weights from /model/tomato/model.json or fallback /model/model.json.
            Scanning buttons are disabled.
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCANNER CONTROLS & PREVIEW TILE                              */}
      {/* Keeps ONLY: [Upload Image], [Capture Frame], preview tile    */}
      {/* ============================================================ */}
      <div className="card-surface rounded-2xl border border-white/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-emerald-400" />
              Real Tomato Leaf Doctor
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              11-class on-device TensorFlow.js model · 10 tomato conditions + non-leaf rejection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono font-bold border",
                modelStatus === "ready"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : modelStatus === "loading"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : "bg-red-500/15 text-red-300 border-red-500/30"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  modelStatus === "ready"
                    ? "bg-emerald-400 animate-pulse"
                    : modelStatus === "loading"
                      ? "bg-amber-400"
                      : "bg-red-400"
                )}
              />
              {modelStatus === "ready" ? "11-CLASS MODEL ONLINE" : modelStatus === "loading" ? "LOADING MODEL" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Buttons Row: [Upload Image] & [Capture Frame] */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={modelStatus !== "ready" || scanning || cameraLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-extrabold text-emerald-200 transition-all hover:bg-emerald-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            Upload Image (JPG / PNG)
          </button>

          <button
            type="button"
            onClick={startCameraCapture}
            disabled={modelStatus !== "ready" || scanning || cameraLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm font-extrabold text-sky-200 transition-all hover:bg-sky-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cameraLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {cameraLoading ? "Capturing frame…" : "Capture Frame"}
          </button>
        </div>

        {/* Preview Tile */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-2">
            <span>Leaf Preview Tile</span>
            {previewUrl && (
              <span className="text-emerald-400 font-mono text-[11px]">224 × 224 Tensor Ready</span>
            )}
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border-2 border-dashed border-white/15 bg-black/40 flex items-center justify-center">
            {previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Scanned tomato leaf preview"
                  className="h-full w-full object-cover"
                />

                {/* Laser scan animation when actively analyzing */}
                <AnimatePresence>
                  {scanning && (
                    <motion.div
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="absolute inset-0 bg-emerald-500/10" />
                      <motion.div
                        className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-emerald-400/80 to-transparent shadow-[0_0_24px_rgba(34,197,94,0.9)]"
                        initial={{ top: "-10%" }}
                        animate={{ top: ["-10%", "105%", "-10%"] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-emerald-300/80 shadow-[0_0_8px_rgba(52,211,153,1)]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                <Sprout className="h-12 w-12 text-zinc-600 mb-2" />
                <p className="text-sm font-semibold text-zinc-400">No Leaf Selected</p>
                <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                  Upload a photo or tap Capture Frame to analyze your tomato plant for disease with TensorFlow.js.
                </p>
              </div>
            )}
          </div>

          {scanning && (
            <p className="mt-3 text-center text-xs font-bold text-emerald-300 animate-pulse flex items-center justify-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Running TensorFlow.js neural network inference…
            </p>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* RESULT CARDS                                                 */}
      {/* Rejection Card OR Diagnosis Card                             */}
      {/* ============================================================ */}
      <AnimatePresence mode="wait">
        {/* REJECTION CARD: Red Card when Not A Leaf or confidence < 0.60 */}
        {rejection && !scanning && (
          <motion.div
            key="rejection"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border-2 border-red-500/80 bg-red-950/70 p-6 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.25)]"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 shadow-inner">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-red-200 uppercase tracking-wider">
                    Invalid Leaf Photo
                  </h3>
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-red-300 border border-red-500/30">
                    SCAN REJECTED
                  </span>
                </div>
                <p className="text-sm font-semibold leading-relaxed text-red-50">
                  {rejection}
                </p>
                <p className="text-xs text-red-300/80">
                  The model did not find a tomato leaf with sufficient confidence (&ge; 60%). Ensure good lighting and a single leaf in focus.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* DIAGNOSIS CARD: Valid Leaf Disease Result */}
        {result && !rejection && !scanning && (
          <motion.div
            key="diagnosis"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="card-surface rounded-2xl border border-emerald-500/30 p-5 sm:p-6 space-y-5"
          >
            {/* Header: Friendly Name Big + Scientific Name Italic */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI Plant Disease Diagnosis
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: diseaseDotColor(result.friendly) }}
                  />
                  {result.friendly}
                </h3>
                {result.scientific && result.scientific !== "-" && (
                  <p className="text-sm italic font-medium text-emerald-300/80">
                    {result.scientific}
                  </p>
                )}
              </div>

              {/* Severity: confidence <70 Low, 70-85 Medium, >85 High */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Severity</span>
                <span
                  className={cn(
                    "mt-0.5 rounded-full px-3 py-1 text-xs font-mono font-black uppercase tracking-wider border",
                    result.severity === "Low"
                      ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                      : result.severity === "Medium"
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                  )}
                >
                  {result.severity} Severity
                </span>
              </div>
            </div>

            {/* Confidence Percentage with Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-400">Confidence Score</span>
                <span className="font-mono font-black text-emerald-300 text-sm">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(result.confidence * 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-sky-400 shadow-[0_0_12px_rgba(34,197,94,0.6)]"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Severity rule: &lt;70% Low · 70–85% Medium · &gt;85% High
              </p>
            </div>

            {/* SPREAD RISK line computed from LIVE store temp/hum */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Live Farm Spread Risk
                </span>
                <span
                  className={cn(
                    "rounded-md px-2.5 py-0.5 text-xs font-mono font-extrabold uppercase",
                    result.spreadRisk === "High"
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : result.spreadRisk === "none"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  )}
                >
                  {result.spreadRisk === "none" ? "No Risk" : result.spreadRisk}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-200 leading-relaxed font-semibold">
                {result.spreadRiskText}
              </p>
              <div className="mt-2 flex items-center gap-4 text-[11px] text-zinc-400 font-mono">
                <span>Live Temp: <strong className="text-zinc-200">{farm.temp.toFixed(1)}°C</strong></span>
                <span>Live Humidity: <strong className="text-zinc-200">{farm.hum.toFixed(0)}%</strong></span>
              </div>
            </div>

            {/* Treatment block: NATURAL FIRST box (green), CHEMICAL FALLBACK box (amber), PREVENTION list */}
            <div className="space-y-3">
              {/* Natural First Box (Green) */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Natural Treatment (First Choice)
                  </h4>
                </div>
                <p className="text-sm font-semibold leading-relaxed text-emerald-100">
                  {result.natural}
                </p>
              </div>

              {/* Chemical Fallback Box (Amber, with safety-period text) */}
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300">
                  <FlaskConical className="h-4 w-4 text-amber-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Chemical Fallback (Safety-Period Specified)
                  </h4>
                </div>
                <p className="text-sm font-semibold text-amber-100">
                  {result.chemical}
                </p>
              </div>

              {/* Prevention Bullet List */}
              {result.prevention && result.prevention.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Agronomic Prevention Rules
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-300 font-medium">
                    {result.prevention.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS: [Add to Spray Plan] and [Ask KrishiGPT about this] */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToSprayPlan}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" /> Add to Spray Plan
              </button>

              <button
                type="button"
                onClick={handleAskKrishiGPT}
                className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-extrabold text-sky-200 transition-all hover:bg-sky-500/20 active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" /> Ask KrishiGPT about this
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* HISTORY: Last 10 scans in localStorage                       */}
      {/* Thumbnail dataURL 96px, date, friendly label, confidence     */}
      {/* Grid under scanner; click reopens that result card           */}
      {/* ============================================================ */}
      <div className="card-surface rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            Scan History
          </h3>
          <span className="font-mono text-xs text-zinc-400">
            {history.length} / 10 scans
          </span>
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-zinc-500">
            No scans recorded yet. Upload a leaf photo or capture a frame from your camera to diagnose tomato diseases.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {history.map((item) => {
              const active = selectedHistoryId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleReopenHistory(item)}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl border text-left transition-all active:scale-[0.97]",
                    active
                      ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                      : "border-white/10 bg-black/40 hover:border-emerald-500/40"
                  )}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-black/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnail}
                      alt={item.friendly}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span
                      className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border border-black/50"
                      style={{
                        backgroundColor: item.isRejected
                          ? "#ef4444"
                          : diseaseDotColor(item.friendly),
                      }}
                    />
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="truncate text-xs font-bold text-white">
                      {item.isRejected ? "Rejected (Non-Leaf)" : item.friendly}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="font-mono">
                        {Math.round(item.confidence * 100)}%
                      </span>
                      <span
                        className={cn(
                          "font-bold uppercase",
                          item.severity === "High"
                            ? "text-red-400"
                            : item.severity === "Medium"
                              ? "text-amber-400"
                              : "text-sky-400"
                        )}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="truncate text-[9px] text-zinc-500">
                      {item.date}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
