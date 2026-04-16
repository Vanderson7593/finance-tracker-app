import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, Modal, Platform, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BudgetProgressBar } from '../../src/components/budget-progress-bar';
import { BudgetForm } from '../../src/features/budgets/budget-form';
import { BudgetCopyModal } from '../../src/features/budgets/budget-copy-modal';
import { MonthSelector } from '../../src/components/month-selector';
import { ThemedText } from '../../src/components/themed-text';
import { EmptyState } from '../../src/components/empty-state';
import { COLORS } from '../../constants/colors';
import { useBudgetStore } from '../../src/store/use-budget-store';
import { useBudgetProgress } from '../../src/hooks/use-finance-data';
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
  const [showCopy, setShowCopy] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);

  const { addBudget, updateBudget, deleteBudget, budgets } = useBudgetStore();
  const budgetProgress = useBudgetProgress(month, year);

  const hasPreviousMonthData = budgets.some(
    (b) => b.year < year || (b.year === year && b.month < month),
  );

  const now = new Date();
  const isAtCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const goToPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goToNextMonth = () => {
    if (isAtCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const translateX = useSharedValue(0);

  const animateSwap = (direction: 1 | -1) => {
    'worklet';
    translateX.value = withTiming(direction * -SCREEN_WIDTH, { duration: 180 }, (finished) => {
      if (!finished) return;
      if (direction === 1) runOnJS(goToNextMonth)();
      else runOnJS(goToPrevMonth)();
      translateX.value = direction * SCREEN_WIDTH;
      translateX.value = withTiming(0, { duration: 220 });
    });
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

  const handleDeleteFromForm = async () => {
    if (!editingBudget) return;
    await deleteBudget(editingBudget.id);
    setShowForm(false);
    setEditingBudget(undefined);
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      const resist = e.translationX < 0 && isAtCurrentMonth ? 0.25 : 1;
      translateX.value = e.translationX * resist;
    })
    .onEnd((e) => {
      const threshold = SCREEN_WIDTH * 0.22;
      if (e.translationX < -threshold && !isAtCurrentMonth) {
        animateSwap(1);
      } else if (e.translationX > threshold) {
        animateSwap(-1);
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 180 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <ThemedText variant="title">Orçamentos</ThemedText>
        <View style={styles.headerActions}>
          {hasPreviousMonthData && (
            <Pressable style={styles.iconBtn} onPress={() => setShowCopy(true)} hitSlop={8}>
              <Feather name="copy" size={18} color={COLORS.text.secondary} />
            </Pressable>
          )}
          <Pressable style={styles.addBtn} onPress={() => { setEditingBudget(undefined); setShowForm(true); }}>
            <Feather name="plus" size={22} color="#FFF" />
          </Pressable>
        </View>
      </View>

      <MonthSelector month={month} year={year} onPrev={goToPrevMonth} onNext={goToNextMonth} />
      <View style={{ height: 8 }} />

      <GestureDetector gesture={swipe}>
        <Animated.View style={[styles.listWrapper, animatedStyle]}>
          <FlatList
            data={budgetProgress}
            keyExtractor={(item) => item.budget.id}
            contentContainerStyle={[styles.list, isWeb && { paddingBottom: 34 }]}
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <EmptyState
                  icon="target"
                  title="Sem orçamentos"
                  subtitle="Define limites de gastos por categoria"
                />
                {hasPreviousMonthData && (
                  <Pressable style={styles.copyEmptyBtn} onPress={() => setShowCopy(true)}>
                    <Feather name="copy" size={16} color={COLORS.primary} />
                    <ThemedText style={styles.copyEmptyLabel}>Copiar do mês anterior</ThemedText>
                  </Pressable>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <BudgetProgressBar
                progress={item}
                onPress={() => { setEditingBudget(item.budget); setShowForm(true); }}
              />
            )}
          />
        </Animated.View>
      </GestureDetector>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <BudgetForm
          initialData={editingBudget}
          month={month}
          year={year}
          onSubmit={handleAddBudget}
          onCancel={() => { setShowForm(false); setEditingBudget(undefined); }}
          onDelete={editingBudget ? handleDeleteFromForm : undefined}
        />
      </Modal>

      <Modal visible={showCopy} animationType="slide" presentationStyle="pageSheet">
        <BudgetCopyModal
          targetMonth={month}
          targetYear={year}
          onClose={() => setShowCopy(false)}
          onCopied={() => setShowCopy(false)}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrapper: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyWrapper: { gap: 16, alignItems: 'center' },
  copyEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary + '14',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  copyEmptyLabel: { color: COLORS.primary, fontWeight: '600' as const, fontSize: 14 },
});
