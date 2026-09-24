"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw, RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`ErrorBoundary caught an error in [${this.props.name || "Route"}]:`, error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="mx-auto flex min-h-[280px] w-full max-w-lg items-center justify-center p-4">
          <div className="card-surface w-full rounded-3xl border border-red-500/25 bg-[rgba(25,12,12,0.85)] p-6 sm:p-8 text-center backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-red-500/15 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Something broke here
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              An unexpected error occurred in this section, but your live farm sensors and telemetry continue running safely.
            </p>

            {this.state.error?.message && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/5 bg-black/40 p-2.5 text-left">
                <p className="font-mono text-[11px] text-red-300/80 truncate">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-black transition-all hover:bg-emerald-400 active:scale-95 shadow-[0_0_16px_rgba(34,197,94,0.4)] cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
                Retry
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-white active:scale-95 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
