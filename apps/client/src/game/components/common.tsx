import { INGREDIENTS, type IngredientId } from '@sizzle/shared';
import { IngredientIcon, OUTLINE } from '../../art/food';
import { LockIcon } from '../../art/icons';
import { useFx } from '../fx';
import { useGame } from '../GameContext';
import { sourceKey, useInput, type PointerSource } from '../input';

/** Circular timer ring drawn around cooking items. */
export function ProgressRing({ progress, size, color, width = 6, track = 'rgba(0,0,0,0.25)' }: { progress: number; size: number; color: string; width?: number; track?: string }) {
  const r = (size - width) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <svg width={size} height={size} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(-90deg)', pointerEvents: 'none' }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={width} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={width} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - p)} strokeLinecap="round" />
    </svg>
  );
}

/** Returns true for ~350ms after an invalid action on this source (for a shake). */
export function useShake(key: string): boolean {
  const t = useFx((s) => s.shakes[key]);
  return !!t && Date.now() - t < 350;
}

/** Common props for a pointer-interactive station element. */
export function useStation(src: PointerSource) {
  const { onPointerDown } = useGame();
  const key = sourceKey(src);
  const hover = useInput((s) => s.hover === key);
  const trashMode = useInput((s) => s.trashMode);
  const shaking = useShake(key);
  return {
    key,
    hover,
    trashMode,
    shaking,
    props: {
      'data-station': key,
      onPointerDown: (e: React.PointerEvent) => onPointerDown(e, src),
      className: 'station-hit',
    },
  };
}

export function Locked({ level, label }: { level: number; label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-slate-900/55 text-center text-white backdrop-grayscale" style={{ pointerEvents: 'none' }}>
      <LockIcon size={26} />
      <div className="mt-1 text-[13px] font-semibold leading-tight drop-shadow">{label ?? 'Unlocks at'}</div>
      <div className="text-[15px] font-bold leading-tight drop-shadow">Level {level}</div>
    </div>
  );
}

/** Ingredient bin/crate with stock counter and restock state. */
export function BinBox({ id, x, y, w, h, locked }: { id: IngredientId; x: number; y: number; w: number; h: number; locked?: number }) {
  const { state, mods } = useGame();
  const st = useStation({ kind: 'bin', bin: id });
  const bin = state.bins[id];
  const empty = bin.stock <= 0 && bin.restocking <= 0;
  const restocking = bin.restocking > 0;
  return (
    <div
      {...(locked ? {} : st.props)}
      className={`absolute ${locked ? '' : 'station-hit'} ${st.shaking ? 'anim-shake' : ''}`}
      style={{ left: x, top: y, width: w, height: h }}
    >
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(180deg,#c88a4a,#9a5f2c)',
          border: `3px solid ${OUTLINE}`,
          boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.25), inset 0 -6px 0 rgba(0,0,0,0.2)',
        }}
      />
      <div className="absolute inset-x-[6px] top-[6px] bottom-[18px] rounded-xl bg-[#f6e3c5]" style={{ border: `2px solid ${OUTLINE}` }} />
      <div className="absolute inset-0 flex items-center justify-center pb-3" style={{ opacity: empty ? 0.25 : 1 }}>
        <IngredientIcon id={id} size={Math.min(w, h) * 0.66} />
      </div>
      <div className="absolute inset-x-0 bottom-[1px] text-center text-[11px] font-bold uppercase tracking-wide text-amber-50" style={{ textShadow: '0 1px 0 #4a2c1a' }}>
        {INGREDIENTS[id].name}
      </div>
      {!locked && (
        <div className="absolute -right-1 -top-2 min-w-[28px] rounded-full px-1.5 text-center text-[14px] font-bold text-white" style={{ background: bin.stock <= 1 ? '#dc2626' : '#16a34a', border: `2px solid ${OUTLINE}` }}>
          {bin.stock}
        </div>
      )}
      {empty && !locked && (
        <div className="absolute inset-x-1 bottom-5 rounded-lg bg-red-600 py-0.5 text-center text-[11px] font-bold uppercase text-white anim-danger" style={{ border: `2px solid ${OUTLINE}` }}>
          Tap to restock
        </div>
      )}
      {restocking && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: 46, height: 46 }}>
            <ProgressRing progress={1 - bin.restocking / mods.restockTime} size={46} color="#22c55e" width={6} />
          </div>
        </div>
      )}
      {st.hover && <div className="absolute inset-0 rounded-2xl ring-4 ring-yellow-300" />}
      {locked && <Locked level={locked} />}
    </div>
  );
}
