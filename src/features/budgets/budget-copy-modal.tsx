import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import { CategoryIcon } from '../../components/category-icon';
import { EmptyState } from '../../components/empty-state';
import { COLORS } from '../../../constants/colors';
import { Budget } from '../../types';
import { DEFAULT_CURRENCY_SYMBOL } from '../../constants';
import { useBudgetStore } from '../../store/use-budget-store';
import { useCategoryStore } from '../../store/use-category-store';
import { getCategoryDisplayName } from '../../lib/categories';
import { formatMonth } from '../../lib/formatters';
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
        amount: String(b.amount).replace('.', ','),
        selected: true,
      }));
  }, [budgets, previous, existingCategoryIds]);

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [saving, setSaving] = useState(false);

  const toggle = (categoryId: string) => {
    setRows((prev) => prev.map((r) => (r.categoryId === categoryId ? { ...r, selected: !r.selected } : r)));
  };

  const changeAmount = (categoryId: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.categoryId === categoryId ? { ...r, amount: value } : r)));
  };

  const selectedCount = rows.filter((r) => r.selected).length;

  const handleSubmit = async () => {
    if (selectedCount === 0) return;
    const invalid = rows.find((r) => {
      if (!r.selected) return false;
      const parsed = parseFloat(r.amount.replace(',', '.'));
      return isNaN(parsed) || parsed <= 0;
    });
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
          amount: parseFloat(row.amount.replace(',', '.')),
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
              const changed =
                parseFloat(row.amount.replace(',', '.')) !== row.previousAmount && !isNaN(parseFloat(row.amount.replace(',', '.')));
              return (
                <View
                  key={row.categoryId}
                  style={[styles.row, row.selected && styles.rowSelected]}
                >
                  <Pressable
                    onPress={() => toggle(row.categoryId)}
                    hitSlop={8}
                    style={[styles.checkbox, row.selected && styles.checkboxSelected]}
                  >
                    {row.selected && <Feather name="check" size={14} color="#FFF" />}
                  </Pressable>
                  <CategoryIcon icon={category.icon} color={category.color} size={36} />
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" numberOfLines={1}>
                      {getCategoryDisplayName(category, categories)}
                    </ThemedText>
                    {changed && (
                      <ThemedText variant="caption" style={{ color: COLORS.text.tertiary }}>
                        Anterior: {DEFAULT_CURRENCY_SYMBOL} {row.previousAmount.toFixed(2).replace('.', ',')}
                      </ThemedText>
                    )}
                  </View>
                  <View style={[styles.amountInput, !row.selected && styles.amountInputDisabled]}>
                    <ThemedText style={styles.currency}>{DEFAULT_CURRENCY_SYMBOL}</ThemedText>
                    <TextInput
                      value={row.amount}
                      onChangeText={(v) => changeAmount(row.categoryId, v)}
                      keyboardType="decimal-pad"
                      editable={row.selected}
                      style={styles.input}
                      placeholderTextColor={COLORS.text.tertiary}
                    />
                  </View>
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

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowSelected: {
    borderColor: COLORS.primary + '60',
    backgroundColor: COLORS.primary + '08',
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
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountInputDisabled: { opacity: 0.4 },
  currency: { fontSize: 13, color: COLORS.text.secondary },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    paddingVertical: 4,
    textAlign: 'right',
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
