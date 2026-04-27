import { create } from 'zustand';
import { Budget } from '../types';
import { getItem, setItem } from '../lib/storage';
import { STORAGE_KEYS } from '../constants';

interface BudgetStore {
  budgets: Budget[];
  initialized: boolean;
  loadBudgets: () => Promise<void>;
  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetByCategory: (categoryId: string, month: number, year: number) => Budget | undefined;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budgets: [],
  initialized: false,

  loadBudgets: async () => {
    const stored = await getItem<Budget[]>(STORAGE_KEYS.BUDGETS);
    set({ budgets: stored ?? [], initialized: true });
  },

  addBudget: async (budget) => {
    const next = [...get().budgets, budget];
    set({ budgets: next });
    await setItem(STORAGE_KEYS.BUDGETS, next);
  },

  updateBudget: async (id, data) => {
    const next = get().budgets.map((b) => (b.id === id ? { ...b, ...data } : b));
    set({ budgets: next });
    await setItem(STORAGE_KEYS.BUDGETS, next);
  },

  deleteBudget: async (id) => {
    const next = get().budgets.filter((b) => b.id !== id);
    set({ budgets: next });
    await setItem(STORAGE_KEYS.BUDGETS, next);
  },

  getBudgetByCategory: (categoryId, month, year) =>
    get().budgets.find((b) => b.categoryId === categoryId && b.month === month && b.year === year),
}));
