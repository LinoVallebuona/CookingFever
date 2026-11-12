import { burgerForToppings, MENU, type IngredientId } from '@sizzle/shared';
import { BurgerArt, OUTLINE } from '../../art/food';
import { unlockLevelForIngredient, useGame } from '../GameContext';
import { LAYOUT } from '../layout';
import { BinBox, useStation } from './common';

function PlateView({ index, x, w }: { index: number; x: number; w: number }) {
  const { state, level } = useGame();
  const p = state.plates[index];
  const st = useStation({ kind: 'plate', index });
  const burger = p.bun && p.patty ? burgerForToppings(p.toppings) : null;
  const valid = burger && level.menu.includes(burger);
  const wanted = valid && state.customers.some((c) => c.phase === 'waiting' && c.order.some((o) => !o.served && o.item === burger));
  return (
    <div {...st.props} data-drop={`plate:${index}`} className={`absolute station-hit ${st.shaking ? 'anim-shake' : ''}`} style={{ left: x, top: 470, width: w, height: 112 }}>
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
        style={{
          bottom: 4,
          width: w - 6,
          height: 34,
          background: 'radial-gradient(ellipse at 50% 40%, #ffffff 0 55%, #e2e8f0 56% 100%)',
          border: `3px solid ${OUTLINE}`,
          boxShadow: st.hover ? '0 0 0 4px #facc15' : st.trashMode && p.bun ? '0 0 0 4px #ef4444' : '0 4px 0 rgba(0,0,0,0.2)',
        }}
      />
      {p.bun ? (
        <div className={`absolute left-1/2 -translate-x-1/2 ${wanted ? 'anim-ready' : ''}`} style={{ bottom: 12 }}>
          <BurgerArt size={Math.min(84, w - 6)} stack={p} />
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-[14px] text-center text-[12px] font-semibold text-slate-500">tap for bun</div>
      )}
      {burger && (
        <div className="absolute -bottom-[14px] left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-full px-2 text-[11px] font-bold text-white" style={{ background: valid ? '#16a34a' : '#64748b', border: `2px solid ${OUTLINE}` }}>
          {valid ? MENU[burger].name : '???'}
        </div>
      )}
    </div>
  );
}

const TOPPING_BINS: IngredientId[] = ['bun', 'cheese', 'lettuce', 'tomato'];

export function Assembly() {
  const { state } = useGame();
  const L = LAYOUT.assembly;
  const n = state.plates.length;
  const pw = Math.min(110, L.w / n);
  const startX = L.x + (L.w - pw * n) / 2;
  const bw = 80;
  const gap = (L.w - bw * 4) / 3;
  return (
    <>
      <div className="absolute rounded-3xl" style={{ left: L.x, top: L.y, width: L.w, height: 136, background: 'linear-gradient(180deg,#fde7c8,#e9c79a)', border: `4px solid ${OUTLINE}`, boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.5)' }}>
        <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 rounded-b-lg bg-amber-600 px-3 text-[12px] font-bold uppercase tracking-widest text-white" style={{ border: `2px solid ${OUTLINE}` }}>
          Burger Station
        </div>
      </div>
      {state.plates.map((_, i) => (
        <PlateView key={i} index={i} x={startX + pw * i} w={pw} />
      ))}
      {TOPPING_BINS.map((id, i) => (
        <BinBox key={id} id={id} x={L.x + i * (bw + gap)} y={604} w={bw} h={106} locked={state.ingredients.includes(id) ? undefined : unlockLevelForIngredient(id)} />
      ))}
    </>
  );
}
