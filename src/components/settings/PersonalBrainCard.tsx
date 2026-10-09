"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Brain,
  Cpu,
  Sparkles,
  RefreshCw,
  Clock,
  TrendingDown,
  Droplets,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Database,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import trainer, {
  type BrainState,
  type BrainStats,
  type BrainCadence,
  type CrossingPrediction,
  type TrainingProgress,
  getBrainCadence,
  setBrainCadence,
  getBrainState,
  getStoredBrainStats,
  getStoredVersions,
  trainNow,
  predictCrossing,
  subscribeTrainingProgress,
  subscribeBrainState,
  seedSimulationTelemetry,
  forceTelemetryRows,
} from "@/lib/brain/trainer";
import { useFarmStore } from "@/lib/store";

export default function PersonalBrainCard({ className }: { className?: string }) {
  const [brainState, setBrainState] = useState<BrainState>({
    status: "COLLECTING",
    current: 0,
    required: 200,
    message: "COLLECTING(0/200)",
    version: null,
    mae: null,
    lastTrainedTs: null,
  });

  const [brainStats, setBrainStats] = useState<BrainStats | null>(null);
  const [cadence, setCadence] = useState<BrainCadence>("hourly");
  const [prediction, setPrediction] = useState<CrossingPrediction | null>(null);
  const [trainingCurve, setTrainingCurve] = useState<TrainingProgress[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [, startTransition] = useTransition();

  const updateSettings = useFarmStore((s) => s.updateSettings);
  const live = useFarmStore((s) => s.live);
  const snapshot = useFarmStore((s) => s.snapshot);

  const refreshAll = async () => {
    try {
      const state = await getBrainState();
      setBrainState(state);
      const stats = getStoredBrainStats();
      setBrainStats(stats);
      const cad = getBrainCadence();
      setCadence(cad);

      const cross = await predictCrossing({
        soil: live?.soil ?? snapshot?.soil ?? 45,
        temp: live?.temp ?? snapshot?.temp ?? 28,
        hum: live?.hum ?? snapshot?.hum ?? 60,
        aqi: live?.aqi ?? snapshot?.aqi ?? 85,
      });
      setPrediction(cross);
    } catch (e) {
      console.error("Failed to load brain state", e);
    }
  };

  useEffect(() => {
    void refreshAll();

    const unsubProgress = subscribeTrainingProgress((progress) => {
      setTrainingCurve((prev) => {
        const next = [...prev, progress];
        return next.slice(-30);
      });
    });

    const unsubState = subscribeBrainState((st) => {
      setBrainState(st);
      if (st.status === "TRAINING") {
        setIsTraining(true);
      } else {
        setIsTraining(false);
      }
    });

    const handleMemoryUpdated = () => {
      void refreshAll();
    };

    window.addEventListener("kn-memory-updated", handleMemoryUpdated);
    const interval = setInterval(refreshAll, 15_000);

    return () => {
      unsubProgress();
      unsubState();
      window.removeEventListener("kn-memory-updated", handleMemoryUpdated);
      clearInterval(interval);
    };
  }, [live?.soil, snapshot?.soil]);

  const handleCadenceChange = (newCadence: BrainCadence) => {
    setCadence(newCadence);
    setBrainCadence(newCadence);
    updateSettings({ brainCadence: newCadence });
    toast.success(`Brain Cadence: ${newCadence.toUpperCase()}`, {
      description:
        newCadence === "manual"
          ? "Brain will only train when you manually click Train Now."
          : `Brain will auto-retrain ${newCadence} when rows grow ≥10%.`,
    });
  };

  const handleTrainNow = async () => {
    if (brainState.current < brainState.required) {
      toast.error(`Not enough data: ${brainState.message}`, {
        description: `Requires ≥200 telemetry rows to train. Currently have ${brainState.current}.`,
      });
      return;
    }

    try {
      setIsTraining(true);
      setTrainingCurve([]);
      toast.info("Starting in-browser neural training...", {
        description: "30 epochs, batch 32, Adam 1e-3 on local farm telemetry.",
      });

      const res = await trainNow();
      await refreshAll();

      toast.success(`Brain v${res.version} Trained!`, {
        description: `MAE: ${res.mae}% across ${res.rows} rows in ${(res.ms / 1000).toFixed(1)}s`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Training failed", { description: msg });
    } finally {
      setIsTraining(false);
    }
  };

  const handleSeedSimulation = async () => {
    startTransition(async () => {
      const count = await seedSimulationTelemetry(10);
      await refreshAll();
      toast.info("Seeded 10 min SIM rows", {
        description: `State is now COLLECTING(${count}/200)`,
      });
    });
  };

  const handleForce250 = async () => {
    startTransition(async () => {
      const count = await forceTelemetryRows(250);
      await refreshAll();
      toast.success("Loaded 250 telemetry rows", {
        description: `Farm memory now has ${count} rows. Brain is ready to train!`,
      });
    });
  };

  const versions = getStoredVersions();
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;

  const crossingTimeFormatted = prediction
    ? new Date(prediction.crossTs).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const deltaMinutes = prediction?.deltaVsUsualMinutes ?? 0;
  const deltaText =
    deltaMinutes === 0
      ? "On usual schedule"
      : deltaMinutes > 0
        ? `${Math.abs(deltaMinutes)} min slower than usual`
        : `${Math.abs(deltaMinutes)} min faster than usual`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-zinc-950/90 via-purple-950/20 to-zinc-950/90 p-5 shadow-2xl backdrop-blur-xl transition-all",
        className,
      )}
    >
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30">
            <Brain className="h-6 w-6" />
            {isTraining && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-purple-500" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Personal Farm Brain</h3>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase ring-1",
                  brainState.status === "COLLECTING"
                    ? "bg-amber-500/15 text-amber-300 ring-amber-500/30"
                    : brainState.status === "TRAINING"
                      ? "bg-purple-500/20 text-purple-300 ring-purple-500/40 animate-pulse"
                      : "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
                )}
              >
                {brainState.status === "COLLECTING"
                  ? brainState.message
                  : brainState.status === "TRAINING"
                    ? "Training Neural Net..."
                    : `Active v${latestVersion?.version ?? 1}`}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Personalized Dense NN (64→32→1) trained entirely in your browser on this farm
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTrainNow}
            disabled={isTraining || brainState.current < brainState.required}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-lg transition-all",
              isTraining
                ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40 cursor-wait"
                : brainState.current < brainState.required
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60 ring-1 ring-zinc-700/50"
                  : "bg-purple-600 text-white hover:bg-purple-500 ring-1 ring-purple-400/30 active:scale-95",
            )}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isTraining && "animate-spin")} />
            {isTraining ? "Training..." : "Train Now"}
          </button>
        </div>
      </div>

      {/* Collecting state warning or progress bar */}
      {brainState.status === "COLLECTING" && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              Collecting historical telemetry ({brainState.current} / {brainState.required} rows)
            </span>
            <span className="font-mono font-bold">
              {Math.round((brainState.current / brainState.required) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((brainState.current / brainState.required) * 100))}%`,
              }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-amber-300/80">
            <span>Minimum 200 telemetry rows needed for local neural training.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSeedSimulation}
                className="underline hover:text-white"
              >
                Seed 10 min
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleForce250}
                className="underline font-bold text-amber-200 hover:text-white"
              >
                Force 250 Rows (Test)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Loss Curve streaming during training */}
      {trainingCurve.length > 0 && (
        <div className="mt-4 rounded-xl border border-purple-500/30 bg-zinc-900/80 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
            <span className="flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" />
              Live Training Loss Stream (30 Epochs)
            </span>
            <span className="font-mono">
              Epoch {trainingCurve[trainingCurve.length - 1].epoch}/30 • Loss:{" "}
              {trainingCurve[trainingCurve.length - 1].loss.toFixed(1)}
            </span>
          </div>
          <div className="mt-2 flex h-14 items-end gap-1 overflow-hidden rounded-lg bg-zinc-950 p-1.5">
            {trainingCurve.map((p, idx) => {
              const maxLoss = Math.max(...trainingCurve.map((c) => c.loss), 10);
              const heightPct = Math.max(8, Math.min(100, (p.loss / maxLoss) * 100));
              return (
                <div
                  key={idx}
                  className="flex-1 rounded-sm bg-gradient-to-t from-purple-600 to-indigo-400 transition-all duration-200"
                  style={{ height: `${heightPct}%` }}
                  title={`Epoch ${p.epoch}: loss ${p.loss}, valLoss ${p.valLoss}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Prediction & Cadence */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Next Irrigation Crossing Forecast */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Soil Crossing Forecast (&lt;30%)
            </span>
            <Droplets className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tracking-tight">
              {prediction ? `${prediction.hoursUntil}h` : "--"}
            </span>
            <span className="text-xs text-zinc-400">until moisture drops &lt; 30%</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span>Crossing expected at {crossingTimeFormatted}</span>
          </div>
          <div className="mt-2 rounded-lg bg-zinc-950/80 px-2.5 py-1.5 text-[11px] font-medium text-emerald-400">
            {deltaText}
          </div>
        </div>

        {/* Retraining Cadence Selector */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Auto-Retrain Cadence
            </span>
            <Calendar className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Evaluated every 60s & on tab visibility when rows grow ≥10%
          </p>

          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {(["hourly", "daily", "weekly", "manual"] as BrainCadence[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleCadenceChange(c)}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition-all",
                  cadence === c
                    ? "bg-purple-500 text-white shadow-sm ring-1 ring-purple-400/40"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Learned Farm Dynamics Stats */}
      {brainStats && (
        <div className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <span>Learned Farm Dynamics (Model v{latestVersion?.version ?? 1})</span>
            <span className="font-mono text-purple-400">
              MAE: {latestVersion?.mae ?? brainStats.mae}%
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-500 block">Irrigation Lift</span>
              <span className="text-sm font-bold text-emerald-400">
                +{brainStats.irrigationLift}%
              </span>
            </div>
            <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-500 block">Rain Lift</span>
              <span className="text-sm font-bold text-blue-400">+{brainStats.rainLift}%</span>
            </div>
            <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-500 block">Quiescent Dry Rate</span>
              <span className="text-sm font-bold text-amber-400">
                -{brainStats.dryRatePerH}% / h
              </span>
            </div>
            <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-500 block">Usual Irrigation Hour</span>
              <span className="text-sm font-bold text-purple-400">
                {String(brainStats.usualIrrigationHour).padStart(2, "0")}:00
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/50 pt-2.5">
        <span className="flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-purple-400" />
          IndexedDB: <code className="text-zinc-400">kn-brain-v*</code> (retains last 10 versions)
        </span>
        <span>
          {latestVersion
            ? `Trained on ${latestVersion.rows} rows • ${new Date(latestVersion.ts).toLocaleTimeString()}`
            : "Untrained model"}
        </span>
      </div>
    </div>
  );
}
