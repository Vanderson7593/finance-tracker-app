import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ThemedText } from './themed-text';
import { CategoryIcon } from './category-icon';
import { Card } from './card';
import { COLORS } from '../../constants/colors';
import { BudgetProgress } from '../types';
import { formatCurrency } from '../lib/formatters';

interface BudgetProgressBarProps {
  progress: BudgetProgress;
  onPress?: () => void;
}

export function BudgetProgressBar({ progress, onPress }: BudgetProgressBarProps) {
  const { budget, category, spent, percentage, remaining, isOverBudget, isNearLimit } = progress;

  const barColor = isOverBudget
    ? COLORS.expense
    : isNearLimit
    ? '#F97316'
    : COLORS.income;

  const statusLabel = isOverBudget
    ? 'Excedido!'
    : isNearLimit
    ? 'Atenção'
    : 'OK';

  const statusColor = isOverBudget ? COLORS.expense : isNearLimit ? '#F97316' : COLORS.income;

  return (
    <Card onPress={onPress} style={styles.card} padding={16}>
      <View style={styles.header}>
        <CategoryIcon icon={category.icon} color={category.color} size={40} />
        <View style={styles.info}>
          <ThemedText variant="subtitle">{category.name}</ThemedText>
          <ThemedText variant="caption">
            {formatCurrency(spent)} / {formatCurrency(budget.amount)}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <ThemedText style={{ fontSize: 11, fontWeight: '600' as const, color: statusColor }}>{statusLabel}</ThemedText>
        </View>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${Math.min(percentage, 100)}%` as any, backgroundColor: barColor }]} />
      </View>
      <View style={styles.footer}>
        <ThemedText variant="caption">{percentage.toFixed(0)}% utilizado</ThemedText>
        <ThemedText variant="caption">
          {isOverBudget ? `${formatCurrency(spent - budget.amount)} acima` : `${formatCurrency(remaining)} restante`}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  info: { flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  barContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: { height: 8, borderRadius: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
});
