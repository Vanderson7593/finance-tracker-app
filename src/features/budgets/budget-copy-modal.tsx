import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import { CategoryIcon } from '../../components/category-icon';
import { EmptyState } from '../../components/empty-state';
import { Palette } from '../../../constants/colors';
import { useColors } from '../../hooks/use-colors';
import { Budget } from '../../types';
import { DEFAULT_CURRENCY_SYMBOL } from '../../constants';
import { useBudgetStore } from '../../store/use-budget-store';
import { useCategoryStore } from '../../store/use-category-store';
import { formatAmountInput, formatMonth, parseAmountInput } from '../../lib/formatters';
import { generateId } from '../../lib/uuid';

interface BudgetCopyModalProps {
  targetMonth: number;
  targetYear: number;
  onClose: () => void;
  onCopied: () => void;
}

interface Row {
  categoryId: string;
  previousAmount: number;
  amount: string;
  selected: boolean;
}

function findPreviousMonthWithBudgets(
  budgets: Budget[],
  targetMonth: number,
  targetYear: number,
): { month: number; year: number } | null {
  let m = targetMonth;
  let y = targetYear;
  for (let i = 0; i < 24; i++) {
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    if (budgets.some((b) => b.month === m && b.year === y)) {
      return { month: m, year: y };
    }
  }
  return null;
}

export function BudgetCopyModal({ targetMonth, targetYear, onClose, onCopied }: BudgetCopyModalProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const budgets = useBudgetStore((s) => s.budgets);
  const addBudget = useBudgetStore((s) => s.addBudget);
  const categories = useCategoryStore((s) => s.categories);

  const previous = useMemo(
    () => findPreviousMonthWithBudgets(budgets, targetMonth, targetYear),
    [budgets, targetMonth, targetYear],
  );

  const existingCategoryIds = useMemo(
    () => new Set(budgets.filter((b) => b.month === targetMonth && b.year === targetYear).map((b) => b.categoryId)),
    [budgets, targetMonth, targetYear],
  );

  const initialRows = useMemo<Row[]>(() => {
    if (!previous) return [];
    return budgets
      .filter((b) => b.month === previous.month && b.year === previous.year)
      .filter((b) => !existingCategoryIds.has(b.categoryId))
      .map((b) => ({
        categoryId: b.categoryId,
        previousAmount: b.amount,
        amount: formatAmountInput(String(b.amount).replace('.', ',')),
        selected: true,
      }));
  }, [budgets, previous, existingCategoryIds]);

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [saving, setSaving] = useState(false);

  const toggle = (categoryId: string) => {
    setRows((prev) => prev.map((r) => (r.categoryId === categoryId ? { ...r, selected: !r.selected } : r)));
  };

  const changeAmount = (categoryId: string, value: string) => {
    const formatted = formatAmountInput(value);
    setRows((prev) => prev.map((r) => (r.categoryId === categoryId ? { ...r, amount: formatted } : r)));
  };

  const selectedCount = rows.filter((r) => r.selected).length;

  const handleSubmit = async () => {
    if (selectedCount === 0) return;
    const invalid = rows.find((r) => r.selected && parseAmountInput(r.amount) <= 0);
    if (invalid) {
      Alert.alert('Valor inválido', 'Verifica os valores selecionados.');
      return;
    }
    setSaving(true);
    try {
      for (const row of rows) {
        if (!row.selected) continue;
        await addBudget({
          id: generateId(),
          categoryId: row.categoryId,
          amount: parseAmountInput(row.amount),
          month: targetMonth,
          year: targetYear,
          createdAt: new Date().toISOString(),
        });
      }
      onCopied();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Feather name="x" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="subtitle">Copiar do mês anterior</ThemedText>
        <View style={{ width: 22 }} />
      </View>

      {!previous || rows.length === 0 ? (
        <EmptyState
          icon="copy"
          title="Nada para copiar"
          subtitle={
            previous
              ? 'Já tens orçamentos para todas as categorias do mês anterior.'
              : 'Não há orçamentos em meses anteriores.'
          }
        />
      ) : (
        <>
          <View style={styles.sourceBanner}>
            <Feather name="calendar" size={14} color={COLORS.text.secondary} />
            <ThemedText variant="caption" style={{ color: COLORS.text.secondary }}>
              A copiar de {formatMonth(previous.month, previous.year)}
            </ThemedText>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {rows.map((row) => {
              const category = categories.find((c) => c.id === row.categoryId);
              if (!category) return null;
              const parsed = parseAmountInput(row.amount);
              const changed = parsed > 0 && parsed !== row.previousAmount;
              return (
                <View
                  key={row.categoryId}
                  style={[styles.row, row.selected && styles.rowSelected]}
                >
                  <View style={styles.rowHeader}>
                    <Pressable
                      onPress={() => toggle(row.categoryId)}
                      hitSlop={8}
                      style={[styles.checkbox, row.selected && styles.checkboxSelected]}
                    >
                      {row.selected && <Feather name="check" size={14} color="#FFF" />}
                    </Pressable>
                    <CategoryIcon icon={category.icon} color={category.color} size={34} />
                    <ThemedText variant="body" style={styles.categoryName} numberOfLines={2}>
                      {category.name}
                    </ThemedText>
                  </View>

                  <View style={[styles.amountBlock, !row.selected && styles.amountInputDisabled]}>
                    <ThemedText style={styles.currency}>{DEFAULT_CURRENCY_SYMBOL}</ThemedText>
                    <TextInput
                      value={row.amount}
                      onChangeText={(v) => changeAmount(row.categoryId, v)}
                      keyboardType="decimal-pad"
                      editable={row.selected}
                      style={styles.input}
                      placeholder="0,00"
                      placeholderTextColor={COLORS.text.tertiary}
                    />
                  </View>

                  {changed && (
                    <View style={styles.previousHint}>
                      <Feather
                        name={parsed > row.previousAmount ? 'arrow-up-right' : 'arrow-down-right'}
                        size={11}
                        color={parsed > row.previousAmount ? COLORS.warning : COLORS.income}
                      />
                      <ThemedText style={styles.previousLabel}>
                        antes {DEFAULT_CURRENCY_SYMBOL} {row.previousAmount.toFixed(2).replace('.', ',')}
                      </ThemedText>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={handleSubmit}
              disabled={selectedCount === 0 || saving}
              style={[styles.submitBtn, (selectedCount === 0 || saving) && styles.submitBtnDisabled]}
            >
              <ThemedText style={styles.submitLabel}>
                {selectedCount === 0 ? 'Seleciona pelo menos um' : `Copiar ${selectedCount} orçamento${selectedCount === 1 ? '' : 's'}`}
              </ThemedText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sourceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowSelected: {
    borderColor: COLORS.primary + '60',
    backgroundColor: COLORS.primary + '08',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryName: {
    flex: 1,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingLeft: 46,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
  },
  amountInputDisabled: { opacity: 0.45 },
  currency: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontWeight: '700' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    paddingBottom: 3,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    letterSpacing: -0.4,
    padding: 0,
    textAlign: 'right',
    includeFontPadding: false,
  },
  previousHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingLeft: 46,
  },
  previousLabel: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: COLORS.border },
  submitLabel: { color: '#FFF', fontWeight: '600' as const, fontSize: 15 },
});
