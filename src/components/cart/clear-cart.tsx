"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/store";

export function ClearCart() {
  useEffect(() => {
    const clear = () => useCart.getState().clear();
    // Clearing before the persisted cart loads would be overwritten by that load.
    if (useCart.persist.hasHydrated()) {
      clear();
      return;
    }
    return useCart.persist.onFinishHydration(clear);
  }, []);

  return null;
}
