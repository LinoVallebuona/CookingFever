import type { GameState, IngredientId, PlayerAction } from '@sizzle/shared';
import { create } from 'zustand';
import type { GameController } from './GameController';

export type PointerSource =
  | { kind: 'bin'; bin: IngredientId }
  | { kind: 'grill'; index: number }
  | { kind: 'plate'; index: number }
  | { kind: 'fryer'; index: number }
  | { kind: 'warmer' }
  | { kind: 'cup'; index: number }
  | { kind: 'shaker'; index: number }
  | { kind: 'trash' }
  | { kind: 'customer'; id: number };

interface DragState {
  source: PointerSource;
  x: number;
  y: number;
}

interface InputState {
  drag: DragState | null;
  hover: string | null;
  trashMode: boolean;
  set(p: Partial<Omit<InputState, 'set'>>): void;
}

export const useInput = create<InputState>((set) => ({
  drag: null,
  hover: null,
  trashMode: false,
  set: (p) => set(p),
}));

export function sourceKey(s: PointerSource): string {
  switch (s.kind) {
    case 'bin':
      return `bin:${s.bin}`;
    case 'warmer':
    case 'trash':
      return s.kind;
    case 'customer':
      return `customer:${s.id}`;
    default:
      return `${s.kind}:${s.index}`;
  }
}

const DRAG_THRESHOLD = 10;

function canDrag(src: PointerSource, s: GameState): boolean {
  switch (src.kind) {
    case 'bin':
      return ['bun', 'cheese', 'lettuce', 'tomato'].includes(src.bin) && s.ingredients.includes(src.bin) && s.bins[src.bin].stock > 0 && s.bins[src.bin].restocking <= 0;
    case 'grill':
      return s.grill[src.index]?.state !== 'empty';
    case 'plate':
      return !!s.plates[src.index]?.bun;
    case 'fryer':
      return s.fryer[src.index]?.state !== 'empty';
    case 'warmer':
      return s.warmer.portions > 0;
    case 'cup':
      return s.cups[src.index]?.state !== 'empty';
    case 'shaker':
      return s.shakers[src.index]?.state !== 'empty';
    default:
      return false;
  }
}

function tapAction(src: PointerSource): PlayerAction | null {
  switch (src.kind) {
    case 'bin':
      return { type: 'bin', bin: src.bin };
    case 'grill':
      return { type: 'grill', slot: src.index };
    case 'plate':
      return { type: 'plate', plate: src.index };
    case 'fryer':
      return { type: 'fryer', basket: src.index };
    case 'warmer':
      return { type: 'warmer' };
    case 'cup':
      return { type: 'cup', slot: src.index };
    case 'shaker':
      return { type: 'shaker', slot: src.index };
    default:
      return null;
  }
}

function discardAction(src: PointerSource): PlayerAction | null {
  switch (src.kind) {
    case 'plate':
    case 'grill':
    case 'fryer':
    case 'cup':
    case 'shaker':
      return { type: 'discard', station: src.kind, index: src.index };
    default:
      return null;
  }
}

function dropAction(src: PointerSource, target: string): PlayerAction | null {
  const [kind, raw] = target.split(':');
  const n = Number(raw);
  if (kind === 'trash') return discardAction(src);
  if (kind === 'plate') {
    if (src.kind === 'bin') return { type: 'bin', bin: src.bin, plate: n };
    if (src.kind === 'grill') return { type: 'grill', slot: src.index, plate: n };
  }
  if (kind === 'customer') {
    if (src.kind === 'plate') return { type: 'plate', plate: src.index, customer: n };
    if (src.kind === 'warmer') return { type: 'warmer', customer: n };
    if (src.kind === 'cup') return { type: 'cup', slot: src.index, customer: n };
    if (src.kind === 'shaker') return { type: 'shaker', slot: src.index, customer: n };
  }
  return null;
}

function dropTargetAt(x: number, y: number): string | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const t = (el as HTMLElement).closest?.('[data-drop]') as HTMLElement | null;
    if (t?.dataset.drop) return t.dataset.drop;
  }
  return null;
}

/**
 * Unified mouse / touch input: a quick tap triggers the station's tap action,
 * dragging an item onto a plate, a customer or the trash targets it precisely.
 */
export function createPointerHandler(getController: () => GameController | null, onUiSound: (s: 'click' | 'invalid') => void) {
  return (e: React.PointerEvent, src: PointerSource) => {
    const controller = getController();
    if (!controller || controller.paused || !controller.started) return;
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const input = useInput.getState();
    const draggable = canDrag(src, controller.engine.state);
    let dragging = false;

    if (src.kind === 'trash') {
      input.set({ trashMode: !input.trashMode });
      onUiSound('click');
      return;
    }

    const move = (ev: PointerEvent) => {
      if (!draggable) return;
      if (!dragging && Math.hypot(ev.clientX - startX, ev.clientY - startY) > DRAG_THRESHOLD) dragging = true;
      if (dragging) {
        useInput.getState().set({ drag: { source: src, x: ev.clientX, y: ev.clientY }, hover: dropTargetAt(ev.clientX, ev.clientY) });
      }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      const st = useInput.getState();
      if (dragging) {
        const target = dropTargetAt(ev.clientX, ev.clientY);
        st.set({ drag: null, hover: null });
        if (target && target !== sourceKey(src)) {
          const action = dropAction(src, target);
          if (action) controller.dispatch(action);
          else onUiSound('invalid');
        }
        return;
      }
      if (st.trashMode) {
        const action = discardAction(src);
        st.set({ trashMode: false });
        if (action) controller.dispatch(action);
        return;
      }
      const action = tapAction(src);
      if (action) controller.dispatch(action);
    };
    const cancel = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      useInput.getState().set({ drag: null, hover: null });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  };
}
