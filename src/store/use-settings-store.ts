import { create } from 'zustand';
import { NotificationSettings, UserProfile } from '../types';
import { getItem, setItem } from '../lib/storage';
import { STORAGE_KEYS } from '../constants';

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminder: false,
  dailyReminderTime: '20:00',
  budgetAlerts: true,
  budgetAlertThreshold: 80,
  weeklyReport: false,
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Utilizador',
  currency: 'EUR',
  onboardingCompleted: false,
};

interface SettingsStore {
  settings: NotificationSettings;
  profile: UserProfile;
  initialized: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (data: Partial<NotificationSettings>) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  profile: DEFAULT_PROFILE,
  initialized: false,

  loadSettings: async () => {
    const storedSettings = await getItem<NotificationSettings>(STORAGE_KEYS.SETTINGS);
    const storedProfile = await getItem<UserProfile>(STORAGE_KEYS.PROFILE);
    set({
      settings: storedSettings ?? DEFAULT_SETTINGS,
      profile: storedProfile ?? DEFAULT_PROFILE,
      initialized: true,
    });
  },

  updateSettings: async (data) => {
    const next = { ...get().settings, ...data };
    set({ settings: next });
    await setItem(STORAGE_KEYS.SETTINGS, next);
  },

  updateProfile: async (data) => {
    const next = { ...get().profile, ...data };
    set({ profile: next });
    await setItem(STORAGE_KEYS.PROFILE, next);
  },
}));
