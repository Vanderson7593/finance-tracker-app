import { create } from 'zustand';
import { NotificationSettings, UserProfile } from '../types';
import { getItem, setItem } from '../lib/storage';
import { DEFAULT_CURRENCY, STORAGE_KEYS } from '../constants';

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminder: false,
  dailyReminderTime: '20:00',
  budgetAlerts: true,
  budgetAlertThreshold: 80,
  weeklyReport: false,
  showAmounts: true,
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Utilizador',
  currency: DEFAULT_CURRENCY,
  onboardingCompleted: false,
};

interface SettingsStore {
  settings: NotificationSettings;
  profile: UserProfile;
  initialized: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (data: Partial<NotificationSettings>) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  toggleAmountVisibility: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  profile: DEFAULT_PROFILE,
  initialized: false,

  loadSettings: async () => {
    const storedSettings = await getItem<NotificationSettings>(STORAGE_KEYS.SETTINGS);
    const storedProfile = await getItem<UserProfile>(STORAGE_KEYS.PROFILE);
    set({
      settings: { ...DEFAULT_SETTINGS, ...(storedSettings ?? {}) },
      profile: { ...DEFAULT_PROFILE, ...(storedProfile ?? {}) },
      initialized: true,
    });
  },

  updateSettings: async (data) => {
    const next = { ...get().settings, ...data };
    set({ settings: next });
    await setItem(STORAGE_KEYS.SETTINGS, next);
  },

  toggleAmountVisibility: async () => {
    const next = {
      ...get().settings,
      showAmounts: !get().settings.showAmounts,
    };
    set({ settings: next });
    await setItem(STORAGE_KEYS.SETTINGS, next);
  },

  updateProfile: async (data) => {
    const next = { ...get().profile, ...data };
    set({ profile: next });
    await setItem(STORAGE_KEYS.PROFILE, next);
  },
}));
