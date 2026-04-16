import { Category, TransactionType } from '../types';

export function isParentCategory(category: Category) {
  return category.kind === 'category';
}

export function isSubcategory(category: Category) {
  return category.kind === 'subcategory';
}

export function getParentCategory(category: Category | undefined, categories: Category[]) {
  if (!category?.parentCategoryId) return undefined;
  return categories.find((item) => item.id === category.parentCategoryId);
}

export function getCategoryDisplayName(category: Category | undefined, categories: Category[]) {
  if (!category) return 'Sem categoria';

  const parent = getParentCategory(category, categories);
  if (!parent) return category.name;

  return parent.name === category.name
    ? category.name
    : `${parent.name} / ${category.name}`;
}

export function groupCategoriesByParent(categories: Category[], type: TransactionType) {
  const parents = categories.filter((category) => category.type === type && isParentCategory(category));

  return parents.map((parent) => ({
    parent,
    subcategories: categories.filter(
      (category) =>
        category.type === type &&
        isSubcategory(category) &&
        category.parentCategoryId === parent.id,
    ),
  }));
}

export function normalizeCategories(categories: Category[]) {
  if (categories.some((category) => category.kind === 'category' || category.kind === 'subcategory')) {
    return categories.map((category) => ({
      ...category,
      kind: category.kind ?? (category.parentCategoryId ? 'subcategory' : 'category'),
      parentCategoryId:
        category.kind === 'category'
          ? undefined
          : category.parentCategoryId,
    }));
  }

  return categories.flatMap((category) => {
    const parentId = `parent-${category.id}`;

    return [
      {
        ...category,
        id: parentId,
        kind: 'category' as const,
        parentCategoryId: undefined,
      },
      {
        ...category,
        kind: 'subcategory' as const,
        parentCategoryId: parentId,
      },
    ];
  });
}
