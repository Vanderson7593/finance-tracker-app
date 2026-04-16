import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { CategoryIcon } from './category-icon';
import { Card } from './card';
import { COLORS } from '../../constants/colors';
import { BudgetProgress } from '../types';
import { formatCurrency } from '../lib/formatters';
import { HIDDEN_AMOUNT, useAmountVisibility } from '../hooks/use-amount-visibility';
import { useCategoryStore } from '../store/use-category-store';
import { getCategoryDisplayName } from '../lib/categories';

interface BudgetProgressBarProps {
  progress: BudgetProgress;
  onPress?: () => void;
}

export function BudgetProgressBar({ progress, onPress }: BudgetProgressBarProps) {
  const { budget, category, spent, percentage, remaining, isOverBudget, isNearLimit } = progress;
  const { showAmounts } = useAmountVisibility();
  const categories = useCategoryStore((state) => state.categories);

  const barColor = isOverBudget ? COLORS.expense : isNearLimit ? '#F97316' : COLORS.income;
  const statusLabel = isOverBudget ? 'Excedido' : isNearLimit ? 'Atenção' : 'OK';

  return (
    <Card onPress={onPress} style={styles.card} padding={16}>
      <View style={styles.header}>
        <CategoryIcon icon={category.icon} color={category.color} size={44} />
        <View style={styles.info}>
          <ThemedText variant="subtitle" numberOfLines={1}>
            {getCategoryDisplayName(category, categories)}
          </ThemedText>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: barColor }]} />
            <ThemedText variant="caption" style={{ color: barColor, fontWeight: '600' as const }}>
              {statusLabel}
            </ThemedText>
            <ThemedText variant="caption" style={{ color: COLORS.text.tertiary }}>
              · {percentage.toFixed(0)}%
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${Math.min(percentage, 100)}%` as any, backgroundColor: barColor }]} />
      </View>

      <View style={styles.footer}>
        <ThemedText variant="caption" style={styles.amountText}>
          <ThemedText variant="caption" style={{ color: barColor, fontWeight: '600' as const }}>
            {showAmounts ? formatCurrency(spent) : HIDDEN_AMOUNT}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: COLORS.text.tertiary }}>
            {' '}/ {showAmounts ? formatCurrency(budget.amount) : HIDDEN_AMOUNT}
          </ThemedText>
        </ThemedText>
        <ThemedText variant="caption" style={{ color: COLORS.text.secondary }}>
          {isOverBudget
            ? showAmounts
              ? `${formatCurrency(spent - budget.amount)} acima`
              : `${HIDDEN_AMOUNT} acima`
            : showAmounts
              ? `${formatCurrency(remaining)} restantes`
              : `${HIDDEN_AMOUNT} restantes`}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  info: { flex: 1, gap: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  amountText: { color: COLORS.text.secondary },
  barContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: { height: 8, borderRadius: 999 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
