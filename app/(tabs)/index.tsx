import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SummaryCard } from '../../src/components/summary-card';
import { TransactionItem } from '../../src/components/transaction-item';
import { BudgetProgressBar } from '../../src/components/budget-progress-bar';
import { ThemedText } from '../../src/components/themed-text';
import { EmptyState } from '../../src/components/empty-state';
import { Fab } from '../../src/components/fab';
import { Palette } from '../../constants/colors';
import { useColors } from '../../src/hooks/use-colors';
import { useTransactionStore } from '../../src/store/use-transaction-store';
import { useCategoryStore } from '../../src/store/use-category-store';
import { useBudgetStore } from '../../src/store/use-budget-store';
import { useSettingsStore } from '../../src/store/use-settings-store';
import { useBudgetProgress } from '../../src/hooks/use-finance-data';
import { getCurrentMonth } from '../../src/lib/formatters';

export default function HomeScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const { month, year } = getCurrentMonth();
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const loadBudgets = useBudgetStore((s) => s.loadBudgets);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const profile = useSettingsStore((s) => s.profile);
  const budgetProgress = useBudgetProgress(month, year);

  const globalSummary = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
  }, [transactions]);

  const recentTxs = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [transactions],
  );

  useEffect(() => {
    Promise.all([loadTransactions(), loadCategories(), loadBudgets(), loadSettings()]);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTransactions(), loadCategories(), loadBudgets()]);
    setRefreshing(false);
  };

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <ThemedText variant="caption">Olá, {profile.name} 👋</ThemedText>
          <ThemedText variant="title">Dashboard</ThemedText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, isWeb && { paddingBottom: 34 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <SummaryCard
          totalIncome={globalSummary.totalIncome}
          totalExpenses={globalSummary.totalExpenses}
          balance={globalSummary.balance}
          monthLabel="Total"
        />

        {budgetProgress.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="subtitle">Orçamentos</ThemedText>
              <Pressable onPress={() => router.push('/(tabs)/budgets')}>
                <ThemedText variant="label" style={{ color: COLORS.primary }}>Ver todos</ThemedText>
              </Pressable>
            </View>
            {budgetProgress.slice(0, 3).map((bp) => (
              <BudgetProgressBar
                key={bp.budget.id}
                progress={bp}
                compact
                onPress={() => router.push('/(tabs)/budgets')}
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle">Recentes</ThemedText>
            <Pressable onPress={() => router.push('/(tabs)/transactions')}>
              <ThemedText variant="label" style={{ color: COLORS.primary }}>Ver todos</ThemedText>
            </Pressable>
          </View>
          <View style={styles.transactionsList}>
            {recentTxs.length === 0 ? (
              <EmptyState icon="inbox" title="Sem transações" subtitle="Regista a tua primeira transação" />
            ) : (
              recentTxs.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  category={categories.find((c) => c.id === tx.categoryId)}
                  onPress={() => router.push({ pathname: '/transaction-form', params: { id: tx.id } })}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Fab onPress={() => router.push('/transaction-form')} />
    </View>
  );
}

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  scroll: { paddingBottom: 100 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  transactionsList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
