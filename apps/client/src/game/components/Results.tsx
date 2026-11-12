import type { CompleteLevelResponse, GameResult } from '@sizzle/shared';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CoinIcon, StarIcon } from '../../art/icons';
import { audio } from '../../audio/AudioManager';
import { Button, Panel, Spinner } from '../../components/ui';
import { useApp } from '../../store/useApp';

function Row({ label, value, icon, strong }: { label: string; value: React.ReactNode; icon?: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-xl px-3 py-1.5 ${strong ? 'bg-amber-100' : 'bg-white/70'}`}>
      <span className="font-semibold text-amber-900">{label}</span>
      <span className={`flex items-center gap-1 font-bold tabular-nums ${strong ? 'text-2xl text-amber-700' : 'text-lg text-slate-800'}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}

export function ResultsOverlay({
  local,
  completion,
  error,
  submitting,
  onRetrySubmit,
}: {
  local: GameResult;
  completion: CompleteLevelResponse | null;
  error: string | null;
  submitting: boolean;
  onRetrySubmit(): void;
}) {
  const startLevel = useApp((s) => s.startLevel);
  const quitRun = useApp((s) => s.quitRun);
  const run = useApp((s) => s.run)!;
  const player = useApp((s) => s.player);
  const result = completion?.result ?? local;
  const reward = completion?.reward;
  const [shownStars, setShownStars] = useState(0);

  useEffect(() => {
    if (shownStars >= result.stars) return;
    const t = setTimeout(() => {
      setShownStars((s) => s + 1);
      audio.play('star');
    }, shownStars === 0 ? 500 : 420);
    return () => clearTimeout(t);
  }, [shownStars, result.stars]);

  const levelNumber = run.level.number;
  const levels = player?.restaurants.find((r) => r.restaurant.id === run.level.restaurantId)?.levels ?? [];
  const nextUnlocked = levels.find((l) => l.levelNumber === levelNumber + 1)?.unlocked;

  return (
    <motion.div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="w-full max-w-xl" data-testid="results">
        <Panel className="max-h-[96vh] overflow-y-auto p-3 scroll-area sm:p-4">
          <div className="text-center text-sm font-bold uppercase tracking-[0.3em] text-orange-600">Level {levelNumber} · {run.level.name}</div>
          <h2 className={`text-center text-3xl font-bold sm:text-4xl ${result.passed ? 'text-green-700' : 'text-red-600'}`} data-testid="results-title">
            {result.passed ? (result.stars === 3 ? 'Perfect shift!' : 'Level complete!') : 'Level failed'}
          </h2>
          <div className="my-1 flex items-end justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <motion.div key={i} animate={shownStars >= i ? { scale: [0.3, 1.35, 1], rotate: [0, 15, 0] } : { scale: 1 }} transition={{ duration: 0.45 }} style={{ marginBottom: i === 2 ? 14 : 0 }}>
                <StarIcon size={i === 2 ? 58 : 46} filled={shownStars >= i} />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            <Row label="Sales" value={result.sales} icon={<CoinIcon size={20} />} />
            <Row label="Tips" value={result.tips} icon={<CoinIcon size={20} />} />
            <Row label="Combo bonus" value={result.comboBonus} icon={<CoinIcon size={20} />} />
            <Row label="Satisfaction" value={`${result.satisfaction}%`} />
            <Row label="Served" value={`${result.served} / ${result.totalCustomers}`} />
            <Row label="Best combo" value={`×${result.maxCombo}`} />
          </div>
          <div className="mt-1.5">
            <Row label="Total revenue" value={result.revenue} icon={<CoinIcon size={24} />} strong />
          </div>

          <div className="mt-2 grid grid-cols-1 gap-x-4 rounded-2xl bg-white/70 p-2 sm:grid-cols-2" style={{ border: '3px solid #4a2c1a' }}>
            <div className="mb-0.5 text-sm font-bold uppercase tracking-wider text-amber-800 sm:col-span-2">Objectives</div>
            {result.objectives.map((o) => (
              <div key={o.id} className="flex items-center gap-2 text-[15px] font-semibold">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${o.met ? 'bg-green-500' : 'bg-slate-400'}`}>{o.met ? '✓' : '✗'}</span>
                <span className={o.met ? 'text-green-800' : 'text-slate-600'}>
                  {o.id === 'bonus' ? '★★★ bonus: ' : `${'★'.repeat(o.id === 'star1' ? 1 : o.id === 'star2' ? 2 : 3)} `}
                  {o.label}
                </span>
              </div>
            ))}
          </div>

          {submitting && (
            <div className="mt-3 flex items-center justify-center gap-3 rounded-2xl bg-orange-500 p-3 font-semibold text-white">
              <Spinner size={26} /> Saving your result…
            </div>
          )}
          {reward && (
            <div className="mt-2 rounded-2xl bg-gradient-to-b from-yellow-200 to-amber-300 px-3 py-2" style={{ border: '3px solid #4a2c1a' }} data-testid="reward">
              <div className="flex items-center justify-between text-amber-900">
                <span className="font-bold">Coins earned</span>
                <span className="flex items-center gap-1 text-3xl font-bold">
                  <CoinIcon size={30} />+{reward.total}
                </span>
              </div>
              {(reward.firstClearBonus > 0 || reward.starBonus > 0) && (
                <div className="mt-1 text-sm font-semibold text-amber-900">
                  {reward.levelCoins} from the shift
                  {reward.firstClearBonus > 0 && ` · +${reward.firstClearBonus} first clear bonus`}
                  {reward.starBonus > 0 && ` · +${reward.starBonus} new star bonus`}
                </div>
              )}
              {completion?.newlyUnlockedLevel && <div className="mt-1 font-bold text-green-800">🔓 Level {completion.newlyUnlockedLevel} unlocked!</div>}
            </div>
          )}
          {error && (
            <div className="mt-3 rounded-2xl bg-red-100 p-3 text-red-800" style={{ border: '3px solid #4a2c1a' }}>
              <div className="font-bold">Your result could not be saved.</div>
              <div className="text-sm">{error}</div>
              <Button size="sm" color="red" className="mt-2" onClick={onRetrySubmit} disabled={submitting}>
                Try saving again
              </Button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button color="cream" className="flex-1" onClick={quitRun} testId="results-map">
              Level map
            </Button>
            <Button color="blue" className="flex-1" onClick={() => void startLevel(levelNumber)} testId="results-retry">
              Retry
            </Button>
            <Button
              color="green"
              className="flex-[1.6] whitespace-nowrap"
              onClick={() => (nextUnlocked && levelNumber < 20 ? void startLevel(levelNumber + 1) : quitRun())}
              testId="results-continue"
            >
              {nextUnlocked && levelNumber < 20 ? `Continue: Level ${levelNumber + 1} ▶` : 'Continue ▶'}
            </Button>
          </div>
        </Panel>
      </motion.div>
    </motion.div>
  );
}
