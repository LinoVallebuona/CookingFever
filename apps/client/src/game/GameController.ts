import {
  DT,
  GameEngine,
  computeKitchenModifiers,
  type GameEvent,
  type PlayerAction,
  type StartLevelResponse,
} from '@sizzle/shared';

type Listener = () => void;

/**
 * Owns the engine and the real-time loop. The simulation advances in fixed
 * DT steps driven by requestAnimationFrame, completely independent of how
 * often React renders. React subscribes to `version` to redraw.
 */
export class GameController {
  readonly engine: GameEngine;
  readonly run: StartLevelResponse;
  private rafId = 0;
  private last = 0;
  private acc = 0;
  private listeners = new Set<Listener>();
  private _paused = true;
  private _started = false;
  version = 0;
  onEvents: (events: GameEvent[]) => void = () => {};
  onFinish: () => void = () => {};

  constructor(run: StartLevelResponse) {
    this.run = run;
    this.engine = new GameEngine({
      level: run.level,
      mods: computeKitchenModifiers(run.upgrades),
      seed: run.seed,
      collectEvents: true,
    });
  }

  get paused() {
    return this._paused;
  }
  get started() {
    return this._started;
  }

  start(): void {
    if (this._started) return;
    this._started = true;
    this._paused = false;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  pause(): void {
    if (!this._started || this.engine.finished) return;
    this._paused = true;
    this.notify();
  }

  resume(): void {
    if (!this._started || this.engine.finished) return;
    this._paused = false;
    this.last = performance.now();
    this.acc = 0;
    this.notify();
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.listeners.clear();
  }

  dispatch(action: PlayerAction): boolean {
    if (!this._started || this._paused || this.engine.finished) return false;
    const ok = this.engine.dispatch(action);
    const events = this.engine.drainEvents();
    if (events.length) this.onEvents(events);
    this.notify();
    return ok;
  }

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getVersion = () => this.version;

  private notify() {
    this.version++;
    for (const l of this.listeners) l();
  }

  private loop = (now: number) => {
    const elapsed = Math.min(250, now - this.last);
    this.last = now;
    if (!this._paused && !this.engine.finished) {
      this.acc += elapsed / 1000;
      let steps = 0;
      while (this.acc >= DT && steps < 30) {
        this.engine.step();
        this.acc -= DT;
        steps++;
        if (this.engine.finished) break;
      }
      const events = this.engine.drainEvents();
      if (events.length) this.onEvents(events);
      this.notify();
      if (this.engine.finished) {
        this.onFinish();
        return;
      }
    }
    this.rafId = requestAnimationFrame(this.loop);
  };
}
