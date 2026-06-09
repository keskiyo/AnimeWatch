import { create } from "zustand";
import { getSettings, saveSettings } from "@/api/animeApi";
import type { AppSettings } from "@/types/anime";

const defaultSettings: AppSettings = {
  default_player: "auto",
  default_quality: "auto",
  default_dubbing: "auto",
  theme: "dark",
  notifications_enabled: true,
  cache_size_limit: 500,
};

type SettingsState = {
  settings: AppSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
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
