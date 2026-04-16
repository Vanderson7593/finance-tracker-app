export type TransactionType = 'income' | 'expense';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type CategoryKind = 'category' | 'subcategory';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  kind: CategoryKind;
  parentCategoryId?: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  title?: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO string
  description?: string;
  recurrence: RecurrenceType;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number; // 1-12
  year: number;
  createdAt: string;
}

export interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:mm
  budgetAlerts: boolean;
  budgetAlertThreshold: number; // percentage 0-100
  weeklyReport: boolean;
  showAmounts: boolean;
}

export interface UserProfile {
  name: string;
  currency: string;
  onboardingCompleted: boolean;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  month: number;
  year: number;
}

export interface CategorySpending {
  categoryId: string;
  category: Category;
  total: number;
  percentage: number;
  count: number;
}

export interface BudgetProgress {
  budget: Budget;
  category: Category;
  spent: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export interface ForecastData {
  projectedBalance: number;
  projectedIncome: number;
  projectedExpenses: number;
  daysLeft: number;
  message: string;
  confidence: 'low' | 'medium' | 'high';
}
