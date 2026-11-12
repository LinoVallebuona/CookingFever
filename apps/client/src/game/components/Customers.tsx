import { CUSTOMER_TYPES, ENTER_TIME, LEAVE_TIME, MENU, type BurgerTopping, type Customer } from '@sizzle/shared';
import { CustomerArt, type Mood } from '../../art/Customer';
import { MenuIcon, OUTLINE } from '../../art/food';
import { CUSTOMER_W, DOOR_X, seatX } from '../layout';
import { useGame } from '../GameContext';
import { useInput } from '../input';

const CHIP: Record<BurgerTopping, { color: string; label: string }> = {
  cheese: { color: '#facc15', label: 'Cheese' },
  lettuce: { color: '#4ade80', label: 'Lettuce' },
  tomato: { color: '#ef4444', label: 'Tomato' },
};

/** Small coloured pills under a burger so similar burgers are easy to tell apart. */
function ToppingChips({ toppings }: { toppings: BurgerTopping[] }) {
  if (toppings.length === 0) return <div className="h-[9px] text-[8px] font-bold leading-[9px] text-slate-500">plain</div>;
  return (
    <div className="flex h-[9px] gap-[2px]">
      {toppings.map((t) => (
        <div key={t} title={CHIP[t].label} className="h-[9px] w-[11px] rounded-full" style={{ background: CHIP[t].color, border: '1.5px solid #4a2c1a' }} />
      ))}
    </div>
  );
}

const TYPE_BADGE: Record<string, { icon: string; color: string } | undefined> = {
  rusher: { icon: '⚡', color: '#f59e0b' },
  senior: { icon: '☕', color: '#a16207' },
  bigEater: { icon: '🍽️', color: '#2563eb' },
  critic: { icon: '★', color: '#e11d48' },
};

function easeOut(t: number) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

function moodOf(c: Customer): Mood {
  if (c.phase === 'leaving') return c.happy ? 'delighted' : 'angry';
  const r = c.patience / c.maxPatience;
  if (r > 0.6) return 'happy';
  if (r > 0.35) return 'neutral';
  if (r > 0.15) return 'worried';
  return 'angry';
}

function patienceColor(r: number) {
  if (r > 0.6) return '#22c55e';
  if (r > 0.35) return '#eab308';
  if (r > 0.15) return '#f97316';
  return '#ef4444';
}

function CustomerView({ c }: { c: Customer }) {
  const { level } = useGame();
  const hover = useInput((s) => s.hover === `customer:${c.id}`);
  const dragging = useInput((s) => !!s.drag);
  const target = seatX(c.seat, level.seats);
  let x = target;
  let opacity = 1;
  let bob = 0;
  if (c.phase === 'entering') {
    const p = easeOut(c.phaseTimer / ENTER_TIME);
    x = DOOR_X + (target - DOOR_X) * p;
    opacity = Math.min(1, c.phaseTimer / 0.25);
    bob = Math.abs(Math.sin(c.phaseTimer * 14)) * 6;
  } else if (c.phase === 'leaving') {
    const p = Math.min(1, c.phaseTimer / LEAVE_TIME);
    x = target + (DOOR_X - target) * easeOut(Math.max(0, p - 0.25) / 0.75);
    opacity = 1 - Math.max(0, (p - 0.6) / 0.4);
    bob = p > 0.25 ? Math.abs(Math.sin(c.phaseTimer * 14)) * 6 : 0;
  }
  const ratio = c.patience / c.maxPatience;
  const badge = TYPE_BADGE[c.type];
  const waiting = c.phase === 'waiting';
  const mood = moodOf(c);

  return (
    <div
      data-drop={waiting ? `customer:${c.id}` : undefined}
      className="absolute"
      style={{ left: x - CUSTOMER_W / 2, top: 64, width: CUSTOMER_W, height: 330, opacity, zIndex: 2 }}
    >
      {/* order bubble */}
      {waiting && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 168 }}>
          <div
            className="relative rounded-2xl bg-white px-2 pb-2 pt-1.5 shadow-lg"
            style={{ border: `3px solid ${OUTLINE}`, boxShadow: hover ? '0 0 0 4px #facc15, 0 6px 14px rgba(0,0,0,.25)' : '0 6px 14px rgba(0,0,0,.25)' }}
          >
            <div className="flex flex-wrap items-end justify-center gap-x-1 gap-y-0.5">
              {c.order.map((o, i) => (
                <div key={i} className="relative flex h-[54px] w-[44px] flex-col items-center justify-end" style={{ opacity: o.served ? 0.35 : 1 }}>
                  <MenuIcon item={o.item} size={c.order.length > 3 ? 38 : 44} />
                  {MENU[o.item].kind === 'burger' ? <ToppingChips toppings={MENU[o.item].toppings ?? []} /> : <div className="h-[9px]" />}
                  {o.served && <div className="absolute inset-0 flex items-center justify-center text-[26px] font-bold text-green-600 drop-shadow">✓</div>}
                </div>
              ))}
            </div>
            <div className="mt-1 h-[9px] overflow-hidden rounded-full bg-slate-200" style={{ border: `2px solid ${OUTLINE}` }}>
              <div className={ratio < 0.2 ? 'anim-danger' : ''} style={{ width: `${Math.max(0, ratio) * 100}%`, height: '100%', background: patienceColor(ratio), transition: 'background 0.3s' }} />
            </div>
            <div className="absolute -bottom-[11px] left-1/2 h-0 w-0 -translate-x-1/2" style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: `11px solid ${OUTLINE}` }} />
            {badge && (
              <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full text-[15px] text-white" title={CUSTOMER_TYPES[c.type].name} style={{ background: badge.color, border: `2px solid ${OUTLINE}` }}>
                {badge.icon}
              </div>
            )}
          </div>
        </div>
      )}
      {c.phase === 'leaving' && c.happy && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 text-[34px] anim-bob">💖</div>
      )}
      <div className="absolute left-0" style={{ top: 112 + bob * -1, transform: hover && dragging ? 'scale(1.04)' : undefined, transition: 'transform .1s' }}>
        <CustomerArt type={c.type} look={c.look} mood={mood} size={CUSTOMER_W} />
      </div>
    </div>
  );
}

export function Customers() {
  const { state } = useGame();
  return (
    <>
      {state.customers.map((c) => (
        <CustomerView key={c.id} c={c} />
      ))}
    </>
  );
}
