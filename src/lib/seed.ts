import { Category, Transaction, Budget } from '../types';
import { generateId } from './uuid';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  { id: 'cat-food', name: 'Alimentação', icon: 'coffee', color: '#F97316', type: 'expense', isDefault: true },
  { id: 'cat-transport', name: 'Transporte', icon: 'navigation', color: '#3B82F6', type: 'expense', isDefault: true },
  { id: 'cat-home', name: 'Casa', icon: 'home', color: '#8B5CF6', type: 'expense', isDefault: true },
  { id: 'cat-health', name: 'Saúde', icon: 'heart', color: '#EF4444', type: 'expense', isDefault: true },
  { id: 'cat-shopping', name: 'Compras', icon: 'shopping-cart', color: '#EC4899', type: 'expense', isDefault: true },
  { id: 'cat-entertainment', name: 'Lazer', icon: 'film', color: '#EAB308', type: 'expense', isDefault: true },
  { id: 'cat-education', name: 'Educação', icon: 'book', color: '#14B8A6', type: 'expense', isDefault: true },
  { id: 'cat-subscriptions', name: 'Subscrições', icon: 'wifi', color: '#6366F1', type: 'expense', isDefault: true },
  { id: 'cat-others-exp', name: 'Outros', icon: 'tag', color: '#84CC16', type: 'expense', isDefault: true },
  // Income categories
  { id: 'cat-salary', name: 'Salário', icon: 'briefcase', color: '#22C55E', type: 'income', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance', icon: 'trending-up', color: '#06B6D4', type: 'income', isDefault: true },
  { id: 'cat-investments', name: 'Investimentos', icon: 'activity', color: '#A855F7', type: 'income', isDefault: true },
  { id: 'cat-gifts', name: 'Presentes', icon: 'gift', color: '#F43F5E', type: 'income', isDefault: true },
  { id: 'cat-others-inc', name: 'Outros', icon: 'tag', color: '#84CC16', type: 'income', isDefault: true },
];

function makeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Salário de Março',
    amount: 2500,
    type: 'income',
    categoryId: 'cat-salary',
    date: makeDate(25),
    recurrence: 'monthly',
    description: 'Salário mensal',
    createdAt: makeDate(25),
  },
  {
    id: 'tx-2',
    title: 'Supermercado',
    amount: 87.50,
    type: 'expense',
    categoryId: 'cat-food',
    date: makeDate(2),
    recurrence: 'none',
    createdAt: makeDate(2),
  },
  {
    id: 'tx-3',
    title: 'Renda',
    amount: 750,
    type: 'expense',
    categoryId: 'cat-home',
    date: makeDate(15),
    recurrence: 'monthly',
    description: 'Renda mensal do apartamento',
    createdAt: makeDate(15),
  },
  {
    id: 'tx-4',
    title: 'Netflix',
    amount: 15.99,
    type: 'expense',
    categoryId: 'cat-subscriptions',
    date: makeDate(10),
    recurrence: 'monthly',
    createdAt: makeDate(10),
  },
  {
    id: 'tx-5',
    title: 'Gasolina',
    amount: 60,
    type: 'expense',
    categoryId: 'cat-transport',
    date: makeDate(5),
    recurrence: 'none',
    createdAt: makeDate(5),
  },
  {
    id: 'tx-6',
    title: 'Projeto Freelance',
    amount: 400,
    type: 'income',
    categoryId: 'cat-freelance',
    date: makeDate(8),
    recurrence: 'none',
    description: 'Website para cliente',
    createdAt: makeDate(8),
  },
  {
    id: 'tx-7',
    title: 'Farmácia',
    amount: 34.20,
    type: 'expense',
    categoryId: 'cat-health',
    date: makeDate(3),
    recurrence: 'none',
    createdAt: makeDate(3),
  },
  {
    id: 'tx-8',
    title: 'Restaurante',
    amount: 45.80,
    type: 'expense',
    categoryId: 'cat-food',
    date: makeDate(6),
    recurrence: 'none',
    createdAt: makeDate(6),
  },
  {
    id: 'tx-9',
    title: 'Cinema',
    amount: 20,
    type: 'expense',
    categoryId: 'cat-entertainment',
    date: makeDate(12),
    recurrence: 'none',
    createdAt: makeDate(12),
  },
  {
    id: 'tx-10',
    title: 'Uber',
    amount: 18.50,
    type: 'expense',
    categoryId: 'cat-transport',
    date: makeDate(1),
    recurrence: 'none',
    createdAt: makeDate(1),
  },
  {
    id: 'tx-11',
    title: 'Spotify',
    amount: 9.99,
    type: 'expense',
    categoryId: 'cat-subscriptions',
    date: makeDate(10),
    recurrence: 'monthly',
    createdAt: makeDate(10),
  },
  {
    id: 'tx-12',
    title: 'Curso Online',
    amount: 49,
    type: 'expense',
    categoryId: 'cat-education',
    date: makeDate(20),
    recurrence: 'none',
    description: 'Curso de TypeScript',
    createdAt: makeDate(20),
  },
  {
    id: 'tx-13',
    title: 'Salário de Fevereiro',
    amount: 2500,
    type: 'income',
    categoryId: 'cat-salary',
    date: makeDate(55),
    recurrence: 'monthly',
    createdAt: makeDate(55),
  },
  {
    id: 'tx-14',
    title: 'Renda Fevereiro',
    amount: 750,
    type: 'expense',
    categoryId: 'cat-home',
    date: makeDate(45),
    recurrence: 'monthly',
    createdAt: makeDate(45),
  },
  {
    id: 'tx-15',
    title: 'Supermercado',
    amount: 95.30,
    type: 'expense',
    categoryId: 'cat-food',
    date: makeDate(40),
    recurrence: 'none',
    createdAt: makeDate(40),
  },
];

export function getSeedBudgets(): Budget[] {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return [
    { id: 'bud-1', categoryId: 'cat-food', amount: 300, month, year, createdAt: new Date().toISOString() },
    { id: 'bud-2', categoryId: 'cat-transport', amount: 150, month, year, createdAt: new Date().toISOString() },
    { id: 'bud-3', categoryId: 'cat-home', amount: 800, month, year, createdAt: new Date().toISOString() },
    { id: 'bud-4', categoryId: 'cat-entertainment', amount: 100, month, year, createdAt: new Date().toISOString() },
    { id: 'bud-5', categoryId: 'cat-subscriptions', amount: 50, month, year, createdAt: new Date().toISOString() },
  ];
}
