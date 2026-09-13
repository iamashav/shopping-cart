"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  addLine,
  applyAdjustments,
  removeLine,
  setLineQuantity,
  type CartLine,
  type LineAdjustment,
} from "./cart";

type CartState = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  adjust: (adjustments: LineAdjustment[]) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) => set((state) => ({ lines: addLine(state.lines, line) })),
      setQuantity: (key, quantity) =>
        set((state) => ({ lines: setLineQuantity(state.lines, key, quantity) })),
      remove: (key) => set((state) => ({ lines: removeLine(state.lines, key) })),
      clear: () => set({ lines: [] }),
      adjust: (adjustments) =>
        set((state) => ({ lines: applyAdjustments(state.lines, adjustments) })),
    }),
    {
      name: "bloom-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Server HTML always renders an empty cart; rehydrating after mount avoids a hydration mismatch.
      skipHydration: true,
    },
  ),
);
