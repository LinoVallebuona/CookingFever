import { FriesArt, OUTLINE } from '../../art/food';
import { unlockLevelForIngredient, useGame } from '../GameContext';
import { LAYOUT } from '../layout';
import { BinBox, Locked, ProgressRing, useStation } from './common';

function friesColor(p: number, burnt: boolean, burnP: number) {
  if (burnt) return '#3f2a1d';
  const raw = [245, 230, 180];
  const done = [255, 196, 40];
  const dark = [150, 90, 30];
  let c = raw.map((r, i) => Math.round(r + (done[i] - r) * Math.min(1, p)));
  if (burnP > 0.4) c = c.map((v, i) => Math.round(v + (dark[i] - v) * Math.min(1, (burnP - 0.4) / 0.6)));
  return `rgb(${c.join(',')})`;
}

function Basket({ index, x, y, w }: { index: number; x: number; y: number; w: number }) {
  const { state, mods } = useGame();
  const b = state.fryer[index];
  const st = useStation({ kind: 'fryer', index });
  const p = b.state === 'frying' ? b.timer / mods.friesCookTime : 1;
  const burnP = b.state === 'done' ? (b.timer - mods.friesCookTime) / mods.friesBurnTime : b.state === 'burnt' ? 1 : 0;
  const warning = b.state === 'done' && burnP > 0.6;
  return (
    <div {...st.props} className={`absolute station-hit ${st.shaking ? 'anim-shake' : ''}`} style={{ left: x, top: y, width: w, height: 104 }}>
      <div className="absolute inset-x-1 bottom-0 top-6 rounded-b-2xl rounded-t-md" style={{ background: 'linear-gradient(180deg,#f59e0b 0%,#b45309 100%)', border: `3px solid ${OUTLINE}`, boxShadow: st.trashMode && b.state !== 'empty' ? '0 0 0 4px #ef4444' : undefined }}>
        {b.state === 'frying' &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="oil-bubble absolute rounded-full bg-amber-200" style={{ width: 8, height: 8, left: 10 + i * 18, bottom: 6, animationDelay: `${i * 0.2}s` }} />
          ))}
      </div>
      {b.state !== 'empty' && (
        <div className={`absolute inset-x-3 top-0 bottom-3 ${b.state === 'done' && !warning ? 'anim-ready' : ''}`}>
          <div className="absolute inset-x-0 bottom-0 top-3 rounded-lg" style={{ background: 'repeating-linear-gradient(45deg,#cbd5e1 0 3px,transparent 3px 9px),repeating-linear-gradient(-45deg,#cbd5e1 0 3px,transparent 3px 9px)', border: `3px solid ${OUTLINE}` }} />
          <div className="absolute inset-x-2 bottom-2 top-0 flex items-end justify-center gap-[3px]">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ width: 6, height: 26 + ((i * 7) % 12), background: friesColor(p, b.state === 'burnt', burnP), border: `1.5px solid ${OUTLINE}`, borderRadius: 2, transform: `rotate(${(i - 3) * 5}deg)` }} />
            ))}
          </div>
          <div className="absolute -right-3 top-2 h-[6px] w-6 rounded bg-slate-700" />
        </div>
      )}
      {b.state === 'frying' && (
        <div className="absolute left-1/2 top-1/2" style={{ width: 0, height: 0 }}>
          <div className="relative" style={{ width: 70, height: 70, transform: 'translate(-50%,-50%)' }}>
            <ProgressRing progress={p} size={70} color="#22c55e" />
          </div>
        </div>
      )}
      {b.state === 'done' && (
        <>
          <div className="absolute left-1/2 top-1/2" style={{ width: 0, height: 0 }}>
            <div className="relative" style={{ width: 70, height: 70, transform: 'translate(-50%,-50%)' }}>
              <ProgressRing progress={1 - burnP} size={70} color={warning ? '#ef4444' : '#f59e0b'} />
            </div>
          </div>
          {b.portions < mods.friesPerBatch && <div className="absolute -left-1 top-0 rounded-full bg-white px-1.5 text-[12px] font-bold" style={{ border: `2px solid ${OUTLINE}` }}>×{b.portions}</div>}
        </>
      )}
      {b.state === 'burnt' && (
        <div className="pointer-events-none absolute left-1/2 top-0 flex -translate-x-1/2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="steam-puff rounded-full" style={{ width: 14, height: 14, background: '#52525b', animationDelay: `${i * 0.5}s` }} />
          ))}
        </div>
      )}
      {warning && <div className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[13px] font-bold text-white anim-danger" style={{ border: `2px solid ${OUTLINE}` }}>!</div>}
      {b.state === 'empty' && <div className="absolute inset-x-0 top-[44px] text-center text-[12px] font-semibold text-amber-50 drop-shadow">tap to fry</div>}
    </div>
  );
}

