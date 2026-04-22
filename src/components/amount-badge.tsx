import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { useColors } from '../hooks/use-colors';
import { formatCurrency } from '../lib/formatters';
import { TransactionType } from '../types';
import { HIDDEN_AMOUNT, useAmountVisibility } from '../hooks/use-amount-visibility';

interface AmountBadgeProps {
  amount: number;
  type: TransactionType;
  size?: 'sm' | 'md' | 'lg';
}

export function AmountBadge({ amount, type, size = 'md' }: AmountBadgeProps) {
  const COLORS = useColors();
  const isIncome = type === 'income';
  const color = isIncome ? COLORS.income : COLORS.expense;
  const prefix = isIncome ? '+' : '-';
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 20 : 16;
  const { showAmounts } = useAmountVisibility();
  return (
    <View style={[styles.container, { backgroundColor: isIncome ? COLORS.incomeLight : COLORS.expenseLight }]}>
      <ThemedText style={{ fontSize, fontWeight: '600' as const, color }}>
        {showAmounts ? `${prefix}${formatCurrency(amount)}` : `${prefix}${HIDDEN_AMOUNT}`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
