import type { CustomerTypeId } from '@sizzle/shared';
import { OUTLINE } from './food';

export type Mood = 'happy' | 'neutral' | 'worried' | 'angry' | 'delighted';

const SKIN = ['#fbd7b8', '#f0bd94', '#d7a073', '#b07a52', '#8a5636', '#6b3f26'];
const HAIR = ['#2b1b12', '#5a3825', '#a0522d', '#e8b85a', '#1f1f2b', '#b4432f', '#7c5a3c'];
const SHIRT = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#ef4444'];

function pick<T>(arr: T[], seed: number, salt: number): T {
  return arr[Math.abs(Math.floor(seed / (salt * 7 + 1)) + salt * 13) % arr.length];
}

interface Props {
  type: CustomerTypeId;
  look: number;
  mood: Mood;
  size?: number;
}

/** Original cartoon customer, drawn from the waist up (feet hidden by the counter). */
export function CustomerArt({ type, look, mood, size = 160 }: Props) {
  const skin = pick(SKIN, look, 1);
  let hair = pick(HAIR, look, 2);
  const shirt = pick(SHIRT, look, 3);
  const hairStyle = Math.abs(look >> 3) % 4;
  if (type === 'senior') hair = look % 2 ? '#d4d4d8' : '#a8a29e';
  const wide = type === 'bigEater';
  const bodyW = wide ? 136 : 112;
  const bx = 80 - bodyW / 2;
  const angryTint = mood === 'angry';

  const body = (() => {
    switch (type) {
      case 'rusher':
        return (
          <g>
            <path d={`M${bx} 240 V190 Q${bx} 158 80 156 Q${160 - bx} 158 ${160 - bx} 190 V240 Z`} fill="#334155" stroke={OUTLINE} strokeWidth={3} />
            <path d="M66 157 L80 200 L94 157 Z" fill="#fff" stroke={OUTLINE} strokeWidth={2.5} />
            <path d="M80 166 L75 176 L80 206 L85 176 Z" fill="#dc2626" stroke={OUTLINE} strokeWidth={2} />
            <path d="M66 157 L74 190 M94 157 L86 190" stroke={OUTLINE} strokeWidth={2.5} />
          </g>
        );
      case 'senior':
        return (
          <g>
            <path d={`M${bx} 240 V192 Q${bx} 158 80 156 Q${160 - bx} 158 ${160 - bx} 192 V240 Z`} fill="#a16207" stroke={OUTLINE} strokeWidth={3} />
            <path d="M68 158 L80 178 L92 158" fill="#fef3c7" stroke={OUTLINE} strokeWidth={2.5} />
            <path d="M80 180 V240" stroke={OUTLINE} strokeWidth={2.5} />
            {[196, 214, 232].map((y) => (
              <circle key={y} cx={86} cy={y} r={2.5} fill="#fde68a" stroke={OUTLINE} strokeWidth={1.2} />
            ))}
          </g>
        );
      case 'critic':
        return (
          <g>
            <path d={`M${bx} 240 V192 Q${bx} 158 80 156 Q${160 - bx} 158 ${160 - bx} 192 V240 Z`} fill="#1e1b4b" stroke={OUTLINE} strokeWidth={3} />
            <path d="M58 158 Q80 176 102 158 L104 170 Q80 186 56 170 Z" fill="#e11d48" stroke={OUTLINE} strokeWidth={2.5} />
            <path d="M92 172 L100 214 L90 216 Z" fill="#e11d48" stroke={OUTLINE} strokeWidth={2} />
          </g>
        );
      default:
        return (
          <g>
            <path d={`M${bx} 240 V190 Q${bx} 158 80 156 Q${160 - bx} 158 ${160 - bx} 190 V240 Z`} fill={type === 'bigEater' ? '#ef4444' : shirt} stroke={OUTLINE} strokeWidth={3} />
            <path d="M64 158 Q80 172 96 158" fill="none" stroke={OUTLINE} strokeWidth={2.5} />
            {type === 'bigEater' && <text x={80} y={212} textAnchor="middle" fontSize={22} fontWeight={700} fill="#fff" stroke={OUTLINE} strokeWidth={1}>YUM</text>}
            {type === 'regular' && <circle cx={80} cy={204} r={9} fill="rgba(255,255,255,0.35)" />}
          </g>
        );
    }
  })();

  const hairEl = (() => {
    if (type === 'critic') {
      return (
        <g>
          <path d="M40 78 Q42 50 80 48 Q118 50 120 78 Q100 70 80 72 Q60 70 40 78 Z" fill={hair} stroke={OUTLINE} strokeWidth={3} />
          <ellipse cx={84} cy={50} rx={40} ry={13} fill="#7c2d12" stroke={OUTLINE} strokeWidth={3} transform="rotate(-8 84 50)" />
          <circle cx={88} cy={36} r={4} fill="#7c2d12" stroke={OUTLINE} strokeWidth={2} />
        </g>
      );
    }
    if (type === 'bigEater') {
      return (
        <g>
          <path d="M36 82 Q34 44 80 42 Q126 44 124 82 Q118 62 80 62 Q42 62 36 82 Z" fill="#2563eb" stroke={OUTLINE} strokeWidth={3} />
          <path d="M34 74 Q20 76 14 84 Q30 86 44 80 Z" fill="#1d4ed8" stroke={OUTLINE} strokeWidth={3} />
          <circle cx={80} cy={44} r={4} fill="#1d4ed8" stroke={OUTLINE} strokeWidth={2} />
        </g>
      );
    }
    if (type === 'senior') {
      return (
        <g>
          <path d="M36 92 Q30 60 48 56 Q44 70 46 88 Z" fill={hair} stroke={OUTLINE} strokeWidth={2.5} />
          <path d="M124 92 Q130 60 112 56 Q116 70 114 88 Z" fill={hair} stroke={OUTLINE} strokeWidth={2.5} />
          <path d="M52 56 Q80 44 108 56 Q90 52 80 54 Q68 52 52 56 Z" fill={hair} stroke={OUTLINE} strokeWidth={2} />
        </g>
      );
    }
    switch (hairStyle) {
      case 0: // short crop
        return <path d="M36 88 Q30 46 80 44 Q130 46 124 88 Q120 66 104 62 Q86 70 58 62 Q42 68 36 88 Z" fill={hair} stroke={OUTLINE} strokeWidth={3} />;
      case 1: // long hair
        return (
          <g>
            <path d="M32 128 Q24 54 80 46 Q136 54 128 128 Q118 120 120 90 Q110 66 80 64 Q50 66 40 90 Q42 120 32 128 Z" fill={hair} stroke={OUTLINE} strokeWidth={3} />
          </g>
        );
      case 2: // bun
        return (
          <g>
            <circle cx={80} cy={40} r={16} fill={hair} stroke={OUTLINE} strokeWidth={3} />
            <path d="M36 86 Q32 50 80 48 Q128 50 124 86 Q112 64 80 64 Q48 64 36 86 Z" fill={hair} stroke={OUTLINE} strokeWidth={3} />
          </g>
        );
      default: // cap
        return (
          <g>
            <path d="M38 80 Q38 46 80 44 Q122 46 122 80 Z" fill={shirt} stroke={OUTLINE} strokeWidth={3} />
            <path d="M80 78 H136 Q138 86 128 88 H80 Z" fill={shirt} stroke={OUTLINE} strokeWidth={3} />
            <path d="M40 84 Q36 92 40 100" stroke={hair} strokeWidth={6} strokeLinecap="round" />
          </g>
        );
    }
  })();

  const eyes = (() => {
    if (mood === 'delighted') {
      return (
        <g stroke={OUTLINE} strokeWidth={3.5} fill="none" strokeLinecap="round">
          <path d="M58 98 Q64 90 70 98" />
          <path d="M90 98 Q96 90 102 98" />
        </g>
      );
    }
    const browTilt = mood === 'angry' ? 8 : mood === 'worried' ? -6 : 0;
    return (
      <g>
        <ellipse cx={64} cy={98} rx={6} ry={mood === 'angry' ? 5 : 7.5} fill="#fff" stroke={OUTLINE} strokeWidth={2} />
        <ellipse cx={96} cy={98} rx={6} ry={mood === 'angry' ? 5 : 7.5} fill="#fff" stroke={OUTLINE} strokeWidth={2} />
        <circle cx={65} cy={99} r={3.4} fill="#1f1308" />
        <circle cx={97} cy={99} r={3.4} fill="#1f1308" />
        <circle cx={66.2} cy={97.6} r={1.1} fill="#fff" />
        <circle cx={98.2} cy={97.6} r={1.1} fill="#fff" />
        {(mood === 'angry' || mood === 'worried') && (
          <g stroke={OUTLINE} strokeWidth={3.5} strokeLinecap="round">
            <path d={`M56 ${86 - browTilt / 2} L72 ${86 + browTilt / 2}`} />
            <path d={`M88 ${86 + browTilt / 2} L104 ${86 - browTilt / 2}`} />
          </g>
        )}
      </g>
    );
  })();

  const mouth = (() => {
    switch (mood) {
      case 'delighted':
        return <path d="M64 116 Q80 136 96 116 Z" fill="#7f1d1d" stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />;
      case 'happy':
        return <path d="M66 117 Q80 128 94 117" fill="none" stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />;
      case 'neutral':
        return <path d="M70 120 H90" stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />;
      case 'worried':
        return <path d="M68 123 Q80 116 92 123" fill="none" stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />;
      case 'angry':
        return <path d="M66 126 Q80 112 94 126" fill="none" stroke={OUTLINE} strokeWidth={3.5} strokeLinecap="round" />;
    }
  })();

  return (
    <svg viewBox="0 0 160 240" width={size} height={size * 1.5} style={{ overflow: 'visible' }}>
      {body}
      <rect x={70} y={136} width={20} height={24} fill={skin} stroke={OUTLINE} strokeWidth={2.5} />
      {/* ears */}
      <circle cx={36} cy={102} r={9} fill={skin} stroke={OUTLINE} strokeWidth={2.5} />
      <circle cx={124} cy={102} r={9} fill={skin} stroke={OUTLINE} strokeWidth={2.5} />
      <ellipse cx={80} cy={98} rx={44} ry={46} fill={angryTint ? '#f28b82' : skin} stroke={OUTLINE} strokeWidth={3} />
      {(mood === 'happy' || mood === 'delighted') && (
        <g fill="#fb7185" opacity={0.45}>
          <ellipse cx={54} cy={114} rx={7} ry={4} />
          <ellipse cx={106} cy={114} rx={7} ry={4} />
        </g>
      )}
      {hairEl}
      {eyes}
      {(type === 'senior' || type === 'critic') && (
        <g fill="none" stroke={OUTLINE} strokeWidth={2.5}>
          <circle cx={64} cy={98} r={11} fill="rgba(255,255,255,0.15)" />
          <circle cx={96} cy={98} r={11} fill="rgba(255,255,255,0.15)" />
          <path d="M75 98 H85" />
        </g>
      )}
      <path d="M80 104 Q76 112 82 113" fill="none" stroke={OUTLINE} strokeWidth={2.2} strokeLinecap="round" />
      {type === 'critic' && <path d="M66 112 Q73 106 80 111 Q87 106 94 112 Q87 116 80 113 Q73 116 66 112 Z" fill="#3f2a1d" />}
      {mouth}
      {mood === 'angry' && (
        <g fill="#e2e8f0" opacity={0.9} className="steam-puff">
          <circle cx={30} cy={56} r={8} />
          <circle cx={130} cy={56} r={8} />
        </g>
      )}
      {mood === 'worried' && <path d="M122 72 Q128 82 122 86 Q116 82 122 72 Z" fill="#7dd3fc" stroke={OUTLINE} strokeWidth={1.5} />}
    </svg>
  );
}
