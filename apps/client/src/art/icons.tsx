import { OUTLINE } from './food';

export function CoinIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <circle cx="20" cy="21" r="17" fill="#d97706" stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="20" cy="19" r="16" fill="#fbbf24" stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="20" cy="19" r="11" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
      <path d="M17 13 h6 M20 13 v13 M16 26 h8" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 13 Q13 8 18 7" stroke="#fff7d1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({ size = 28, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <path
        d="M20 3 L25 14 L37 15.5 L28 24 L30.5 36 L20 30 L9.5 36 L12 24 L3 15.5 L15 14 Z"
        fill={filled ? '#facc15' : '#cbd5e1'}
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {filled && <path d="M14 16 L19 15 L20 10" stroke="#fef9c3" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
    </svg>
  );
}

export function ClockIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <circle cx="20" cy="21" r="16" fill="#fff" stroke={OUTLINE} strokeWidth="3" />
      <path d="M20 11 V21 L27 25" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="16" y="1" width="8" height="5" rx="2" fill="#e63946" stroke={OUTLINE} strokeWidth="2" />
    </svg>
  );
}

export function LockIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <path d="M12 18 V13 Q12 5 20 5 Q28 5 28 13 V18" fill="none" stroke={OUTLINE} strokeWidth="4" />
      <rect x="8" y="17" width="24" height="19" rx="4" fill="#facc15" stroke={OUTLINE} strokeWidth="3" />
      <circle cx="20" cy="26" r="3" fill={OUTLINE} />
    </svg>
  );
}

export function TrashIcon({ size = 60, open = false }: { size?: number; open?: boolean }) {
  return (
    <svg viewBox="0 0 60 70" width={size} height={size * (70 / 60)} style={{ overflow: 'visible' }}>
      <path d="M10 20 H50 L46 66 Q45.5 69 42 69 H18 Q14.5 69 14 66 Z" fill="#64748b" stroke={OUTLINE} strokeWidth="3" />
      <path d="M22 28 V60 M30 28 V60 M38 28 V60" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      <g transform={open ? 'rotate(-28 8 14)' : undefined}>
        <rect x="6" y="11" width="48" height="9" rx="3" fill="#94a3b8" stroke={OUTLINE} strokeWidth="3" />
        <rect x="23" y="5" width="14" height="7" rx="2" fill="#94a3b8" stroke={OUTLINE} strokeWidth="2.5" />
      </g>
    </svg>
  );
}

export function UserIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <circle cx="20" cy="14" r="8" fill="#fde68a" stroke={OUTLINE} strokeWidth="3" />
      <path d="M6 36 Q6 24 20 24 Q34 24 34 36 Z" fill="#60a5fa" stroke={OUTLINE} strokeWidth="3" />
    </svg>
  );
}
