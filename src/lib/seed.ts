import { Category, Transaction, Budget } from '../types';

function makeCategory(
  id: string,
  name: string,
  icon: string,
  color: string,
  type: Category['type'],
): Category {
  return { id, name, icon, color, type, isDefault: true };
}

export const DEFAULT_CATEGORIES: Category[] = [
  makeCategory('cat-groceries', 'Supermercado', 'shopping-bag', '#F97316', 'expense'),
  makeCategory('cat-restaurants', 'Restaurante', 'coffee', '#F97316', 'expense'),
  makeCategory('cat-fuel', 'Combustível', 'truck', '#3B82F6', 'expense'),
  makeCategory('cat-ride-hailing', 'Táxi / Uber', 'map-pin', '#3B82F6', 'expense'),
  makeCategory('cat-rent', 'Renda', 'home', '#8B5CF6', 'expense'),
  makeCategory('cat-utilities', 'Água / Luz', 'droplet', '#8B5CF6', 'expense'),
  makeCategory('cat-pharmacy', 'Farmácia', 'heart', '#EF4444', 'expense'),
  makeCategory('cat-consultation', 'Consulta', 'activity', '#EF4444', 'expense'),
  makeCategory('cat-clothing', 'Roupa', 'shopping-cart', '#EC4899', 'expense'),
  makeCategory('cat-household', 'Casa e outros', 'package', '#EC4899', 'expense'),
  makeCategory('cat-cinema', 'Cinema', 'film', '#EAB308', 'expense'),
  makeCategory('cat-events', 'Eventos', 'star', '#EAB308', 'expense'),
  makeCategory('cat-courses', 'Cursos', 'book', '#14B8A6', 'expense'),
  makeCategory('cat-books', 'Livros', 'book-open', '#14B8A6', 'expense'),
  makeCategory('cat-streaming', 'Streaming', 'film', '#6366F1', 'expense'),
  makeCategory('cat-mobile', 'Internet / Telemóvel', 'smartphone', '#6366F1', 'expense'),
  makeCategory('cat-others-exp', 'Outros gastos', 'tag', '#84CC16', 'expense'),

  makeCategory('cat-salary', 'Salário', 'briefcase', '#22C55E', 'income'),
  makeCategory('cat-freelance', 'Freelance', 'trending-up', '#06B6D4', 'income'),
  makeCategory('cat-investments', 'Investimentos', 'activity', '#A855F7', 'income'),
  makeCategory('cat-gifts', 'Presentes', 'gift', '#F43F5E', 'income'),
  makeCategory('cat-others-inc', 'Outras receitas', 'tag', '#84CC16', 'income'),
];

function makeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', title: 'Salário de Março', amount: 2500, type: 'income', categoryId: 'cat-salary', date: makeDate(25), recurrence: 'monthly', description: 'Salário mensal', accountId: '', createdAt: makeDate(25) },
  { id: 'tx-2', title: 'Supermercado', amount: 87.50, type: 'expense', categoryId: 'cat-groceries', date: makeDate(2), recurrence: 'none', accountId: '', createdAt: makeDate(2) },
  { id: 'tx-3', title: 'Renda', amount: 750, type: 'expense', categoryId: 'cat-rent', date: makeDate(15), recurrence: 'monthly', description: 'Renda mensal do apartamento', accountId: '', createdAt: makeDate(15) },
  { id: 'tx-4', title: 'Netflix', amount: 15.99, type: 'expense', categoryId: 'cat-streaming', date: makeDate(10), recurrence: 'monthly', accountId: '', createdAt: makeDate(10) },
  { id: 'tx-5', title: 'Gasolina', amount: 60, type: 'expense', categoryId: 'cat-fuel', date: makeDate(5), recurrence: 'none', accountId: '', createdAt: makeDate(5) },
  { id: 'tx-6', title: 'Projeto Freelance', amount: 400, type: 'income', categoryId: 'cat-freelance', date: makeDate(8), recurrence: 'none', description: 'Website para cliente', accountId: '', createdAt: makeDate(8) },
  { id: 'tx-7', title: 'Farmácia', amount: 34.20, type: 'expense', categoryId: 'cat-pharmacy', date: makeDate(3), recurrence: 'none', accountId: '', createdAt: makeDate(3) },
  { id: 'tx-8', title: 'Restaurante', amount: 45.80, type: 'expense', categoryId: 'cat-restaurants', date: makeDate(6), recurrence: 'none', accountId: '', createdAt: makeDate(6) },
  { id: 'tx-9', title: 'Cinema', amount: 20, type: 'expense', categoryId: 'cat-cinema', date: makeDate(12), recurrence: 'none', accountId: '', createdAt: makeDate(12) },
  { id: 'tx-10', title: 'Uber', amount: 18.50, type: 'expense', categoryId: 'cat-ride-hailing', date: makeDate(1), recurrence: 'none', accountId: '', createdAt: makeDate(1) },
  { id: 'tx-11', title: 'Spotify', amount: 9.99, type: 'expense', categoryId: 'cat-streaming', date: makeDate(10), recurrence: 'monthly', accountId: '', createdAt: makeDate(10) },
  { id: 'tx-12', title: 'Curso Online', amount: 49, type: 'expense', categoryId: 'cat-courses', date: makeDate(20), recurrence: 'none', description: 'Curso de TypeScript', accountId: '', createdAt: makeDate(20) },
  { id: 'tx-13', title: 'Salário de Fevereiro', amount: 2500, type: 'income', categoryId: 'cat-salary', date: makeDate(55), recurrence: 'monthly', accountId: '', createdAt: makeDate(55) },
  { id: 'tx-14', title: 'Renda Fevereiro', amount: 750, type: 'expense', categoryId: 'cat-rent', date: makeDate(45), recurrence: 'monthly', accountId: '', createdAt: makeDate(45) },
  { id: 'tx-15', title: 'Supermercado', amount: 95.30, type: 'expense', categoryId: 'cat-groceries', date: makeDate(40), recurrence: 'none', accountId: '', createdAt: makeDate(40) },
];

export function getSeedBudgets(): Budget[] {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return [
    { id: 'bud-1', categoryId: 'cat-groceries', amount: 300, month, year, createdAt: new Date().toISOString() },
    { id: 'bud-2', categoryId: 'cat-fuel', amount: 150, month, year, createdAt: new Date().toISOString() },
    { id: 'bud-3', categoryId: 'cat-rent', amount: 800, month, year, createdAt: new Date().toISOString() },
    { id: 'bud-4', categoryId: 'cat-cinema', amount: 100, month, year, createdAt: new Date().toISOString() },
    { id: 'bud-5', categoryId: 'cat-streaming', amount: 50, month, year, createdAt: new Date().toISOString() },
  ];
}
