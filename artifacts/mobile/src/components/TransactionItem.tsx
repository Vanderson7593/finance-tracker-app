import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { CategoryIcon } from './CategoryIcon';
import { COLORS } from '../../constants/colors';
import { Transaction, Category } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  category: Category | undefined;
  onPress?: () => void;
  onDelete?: () => void;
}

export function TransactionItem({ transaction, category, onPress, onDelete }: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? COLORS.income : COLORS.expense;
  const prefix = isIncome ? '+' : '-';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <CategoryIcon
        icon={category?.icon ?? 'tag'}
        color={category?.color ?? '#ccc'}
        size={44}
      />
      <View style={styles.content}>
        <ThemedText variant="subtitle" numberOfLines={1} style={styles.title}>
          {transaction.title}
        </ThemedText>
        <View style={styles.metaRow}>
          <ThemedText variant="caption">{category?.name ?? 'Sem categoria'}</ThemedText>
          {transaction.recurrence !== 'none' && (
            <View style={styles.recurringBadge}>
              <Feather name="repeat" size={10} color={COLORS.primary} />
            </View>
          )}
          <ThemedText variant="caption" style={styles.date}>
            {formatDate(transaction.date)}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={{ fontSize: 16, fontWeight: '600' as const, color: amountColor }}>
        {prefix}{formatCurrency(transaction.amount)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: COLORS.surface,
  },
  pressed: { opacity: 0.75 },
  content: { flex: 1 },
  title: { fontSize: 15, marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recurringBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 4,
    padding: 2,
  },
  date: { marginLeft: 'auto' },
});
