class ForestAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.14, delay = 0, slideTo?: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playJump() {
    this.tone(260, 0.14, 'triangle', 0.14, 0, 520);
  }

  public playBounce() {
    this.tone(220, 0.2, 'sine', 0.16, 0, 680);
    this.tone(440, 0.14, 'triangle', 0.09, 0.06, 780);
  }

  public playLetterCollect(step = 0) {
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
    const freq = scale[step % scale.length];
    this.tone(freq, 0.16, 'sine', 0.14, 0);
    this.tone(freq * 1.5, 0.14, 'triangle', 0.07, 0.05);
  }

  public playHerbSparkle() {
    this.tone(660, 0.1, 'sine', 0.06, 0);
    this.tone(880, 0.12, 'sine', 0.05, 0.05);
  }

  public playCheckpoint() {
    this.tone(440, 0.14, 'triangle', 0.14, 0);
    this.tone(554.37, 0.14, 'triangle', 0.14, 0.09);
    this.tone(659.25, 0.24, 'sine', 0.15, 0.18);
  }

  public playStomp() {
    this.tone(360, 0.12, 'triangle', 0.15, 0, 180);
    this.tone(540, 0.14, 'sine', 0.11, 0.06, 680);
  }

  public playHurt() {
    this.tone(240, 0.18, 'sawtooth', 0.1, 0, 120);
    this.tone(170, 0.22, 'triangle', 0.12, 0.08, 95);
  }

  public playTaskSuccess() {
    this.tone(523.25, 0.13, 'triangle', 0.15, 0);
    this.tone(659.25, 0.13, 'triangle', 0.15, 0.1);
    this.tone(783.99, 0.18, 'sine', 0.16, 0.2);
    this.tone(1046.5, 0.3, 'sine', 0.16, 0.31);
  }

  public playLevelVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    const times = [0, 0.1, 0.2, 0.32, 0.48, 0.6];
    notes.forEach((n, idx) => {
      this.tone(n, idx === notes.length - 1 ? 0.42 : 0.16, 'triangle', 0.15, times[idx]);
    });
  }

  public playGameOver() {
    this.tone(392, 0.22, 'triangle', 0.13, 0, 349);
    this.tone(329.63, 0.24, 'triangle', 0.13, 0.22, 293);
    this.tone(261.63, 0.4, 'sine', 0.14, 0.46, 196);
  }
}

export const sound = new ForestAudioEngine();
