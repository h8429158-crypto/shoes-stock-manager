import { create } from 'zustand';

/** In-progress stocktake counting session (shared by scanner + review screen). */
interface StocktakeState {
  active: boolean;
  counts: Record<string, number>; // productId → counted qty
  start: () => void;
  addScan: (productId: string) => void;
  setCount: (productId: string, count: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useStocktakeStore = create<StocktakeState>((set, get) => ({
  active: false,
  counts: {},
  start: () => set({ active: true, counts: {} }),
  addScan: (productId) =>
    set({ counts: { ...get().counts, [productId]: (get().counts[productId] ?? 0) + 1 } }),
  setCount: (productId, count) =>
    set({ counts: { ...get().counts, [productId]: Math.max(0, count) } }),
  remove: (productId) => {
    const next = { ...get().counts };
    delete next[productId];
    set({ counts: next });
  },
  clear: () => set({ active: false, counts: {} }),
}));
