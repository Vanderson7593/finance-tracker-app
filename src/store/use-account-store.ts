import { create } from 'zustand';
import { Account, Transaction } from '../types';
import { getItem, setItem } from '../lib/storage';
import { STORAGE_KEYS } from '../constants';
import { useTransactionStore } from './use-transaction-store';

interface AccountStore {
  accounts: Account[];
  initialized: boolean;
  loadAccounts: () => Promise<void>;
  addAccount: (account: Account) => Promise<void>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccountById: (id: string) => Account | undefined;
}

async function backfillTransactionAccounts(firstAccountId: string) {
  const txs = await getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS);
  if (!txs || txs.length === 0) return;
  const needsMigration = txs.some((t) => !t.accountId);
  if (!needsMigration) return;
  const migrated = txs.map((t) => (t.accountId ? t : { ...t, accountId: firstAccountId }));
  await setItem(STORAGE_KEYS.TRANSACTIONS, migrated);
  const txStore = useTransactionStore.getState();
  if (txStore.initialized) {
    useTransactionStore.setState({ transactions: migrated });
  }
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  initialized: false,

  loadAccounts: async () => {
    const stored = await getItem<Account[]>(STORAGE_KEYS.ACCOUNTS);
    const accounts = stored ?? [];
    set({ accounts, initialized: true });
    if (accounts.length > 0) {
      await backfillTransactionAccounts(accounts[0].id);
    }
  },

  addAccount: async (account) => {
    const next = [...get().accounts, account];
    set({ accounts: next });
    await setItem(STORAGE_KEYS.ACCOUNTS, next);
    if (next.length === 1) {
      await backfillTransactionAccounts(account.id);
    }
  },

  updateAccount: async (id, data) => {
    const next = get().accounts.map((a) => (a.id === id ? { ...a, ...data } : a));
    set({ accounts: next });
    await setItem(STORAGE_KEYS.ACCOUNTS, next);
  },

  deleteAccount: async (id) => {
    const remaining = get().accounts.filter((a) => a.id !== id);
    if (remaining.length === 0) return;
    set({ accounts: remaining });
    await setItem(STORAGE_KEYS.ACCOUNTS, remaining);
    const fallbackId = remaining[0].id;
    const txStore = useTransactionStore.getState();
    const reassigned = txStore.transactions.map((t) =>
      t.accountId === id ? { ...t, accountId: fallbackId } : t,
    );
    useTransactionStore.setState({ transactions: reassigned });
    await setItem(STORAGE_KEYS.TRANSACTIONS, reassigned);
  },

  getAccountById: (id) => get().accounts.find((a) => a.id === id),
}));