export function Fryer() {
  const { state } = useGame();
  const L = LAYOUT.fryer;
  const locked = !state.ingredients.includes('fries');
  const n = state.fryer.length;
  const bw = n === 1 ? 120 : 80;
  return (
    <>
      <div className="absolute rounded-3xl" style={{ left: L.x, top: L.y, width: L.w, height: 172, background: 'linear-gradient(180deg,#cbd5e1,#64748b)', border: `4px solid ${OUTLINE}`, boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.5)' }}>
        <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 rounded-b-lg bg-yellow-500 px-3 text-[12px] font-bold uppercase tracking-widest text-white" style={{ border: `2px solid ${OUTLINE}`, textShadow: '0 1px 0 #4a2c1a' }}>
          Fryer
        </div>
      </div>
      {!locked && state.fryer.map((_, i) => <Basket key={i} index={i} x={L.x + (L.w - bw * n) / 2 + i * bw} y={L.y + 30} w={bw} />)}
      <BinBox id="fries" x={L.x + 28} y={644} w={120} h={66} locked={locked ? unlockLevelForIngredient('fries') : undefined} />
      {locked && (
        <div className="absolute" style={{ left: L.x, top: L.y, width: L.w, height: 172 }}>
          <Locked level={unlockLevelForIngredient('fries')} />
        </div>
      )}
    </>
  );
}

export function Warmer() {
  const { state } = useGame();
  const st = useStation({ kind: 'warmer' });
  const L = LAYOUT.warmer;
  const locked = !state.ingredients.includes('fries');
  const cap = state.warmer.capacity;
  const cols = cap > 4 ? 3 : 2;
  return (
    <div {...(locked ? {} : st.props)} className={`absolute ${locked ? '' : 'station-hit'} ${st.shaking ? 'anim-shake' : ''}`} style={{ left: L.x, top: L.y, width: L.w, height: L.h }}>
      <div className="absolute inset-x-2 top-0 h-5 rounded-t-xl" style={{ background: '#475569', border: `3px solid ${OUTLINE}` }} />
      <div className="absolute inset-x-4 top-4 h-10" style={{ background: 'linear-gradient(180deg,rgba(251,146,60,0.55),transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 top-8 rounded-2xl" style={{ background: 'linear-gradient(180deg,#e2e8f0,#94a3b8)', border: `4px solid ${OUTLINE}` }} />
      <div className="absolute inset-x-2 bottom-2 top-10 grid gap-x-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, alignItems: 'end' }}>
        {Array.from({ length: cap }).map((_, i) => (
          <div key={i} className="flex h-[52px] items-end justify-center">
            {i < state.warmer.portions ? <FriesArt size={cols === 3 ? 30 : 40} /> : <div className="h-3 w-7 rounded-full bg-slate-400/70" />}
          </div>
        ))}
      </div>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-2 text-[11px] font-bold uppercase text-white" style={{ border: `2px solid ${OUTLINE}` }}>
        Warmer {state.warmer.portions}/{cap}
      </div>
      {st.hover && <div className="absolute inset-0 rounded-2xl ring-4 ring-yellow-300" />}
      {state.warmer.portions > 0 && state.customers.some((c) => c.phase === 'waiting' && c.order.some((o) => !o.served && o.item === 'fries')) && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl anim-ready" />
      )}
      {locked && <Locked level={unlockLevelForIngredient('fries')} />}
    </div>
  );
}
