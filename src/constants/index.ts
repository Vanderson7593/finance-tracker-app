export const STORAGE_KEYS = {
  TRANSACTIONS: '@fintrack_transactions',
  CATEGORIES: '@fintrack_categories',
  BUDGETS: '@fintrack_budgets',
  SETTINGS: '@fintrack_settings',
  PROFILE: '@fintrack_profile',
} as const;

export const CURRENCY_SYMBOLS = {
  AOA: 'Kz',
  EUR: '€',
  USD: '$',
  GBP: '£',
  BRL: 'R$',
} as const;

export const CURRENCIES = [
  { code: 'AOA', symbol: CURRENCY_SYMBOLS.AOA, name: 'Kwanza Angolano' },
  { code: 'EUR', symbol: CURRENCY_SYMBOLS.EUR, name: 'Euro' },
  { code: 'USD', symbol: CURRENCY_SYMBOLS.USD, name: 'US Dollar' },
  { code: 'GBP', symbol: CURRENCY_SYMBOLS.GBP, name: 'British Pound' },
  { code: 'BRL', symbol: CURRENCY_SYMBOLS.BRL, name: 'Brazilian Real' },
];

export const DEFAULT_CURRENCY = 'AOA';
export const DEFAULT_CURRENCY_SYMBOL = CURRENCY_SYMBOLS[DEFAULT_CURRENCY];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const SHORT_MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const RECURRENCE_LABELS = {
  none: 'Sem recorrência',
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
} as const;

export const CATEGORY_ICONS = [
  'shopping-cart', 'coffee', 'navigation', 'home', 'heart', 'zap',
  'wifi', 'smartphone', 'music', 'camera', 'book', 'sun',
  'gift', 'globe', 'briefcase', 'trending-up', 'dollar-sign',
  'credit-card', 'tag', 'star', 'film', 'tool', 'droplet',
  'activity', 'award', 'package', 'map-pin', 'truck', 'send',
];

export const CATEGORY_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#06B6D4',
  '#84CC16', '#A855F7', '#F43F5E', '#FB923C', '#FBBF24',
];

export const BUDGET_WARNING_THRESHOLD = 80; // percentage
