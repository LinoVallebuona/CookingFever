import { describeObjective, isBonusObjectiveMet } from '@sizzle/shared';
import { OUTLINE } from '../../art/food';
import { ClockIcon, CoinIcon, StarIcon } from '../../art/icons';
import { useGame } from '../GameContext';

export function Hud({ onPause }: { onPause(): void }) {
  const { state, level, controller } = useGame();
  const [t1, t2, t3] = level.targets;
  const max = t3 * 1.12;
  const rev = state.stats.revenue;
  const timeLeft = Math.max(0, level.duration - state.time);
  const mm = Math.floor(timeLeft / 60);
  const ss = Math.floor(timeLeft % 60);
  const lowTime = timeLeft < 15;
  const remaining = level.customers - state.spawned + state.customers.filter((c) => c.phase !== 'leaving').length;
  const bonusMet = isBonusObjectiveMet(level, state);
  const bonusFinal = level.bonusObjective.type === 'maxLost' || level.bonusObjective.type === 'minSatisfaction';
  const stars = rev >= t3 && bonusMet ? 3 : rev >= t2 ? 2 : rev >= t1 ? 1 : 0;

  return (
    <>
      {/* revenue & targets */}
      <div className="absolute left-3 top-2 rounded-2xl px-3 py-1.5" style={{ width: 330, background: 'rgba(255,250,240,0.95)', border: `3px solid ${OUTLINE}`, boxShadow: '0 4px 0 rgba(74,44,26,0.4)', zIndex: 20 }}>
        <div className="flex items-center gap-2">
          <CoinIcon size={30} />
          <div className="text-[26px] font-bold leading-none text-amber-700 tabular-nums" data-testid="hud-revenue">{rev}</div>
          <div className="ml-auto flex">
            {[1, 2, 3].map((i) => (
              <StarIcon key={i} size={22} filled={stars >= i} />
            ))}
          </div>
        </div>
        <div className="relative mt-1 h-3.5 rounded-full bg-slate-200" style={{ border: `2px solid ${OUTLINE}` }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (rev / max) * 100)}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', transition: 'width .3s' }} />
          {[t1, t2, t3].map((t, i) => (
            <div key={i} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(t / max) * 100}%` }}>
              <StarIcon size={18} filled={rev >= t && (i < 2 || bonusMet)} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-amber-900">
          <span>Goal {t1} · {t2} · {t3}</span>
          <span className={bonusMet ? 'text-green-700' : bonusFinal ? 'text-red-600' : 'text-slate-500'}>
            ★3: {describeObjective(level.bonusObjective)} {bonusMet ? '✓' : ''}
          </span>
        </div>
      </div>

      {/* timer */}
      <div className={`absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-1 ${lowTime ? 'anim-danger' : ''}`} style={{ background: lowTime ? '#fee2e2' : 'rgba(255,250,240,0.95)', border: `3px solid ${OUTLINE}`, boxShadow: '0 4px 0 rgba(74,44,26,0.4)', zIndex: 20 }}>
        <ClockIcon size={26} />
        <span className={`text-[24px] font-bold tabular-nums ${lowTime ? 'text-red-600' : 'text-slate-800'}`} data-testid="hud-timer">
          {mm}:{ss.toString().padStart(2, '0')}
        </span>
      </div>
      <div className="absolute left-1/2 top-[50px] -translate-x-1/2 rounded-full bg-black/40 px-3 text-[12px] font-semibold text-white" style={{ zIndex: 20 }}>
        Level {level.number} · {level.name}
      </div>

      {/* right side: customers left, combo, pause */}
      <div className="absolute right-3 top-2 flex items-center gap-2" style={{ zIndex: 20 }}>
        {state.stats.combo >= 2 && state.time - state.stats.lastCompleteAt < controller.engine.mods.comboWindow && (
          <div className="anim-bob rounded-full bg-fuchsia-600 px-3 py-1 text-[18px] font-bold text-white" style={{ border: `3px solid ${OUTLINE}` }}>
            Combo ×{state.stats.combo}
          </div>
        )}
        <div className="flex items-center gap-1 rounded-full px-3 py-1 text-[18px] font-bold text-slate-800" style={{ background: 'rgba(255,250,240,0.95)', border: `3px solid ${OUTLINE}`, boxShadow: '0 4px 0 rgba(74,44,26,0.4)' }} title="Customers still to serve">
          <span>🧑‍🤝‍🧑</span>
          <span className="tabular-nums" data-testid="hud-customers">{remaining}</span>
        </div>
        <button
          aria-label="Pause"
          data-testid="pause-button"
          onClick={onPause}
          className="btn-3d flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white"
        >
          <svg width="22" height="22" viewBox="0 0 22 22">
            <rect x="4" y="3" width="5" height="16" rx="1.5" fill="#fff" />
            <rect x="13" y="3" width="5" height="16" rx="1.5" fill="#fff" />
          </svg>
        </button>
      </div>
    </>
  );
}
