import { create } from 'zustand';
import { Tag, Transaction } from '../types';
import { getItem, setItem } from '../lib/storage';
import { STORAGE_KEYS } from '../constants';
import { useTransactionStore } from './use-transaction-store';

interface TagStore {
  tags: Tag[];
  initialized: boolean;
  loadTags: () => Promise<void>;
  addTag: (tag: Tag) => Promise<void>;
  updateTag: (id: string, data: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  getTagById: (id: string) => Tag | undefined;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  initialized: false,

  loadTags: async () => {
    const stored = await getItem<Tag[]>(STORAGE_KEYS.TAGS);
    set({ tags: stored ?? [], initialized: true });
  },

  addTag: async (tag) => {
    const next = [...get().tags, tag];
    set({ tags: next });
    await setItem(STORAGE_KEYS.TAGS, next);
  },

  updateTag: async (id, data) => {
    const next = get().tags.map((t) => (t.id === id ? { ...t, ...data } : t));
    set({ tags: next });
    await setItem(STORAGE_KEYS.TAGS, next);
  },

  deleteTag: async (id) => {
    const next = get().tags.filter((t) => t.id !== id);
    set({ tags: next });
    await setItem(STORAGE_KEYS.TAGS, next);
    const txStore = useTransactionStore.getState();
    const cleaned: Transaction[] = txStore.transactions.map((t) =>
      t.tagIds && t.tagIds.includes(id)
        ? { ...t, tagIds: t.tagIds.filter((tid) => tid !== id) }
        : t,
    );
    useTransactionStore.setState({ transactions: cleaned });
    await setItem(STORAGE_KEYS.TRANSACTIONS, cleaned);
  },

  getTagById: (id) => get().tags.find((t) => t.id === id),
}));
