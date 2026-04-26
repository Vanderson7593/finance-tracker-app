import { useSettingsStore } from '../store/use-settings-store';
import { CURRENCY_SYMBOLS, DEFAULT_CURRENCY } from '../constants';

export const HIDDEN_AMOUNT = '***';

export function hiddenCurrency(currency = DEFAULT_CURRENCY): string {
  const sym = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] ?? currency;
  return `${sym} ***`;
}

export function useAmountVisibility() {
  const showAmounts = useSettingsStore((s) => s.settings.showAmounts ?? true);
  const toggleAmountVisibility = useSettingsStore((s) => s.toggleAmountVisibility);

  return {
    showAmounts,
    toggleAmountVisibility,
  };
}
