import { GamePhase, type CompleteLevelResponse, type GameEvent, type GameResult } from '@sizzle/shared';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { CounterFront, DinerBackdrop, KitchenBackdrop } from '../art/Scene';
import { audio } from '../audio/AudioManager';
import { useApp } from '../store/useApp';
import { Assembly } from './components/Assembly';
import { Customers } from './components/Customers';
import { Blender, SodaFountain, Trash } from './components/Drinks';
import { Fryer, Warmer } from './components/Fryer';
import { DragGhost, FxLayer } from './components/Fx';
import { Grill } from './components/Grill';
import { Hud } from './components/Hud';
import { CountdownOverlay, EndingOverlay, IntroOverlay, PauseOverlay, RotateHint } from './components/Overlays';
import { ResultsOverlay } from './components/Results';
import { GameController } from './GameController';
import { GameContext, type GameCtx } from './GameContext';
import { useFx } from './fx';
import { createPointerHandler, useInput, type PointerSource } from './input';
import { STAGE_H, STAGE_W, seatX, sourcePoint } from './layout';

type Overlay = 'intro' | 'countdown' | 'playing' | 'paused' | 'ending' | 'results';

function sourceKeyOfRef(ref: { kind: string; index?: number; bin?: string }) {
  if (ref.kind === 'bin') return `bin:${ref.bin}`;
  if (ref.kind === 'warmer') return 'warmer';
  return `${ref.kind}:${ref.index}`;
}

