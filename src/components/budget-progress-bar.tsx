import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { CategoryIcon } from './category-icon';
import { Card } from './card';
import { Palette } from '../../constants/colors';
import { useColors } from '../hooks/use-colors';
import { BudgetProgress } from '../types';
import { formatCurrency } from '../lib/formatters';
import { HIDDEN_AMOUNT, useAmountVisibility } from '../hooks/use-amount-visibility';

interface BudgetProgressBarProps {
  progress: BudgetProgress;
  onPress?: () => void;
  compact?: boolean;
}

export function BudgetProgressBar({ progress, onPress, compact = false }: BudgetProgressBarProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { budget, category, spent, percentage, remaining, isOverBudget, isNearLimit } = progress;
  const { showAmounts } = useAmountVisibility();

  const barColor = isOverBudget ? COLORS.expense : isNearLimit ? '#F97316' : COLORS.income;
  const statusLabel = isOverBudget ? 'Excedido' : isNearLimit ? 'Atenção' : 'OK';

  if (compact) {
    return (
      <Card onPress={onPress} style={styles.compactCard} padding={12}>
        <View style={styles.compactRow}>
          <CategoryIcon icon={category.icon} color={category.color} size={32} />
          <View style={styles.compactInfo}>
            <View style={styles.compactTopRow}>
              <ThemedText variant="body" numberOfLines={1} style={styles.compactName}>
                {category.name}
              </ThemedText>
              <ThemedText variant="caption" style={{ color: barColor, fontWeight: '700' as const }}>
                {percentage.toFixed(0)}%
              </ThemedText>
            </View>
            <View style={styles.compactBarContainer}>
              <View
                style={[
                  styles.compactBarFill,
                  { width: `${Math.min(percentage, 100)}%` as any, backgroundColor: barColor },
                ]}
              />
            </View>
            <ThemedText variant="caption" style={styles.compactAmount}>
              <ThemedText variant="caption" style={{ color: COLORS.text.secondary, fontWeight: '600' as const }}>
                {showAmounts ? formatCurrency(spent) : HIDDEN_AMOUNT}
              </ThemedText>
              <ThemedText variant="caption" style={{ color: COLORS.text.tertiary }}>
                {' '}/ {showAmounts ? formatCurrency(budget.amount) : HIDDEN_AMOUNT}
              </ThemedText>
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={onPress} style={styles.card} padding={16}>
      <View style={styles.header}>
        <CategoryIcon icon={category.icon} color={category.color} size={44} />
        <View style={styles.info}>
          <ThemedText variant="subtitle" numberOfLines={1}>
            {category.name}
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

const makeStyles = (COLORS: Palette) => StyleSheet.create({
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

  compactCard: { marginBottom: 8 },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactInfo: { flex: 1, gap: 4 },
  compactTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  compactName: { flex: 1, fontWeight: '600' as const, fontSize: 14 },
  compactBarContainer: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  compactBarFill: { height: 5, borderRadius: 999 },
  compactAmount: { color: COLORS.text.secondary, fontSize: 11 },
});
