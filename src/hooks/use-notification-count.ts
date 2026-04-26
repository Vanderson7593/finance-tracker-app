import { useMemo } from "react";
import { useTransactionStore } from "../store/use-transaction-store";
import { useAllAccountBalances, useBudgetProgress } from "./use-finance-data";
import { useSettingsStore } from "../store/use-settings-store";
import { getCurrentMonth } from "../lib/formatters";

export function useNotificationCount(): number {
  const { month, year } = getCurrentMonth();
  const transactions = useTransactionStore((s) => s.transactions);
  const budgetProgress = useBudgetProgress(month, year);
  const accounts = useAllAccountBalances();
  const settings = useSettingsStore((s) => s.settings);

  return useMemo(() => {
    let count = 0;

    // Over budget
    count += budgetProgress.filter((b) => b.isOverBudget).length;

    // Near limit
    count += budgetProgress.filter((b) => b.isNearLimit && !b.isOverBudget).length;

    // Recent transfers (unique transferIds)
    const seenIds = new Set<string>();
    transactions
      .filter((t) => t.transferId)
      .forEach((t) => {
        if (!t.transferId || seenIds.has(t.transferId)) return;
        seenIds.add(t.transferId);
      });
    const transferCount = Math.min(seenIds.size, 5);
    count += transferCount;

    // Negative balances
    count += accounts.filter((a) => a.balance < 0).length;

    return count;
  }, [budgetProgress, transactions, accounts, settings]);
}
