import { OUTLINE, ShakeArt, SodaArt } from '../../art/food';
import { TrashIcon } from '../../art/icons';
import { unlockLevelForIngredient, useGame } from '../GameContext';
import { LAYOUT } from '../layout';
import { BinBox, Locked, ProgressRing, useStation } from './common';

function CupSlot({ index, x, w }: { index: number; x: number; w: number }) {
  const { state, mods } = useGame();
  const c = state.cups[index];
  const st = useStation({ kind: 'cup', index });
  const fill = c.state === 'filling' ? c.timer / mods.drinkFillTime : c.state === 'full' ? 1 : 0;
  const wanted = c.state === 'full' && state.customers.some((cu) => cu.phase === 'waiting' && cu.order.some((o) => !o.served && o.item === 'cola'));
  return (
    <div {...st.props} className={`absolute station-hit ${st.shaking ? 'anim-shake' : ''}`} style={{ left: x, top: 530, width: w, height: 96 }}>
      {c.state === 'filling' && <div className="absolute left-1/2 top-0 h-[34px] w-[6px] -translate-x-1/2 rounded bg-amber-900/80" />}
      <div className="absolute inset-x-0 bottom-0 h-3 rounded-full bg-slate-500" style={{ border: `2px solid ${OUTLINE}` }} />
      {c.state !== 'empty' ? (
        <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 ${wanted ? 'anim-ready' : ''}`} style={{ boxShadow: st.trashMode ? '0 0 0 4px #ef4444' : undefined, borderRadius: 8 }}>
          <SodaArt size={46} fill={fill} />
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-5 text-center text-[11px] font-semibold text-white drop-shadow">tap</div>
      )}
      {st.hover && <div className="absolute inset-0 rounded-xl ring-4 ring-yellow-300" />}
    </div>
  );
}

export function SodaFountain() {
  const { state } = useGame();
  const L = LAYOUT.soda;
  const n = state.cups.length;
  const w = (L.w - 24) / n;
  return (
    <>
      <div className="absolute rounded-3xl" style={{ left: L.x, top: L.y, width: L.w, height: 178, background: 'linear-gradient(180deg,#ef4444,#991b1b)', border: `4px solid ${OUTLINE}`, boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.35)' }}>
        <div className="absolute left-3 right-3 top-3 h-12 rounded-xl" style={{ background: 'linear-gradient(180deg,#fef3c7,#fcd34d)', border: `3px solid ${OUTLINE}` }}>
          <div className="mt-1 text-center text-[15px] font-bold leading-none text-red-700">SODA</div>
          <div className="text-center text-[10px] font-bold uppercase leading-tight text-red-700/80">ice cold</div>
        </div>
        <div className="absolute left-3 right-3 top-[64px] flex justify-around">
          {state.cups.map((_, i) => (
            <div key={i} className="h-5 w-5 rounded-b-lg bg-slate-300" style={{ border: `2px solid ${OUTLINE}` }} />
          ))}
        </div>
        <div className="absolute bottom-0 left-2 right-2 h-[78px] rounded-b-2xl bg-black/25" />
      </div>
      {state.cups.map((_, i) => (
        <CupSlot key={i} index={i} x={L.x + 12 + w * i} w={w} />
      ))}
      <BinBox id="cup" x={L.x + 26} y={644} w={120} h={66} />
    </>
  );
}

function ShakerSlot({ index, x }: { index: number; x: number }) {
  const { state, mods } = useGame();
  const s = state.shakers[index];
  const st = useStation({ kind: 'shaker', index });
  const p = s.state === 'blending' ? s.timer / mods.shakeBlendTime : 1;
  const meltP = s.state === 'ready' ? (s.timer - mods.shakeBlendTime) / mods.shakeMeltTime : 0;
  const wanted = s.state === 'ready' && state.customers.some((cu) => cu.phase === 'waiting' && cu.order.some((o) => !o.served && o.item === 'milkshake'));
  return (
    <div {...st.props} className={`absolute station-hit ${st.shaking ? 'anim-shake' : ''}`} style={{ left: x, top: 488, width: 62, height: 120 }}>
      <div className="absolute inset-x-0 bottom-0 h-8 rounded-lg" style={{ background: 'linear-gradient(180deg,#a855f7,#6b21a8)', border: `3px solid ${OUTLINE}` }}>
        <div className="mx-auto mt-1.5 h-2.5 w-2.5 rounded-full" style={{ background: s.state === 'blending' ? '#4ade80' : '#475569' }} />
      </div>
      {s.state === 'empty' && (
        <div className="absolute bottom-8 left-1/2 h-[64px] w-[42px] -translate-x-1/2 rounded-t-md rounded-b-lg bg-white/50" style={{ border: `3px solid ${OUTLINE}` }}>
          <div className="mt-5 text-center text-[11px] font-bold text-purple-900">tap</div>
        </div>
      )}
      {s.state === 'blending' && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2" style={{ transform: `translateX(-50%) rotate(${Math.sin(s.timer * 40) * 3}deg)` }}>
          <ShakeArt size={44} fill={p} />
        </div>
      )}
      {(s.state === 'ready' || s.state === 'melted') && (
        <div className={`absolute bottom-7 left-1/2 -translate-x-1/2 ${wanted ? 'anim-ready' : ''}`} style={{ filter: s.state === 'melted' ? 'sepia(0.8) saturate(0.6) brightness(0.8)' : undefined, boxShadow: st.trashMode ? '0 0 0 4px #ef4444' : undefined }}>
          <ShakeArt size={44} fill={s.state === 'melted' ? 0.55 : 1} />
        </div>
      )}
      {s.state === 'blending' && (
        <div className="absolute left-1/2 top-[40px]" style={{ width: 0, height: 0 }}>
          <div className="relative" style={{ width: 58, height: 58, transform: 'translate(-50%,-50%)' }}>
            <ProgressRing progress={p} size={58} color="#22c55e" width={5} />
          </div>
        </div>
      )}
      {s.state === 'ready' && meltP > 0.6 && <div className="absolute -right-1 top-0 rounded-full bg-red-600 px-1.5 text-[13px] font-bold text-white anim-danger" style={{ border: `2px solid ${OUTLINE}` }}>!</div>}
      {st.hover && <div className="absolute inset-0 rounded-xl ring-4 ring-yellow-300" />}
    </div>
  );
}

export function Blender() {
  const { state, level } = useGame();
  const L = LAYOUT.blender;
  const locked = !level.menu.includes('milkshake');
  return (
    <>
      <div className="absolute rounded-3xl" style={{ left: L.x, top: L.y, width: L.w, height: 178, background: 'linear-gradient(180deg,#f0abfc,#c026d3)', border: `4px solid ${OUTLINE}`, boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.4)' }}>
        <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-lg bg-fuchsia-700 px-2 text-[12px] font-bold uppercase tracking-widest text-white" style={{ border: `2px solid ${OUTLINE}` }}>
          Shakes
        </div>
      </div>
      {!locked && state.shakers.map((_, i) => <ShakerSlot key={i} index={i} x={L.x + 4 + i * 64} />)}
      <BinBox id="milk" x={L.x + 7} y={644} w={120} h={66} locked={locked ? unlockLevelForIngredient('milk') : undefined} />
      {locked && (
        <div className="absolute" style={{ left: L.x, top: L.y, width: L.w, height: 178 }}>
          <Locked level={unlockLevelForIngredient('milk')} />
        </div>
      )}
    </>
  );
}

export function Trash() {
  const st = useStation({ kind: 'trash' });
  const L = LAYOUT.trash;
  return (
    <div {...st.props} data-drop="trash" className="absolute station-hit flex flex-col items-center justify-end" style={{ left: L.x, top: L.y, width: L.w, height: L.h }}>
      <div className={st.trashMode ? 'anim-bob' : ''} style={{ filter: st.hover || st.trashMode ? 'drop-shadow(0 0 8px #ef4444)' : undefined }}>
        <TrashIcon size={50} open={st.hover || st.trashMode} />
      </div>
      <div className="rounded-full px-2 text-[11px] font-bold uppercase text-white" style={{ background: st.trashMode ? '#dc2626' : '#475569', border: `2px solid ${OUTLINE}` }}>
        {st.trashMode ? 'Tap item' : 'Trash'}
      </div>
    </div>
  );
}
