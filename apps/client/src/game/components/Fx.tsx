import type { GameState } from '@sizzle/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { BurgerArt, FriesArt, IngredientIcon, MenuIcon, pattyColor, ShakeArt, SodaArt } from '../../art/food';
import { useFx } from '../fx';
import { useInput, type PointerSource } from '../input';
import type { MenuItemId } from '@sizzle/shared';

export function FxLayer() {
  const texts = useFx((s) => s.texts);
  const flyers = useFx((s) => s.flyers);
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 30 }}>
      <AnimatePresence>
        {texts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -70, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut', times: [0, 0.15, 0.7, 1] }}
            className="absolute whitespace-nowrap font-bold text-outline"
            style={{ left: t.x, top: t.y, color: t.color, fontSize: t.size }}
          >
            <span style={{ display: 'inline-block', transform: 'translateX(-50%)' }}>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {flyers.map((f) => (
        <motion.div
          key={f.id}
          initial={{ left: f.from.x - 25, top: f.from.y - 25, scale: 1 }}
          animate={{ left: f.to.x - 25, top: f.to.y - 25, scale: 0.6 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
          className="absolute"
        >
          <MenuIcon item={f.item as MenuItemId} size={50} />
        </motion.div>
      ))}
    </div>
  );
}

/** Item following the pointer while dragging (fixed positioning, viewport coords). */
export function DragGhost({ state, scale }: { state: GameState; scale: number }) {
  const drag = useInput((s) => s.drag);
  if (!drag) return null;
  const size = 70 * scale;
  return (
    <div className="pointer-events-none fixed" style={{ left: drag.x - size / 2, top: drag.y - size * 0.8, width: size, height: size, zIndex: 100, filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.35))' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 70, height: 70 }} className="flex items-end justify-center">
        <GhostContent source={drag.source} state={state} />
      </div>
    </div>
  );
}

function GhostContent({ source, state }: { source: PointerSource; state: GameState }) {
  switch (source.kind) {
    case 'bin':
      return <IngredientIcon id={source.bin} size={60} />;
    case 'grill': {
      const g = state.grill[source.index];
      return <div style={{ width: 60, height: 40, borderRadius: '50%', background: pattyColor(g.state === 'raw' ? 0.3 : 1, g.state === 'burnt'), border: '3px solid #4a2c1a' }} />;
    }
    case 'plate':
      return <BurgerArt size={70} stack={state.plates[source.index]} />;
    case 'warmer':
      return <FriesArt size={44} />;
    case 'cup':
      return <SodaArt size={44} />;
    case 'shaker':
      return <ShakeArt size={42} />;
    case 'fryer':
      return <FriesArt size={40} />;
    default:
      return null;
  }
}
