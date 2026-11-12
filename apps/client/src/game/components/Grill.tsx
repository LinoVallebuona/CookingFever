import { OUTLINE, pattyColor } from '../../art/food';
import { useGame } from '../GameContext';
import { LAYOUT, grillSlotRect } from '../layout';
import { BinBox, ProgressRing, useStation } from './common';

function GrillSlot({ index }: { index: number }) {
  const { state, mods } = useGame();
  const g = state.grill[index];
  const st = useStation({ kind: 'grill', index });
  const r = grillSlotRect(index, state.grill.length);
  const cookP = g.state === 'raw' ? g.timer / mods.pattyCookTime : 1;
  const burnP = g.state === 'cooked' ? (g.timer - mods.pattyCookTime) / mods.pattyBurnTime : g.state === 'burnt' ? 1 : 0;
  const color = g.state === 'empty' ? 'transparent' : pattyColor(cookP, g.state === 'burnt', g.state === 'cooked' ? Math.max(0, burnP - 0.4) : 0);
  const ready = g.state === 'cooked';
  const warning = ready && burnP > 0.6;
  return (
    <div {...st.props} className={`absolute station-hit ${st.shaking ? 'anim-shake' : ''}`} style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'repeating-linear-gradient(90deg,#3f3f46 0 8px,#18181b 8px 14px)',
          border: `3px solid ${OUTLINE}`,
          boxShadow: st.trashMode && g.state !== 'empty' ? '0 0 0 4px #ef4444' : 'inset 0 0 18px rgba(249,115,22,0.45)',
        }}
      />
      {g.state !== 'empty' && (
        <div className={`absolute inset-0 flex items-center justify-center ${ready && !warning ? 'anim-ready' : ''}`}>
          <div
            style={{
              width: 66,
              height: 44,
              borderRadius: '50%',
              background: color,
              border: `3px solid ${OUTLINE}`,
              boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.25), inset 0 4px 0 rgba(255,255,255,0.15)',
              position: 'relative',
            }}
          >
            {g.state !== 'raw' && (
              <div className="absolute inset-0 flex items-center justify-center gap-2" style={{ transform: 'rotate(-25deg)' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 4, height: 30, background: 'rgba(0,0,0,0.35)', borderRadius: 2 }} />
                ))}
              </div>
            )}
          </div>
          {g.state === 'raw' && <ProgressRing progress={cookP} size={Math.min(r.h, 86)} color="#22c55e" />}
          {g.state === 'cooked' && <ProgressRing progress={1 - burnP} size={Math.min(r.h, 86)} color={warning ? '#ef4444' : '#f59e0b'} />}
          {(g.state === 'raw' || g.state === 'burnt') && (
            <div className="pointer-events-none absolute left-1/2 top-0 flex -translate-x-1/2 gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="steam-puff rounded-full" style={{ width: 14, height: 14, background: g.state === 'burnt' ? '#52525b' : '#f1f5f9', animationDelay: `${i * 0.5}s` }} />
              ))}
            </div>
          )}
          {warning && <div className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[13px] font-bold text-white anim-danger" style={{ border: `2px solid ${OUTLINE}` }}>!</div>}
        </div>
      )}
      {st.hover && <div className="absolute inset-0 rounded-xl ring-4 ring-yellow-300" />}
    </div>
  );
}

export function Grill() {
  const { state } = useGame();
  const L = LAYOUT.grill;
  return (
    <>
      <div className="absolute rounded-3xl" style={{ left: L.x, top: L.y, width: L.w, height: 176, background: 'linear-gradient(180deg,#71717a,#3f3f46)', border: `4px solid ${OUTLINE}`, boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.25)' }}>
        <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 rounded-b-lg bg-red-600 px-3 text-[12px] font-bold uppercase tracking-widest text-white" style={{ border: `2px solid ${OUTLINE}` }}>
          Grill
        </div>
        <div className="absolute bottom-2 left-3 right-3 flex justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
          ))}
        </div>
      </div>
      {state.grill.map((_, i) => (
        <GrillSlot key={i} index={i} />
      ))}
      <BinBox id="patty" x={L.x + 66} y={644} w={120} h={66} />
    </>
  );
}
