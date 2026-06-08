import { create } from "zustand";
import { getSettings, saveSettings } from "@/api/animeApi";
import { fallbackSettings } from "@/utils/fallbackData";
import type { AppSettings } from "@/types/anime";

type SettingsState = {
  settings: AppSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: fallbackSettings,
  isLoading: false,
  loadSettings: async () => {
    set({ isLoading: true });
    const settings = await getSettings();
    set({ settings, isLoading: false });
  },
  updateSettings: async (settings) => {
    set({ isLoading: true });
    const saved = await saveSettings(settings);
    set({ settings: saved, isLoading: false });
  }
}));
