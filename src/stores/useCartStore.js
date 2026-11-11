"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Website cart: plans picked from the home page offer modals, paid together in
 * one Razorpay checkout (see components/cart). Items are { offer, tier } keys
 * from lib/planOffers.js; one plan per offer, so adding another tier of the
 * same offer replaces it. Prices are always worked out from planOffers (and
 * re-checked on the server), never stored here.
 */
export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (offer, tier) =>
        set((state) => ({
          items: [...state.items.filter((i) => i.offer !== offer), { offer, tier }],
        })),
      removeItem: (offer) => set((state) => ({ items: state.items.filter((i) => i.offer !== offer) })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "limbu-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // never persist the drawer open
    }
  )
);
