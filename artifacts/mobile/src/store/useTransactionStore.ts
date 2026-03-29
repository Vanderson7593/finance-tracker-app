import { create } from 'zustand';
import { Transaction } from '../types';
import { getItem, setItem } from '../lib/storage';
import { STORAGE_KEYS } from '../constants';
import { SEED_TRANSACTIONS } from '../lib/seed';

interface TransactionStore {
  transactions: Transaction[];
  initialized: boolean;
  loadTransactions: () => Promise<void>;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  initialized: false,

  loadTransactions: async () => {
    const stored = await getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS);
    if (stored && stored.length > 0) {
      set({ transactions: stored, initialized: true });
    } else {
      await setItem(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
      set({ transactions: SEED_TRANSACTIONS, initialized: true });
    }
  },

  addTransaction: async (tx) => {
    const next = [tx, ...get().transactions];
    set({ transactions: next });
    await setItem(STORAGE_KEYS.TRANSACTIONS, next);
  },

  updateTransaction: async (id, data) => {
    const next = get().transactions.map((t) => (t.id === id ? { ...t, ...data } : t));
    set({ transactions: next });
    await setItem(STORAGE_KEYS.TRANSACTIONS, next);
  },

  deleteTransaction: async (id) => {
    const next = get().transactions.filter((t) => t.id !== id);
    set({ transactions: next });
    await setItem(STORAGE_KEYS.TRANSACTIONS, next);
  },
}));
