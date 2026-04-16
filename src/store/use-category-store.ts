import { create } from 'zustand';
import { Category } from '../types';
import { getItem, setItem } from '../lib/storage';
import { STORAGE_KEYS } from '../constants';
import { DEFAULT_CATEGORIES } from '../lib/seed';
import { normalizeCategories } from '../lib/categories';

interface CategoryStore {
  categories: Category[];
  initialized: boolean;
  loadCategories: () => Promise<void>;
  addCategory: (cat: Category) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  initialized: false,

  loadCategories: async () => {
    const stored = await getItem<Category[]>(STORAGE_KEYS.CATEGORIES);
    if (stored && stored.length > 0) {
      const normalized = normalizeCategories(stored);
      set({ categories: normalized, initialized: true });
      await setItem(STORAGE_KEYS.CATEGORIES, normalized);
    } else {
      await setItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      set({ categories: DEFAULT_CATEGORIES, initialized: true });
    }
  },

  addCategory: async (cat) => {
    const next = [...get().categories, cat];
    set({ categories: next });
    await setItem(STORAGE_KEYS.CATEGORIES, next);
  },

  updateCategory: async (id, data) => {
    const next = get().categories.map((c) => (c.id === id ? { ...c, ...data } : c));
    set({ categories: next });
    await setItem(STORAGE_KEYS.CATEGORIES, next);
  },

  deleteCategory: async (id) => {
    const next = get().categories.filter((c) => c.id !== id);
    set({ categories: next });
    await setItem(STORAGE_KEYS.CATEGORIES, next);
  },

  getCategoryById: (id) => get().categories.find((c) => c.id === id),
}));
