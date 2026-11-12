/**
 * Procedural audio: every sound effect and the background music are
 * synthesized with the Web Audio API (no audio files, fully original).
 * Categories can be muted individually: music, sfx, voices, ui.
 */
import type { PlayerSettings } from '@sizzle/shared';

export type SoundCategory = 'music' | 'sfx' | 'voices' | 'ui';
export type SoundName =
  | 'click'
  | 'invalid'
  | 'place'
  | 'sizzle'
  | 'fry'
  | 'pour'
  | 'blend'
  | 'ready'
  | 'burn'
  | 'serve'
  | 'trash'
  | 'coins'
  | 'combo'
  | 'doorbell'
  | 'happy'
  | 'angry'
  | 'impatient'
  | 'star'
  | 'win'
  | 'lose'
  | 'restock'
  | 'purchase'
  | 'countdown'
  | 'go';

const CATEGORY: Record<SoundName, SoundCategory> = {
  click: 'ui',
  invalid: 'ui',
  star: 'ui',
  purchase: 'ui',
  countdown: 'ui',
  go: 'ui',
  place: 'sfx',
  sizzle: 'sfx',
  fry: 'sfx',
  pour: 'sfx',
  blend: 'sfx',
  ready: 'sfx',
  burn: 'sfx',
  serve: 'sfx',
  trash: 'sfx',
  coins: 'sfx',
  combo: 'sfx',
  doorbell: 'sfx',
  restock: 'sfx',
  win: 'sfx',
  lose: 'sfx',
  happy: 'voices',
  angry: 'voices',
  impatient: 'voices',
};

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

type MusicTrack = 'menu' | 'game' | null;

class AudioManager {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private buses = {} as Record<SoundCategory, GainNode>;
  private enabled: Record<SoundCategory, boolean> = { music: true, sfx: true, voices: true, ui: true };
  private volume = 0.8;
  private noise: AudioBuffer | null = null;
  private lastPlayed = new Map<SoundName, number>();