export function GameScreen() {
  const run = useApp((s) => s.run)!;
  const settings = useApp((s) => s.settings);
  const setPhase = useApp((s) => s.setPhase);
  const setCompletion = useApp((s) => s.setCompletion);
  const [controller] = useState(() => new GameController(run));
  useSyncExternalStore(controller.subscribe, controller.getVersion);
  const [overlay, setOverlay] = useState<Overlay>('intro');
  const [scale, setScale] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<GameResult | null>(null);
  const [completion, setLocalCompletion] = useState<CompleteLevelResponse | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fx = useFx;

  // ---- responsive scaling of the fixed 1280x720 stage ----
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- engine events -> audio & visual feedback ----
  const handleEvents = useCallback(
    (events: GameEvent[]) => {
      const state = controller.engine.state;
      const seats = controller.engine.level.seats;
      const f = fx.getState();
      for (const e of events) {
        switch (e.type) {
          case 'customerArrived':
            audio.play('doorbell');
            break;
          case 'customerImpatient':
            audio.play('impatient');
            break;
          case 'customerLeft':
            audio.play('angry');
            f.addText({ x: seatX(e.seat, seats), y: 230, text: 'Too slow!', color: '#ef4444', size: 28 });
            break;
          case 'customerPaid': {
            audio.play('coins');
            audio.play('happy');
            const x = seatX(e.seat, seats);
            f.addText({ x, y: 180, text: `+${e.amount}`, color: '#facc15', size: 38 });
            if (e.tip > 0) f.addText({ x: x + 50, y: 230, text: `+${e.tip} tip`, color: '#4ade80', size: 24 });
            if (e.combo >= 2) {
              audio.play('combo');
              f.addText({ x: 640, y: 300, text: `Combo ×${e.combo}! +${e.comboBonus}`, color: '#e879f9', size: 40 });
            }
            break;
          }
          case 'served': {
            audio.play('serve');
            f.addFlyer({ from: sourcePoint(e.source, state), to: { x: seatX(e.seat, seats), y: 140 }, item: e.item });
            break;
          }
          case 'placed':
            audio.play(e.ingredient === 'patty' ? 'sizzle' : e.ingredient === 'fries' ? 'fry' : e.ingredient === 'cup' ? 'pour' : e.ingredient === 'milk' ? 'blend' : 'place');
            break;
          case 'moved':
            audio.play('place');
            break;
          case 'cooked':
            audio.play('ready');
            break;
          case 'burnt': {
            audio.play('burn');
            const p = sourcePoint(e.source, state);
            f.addText({ x: p.x, y: p.y - 40, text: e.source.kind === 'shaker' ? 'Melted!' : 'Burnt!', color: '#f97316', size: 24 });
            break;
          }
          case 'trashed':
            audio.play('trash');
            break;
          case 'restockStarted':
            audio.play('restock');
            break;
          case 'invalid': {
            audio.play('invalid');
            if (e.source) {
              f.shake(sourceKeyOfRef(e.source as never));
              const p = sourcePoint(e.source, state);
              f.addText({ x: p.x, y: p.y - 50, text: e.reason, color: '#fff', size: 20 });
            } else {
              f.addText({ x: 640, y: 440, text: e.reason, color: '#fff', size: 22 });
            }
            break;
          }
        }
      }
    },
    [controller, fx],
  );

  const submit = useCallback(async () => {
    const engine = controller.engine;
    const local = engine.result();
    setLocalResult(local);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.completeLevel(run.sessionId, { actions: engine.actions, clientResult: { revenue: local.revenue, stars: local.stars } });
      setLocalCompletion(res);
      setCompletion(res);
      setPhase(res.result.passed ? GamePhase.LEVEL_COMPLETED : GamePhase.LEVEL_FAILED);
      audio.play(res.result.passed ? 'win' : 'lose');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save your result');
      setPhase(local.passed ? GamePhase.LEVEL_COMPLETED : GamePhase.LEVEL_FAILED);
    } finally {
      setSubmitting(false);
      setOverlay('results');
    }
  }, [controller, run.sessionId, setCompletion, setPhase]);

  useEffect(() => {
    controller.onEvents = handleEvents;
    controller.onFinish = () => {
      useInput.getState().set({ drag: null, hover: null, trashMode: false });
      setOverlay('ending');
      setTimeout(() => void submit(), 1400);
    };
    return () => {
      controller.destroy();
      useFx.getState().clear();
      useInput.getState().set({ drag: null, hover: null, trashMode: false });
    };
  }, [controller, handleEvents, submit]);

  // Dev/test hook: lets automated browser tests inspect the running game.
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __sizzleGame?: GameController }).__sizzleGame = controller;
  }, [controller]);

  useEffect(() => {
    audio.playMusic('game');
    return () => audio.playMusic('menu');
  }, []);

  const pause = useCallback(() => {
    if (controller.paused || controller.engine.finished || !controller.started) return;
    controller.pause();
    useInput.getState().set({ drag: null, hover: null });
    setPhase(GamePhase.PAUSED);
    setOverlay('paused');
  }, [controller, setPhase]);

  const resume = useCallback(() => {
    setPhase(GamePhase.PLAYING);
    setOverlay('playing');
    controller.resume();
  }, [controller, setPhase]);

  // Auto-pause when the tab is hidden; keyboard shortcuts.
  useEffect(() => {
    const onVis = () => document.hidden && pause();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p') {
        if (overlay === 'playing') pause();
        else if (overlay === 'paused') resume();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('keydown', onKey);
    };
  }, [overlay, pause, resume]);

  const onPointerDown = useMemo(
    () =>
      createPointerHandler(
        () => controller,
        (s) => audio.play(s),
      ),
    [controller],
  );

  const ctx: GameCtx = {
    controller,
    state: controller.engine.state,
    level: controller.engine.level,
    mods: controller.engine.mods,
    onPointerDown: (e: React.PointerEvent, src: PointerSource) => {
      audio.unlock();
      onPointerDown(e, src);
    },
    reducedMotion: settings.reducedMotion,
  };

  return (
    <GameContext.Provider value={ctx}>
      <div ref={wrapRef} className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[#2b1638] ${settings.reducedMotion ? 'reduced-motion' : ''}`} style={{ touchAction: 'none' }}>
        <div style={{ width: STAGE_W * scale, height: STAGE_H * scale, position: 'relative' }}>
          <div
            data-testid="game-stage"
            className="absolute left-0 top-0 overflow-hidden rounded-xl"
            style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left', touchAction: 'none' }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <DinerBackdrop menu={controller.engine.level.menu} priceMult={controller.engine.mods.priceMult} />
            <Customers />
            <CounterFront />
            <KitchenBackdrop />
            <SodaFountain />
            <Grill />
            <Assembly />
            <Fryer />
            <Warmer />
            <Trash />
            <Blender />
            <FxLayer />
            <Hud onPause={pause} />
          </div>
        </div>
        <DragGhost state={controller.engine.state} scale={scale} />

        {overlay === 'intro' && (
          <IntroOverlay
            level={controller.engine.level}
            showHints={settings.showHints}
            onStart={() => {
              audio.unlock();
              setOverlay('countdown');
            }}
            onBack={() => useApp.getState().quitRun()}
          />
        )}
        {overlay === 'countdown' && (
          <CountdownOverlay
            onDone={() => {
              setOverlay('playing');
              controller.start();
            }}
          />
        )}
        {overlay === 'paused' && <PauseOverlay onResume={resume} />}
        {overlay === 'ending' && <EndingOverlay timeUp={controller.engine.timeLeft <= 0.01} />}
        {overlay === 'results' && localResult && (
          <ResultsOverlay
            local={localResult}
            completion={completion}
            error={submitError}
            submitting={submitting}
            onRetrySubmit={() => void submit()}
          />
        )}
        <RotateHint />
      </div>
    </GameContext.Provider>
  );
}
