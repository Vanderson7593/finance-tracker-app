export type TransactionType = "income" | "expense" | "transfer";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault?: boolean;
}

export type AccountType = "bank" | "wallet" | "digital" | "card" | "savings" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
  initialBalance: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export type AttachmentKind = "image" | "document";

export interface Attachment {
  id: string;
  uri: string;
  name: string;
  kind: AttachmentKind;
  mimeType?: string;
  size?: number;
}

export interface Transaction {
  id: string;
  title?: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  tagIds?: string[];
  date: string; // ISO string
  description?: string;
  recurrence: RecurrenceType;
  attachments?: Attachment[];
  createdAt: string;
  transferId?: string; // links paired transfer transactions
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number; // 1-12
  year: number;
  createdAt: string;
}

export type ThemePreference = "light" | "dark" | "system";

export interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:mm
  budgetAlerts: boolean;
  budgetAlertThreshold: number; // percentage 0-100
  weeklyReport: boolean;
  showAmounts: boolean;
  theme: ThemePreference;
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
  confidence: "low" | "medium" | "high";
}
