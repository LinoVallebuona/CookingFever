import { describeObjective, MENU, type LevelDef } from '@sizzle/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MenuIcon } from '../../art/food';
import { CoinIcon, StarIcon } from '../../art/icons';
import { audio } from '../../audio/AudioManager';
import { Button, Panel, Toggle } from '../../components/ui';
import { useApp } from '../../store/useApp';

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <motion.div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {children}
    </motion.div>
  );
}

export function IntroOverlay({ level, showHints, onStart, onBack }: { level: LevelDef; showHints: boolean; onStart(): void; onBack(): void }) {
  return (
    <Backdrop>
      <motion.div initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="w-full max-w-lg">
        <Panel className="max-h-[92vh] overflow-y-auto p-5 scroll-area">
          <div className="text-center text-sm font-bold uppercase tracking-[0.3em] text-orange-600">Level {level.number}</div>
          <h2 className="text-center text-4xl font-bold text-amber-900">{level.name}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {level.targets.map((t, i) => (
              <div key={i} className="flex flex-col items-center rounded-2xl bg-white/80 py-2" style={{ border: '3px solid #4a2c1a' }}>
                <div className="flex">
                  {Array.from({ length: i + 1 }).map((_, k) => (
                    <StarIcon key={k} size={20} />
                  ))}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xl font-bold text-amber-800">
                  <CoinIcon size={20} />
                  {t}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-2xl bg-fuchsia-100 px-3 py-2 text-center font-semibold text-fuchsia-900" style={{ border: '3px solid #4a2c1a' }}>
            ★★★ also requires: {describeObjective(level.bonusObjective)}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-base font-semibold text-amber-900">
            <span>⏱ {Math.floor(level.duration / 60)}:{String(level.duration % 60).padStart(2, '0')}</span>
            <span>🧑‍🤝‍🧑 {level.customers} customers</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-center gap-3">
            {level.menu.map((m) => (
              <div key={m} className="flex flex-col items-center">
                <div className="flex h-12 items-end">
                  <MenuIcon item={m} size={44} />
                </div>
                <div className="text-[11px] font-bold text-amber-900">{MENU[m].name}</div>
              </div>
            ))}
          </div>
          {showHints && level.intro.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-2xl bg-sky-50 p-3 text-[15px] font-medium text-sky-900" style={{ border: '3px solid #4a2c1a' }}>
              {level.intro.map((h, i) => (
                <li key={i}>💡 {h}</li>
              ))}
              {level.number <= 2 && <li>🗑️ Drag mistakes to the trash, or tap the trash then the item.</li>}
            </ul>
          )}
          <div className="mt-4 flex gap-3">
            <Button color="cream" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button color="green" size="lg" onClick={onStart} className="flex-[2]" testId="start-shift">
              Start shift!
            </Button>
          </div>
        </Panel>
      </motion.div>
    </Backdrop>
  );
}

export function CountdownOverlay({ onDone }: { onDone(): void }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    audio.play(n > 0 ? 'countdown' : 'go');
    if (n < 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setN((x) => x - 1), n === 0 ? 450 : 550);
    return () => clearTimeout(t);
  }, [n, onDone]);
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/25">
      <AnimatePresence mode="popLayout">
        {n >= 0 && (
          <motion.div key={n} initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} className="text-outline text-shadow-pop text-[120px] font-bold text-yellow-300">
            {n === 0 ? 'GO!' : n}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PauseOverlay({ onResume }: { onResume(): void }) {
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const startLevel = useApp((s) => s.startLevel);
  const quitRun = useApp((s) => s.quitRun);
  const run = useApp((s) => s.run);
  const [confirmQuit, setConfirmQuit] = useState(false);
  return (
    <Backdrop>
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="w-full max-w-sm">
        <Panel className="max-h-[92vh] overflow-y-auto p-5 scroll-area">
          <h2 className="text-center text-4xl font-bold text-amber-900">Paused</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Button color="green" size="lg" onClick={onResume} testId="resume">
              Resume
            </Button>
            <Button color="blue" onClick={() => run && void startLevel(run.level.number)}>
              Restart level
            </Button>
            <Toggle label="Music" checked={settings.audio.music} onChange={(v) => updateSettings({ audio: { ...settings.audio, music: v } })} />
            <Toggle label="Sound effects" checked={settings.audio.sfx} onChange={(v) => updateSettings({ audio: { ...settings.audio, sfx: v } })} />
            {confirmQuit ? (
              <div className="rounded-2xl bg-red-50 p-3 text-center" style={{ border: '3px solid #4a2c1a' }}>
                <div className="font-semibold text-red-800">Quit? This shift will not be saved.</div>
                <div className="mt-2 flex gap-2">
                  <Button color="cream" size="sm" className="flex-1" onClick={() => setConfirmQuit(false)}>
                    Stay
                  </Button>
                  <Button color="red" size="sm" className="flex-1" onClick={quitRun} testId="confirm-quit">
                    Quit
                  </Button>
                </div>
              </div>
            ) : (
              <Button color="red" onClick={() => setConfirmQuit(true)}>
                Quit to level map
              </Button>
            )}
          </div>
        </Panel>
      </motion.div>
    </Backdrop>
  );
}

export function EndingOverlay({ timeUp }: { timeUp: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/30">
      <motion.div initial={{ scale: 0.3, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: -4, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="rounded-3xl bg-gradient-to-b from-yellow-300 to-orange-500 px-10 py-5 text-outline text-shadow-pop text-6xl font-bold text-white" style={{ border: '5px solid #4a2c1a' }}>
        {timeUp ? "Time's up!" : 'Shift complete!'}
      </motion.div>
    </div>
  );
}

export function RotateHint() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const check = () => setShow(window.innerHeight > window.innerWidth * 1.15 && window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (!show || dismissed) return null;
  return (
    <div className="absolute inset-x-3 top-3 z-50 flex items-center gap-3 rounded-2xl bg-white/95 p-2 text-amber-900 shadow-xl" style={{ border: '3px solid #4a2c1a' }}>
      <div className="text-3xl">📱↻</div>
      <div className="flex-1 text-sm font-semibold">Rotate your phone to landscape for a bigger kitchen!</div>
      <Button size="sm" color="cream" onClick={() => setDismissed(true)}>
        OK
      </Button>
    </div>
  );
}
