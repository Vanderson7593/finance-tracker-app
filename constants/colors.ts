export interface Palette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  income: string;
  incomeLight: string;
  expense: string;
  expenseLight: string;
  border: string;
  divider: string;
  placeholder: string;
  warning: string;
  warningLight: string;
  success: string;
  error: string;
}

export const LIGHT_COLORS: Palette = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryMuted: '#EEF2FF',

  background: '#F8F9FC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',

  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
  },

  income: '#10B981',
  incomeLight: '#ECFDF5',
  expense: '#EF4444',
  expenseLight: '#FEF2F2',

  border: '#E2E8F0',
  divider: '#F1F5F9',
  placeholder: '#CBD5E1',

  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  success: '#10B981',
  error: '#EF4444',
};

export const DARK_COLORS: Palette = {
  primary: '#818CF8',
  primaryDark: '#6366F1',
  primaryLight: '#A5B4FC',
  primaryMuted: '#1E1B4B',

  background: '#0B0F1A',
  surface: '#151B2C',
  surfaceVariant: '#1E2538',

  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    inverse: '#0F172A',
  },

  income: '#34D399',
  incomeLight: '#064E3B',
  expense: '#F87171',
  expenseLight: '#7F1D1D',

  border: '#2A3244',
  divider: '#1E2538',
  placeholder: '#475569',

  warning: '#FBBF24',
  warningLight: '#78350F',
  success: '#34D399',
  error: '#F87171',
};

export const COLORS: Palette = LIGHT_COLORS;

export default {
  light: {
    text: LIGHT_COLORS.text.primary,
    background: LIGHT_COLORS.background,
    tint: LIGHT_COLORS.primary,
    tabIconDefault: LIGHT_COLORS.text.tertiary,
    tabIconSelected: LIGHT_COLORS.primary,
  },
  dark: {
    text: DARK_COLORS.text.primary,
    background: DARK_COLORS.background,
    tint: DARK_COLORS.primary,
    tabIconDefault: DARK_COLORS.text.tertiary,
    tabIconSelected: DARK_COLORS.primary,
  },
};
