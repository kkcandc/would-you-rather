const MUTE_KEY = "wyr-muted";

function midi(semitoneFromC4: number): number {
  return 261.63 * 2 ** (semitoneFromC4 / 12);
}

/** Goofy 4-bar loop in C pentatonic, eighth notes at 126 bpm. */
const MELODY: Array<number | null> = [
  0, 4, 7, 4, 12, 7, 4, 0,
  7, 9, 7, 4, 2, 4, null, 0,
  4, 4, 7, 12, 9, 7, 4, 2,
  0, 7, 4, 2, 0, null, 4, 0,
];

const BASS: Array<number | null> = [
  -12, null, -12, null, -5, null, -12, null,
  -5, null, -5, null, -8, null, -10, null,
  -8, null, -5, null, -3, null, -5, null,
  -12, null, -8, null, -12, null, -5, -12,
];

export class Soundboard {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer = 0;
  private step = 0;
  private nextNote = 0;
  private muted: boolean;

  constructor() {
    this.muted = readMuted();
  }

  get isMuted(): boolean {
    return this.muted;
  }

  async unlock(): Promise<void> {
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (!this.timer) {
      this.nextNote = this.ctx.currentTime + 0.08;
      this.timer = window.setInterval(() => this.pump(), 60);
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? "1" : "0");
    } catch {
      /* private mode */
    }
    this.applyMute();
    return this.muted;
  }

  reveal(): void {
    this.drumroll(0.55);
  }

  drumroll(seconds = 1.1): void {
    this.ensure();
    if (!this.ctx) return;
    const start = this.ctx.currentTime;
    let cursor = 0;
    let gap = 0.09;
    while (cursor < seconds) {
      this.noiseBurst(start + cursor, 0.045, 0.22, 2400);
      cursor += gap;
      gap = Math.max(0.025, gap * 0.9);
    }
  }

  stamp(): void {
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.tone(this.sfxGain, 160, t, 0.18, "sine", 0.4, 50);
    this.noiseBurst(t, 0.08, 0.35, 900);
  }

  tick(secondsLeft: number): void {
    const pitch = secondsLeft <= 3 ? 880 + (3 - secondsLeft) * 140 : 520;
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    this.tone(this.sfxGain, pitch, this.ctx.currentTime, 0.07, "square", 0.08);
  }

  pop(): void {
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.tone(this.sfxGain, 320, t, 0.12, "sine", 0.2, 640);
  }

  ding(): void {
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.tone(this.sfxGain, 523, t, 0.18, "triangle", 0.22);
    this.tone(this.sfxGain, 784, t + 0.08, 0.28, "triangle", 0.2);
  }

  buzzer(): void {
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.42);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
    this.noiseBurst(t, 0.12, 0.12, 420);
  }

  cheer(): void {
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1046].forEach((freq, index) => {
      this.tone(this.sfxGain!, freq, t + index * 0.07, 0.36, "triangle", 0.18);
    });
    this.tone(this.sfxGain, 1318, t + 0.28, 0.22, "sine", 0.1);
    this.noiseBurst(t + 0.05, 0.25, 0.08, 3200);
  }

  private ensure(): void {
    if (this.ctx) return;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.85;
    master.connect(ctx.destination);
    const musicGain = ctx.createGain();
    musicGain.gain.value = 0.5;
    musicGain.connect(master);
    const sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.9;
    sfxGain.connect(master);
    this.ctx = ctx;
    this.master = master;
    this.musicGain = musicGain;
    this.sfxGain = sfxGain;
  }

  private applyMute(): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.85, now + 0.04);
  }

  private pump(): void {
    if (!this.ctx || !this.musicGain) return;
    const horizon = this.ctx.currentTime + 0.28;
    while (this.nextNote < horizon) {
      this.schedule(this.step, this.nextNote);
      this.step = (this.step + 1) % MELODY.length;
      this.nextNote += 60 / 126 / 2;
    }
  }

  private schedule(step: number, when: number): void {
    if (!this.musicGain) return;
    const note = MELODY[step];
    if (note !== null && note !== undefined) {
      this.tone(this.musicGain, midi(note), when, 0.18, "triangle", 0.16);
      this.tone(this.musicGain, midi(note + 12), when, 0.1, "square", 0.035);
    }
    const bass = BASS[step];
    if (bass !== null && bass !== undefined) {
      this.tone(this.musicGain, midi(bass), when, 0.22, "triangle", 0.18);
    }
    if (step % 2 === 1) this.noiseBurst(when, 0.03, 0.035, 6000, this.musicGain);
  }

  private tone(
    dest: AudioNode,
    freq: number,
    when: number,
    duration: number,
    type: OscillatorType,
    amount: number,
    slideTo?: number,
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freq), when);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), when + duration);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(amount, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  private noiseBurst(
    when: number,
    duration: number,
    amount: number,
    band: number,
    dest?: AudioNode,
  ): void {
    if (!this.ctx || !this.sfxGain) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = band;
    filter.Q.value = 0.6;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(amount, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(dest ?? this.sfxGain);
    source.start(when);
    source.stop(when + duration + 0.01);
  }

  private noiseBuffer(): AudioBuffer {
    if (this.noise) return this.noise;
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noise = buffer;
    return buffer;
  }
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}
