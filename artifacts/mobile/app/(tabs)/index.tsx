import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SummaryCard } from '../../src/components/SummaryCard';
import { TransactionItem } from '../../src/components/TransactionItem';
import { MonthSelector } from '../../src/components/MonthSelector';
import { BudgetProgressBar } from '../../src/components/BudgetProgressBar';
import { ThemedText } from '../../src/components/ThemedText';
import { EmptyState } from '../../src/components/EmptyState';
import { COLORS } from '../../constants/colors';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useCategoryStore } from '../../src/store/useCategoryStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useMonthSummary, useBudgetProgress } from '../../src/hooks/useFinanceData';
import { formatMonth } from '../../src/lib/formatters';
import { getCurrentMonth } from '../../src/lib/formatters';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [month, setMonth] = useState(getCurrentMonth().month);
  const [year, setYear] = useState(getCurrentMonth().year);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const loadBudgets = useBudgetStore((s) => s.loadBudgets);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const profile = useSettingsStore((s) => s.profile);
  const summary = useMonthSummary(month, year);
  const budgetProgress = useBudgetProgress(month, year);

  const recentTxs = transactions
    .filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  useEffect(() => {
    Promise.all([loadTransactions(), loadCategories(), loadBudgets(), loadSettings()]);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTransactions(), loadCategories(), loadBudgets()]);
    setRefreshing(false);
  };

  const goToPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <ThemedText variant="caption">Olá, {profile.name} 👋</ThemedText>
          <ThemedText variant="title">Dashboard</ThemedText>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/transaction-form')}
        >
          <Feather name="plus" size={22} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, isWeb && { paddingBottom: 34 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <MonthSelector month={month} year={year} onPrev={goToPrevMonth} onNext={goToNextMonth} />
        <View style={{ height: 12 }} />
        <SummaryCard
          totalIncome={summary.totalIncome}
          totalExpenses={summary.totalExpenses}
          balance={summary.balance}
          monthLabel={formatMonth(month, year)}
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
              <BudgetProgressBar key={bp.budget.id} progress={bp} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