  private track: MusicTrack = null;
  private wantedTrack: MusicTrack = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private step = 0;

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
      for (const c of ['music', 'sfx', 'voices', 'ui'] as SoundCategory[]) {
        const g = this.ctx.createGain();
        g.gain.value = this.enabled[c] ? (c === 'music' ? 0.35 : 1) : 0;
        g.connect(this.master);
        this.buses[c] = g;
      }
      const len = this.ctx.sampleRate * 1;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.wantedTrack && this.track !== this.wantedTrack) this.playMusic(this.wantedTrack);
  }

  applySettings(s: PlayerSettings): void {
    this.volume = s.audio.master;
    this.enabled = { music: s.audio.music, sfx: s.audio.sfx, voices: s.audio.voices, ui: s.audio.ui };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.volume, t, 0.05);
    for (const c of Object.keys(this.buses) as SoundCategory[]) {
      this.buses[c].gain.setTargetAtTime(this.enabled[c] ? (c === 'music' ? 0.35 : 1) : 0, t, 0.05);
    }
  }

  // ---------- primitives ----------
  private tone(bus: AudioNode, freq: number, start: number, dur: number, opts: { type?: OscillatorType; vol?: number; to?: number; attack?: number } = {}) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, start + dur);
    const vol = opts.vol ?? 0.3;
    const a = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(vol, start + a);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(bus);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  private noiseBurst(bus: AudioNode, start: number, dur: number, opts: { freq?: number; q?: number; type?: BiquadFilterType; vol?: number; attack?: number; sweepTo?: number } = {}) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? 'bandpass';
    f.frequency.setValueAtTime(opts.freq ?? 2000, start);
    if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, start + dur);
    f.Q.value = opts.q ?? 1;
    const g = ctx.createGain();
    const vol = opts.vol ?? 0.2;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(vol, start + (opts.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(start, Math.random() * 0.5);
    src.stop(start + dur + 0.05);
  }

  play(name: SoundName): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const cat = CATEGORY[name];
    if (!this.enabled[cat] || this.volume <= 0) return;
    // Avoid stacking the same sound many times in one frame.
    const now = performance.now();
    if (now - (this.lastPlayed.get(name) ?? 0) < 40) return;
    this.lastPlayed.set(name, now);
    const bus = this.buses[cat];
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'click':
        this.tone(bus, 880, t, 0.06, { type: 'triangle', vol: 0.18, to: 1200 });
        break;
      case 'invalid':
        this.tone(bus, 220, t, 0.12, { type: 'square', vol: 0.08 });
        this.tone(bus, 180, t + 0.1, 0.16, { type: 'square', vol: 0.08 });
        break;
      case 'place':
        this.tone(bus, 300, t, 0.08, { type: 'sine', vol: 0.25, to: 140 });
        this.noiseBurst(bus, t, 0.05, { freq: 1200, vol: 0.06 });
        break;
      case 'sizzle':
        this.noiseBurst(bus, t, 0.9, { freq: 5500, q: 0.7, type: 'highpass', vol: 0.12, attack: 0.03 });
        break;
      case 'fry':
        for (let i = 0; i < 6; i++) this.tone(bus, 500 + Math.random() * 600, t + i * 0.07, 0.05, { vol: 0.07, to: 900 });
        this.noiseBurst(bus, t, 0.6, { freq: 3000, vol: 0.06 });
        break;
      case 'pour':
        this.noiseBurst(bus, t, 0.7, { freq: 900, q: 3, vol: 0.12, sweepTo: 2000, attack: 0.05 });
        break;
      case 'blend':
        this.tone(bus, 90, t, 0.8, { type: 'sawtooth', vol: 0.05, to: 140, attack: 0.1 });
        this.noiseBurst(bus, t, 0.8, { freq: 600, q: 2, vol: 0.08, attack: 0.1 });
        break;
      case 'ready':
        this.tone(bus, NOTE(84), t, 0.5, { type: 'sine', vol: 0.18 });
        this.tone(bus, NOTE(91), t + 0.005, 0.5, { type: 'sine', vol: 0.06 });
        break;
      case 'burn':
        this.tone(bus, 120, t, 0.35, { type: 'sawtooth', vol: 0.07, to: 80 });
        this.noiseBurst(bus, t, 0.4, { freq: 400, vol: 0.08 });
        break;
      case 'serve':
        this.noiseBurst(bus, t, 0.18, { freq: 800, q: 1.5, vol: 0.12, sweepTo: 3500 });
        this.tone(bus, NOTE(76), t + 0.1, 0.1, { type: 'triangle', vol: 0.15 });
        this.tone(bus, NOTE(83), t + 0.16, 0.14, { type: 'triangle', vol: 0.15 });
        break;
      case 'trash':
        this.noiseBurst(bus, t, 0.25, { freq: 700, q: 0.8, vol: 0.15, sweepTo: 200 });
        this.tone(bus, 160, t + 0.05, 0.15, { type: 'square', vol: 0.05, to: 90 });
        break;
      case 'coins':
        [88, 93, 96, 100].forEach((n, i) => this.tone(bus, NOTE(n), t + i * 0.055, 0.18, { type: 'square', vol: 0.06 }));
        [88, 93, 96, 100].forEach((n, i) => this.tone(bus, NOTE(n), t + i * 0.055, 0.25, { type: 'sine', vol: 0.12 }));
        break;
      case 'combo':
        [72, 76, 79, 84, 88].forEach((n, i) => this.tone(bus, NOTE(n), t + i * 0.045, 0.15, { type: 'triangle', vol: 0.14 }));
        break;
      case 'doorbell':
        this.tone(bus, NOTE(88), t, 0.6, { vol: 0.12 });
        this.tone(bus, NOTE(84), t + 0.18, 0.7, { vol: 0.12 });
        break;
      case 'restock':
        this.noiseBurst(bus, t, 0.15, { freq: 1500, vol: 0.08 });
        this.tone(bus, NOTE(67), t + 0.05, 0.1, { type: 'triangle', vol: 0.1 });
        this.tone(bus, NOTE(74), t + 0.12, 0.12, { type: 'triangle', vol: 0.1 });
        break;
      case 'happy':
        this.tone(bus, NOTE(74), t, 0.12, { type: 'triangle', vol: 0.16, to: NOTE(79) });
        this.tone(bus, NOTE(79), t + 0.12, 0.2, { type: 'triangle', vol: 0.16, to: NOTE(86) });
        break;
      case 'angry':
        this.tone(bus, 260, t, 0.32, { type: 'sawtooth', vol: 0.08, to: 130 });
        this.tone(bus, 255, t, 0.32, { type: 'square', vol: 0.04, to: 125 });
        break;
      case 'impatient':
        this.tone(bus, 330, t, 0.12, { type: 'triangle', vol: 0.12, to: 300 });
        this.tone(bus, 330, t + 0.16, 0.12, { type: 'triangle', vol: 0.12, to: 300 });
        break;
      case 'star':
        this.tone(bus, NOTE(84), t, 0.3, { type: 'triangle', vol: 0.15, to: NOTE(96) });
        this.tone(bus, NOTE(91), t + 0.06, 0.4, { type: 'sine', vol: 0.12 });
        break;
      case 'purchase':
        [79, 84, 88, 91].forEach((n, i) => this.tone(bus, NOTE(n), t + i * 0.07, 0.25, { type: 'triangle', vol: 0.14 }));
        break;
      case 'countdown':
        this.tone(bus, NOTE(76), t, 0.15, { type: 'square', vol: 0.07 });
        break;
      case 'go':
        this.tone(bus, NOTE(84), t, 0.35, { type: 'square', vol: 0.08 });
        this.tone(bus, NOTE(88), t, 0.35, { type: 'triangle', vol: 0.1 });
        break;
      case 'win':
        [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => this.tone(bus, NOTE(n), t + i * 0.11, 0.24, { type: 'square', vol: 0.06 }));
        [60, 64, 67, 72].forEach((n, i) => this.tone(bus, NOTE(n), t + i * 0.2, 0.4, { type: 'triangle', vol: 0.12 }));
        break;
      case 'lose':
        [67, 66, 65, 64].forEach((n, i) => this.tone(bus, NOTE(n), t + i * 0.22, 0.3, { type: 'triangle', vol: 0.14 }));
        this.tone(bus, NOTE(52), t + 0.9, 0.7, { type: 'sawtooth', vol: 0.05 });
        break;
    }
  }

  // ---------- music ----------
  playMusic(track: MusicTrack): void {
    this.wantedTrack = track;
    if (!this.ctx) return;
    if (this.track === track) return;
    this.stopMusic();
    this.track = track;
    if (!track) return;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 25);
  }

  private stopMusic(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.track = null;
  }

  /** Original chord loop: I – vi – IV – V with a bouncy diner groove. */
  private scheduleMusic(): void {
    if (!this.ctx || !this.track) return;
    const bpm = this.track === 'game' ? 132 : 104;
    const sixteenth = 60 / bpm / 4;
    const bus = this.buses.music;
    const progression = this.track === 'game' ? [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]] : [[60, 64, 67], [53, 57, 60], [57, 60, 64], [55, 59, 62]];
    const melodyGame = [72, -1, 76, -1, 79, 76, -1, 74, 72, -1, 69, -1, 72, -1, -1, -1, 69, -1, 72, -1, 76, 74, -1, 72, 74, -1, 76, -1, 74, -1, 71, -1];
    const melodyMenu = [76, -1, -1, 79, -1, -1, 77, -1, 76, -1, 74, -1, 72, -1, -1, -1, 72, -1, -1, 74, -1, -1, 76, -1, 74, -1, -1, -1, 71, -1, -1, -1];
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      const t = this.nextNoteTime;
      const s = this.step % 64;
      const bar = Math.floor(s / 16);
      const chord = progression[bar];
      const pos = s % 16;
      // bass: root/fifth on 8ths
      if (pos % 4 === 0) this.tone(bus, NOTE(chord[0] - 24 + (pos === 8 ? 7 : 0)), t, sixteenth * 3, { type: 'triangle', vol: 0.32 });
      // chord stabs on the off-beats
      if (pos % 4 === 2) for (const n of chord) this.tone(bus, NOTE(n), t, sixteenth * 1.5, { type: 'square', vol: 0.035 });
      // melody
      const mel = (this.track === 'game' ? melodyGame : melodyMenu)[s % 32];
      if (mel > 0) this.tone(bus, NOTE(mel + (s >= 32 && this.track === 'game' ? 0 : 0)), t, sixteenth * 2.5, { type: 'triangle', vol: 0.12 });
      // drums
      if (pos % 8 === 0) this.tone(bus, 150, t, 0.18, { type: 'sine', vol: 0.5, to: 45 });
      if (pos % 8 === 4) this.noiseBurst(bus, t, 0.12, { freq: 1800, q: 0.8, vol: 0.12 });
      if (pos % 2 === 0) this.noiseBurst(bus, t, 0.03, { freq: 8000, type: 'highpass', vol: 0.05 });
      this.nextNoteTime += sixteenth;
      this.step++;
    }
  }
}

export const audio = new AudioManager();
