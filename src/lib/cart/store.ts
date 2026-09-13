"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addLine, removeLine, setLineQuantity, type CartLine } from "./cart";

type CartState = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
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
