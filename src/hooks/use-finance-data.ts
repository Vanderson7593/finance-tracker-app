import { useMemo } from 'react';
import { parseISO, isSameMonth, isSameYear } from 'date-fns';
import { useTransactionStore } from '../store/use-transaction-store';
import { useCategoryStore } from '../store/use-category-store';
import { useBudgetStore } from '../store/use-budget-store';
import { useAccountStore } from '../store/use-account-store';
import { Transaction, CategorySpending, BudgetProgress, ForecastData, MonthSummary, Account } from '../types';
import { BUDGET_WARNING_THRESHOLD } from '../constants';

export function useAllAccountBalances(): Array<Account & { balance: number }> {
  const transactions = useTransactionStore((s) => s.transactions);
  const accounts = useAccountStore((s) => s.accounts);
  return useMemo(() => {
    return accounts.map((account) => {
      const txs = transactions.filter((t) => t.accountId === account.id);
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { ...account, balance: account.initialBalance + income - expenses };
    });
  }, [transactions, accounts]);
}

export function useMonthTransactions(month: number, year: number) {
  const transactions = useTransactionStore((s) => s.transactions);
  return useMemo(() => {
    const target = new Date(year, month - 1, 1);
    return transactions.filter((tx) => {
      const d = parseISO(tx.date);
      return isSameMonth(d, target) && isSameYear(d, target);
    });
  }, [transactions, month, year]);
}

export function useMonthSummary(month: number, year: number): MonthSummary {
  const txs = useMonthTransactions(month, year);
  return useMemo(() => {
    const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses, month, year };
  }, [txs, month, year]);
}

export function useCategorySpending(month: number, year: number): CategorySpending[] {
  const txs = useMonthTransactions(month, year);
  const categories = useCategoryStore((s) => s.categories);
  return useMemo(() => {
    const expenseTxs = txs.filter((t) => t.type === 'expense');
    const totalExpenses = expenseTxs.reduce((s, t) => s + t.amount, 0);
    const map = new Map<string, number>();
    expenseTxs.forEach((tx) => {
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount);
    });
    return Array.from(map.entries())
      .map(([categoryId, total]) => {
        const category = categories.find((c) => c.id === categoryId);
        const count = expenseTxs.filter((t) => t.categoryId === categoryId).length;
        return {
          categoryId,
          category: category ?? {
            id: categoryId,
            name: 'Desconhecido',
            icon: 'tag',
            color: '#ccc',
            type: 'expense' as const,
            kind: 'subcategory' as const,
          },
          total,
          percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
          count,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [txs, categories]);
}

export function useBudgetProgress(month: number, year: number): BudgetProgress[] {
  const txs = useMonthTransactions(month, year);
  const budgets = useBudgetStore((s) => s.budgets);
  const categories = useCategoryStore((s) => s.categories);
  return useMemo(() => {
    const monthBudgets = budgets.filter((b) => b.month === month && b.year === year);
    return monthBudgets.map((budget) => {
      const category = categories.find((c) => c.id === budget.categoryId) ?? {
        id: budget.categoryId,
        name: 'Desconhecido',
        icon: 'tag',
        color: '#ccc',
        type: 'expense' as const,
        kind: 'subcategory' as const,
      };
      const spent = txs
        .filter((t) => t.type === 'expense' && t.categoryId === budget.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return {
        budget,
        category,
        spent,
        percentage: Math.min(percentage, 100),
        remaining: Math.max(budget.amount - spent, 0),
        isOverBudget: spent > budget.amount,
        isNearLimit: percentage >= BUDGET_WARNING_THRESHOLD && spent <= budget.amount,
      };
    });
  }, [txs, budgets, categories, month, year]);
}

export function useForecast(month: number, year: number): ForecastData {
  const txs = useMonthTransactions(month, year);
  const allTxs = useTransactionStore((s) => s.transactions);
  return useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysLeft = daysInMonth - dayOfMonth;

    const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const dailyExpenseRate = dayOfMonth > 0 ? totalExpenses / dayOfMonth : 0;
    const projectedExpenses = totalExpenses + dailyExpenseRate * daysLeft;

    const recurringIncome = allTxs
      .filter((t) => t.type === 'income' && t.recurrence !== 'none')
      .reduce((s, t) => s + t.amount, 0);
    const projectedIncome = totalIncome + (recurringIncome > 0 && totalIncome === 0 ? recurringIncome : 0);

    const projectedBalance = projectedIncome - projectedExpenses;

    let message = '';
    if (projectedBalance > 0) {
      message = `Estás a poupar bem! Previsão de saldo positivo no final do mês.`;
    } else if (projectedBalance < -100) {
      message = `Atenção! O teu ritmo de gastos pode levar a saldo negativo.`;
    } else {
      message = `Estás quase equilibrado. Mantém o controlo dos gastos.`;
    }

    const confidence: 'low' | 'medium' | 'high' =
      dayOfMonth < 7 ? 'low' : dayOfMonth < 20 ? 'medium' : 'high';

    return {
      projectedBalance,
      projectedIncome,
      projectedExpenses,
      daysLeft,
      message,
      confidence,
    };
  }, [txs, allTxs, month, year]);
}

export function useMonthlyTrend(monthsBack = 6) {
  const transactions = useTransactionStore((s) => s.transactions);
  return useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const txs = transactions.filter((tx) => {
        const date = parseISO(tx.date);
        return isSameMonth(date, d) && isSameYear(date, d);
      });
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      months.push({ month: m, year: y, income, expenses, balance: income - expenses });
    }
    return months;
  }, [transactions, monthsBack]);
}
