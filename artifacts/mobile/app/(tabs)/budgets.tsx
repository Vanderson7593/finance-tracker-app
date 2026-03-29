import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, Modal, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BudgetProgressBar } from '../../src/components/BudgetProgressBar';
import { BudgetForm } from '../../src/features/budgets/BudgetForm';
import { MonthSelector } from '../../src/components/MonthSelector';
import { ThemedText } from '../../src/components/ThemedText';
import { EmptyState } from '../../src/components/EmptyState';
import { COLORS } from '../../constants/colors';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useBudgetProgress } from '../../src/hooks/useFinanceData';
import { getCurrentMonth } from '../../src/lib/formatters';
import { Budget } from '../../src/types';
import { generateId } from '../../src/lib/uuid';

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [month, setMonth] = useState(getCurrentMonth().month);
  const [year, setYear] = useState(getCurrentMonth().year);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);

  const { addBudget, updateBudget, deleteBudget } = useBudgetStore();
  const budgetProgress = useBudgetProgress(month, year);

  const goToPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goToNextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handleAddBudget = async (data: Omit<Budget, 'id' | 'createdAt'>) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
    } else {
      await addBudget({ ...data, id: generateId(), createdAt: new Date().toISOString() });
    }
    setShowForm(false);
    setEditingBudget(undefined);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', 'Eliminar este orçamento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteBudget(id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <ThemedText variant="title">Orçamentos</ThemedText>
        <Pressable style={styles.addBtn} onPress={() => { setEditingBudget(undefined); setShowForm(true); }}>
          <Feather name="plus" size={22} color="#FFF" />
        </Pressable>
      </View>

      <MonthSelector month={month} year={year} onPrev={goToPrevMonth} onNext={goToNextMonth} />
      <View style={{ height: 8 }} />

      <FlatList
        data={budgetProgress}
        keyExtractor={(item) => item.budget.id}
        contentContainerStyle={[styles.list, isWeb && { paddingBottom: 34 }]}
        ListEmptyComponent={
          <EmptyState icon="target" title="Sem orçamentos" subtitle="Define limites de gastos por categoria" />
        }
        renderItem={({ item }) => (
          <View>
            <BudgetProgressBar
              progress={item}
              onPress={() => { setEditingBudget(item.budget); setShowForm(true); }}
            />
            <Pressable
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.budget.id)}
            >
              <Feather name="trash-2" size={14} color={COLORS.expense} />
            </Pressable>
          </View>
        )}
      />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <BudgetForm
          initialData={editingBudget}
          month={month}
          year={year}
          onSubmit={handleAddBudget}
          onCancel={() => { setShowForm(false); setEditingBudget(undefined); }}
        />
      </Modal>
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
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  deleteBtn: { position: 'absolute', top: 12, right: 12, padding: 4 },
});
