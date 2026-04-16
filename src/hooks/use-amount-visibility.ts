import { useSettingsStore } from '../store/use-settings-store';

export const HIDDEN_AMOUNT = '••••';

export function useAmountVisibility() {
  const showAmounts = useSettingsStore((s) => s.settings.showAmounts ?? true);
  const toggleAmountVisibility = useSettingsStore((s) => s.toggleAmountVisibility);

  return {
    showAmounts,
    toggleAmountVisibility,
  };
}
