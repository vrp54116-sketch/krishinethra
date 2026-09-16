import { create } from "zustand";
import type { LanguageCode } from "./types";

interface FarmState {
  language: LanguageCode;
  isAuthenticated: boolean;
  setLanguage: (lang: LanguageCode) => void;
  unlock: () => void;
  lock: () => void;
}

export const useFarmStore = create<FarmState>((set) => ({
  language: "en",
  isAuthenticated: false,
  setLanguage: (language) => set({ language }),
  unlock: () => set({ isAuthenticated: true }),
  lock: () => set({ isAuthenticated: false }),
}));
