import { Category } from '../types';

export function getCategoryDisplayName(category: Category | undefined) {
  return category?.name ?? 'Sem categoria';
}

type LegacyCategory = Category & { kind?: 'category' | 'subcategory'; parentCategoryId?: string };

export function migrateCategories(categories: LegacyCategory[]): Category[] {
  const hasLegacyFields = categories.some((c) => c.kind !== undefined || c.parentCategoryId !== undefined);
  if (!hasLegacyFields) return categories as Category[];

  const parentIdsWithChildren = new Set(
    categories
      .filter((c) => c.kind === 'subcategory' && c.parentCategoryId)
      .map((c) => c.parentCategoryId as string),
  );

  return categories
    .filter((c) => {
      if (c.kind === 'category' && parentIdsWithChildren.has(c.id)) return false;
      return true;
    })
    .map(({ kind: _kind, parentCategoryId: _parent, ...rest }) => rest);
}
