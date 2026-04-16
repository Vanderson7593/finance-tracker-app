import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionItem } from '../../src/components/transaction-item';
import { PillFilter } from '../../src/components/pill-filter';
import { MonthSelector } from '../../src/components/month-selector';
import { ThemedText } from '../../src/components/themed-text';
import { EmptyState } from '../../src/components/empty-state';
import { COLORS } from '../../constants/colors';
import { useTransactionStore } from '../../src/store/use-transaction-store';
import { useCategoryStore } from '../../src/store/use-category-store';
import { getCurrentMonth } from '../../src/lib/formatters';
import { getCategoryDisplayName, isSubcategory } from '../../src/lib/categories';
import * as Haptics from 'expo-haptics';

const TYPE_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Receitas', value: 'income' },
  { label: 'Despesas', value: 'expense' },
];

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [month, setMonth] = useState(getCurrentMonth().month);
  const [year, setYear] = useState(getCurrentMonth().year);
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const transactions = useTransactionStore((s) => s.transactions);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const categories = useCategoryStore((s) => s.categories);

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        const d = new Date(tx.date);
        const matchMonth = d.getMonth() + 1 === month && d.getFullYear() === year;
        const matchType = typeFilter === 'all' || tx.type === typeFilter;
        const matchCat = categoryFilter === 'all' || tx.categoryId === categoryFilter;
        return matchMonth && matchType && matchCat;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, month, year, typeFilter, categoryFilter]);

  const categoryOptions = useMemo(() => {
    const used = new Set(filtered.map((t) => t.categoryId));
    const opts = [{ label: 'Todas', value: 'all' }];
    categories
      .filter((category) => used.has(category.id) && isSubcategory(category))
      .forEach((category) =>
        opts.push({ label: getCategoryDisplayName(category, categories), value: category.id }),
      );
    return opts;
  }, [filtered, categories]);

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', 'Tens a certeza que queres eliminar esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteTransaction(id);
        },
      },
    ]);
  };

  const goToPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goToNextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <ThemedText variant="title">Transações</ThemedText>
        <Pressable style={styles.addBtn} onPress={() => router.push('/transaction-form')}>
          <Feather name="plus" size={22} color="#FFF" />
        </Pressable>
      </View>

      <MonthSelector month={month} year={year} onPrev={goToPrevMonth} onNext={goToNextMonth} />
      <View style={{ height: 8 }} />
      <PillFilter options={TYPE_FILTERS} selected={typeFilter} onSelect={setTypeFilter} />
      {categoryOptions.length > 2 && (
        <PillFilter options={categoryOptions} selected={categoryFilter} onSelect={setCategoryFilter} />
      )}
      <View style={{ height: 8 }} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, isWeb && { paddingBottom: 34 }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState icon="inbox" title="Sem transações" subtitle="Regista uma nova transação" />}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            category={categories.find((c) => c.id === item.categoryId)}
            allCategories={categories}
            onPress={() => router.push({ pathname: '/transaction-form', params: { id: item.id } })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />
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
  list: { paddingBottom: 100 },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 72 },
});
