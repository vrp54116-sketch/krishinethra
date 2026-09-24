/**
 * Web Audio API synthesizer for liquid glass micro-interactions.
 * Zero external audio files required — generates synthesized tones directly.
 * Handles audio context suspension and autoplay policies cleanly.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;

  constructor() {
    if (typeof window !== "undefined") {
      // Respect user sound preference from store if available
      try {
        const stored = localStorage.getItem("krishinethra-v1");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.settings?.soundEnabled === false) {
            this.soundEnabled = false;
          }
        }
      } catch {
        // Fallback default true
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Subtle click on liquid toggle switch.
   * Specification: 80Hz sine wave, 50ms duration.
   */
  playToggleClick(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(80, ctx.currentTime);

      // 50ms duration with soft click envelope
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio playback fails gracefully if blocked
    }
  }

  /**
   * Water drop sound on pump activation.
   * Specification: 400Hz sine wave, 100ms exponential decay.
   */
  playWaterDrop(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Slight pitch bend gives a realistic water droplet "bloop" effect
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.04);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.1);

      // 100ms exponential decay
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Graceful fallback
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }
}

export const sound = new SoundEngine();
export const playToggleClick = () => sound.playToggleClick();
export const playWaterDrop = () => sound.playWaterDrop();
