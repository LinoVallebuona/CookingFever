import type { BurgerTopping, IngredientId, MenuItemId } from '@sizzle/shared';
import { MENU } from '@sizzle/shared';
import { useId } from 'react';

export const OUTLINE = '#4a2c1a';
const SW = 2.5;

/** Interpolates the patty colour from raw pink to grilled brown (or burnt). */
export function pattyColor(progress: number, burnt: boolean, burnProgress = 0): string {
  if (burnt) return '#2a1a12';
  const raw = [232, 132, 128];
  const cooked = [139, 74, 36];
  const dark = [70, 38, 20];
  const p = Math.max(0, Math.min(1, progress));
  let c = raw.map((r, i) => Math.round(r + (cooked[i] - r) * p));
  if (burnProgress > 0) c = c.map((v, i) => Math.round(v + (dark[i] - v) * Math.min(1, burnProgress)));
  return `rgb(${c.join(',')})`;
}

function BottomBun() {
  return (
    <g>
      <path d="M12 2 H88 Q93 2 91 7 Q87 15 74 15 H26 Q13 15 9 7 Q7 2 12 2 Z" fill="#e7a24a" stroke={OUTLINE} strokeWidth={SW} />
      <path d="M16 5 H84" stroke="#f7cc82" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

function PattyLayer({ color = '#8b4a24', marks = true }: { color?: string; marks?: boolean }) {
  return (
    <g>
      <rect x={10} y={0} width={80} height={13} rx={6.5} fill={color} stroke={OUTLINE} strokeWidth={SW} />
      {marks && (
        <g stroke="rgba(0,0,0,0.28)" strokeWidth={2.2} strokeLinecap="round">
          <path d="M26 4 L32 9" />
          <path d="M44 4 L50 9" />
          <path d="M62 4 L68 9" />
        </g>
      )}
      <path d="M18 3.5 H40" stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function CheeseLayer() {
  return <path d="M8 0 H92 L86 5 L80 12 L74 5 H46 L40 11 L34 5 H14 Z" fill="#ffd23f" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />;
}

function LettuceLayer() {
  return (
    <path
      d="M6 4 Q12 -1 18 4 Q24 9 30 4 Q36 -1 42 4 Q48 9 54 4 Q60 -1 66 4 Q72 9 78 4 Q84 -1 90 4 Q96 6 94 8 L6 8 Q4 6 6 4 Z"
      fill="#6cc24a"
      stroke={OUTLINE}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
  );
}

function TomatoLayer() {
  return (
    <g>
      <rect x={14} y={0} width={34} height={8} rx={4} fill="#ef4444" stroke={OUTLINE} strokeWidth={SW} />
      <rect x={52} y={0} width={34} height={8} rx={4} fill="#ef4444" stroke={OUTLINE} strokeWidth={SW} />
      <circle cx={24} cy={4} r={1.4} fill="#fde68a" />
      <circle cx={38} cy={4} r={1.4} fill="#fde68a" />
      <circle cx={62} cy={4} r={1.4} fill="#fde68a" />
      <circle cx={76} cy={4} r={1.4} fill="#fde68a" />
    </g>
  );
}

function TopBun({ gradId }: { gradId: string }) {
  return (
    <g>
      <path d="M8 28 Q8 0 50 0 Q92 0 92 28 Q92 31 88 31 H12 Q8 31 8 28 Z" fill={`url(#${gradId})`} stroke={OUTLINE} strokeWidth={SW} />
      <path d="M22 12 Q34 5 48 5" stroke="#fde3ad" strokeWidth={3} strokeLinecap="round" fill="none" />
      {[
        [32, 14, -20],
        [50, 10, 10],
        [66, 15, 30],
        [42, 21, 5],
        [60, 23, -15],
        [24, 22, 15],
        [76, 22, -10],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={3} ry={1.6} transform={`rotate(${r} ${x} ${y})`} fill="#fff6dc" />
      ))}
    </g>
  );
}

export interface BurgerStack {
  bun: boolean;
  patty: boolean;
  toppings: readonly BurgerTopping[];
  pattyColor?: string;
}

const LAYER_H = { bottom: 15, patty: 13, cheese: 6, lettuce: 7, tomato: 7, top: 31 };

/** Draws a burger built from the given layers (canonical stacking order). */
export function BurgerArt({ stack, size = 100, showTop = true }: { stack: BurgerStack; size?: number; showTop?: boolean }) {
  const gradId = useId().replace(/:/g, '');
  const layers: { key: string; h: number; el: React.ReactNode }[] = [];
  if (stack.bun) layers.push({ key: 'b', h: LAYER_H.bottom, el: <BottomBun /> });
  if (stack.patty) layers.push({ key: 'p', h: LAYER_H.patty, el: <PattyLayer color={stack.pattyColor} /> });
  if (stack.toppings.includes('cheese')) layers.push({ key: 'c', h: LAYER_H.cheese, el: <CheeseLayer /> });
  if (stack.toppings.includes('lettuce')) layers.push({ key: 'l', h: LAYER_H.lettuce, el: <LettuceLayer /> });
  if (stack.toppings.includes('tomato')) layers.push({ key: 't', h: LAYER_H.tomato, el: <TomatoLayer /> });
  if (stack.bun && stack.patty && showTop) layers.push({ key: 'top', h: LAYER_H.top, el: <TopBun gradId={gradId} /> });
  let y = 96;
  const placed = layers.map((l) => {
    y -= l.h;
    const g = (
      <g key={l.key} transform={`translate(0 ${y})`}>
        {l.el}
      </g>
    );
    y += 3; // slight overlap
    return g;
  });
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7bd63" />
          <stop offset="1" stopColor="#d98a2b" />
        </linearGradient>
      </defs>
      {placed}
    </svg>
  );
}

export function FriesArt({ size = 60 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 80" width={size} height={size * (80 / 60)} style={{ overflow: 'visible' }}>
      {[
        [14, 6, -12],
        [22, 2, -5],
        [30, 0, 2],
        [38, 3, 8],
        [45, 7, 15],
        [18, 10, -8],
        [34, 8, 4],
        [26, 9, -2],
        [42, 12, 10],
      ].map(([x, y, r], i) => (
        <rect key={i} x={x - 3} y={y} width={7} height={40} rx={2} fill={i % 2 ? '#ffd54a' : '#ffc72c'} stroke={OUTLINE} strokeWidth={2} transform={`rotate(${r} ${x} ${y + 36})`} />
      ))}
      <path d="M6 32 H54 L48 76 Q47 79 44 79 H16 Q13 79 12 76 Z" fill="#e63946" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M6 32 Q30 44 54 32" fill="#c92a37" stroke={OUTLINE} strokeWidth={SW} />
      <circle cx={30} cy={58} r={8} fill="#ffd23f" stroke={OUTLINE} strokeWidth={2} />
      <path d="M26 58 L29 61 L35 55" stroke={OUTLINE} strokeWidth={2} fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Soda cup. `fill` 0..1 shows the pour progress; a lid appears when full. */
export function SodaArt({ size = 60, fill = 1, lid = true }: { size?: number; fill?: number; lid?: boolean }) {
  const clip = useId().replace(/:/g, '');
  const top = 18;
  const bottom = 76;
  const level = bottom - (bottom - top) * Math.max(0, Math.min(1, fill));
  return (
    <svg viewBox="0 0 60 80" width={size} height={size * (80 / 60)} style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={clip}>
          <path d="M9 18 H51 L46 76 Q45.5 79 42 79 H18 Q14.5 79 14 76 Z" />
        </clipPath>
      </defs>
      {lid && fill >= 1 && <rect x={36} y={-6} width={5} height={22} rx={2} fill="#38bdf8" stroke={OUTLINE} strokeWidth={2} transform="rotate(12 38 10)" />}
      <path d="M9 18 H51 L46 76 Q45.5 79 42 79 H18 Q14.5 79 14 76 Z" fill="#f8fafc" />
      <g clipPath={`url(#${clip})`}>
        <rect x={0} y={level} width={60} height={80} fill="#7c2d12" />
        <rect x={0} y={level} width={60} height={3} fill="#c2410c" opacity={0.8} />
        {[20, 32, 44].map((x) => (
          <rect key={x} x={x} y={10} width={5} height={70} fill="#e63946" opacity={0.85} />
        ))}
      </g>
      <path d="M9 18 H51 L46 76 Q45.5 79 42 79 H18 Q14.5 79 14 76 Z" fill="none" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
      <rect x={13} y={36} width={34} height={16} rx={6} fill="#fff" stroke={OUTLINE} strokeWidth={2} />
      <path d="M22 44 Q30 38 38 44 Q30 50 22 44" fill="#e63946" />
      {lid && fill >= 1 && <rect x={6} y={13} width={48} height={7} rx={3.5} fill="#e2e8f0" stroke={OUTLINE} strokeWidth={SW} />}
    </svg>
  );
}

export function ShakeArt({ size = 60, fill = 1 }: { size?: number; fill?: number }) {
  const clip = useId().replace(/:/g, '');
  const level = 78 - 56 * Math.max(0, Math.min(1, fill));
  const done = fill >= 1;
  return (
    <svg viewBox="0 0 60 84" width={size} height={size * (84 / 60)} style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={clip}>
          <path d="M10 22 H50 L44 78 Q43 81 40 81 H20 Q17 81 16 78 Z" />
        </clipPath>
      </defs>
      {done && (
        <>
          <rect x={33} y={-4} width={4.5} height={26} rx={2} fill="#f472b6" stroke={OUTLINE} strokeWidth={2} transform="rotate(14 35 10)" />
          <path d="M12 22 Q10 12 20 12 Q22 4 30 6 Q38 2 42 10 Q52 10 48 22 Z" fill="#fffaf0" stroke={OUTLINE} strokeWidth={SW} />
          <circle cx={30} cy={5} r={5} fill="#e11d48" stroke={OUTLINE} strokeWidth={2} />
          <path d="M30 0 Q32 -6 36 -7" stroke={OUTLINE} strokeWidth={1.8} fill="none" />
        </>
      )}
      <path d="M10 22 H50 L44 78 Q43 81 40 81 H20 Q17 81 16 78 Z" fill="rgba(255,255,255,0.75)" />
      <g clipPath={`url(#${clip})`}>
        <rect x={0} y={level} width={60} height={84} fill="#f9a8d4" />
        <rect x={0} y={level} width={60} height={4} fill="#fbcfe8" />
      </g>
      <path d="M10 22 H50 L44 78 Q43 81 40 81 H20 Q17 81 16 78 Z" fill="none" stroke={OUTLINE} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M15 28 L19 72" stroke="rgba(255,255,255,0.8)" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/** Icon for a menu item in order bubbles and menus. */
export function MenuIcon({ item, size = 44 }: { item: MenuItemId; size?: number }) {
  const def = MENU[item];
  switch (def.kind) {
    case 'burger':
      return <BurgerArt size={size} stack={{ bun: true, patty: true, toppings: def.toppings ?? [] }} />;
    case 'fries':
      return <FriesArt size={size * 0.75} />;
    case 'drink':
      return <SodaArt size={size * 0.72} />;
    case 'shake':
      return <ShakeArt size={size * 0.7} />;
  }
}

/** Icons for ingredient bins. */
export function IngredientIcon({ id, size = 48 }: { id: IngredientId; size?: number }) {
  const gid = useId().replace(/:/g, '');
  switch (id) {
    case 'bun':
      return (
        <svg viewBox="0 0 100 60" width={size} height={size * 0.6}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f7bd63" />
              <stop offset="1" stopColor="#d98a2b" />
            </linearGradient>
          </defs>
          <g transform="translate(0 6)">
            <TopBun gradId={gid} />
          </g>
          <g transform="translate(0 40)">
            <BottomBun />
          </g>
        </svg>
      );
    case 'patty':
      return (
        <svg viewBox="0 0 100 40" width={size} height={size * 0.4}>
          <g transform="translate(0 4)">
            <PattyLayer color={pattyColor(0, false)} marks={false} />
          </g>
          <g transform="translate(0 20)">
            <PattyLayer color={pattyColor(0, false)} marks={false} />
          </g>
        </svg>
      );
    case 'cheese':
      return (
        <svg viewBox="0 0 100 70" width={size} height={size * 0.7}>
          <rect x={15} y={8} width={70} height={56} rx={6} fill="#ffd23f" stroke={OUTLINE} strokeWidth={SW} transform="rotate(-6 50 36)" />
          <circle cx={36} cy={28} r={5} fill="#f2b51c" />
          <circle cx={62} cy={44} r={7} fill="#f2b51c" />
          <circle cx={58} cy={20} r={3.5} fill="#f2b51c" />
        </svg>
      );
    case 'lettuce':
      return (
        <svg viewBox="0 0 100 70" width={size} height={size * 0.7}>
          <path d="M10 40 Q8 10 40 12 Q50 0 64 10 Q92 6 90 36 Q96 58 70 60 Q50 72 30 60 Q4 62 10 40 Z" fill="#7ed957" stroke={OUTLINE} strokeWidth={SW} />
          <path d="M22 44 Q50 30 80 40 M50 36 L46 18 M64 38 L72 20 M36 40 L28 24" stroke="#4a9f2e" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'tomato':
      return (
        <svg viewBox="0 0 100 70" width={size} height={size * 0.7}>
          <circle cx={50} cy={36} r={30} fill="#ef4444" stroke={OUTLINE} strokeWidth={SW} />
          <circle cx={50} cy={36} r={22} fill="#f87171" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx={50 + 12 * Math.cos((a * Math.PI) / 180)} cy={36 + 12 * Math.sin((a * Math.PI) / 180)} rx={4} ry={6} fill="#fde68a" transform={`rotate(${a + 90} ${50 + 12 * Math.cos((a * Math.PI) / 180)} ${36 + 12 * Math.sin((a * Math.PI) / 180)})`} />
          ))}
          <circle cx={50} cy={36} r={5} fill="#fca5a5" />
        </svg>
      );
    case 'fries':
      return (
        <svg viewBox="0 0 100 80" width={size} height={size * 0.8}>
          <path d="M18 14 Q50 4 82 14 L88 72 Q50 82 12 72 Z" fill="#c8a165" stroke={OUTLINE} strokeWidth={SW} />
          <path d="M18 14 Q50 24 82 14" fill="none" stroke={OUTLINE} strokeWidth={2} />
          <ellipse cx={36} cy={44} rx={12} ry={9} fill="#d9b779" stroke={OUTLINE} strokeWidth={2} />
          <ellipse cx={62} cy={50} rx={13} ry={10} fill="#d9b779" stroke={OUTLINE} strokeWidth={2} />
          <text x={50} y={34} textAnchor="middle" fontSize={11} fontWeight={700} fill={OUTLINE}>POTATO</text>
        </svg>
      );
    case 'cup':
      return (
        <svg viewBox="0 0 100 80" width={size} height={size * 0.8}>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${22 + i * 2} ${6 + i * 9})`}>
              <path d="M2 0 H54 L48 52 Q47 56 43 56 H13 Q9 56 8 52 Z" fill={i === 2 ? '#fff' : '#f1f5f9'} stroke={OUTLINE} strokeWidth={SW} />
              <rect x={6} y={16} width={44} height={6} fill="#e63946" />
            </g>
          ))}
        </svg>
      );
    case 'milk':
      return (
        <svg viewBox="0 0 80 100" width={size * 0.8} height={size}>
          <path d="M18 30 L28 10 H52 L62 30 V92 Q62 96 58 96 H22 Q18 96 18 92 Z" fill="#f8fafc" stroke={OUTLINE} strokeWidth={SW} />
          <path d="M28 10 L34 2 H46 L52 10" fill="#e0f2fe" stroke={OUTLINE} strokeWidth={SW} />
          <rect x={18} y={44} width={44} height={26} fill="#38bdf8" />
          <text x={40} y={62} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff">MILK</text>
        </svg>
      );
  }
}
