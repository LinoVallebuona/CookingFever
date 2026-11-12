import { DINER_LEVELS, describeObjective, type LevelProgressDTO } from '@sizzle/shared';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { MenuIcon } from '../art/food';
import { CoinIcon, LockIcon, StarIcon } from '../art/icons';
import { TopBar } from '../components/TopBar';
import { Button, Modal, Panel, Stars } from '../components/ui';
import { useApp } from '../store/useApp';

const PER_ROW = 5;

function LevelNode({ lp, current, onClick }: { lp: LevelProgressDTO; current: boolean; onClick(): void }) {
  const def = DINER_LEVELS[lp.levelNumber - 1];
  return (
    <motion.button
      data-testid={`level-${lp.levelNumber}`}
      whileTap={lp.unlocked ? { scale: 0.92 } : undefined}
      onClick={onClick}
      disabled={!lp.unlocked}
      className="relative flex flex-col items-center"
      aria-label={`Level ${lp.levelNumber}${lp.unlocked ? '' : ' (locked)'}`}
    >
      {current && (
        <motion.div className="absolute -top-7 z-10 rounded-full bg-red-500 px-2 text-xs font-bold uppercase text-white" style={{ border: '2px solid #4a2c1a' }} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
          Play
        </motion.div>
      )}
      <div
        className={`flex h-[68px] w-[68px] items-center justify-center rounded-full text-3xl font-bold sm:h-[78px] sm:w-[78px] ${current ? 'anim-ready' : ''}`}
        style={{
          background: !lp.unlocked ? 'linear-gradient(180deg,#cbd5e1,#64748b)' : lp.completed ? 'linear-gradient(180deg,#fde047,#f59e0b)' : 'linear-gradient(180deg,#fb923c,#ea580c)',
          border: '4px solid #4a2c1a',
          boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.2), inset 0 4px 0 rgba(255,255,255,0.4), 0 5px 0 rgba(74,44,26,0.45)',
          color: lp.completed ? '#7c2d12' : '#fff',
          textShadow: lp.completed ? undefined : '0 2px 0 rgba(0,0,0,0.3)',
        }}
      >
        {lp.unlocked ? lp.levelNumber : <LockIcon size={30} />}
      </div>
      <div className="-mt-2 rounded-full bg-amber-50/95 px-1" style={{ border: '2px solid #4a2c1a' }}>
        <Stars count={lp.bestStars} size={16} />
      </div>
      <div className="mt-0.5 max-w-[96px] truncate text-[11px] font-bold text-white drop-shadow sm:text-xs">{def?.name}</div>
    </motion.button>
  );
}

export function LevelMap() {
  const player = useApp((s) => s.player);
  const startLevel = useApp((s) => s.startLevel);
  const starting = useApp((s) => s.startingLevel);
  const [selected, setSelected] = useState<number | null>(null);
  const diner = player?.restaurants.find((r) => r.restaurant.id === 'diner');
  if (!diner) return null;
  const current = diner.levels.find((l) => l.unlocked && !l.completed)?.levelNumber ?? null;
  const rows: LevelProgressDTO[][] = [];
  for (let i = 0; i < diner.levels.length; i += PER_ROW) {
    const row = diner.levels.slice(i, i + PER_ROW);
    rows.push((i / PER_ROW) % 2 === 1 ? [...row].reverse() : row);
  }
  const sel = selected ? diner.levels.find((l) => l.levelNumber === selected) : null;
  const selDef = selected ? DINER_LEVELS[selected - 1] : null;

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Sunny's Diner" back="menu" />
      <div className="scroll-area flex-1 px-2 pb-6 pt-4">
        <div className="relative mx-auto max-w-3xl rounded-[36px] p-4 sm:p-6" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))', border: '4px dashed rgba(255,255,255,0.35)' }}>
          <div className="mb-2 flex items-center justify-center gap-2 text-lg font-bold text-white">
            <StarIcon size={24} /> {diner.stars} / {diner.levels.length * 3} stars collected
          </div>
          {rows.map((row, ri) => (
            <div key={ri} className="relative">
              <div className="absolute left-[8%] right-[8%] top-[34px] h-3 rounded-full bg-white/35 sm:top-[39px]" />
              {ri < rows.length - 1 && <div className={`absolute top-[34px] h-[calc(100%-10px)] w-3 rounded-full bg-white/35 sm:top-[39px] ${ri % 2 === 0 ? 'right-[8%]' : 'left-[8%]'}`} />}
              <div className="relative grid grid-cols-5 gap-1 pb-7 pt-6">
                {row.map((lp) => (
                  <div key={lp.levelNumber} className="flex justify-center">
                    <LevelNode lp={lp} current={lp.levelNumber === current} onClick={() => setSelected(lp.levelNumber)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal open={!!sel} onClose={() => setSelected(null)}>
        {sel && selDef && (
          <Panel className="p-5">
            <div className="text-center text-sm font-bold uppercase tracking-[0.3em] text-orange-600">Level {sel.levelNumber}</div>
            <h2 className="text-center text-3xl font-bold text-amber-900">{selDef.name}</h2>
            <div className="mt-2 flex justify-center">
              <Stars count={sel.bestStars} size={40} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-white/70 p-2">
                <div className="text-xs font-bold uppercase text-amber-700">Best revenue</div>
                <div className="flex items-center justify-center gap-1 text-xl font-bold">
                  <CoinIcon size={20} /> {sel.bestRevenue}
                </div>
              </div>
              <div className="rounded-xl bg-white/70 p-2">
                <div className="text-xs font-bold uppercase text-amber-700">Attempts</div>
                <div className="text-xl font-bold">{sel.attempts}</div>
              </div>
            </div>
            <div className="mt-2 rounded-xl bg-white/70 p-2 text-[15px] font-semibold text-amber-900">
              <div>★ {selDef.targets[0]} · ★★ {selDef.targets[1]} · ★★★ {selDef.targets[2]} coins</div>
              <div>★★★ bonus: {describeObjective(selDef.bonusObjective)}</div>
              <div>
                {selDef.customers} customers · {Math.floor(selDef.duration / 60)}:{String(selDef.duration % 60).padStart(2, '0')} shift · difficulty {'🌶'.repeat(selDef.difficulty)}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {selDef.menu.map((m) => (
                <div key={m} className="flex h-12 items-end">
                  <MenuIcon item={m} size={40} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button color="cream" className="flex-1" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button
                color="green"
                size="lg"
                className="flex-[2]"
                disabled={!!starting}
                testId="level-play"
                onClick={async () => {
                  const ok = await startLevel(sel.levelNumber);
                  if (ok) setSelected(null);
                }}
              >
                {starting ? 'Loading…' : 'Play'}
              </Button>
            </div>
          </Panel>
        )}
      </Modal>
    </div>
  );
}
