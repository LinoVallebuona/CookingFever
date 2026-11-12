import { create } from 'zustand';

export interface FloatText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

export interface Flyer {
  id: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  item: string;
}

interface FxState {
  texts: FloatText[];
  flyers: Flyer[];
  shakes: Record<string, number>;
  addText(t: Omit<FloatText, 'id'>): void;
  addFlyer(f: Omit<Flyer, 'id'>): void;
  shake(key: string): void;
  clear(): void;
}

let id = 1;

/** Short-lived visual effects (floating texts, flying food, shakes). */
export const useFx = create<FxState>((set) => ({
  texts: [],
  flyers: [],
  shakes: {},
  addText(t) {
    const item = { ...t, id: id++ };
    set((s) => ({ texts: [...s.texts.slice(-14), item] }));
    setTimeout(() => set((s) => ({ texts: s.texts.filter((x) => x.id !== item.id) })), 1300);
  },
  addFlyer(f) {
    const item = { ...f, id: id++ };
    set((s) => ({ flyers: [...s.flyers.slice(-8), item] }));
    setTimeout(() => set((s) => ({ flyers: s.flyers.filter((x) => x.id !== item.id) })), 500);
  },
  shake(key) {
    set((s) => ({ shakes: { ...s.shakes, [key]: Date.now() } }));
  },
  clear() {
    set({ texts: [], flyers: [], shakes: {} });
  },
}));
