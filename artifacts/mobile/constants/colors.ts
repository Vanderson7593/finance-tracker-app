export const COLORS = {
  // Brand
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryMuted: '#EEF2FF',

  // Background
  background: '#F8F9FC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',

  // Text
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
  },

  // Semantic
  income: '#10B981',
  incomeLight: '#ECFDF5',
  expense: '#EF4444',
  expenseLight: '#FEF2F2',

  // UI
  border: '#E2E8F0',
  divider: '#F1F5F9',
  placeholder: '#CBD5E1',

  // Feedback
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  success: '#10B981',
  error: '#EF4444',
};

export default {
  light: {
    text: COLORS.text.primary,
    background: COLORS.background,
    tint: COLORS.primary,
    tabIconDefault: COLORS.text.tertiary,
    tabIconSelected: COLORS.primary,
  },
};
