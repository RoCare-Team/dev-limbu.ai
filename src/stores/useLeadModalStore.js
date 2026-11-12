"use client";

import { create } from "zustand";

/**
 * Open/close state of the enquiry form (components/leads/LeadFormModal).
 * `service` is what the visitor is asking about, e.g. "Custom CRM".
 */
export const useLeadModalStore = create((set) => ({
  service: null,
  topic: "",
  open: (service, topic = "") => set({ service, topic }),
  close: () => set({ service: null, topic: "" }),
}));
