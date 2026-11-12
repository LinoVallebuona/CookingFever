import { MENU, type MenuItemId } from '@sizzle/shared';
import { OUTLINE } from './food';

/** Diner dining-room backdrop (1280 x 440 logical px). */
export function DinerBackdrop({ menu, priceMult }: { menu: MenuItemId[]; priceMult: number }) {
  return (
    <svg viewBox="0 0 1280 440" width={1280} height={440} style={{ position: 'absolute', left: 0, top: 0 }}>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fd6cb" />
          <stop offset="1" stopColor="#5fbfb4" />
        </linearGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc8ff" />
          <stop offset="1" stopColor="#ffe0a3" />
        </linearGradient>
        <pattern id="checker" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#fff4e0" />
          <rect width="20" height="20" fill="#e63946" />
          <rect x="20" y="20" width="20" height="20" fill="#e63946" />
        </pattern>
        <pattern id="stripes" width="36" height="10" patternUnits="userSpaceOnUse">
          <rect width="36" height="10" fill="transparent" />
          <rect width="18" height="10" fill="rgba(255,255,255,0.10)" />
        </pattern>
        <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#c7d2de" />
          <stop offset="1" stopColor="#8a99aa" />
        </linearGradient>
        <filter id="neon" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* wall */}
      <rect width="1280" height="440" fill="url(#wall)" />
      <rect width="1280" height="300" fill="url(#stripes)" transform="rotate(90 640 150) translate(-490 490)" opacity="0.5" />
      {/* checker wainscot */}
      <rect y="300" width="1280" height="140" fill="url(#checker)" />
      <rect y="292" width="1280" height="12" fill="url(#chrome)" stroke={OUTLINE} strokeWidth="2" />

      {/* door */}
      <g>
        <rect x="18" y="96" width="120" height="210" rx="10" fill="#b45309" stroke={OUTLINE} strokeWidth="4" />
        <rect x="32" y="112" width="92" height="96" rx="8" fill="url(#sky)" stroke={OUTLINE} strokeWidth="3" />
        <path d="M40 200 L120 120" stroke="rgba(255,255,255,0.5)" strokeWidth="6" />
        <circle cx="122" cy="240" r="6" fill="#facc15" stroke={OUTLINE} strokeWidth="2" />
        <rect x="40" y="220" width="76" height="26" rx="6" fill="#fef3c7" stroke={OUTLINE} strokeWidth="2" />
        <text x="78" y="238" textAnchor="middle" fontSize="15" fontWeight="700" fill="#16a34a">OPEN</text>
      </g>

      {/* windows */}
      {[230, 1010].map((x) => (
        <g key={x}>
          <rect x={x} y="96" width="190" height="150" rx="16" fill="url(#sky)" stroke={OUTLINE} strokeWidth="4" />
          <circle cx={x + 150} cy="134" r="18" fill="#fde047" />
          <path d={`M${x} 226 Q${x + 40} 196 ${x + 80} 214 Q${x + 120} 190 ${x + 190} 214 V246 H${x} Z`} fill="#86efac" opacity="0.9" />
          <rect x={x + 30} y="180" width="24" height="46" fill="#94a3b8" />
          <rect x={x + 60} y="166" width="30" height="60" fill="#a5b4c6" />
          <rect x={x + 96} y="190" width="20" height="36" fill="#94a3b8" />
          <path d={`M${x + 95} 96 V246 M${x} 171 H${x + 190}`} stroke={OUTLINE} strokeWidth="4" />
          <path d={`M${x - 10} 92 H${x + 200} V112 Q${x + 180} 122 ${x + 160} 112 Q${x + 140} 122 ${x + 120} 112 Q${x + 100} 122 ${x + 80} 112 Q${x + 60} 122 ${x + 40} 112 Q${x + 20} 122 ${x} 112 Q${x - 10} 118 ${x - 10} 112 Z`} fill="#e63946" stroke={OUTLINE} strokeWidth="3" />
        </g>
      ))}

      {/* neon sign */}
      <g filter="url(#neon)">
        <rect x="480" y="84" width="320" height="92" rx="46" fill="#3b0764" stroke="#f0abfc" strokeWidth="5" />
        <text x="640" y="128" textAnchor="middle" fontSize="38" fontWeight="700" fill="#fde047" letterSpacing="2">SUNNY&apos;S</text>
        <text x="640" y="162" textAnchor="middle" fontSize="24" fontWeight="600" fill="#67e8f9" letterSpacing="8">DINER</text>
      </g>

      {/* menu board (shows today's menu & prices) */}
      <g>
        <rect x="470" y="196" width="340" height="88" rx="12" fill="#1f2937" stroke={OUTLINE} strokeWidth="4" />
        <text x="640" y="216" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fbbf24" letterSpacing="3">TODAY&apos;S MENU</text>
        {menu.map((id, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          return (
            <text key={id} x={col ? 800 - 14 : 484} y={236 + row * 15} textAnchor={col ? 'end' : 'start'} fontSize="12.5" fill="#f8fafc" fontWeight="500">
              {col ? `${Math.round(MENU[id].price * priceMult)}¢ ${MENU[id].name}` : `${MENU[id].name} ${Math.round(MENU[id].price * priceMult)}¢`}
            </text>
          );
        })}
      </g>

      {/* pendant lamps */}
      {[330, 640, 950].map((x) => (
        <g key={x}>
          <path d={`M${x} 0 V40`} stroke={OUTLINE} strokeWidth="3" />
          <path d={`M${x - 28} 66 Q${x} 26 ${x + 28} 66 Z`} fill="#e63946" stroke={OUTLINE} strokeWidth="3" />
          <ellipse cx={x} cy="68" rx="12" ry="5" fill="#fef9c3" />
          <path d={`M${x - 60} 70 L${x - 14} 68 L${x + 14} 68 L${x + 60} 70 L${x + 90} 150 L${x - 90} 150 Z`} fill="rgba(254,249,195,0.12)" />
        </g>
      ))}
    </svg>
  );
}

/** Front of the serving counter (drawn above the customers). */
export function CounterFront() {
  return (
    <svg viewBox="0 0 1280 70" width={1280} height={70} style={{ position: 'absolute', left: 0, top: 380, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="countertop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="counterface" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1280" height="18" fill="url(#countertop)" stroke={OUTLINE} strokeWidth="3" />
      <rect x="0" y="18" width="1280" height="52" fill="url(#counterface)" stroke={OUTLINE} strokeWidth="3" />
      <rect x="0" y="30" width="1280" height="6" fill="#fecaca" opacity="0.6" />
      <rect x="0" y="58" width="1280" height="6" fill="#7f1d1d" opacity="0.5" />
    </svg>
  );
}

/** Kitchen backdrop below the counter (1280 x 270). */
export function KitchenBackdrop() {
  return (
    <svg viewBox="0 0 1280 270" width={1280} height={270} style={{ position: 'absolute', left: 0, top: 450 }}>
      <defs>
        <pattern id="tiles" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#e0f2fe" />
          <rect x="1" y="1" width="30" height="30" rx="3" fill="#f0f9ff" />
        </pattern>
        <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <rect width="1280" height="270" fill="url(#tiles)" />
      <rect y="150" width="1280" height="120" fill="url(#steel)" stroke={OUTLINE} strokeWidth="3" />
      <rect y="150" width="1280" height="8" fill="#f8fafc" opacity="0.8" />
    </svg>
  );
}
