/**
 * 8-Bit Web Audio API Sound Synthesizer
 * Zero-dependency, authentic retro JRPG audio engine.
 * Supports toggling sound on/off with local preference persistence.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("life-rpg-sound");
      this.enabled = saved !== "false";
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("life-rpg-sound", String(this.enabled));
    }
    return this.enabled;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("life-rpg-sound", String(enabled));
    }
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
   * Play an 8-bit note with square wave and volume decay.
   */
  private playTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = "square",
    volume: number = 0.1
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Audio playback errors are non-critical
    }
  }

  /**
   * Short 8-bit cheerful chime for task completion (C5 -> E5 -> G5 -> C6).
   */
  public playTaskComplete() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playTone(523.25, now + 0.00, 0.08, "square", 0.12); // C5
    this.playTone(659.25, now + 0.06, 0.08, "square", 0.12); // E5
    this.playTone(783.99, now + 0.12, 0.08, "square", 0.12); // G5
    this.playTone(1046.5, now + 0.18, 0.22, "triangle", 0.15); // C6
  }

  /**
   * Triumphant 8-bit fanfare on level-up.
   */
  public playLevelUp() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Fast arpeggio
    this.playTone(392.00, now + 0.00, 0.10, "square", 0.12); // G4
    this.playTone(523.25, now + 0.09, 0.10, "square", 0.12); // C5
    this.playTone(659.25, now + 0.18, 0.10, "square", 0.12); // E5
    this.playTone(783.99, now + 0.27, 0.12, "square", 0.14); // G5
    this.playTone(1046.5, now + 0.38, 0.14, "square", 0.15); // C6
    // Final triumphant chord / long sustained note
    this.playTone(1046.5, now + 0.52, 0.50, "triangle", 0.20); // C6
    this.playTone(1318.5, now + 0.52, 0.50, "square", 0.12); // E6
  }

  /**
   * 8-bit coin / register sound for shop purchase.
   */
  public playPurchase() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playTone(987.77, now + 0.00, 0.09, "square", 0.14); // B5
    this.playTone(1318.5, now + 0.07, 0.28, "square", 0.16); // E6
  }

  /**
   * Subtle retro click sound for button interactions.
   */
  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playTone(800, now, 0.03, "triangle", 0.06);
  }
}

export const sound = new SoundEngine();
