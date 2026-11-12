import type { GameState, SourceRef } from '@sizzle/shared';

/** Logical stage size. The stage is scaled to fit the screen. */
export const STAGE_W = 1280;
export const STAGE_H = 720;

export const DOOR_X = 78;
export const CUSTOMER_W = 150;

export function seatX(seat: number, seats: number): number {
  return 340 + seat * 220 + (4 - seats) * 110;
}

export const LAYOUT = {
  soda: { x: 14, y: 458, w: 172, h: 254 },
  grill: { x: 196, y: 462, w: 252, h: 250 },
  assembly: { x: 458, y: 458, w: 352, h: 254 },
  fryer: { x: 820, y: 462, w: 176, h: 250 },
  warmer: { x: 1004, y: 462, w: 124, h: 160 },
  trash: { x: 1018, y: 632, w: 96, h: 80 },
  blender: { x: 1136, y: 458, w: 134, h: 254 },
} as const;

/** Approximate centre of a station element (stage coordinates), used for effects. */
export function sourcePoint(ref: SourceRef, state: GameState): { x: number; y: number } {
  switch (ref.kind) {
    case 'plate': {
      const n = state.plates.length;
      const w = LAYOUT.assembly.w / n;
      return { x: LAYOUT.assembly.x + w * ref.index + w / 2, y: 520 };
    }
    case 'grill': {
      const p = grillSlotRect(ref.index, state.grill.length);
      return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
    }
    case 'fryer':
      return { x: LAYOUT.fryer.x + LAYOUT.fryer.w / 2, y: 540 };
    case 'warmer':
      return { x: LAYOUT.warmer.x + LAYOUT.warmer.w / 2, y: 560 };
    case 'cup': {
      const n = state.cups.length;
      return { x: LAYOUT.soda.x + 16 + ((LAYOUT.soda.w - 32) / n) * (ref.index + 0.5), y: 590 };
    }
    case 'shaker':
      return { x: LAYOUT.blender.x + 34 + ref.index * 66, y: 560 };
    case 'bin':
      return { x: 640, y: 660 };
  }
}

export function grillSlotRect(index: number, count: number) {
  const g = LAYOUT.grill;
  const cols = 2;
  const rows = count > 2 ? 2 : 1;
  const w = 100;
  const h = rows === 1 ? 92 : 70;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const top = rows === 1 ? 504 : 478;
  return { x: g.x + 22 + col * (w + 8), y: top + row * (h + 8), w, h };
}
