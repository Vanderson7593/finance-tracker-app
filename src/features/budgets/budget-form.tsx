import React, { useState } from 'react';
import { View, StyleSheet, Pressable, FlatList, Modal } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';
import { FormInput } from '../../components/form-input';
import { CategoryIcon } from '../../components/category-icon';
import { ThemedText } from '../../components/themed-text';
import { COLORS } from '../../../constants/colors';
import { Budget, Category } from '../../types';
import { useCategoryStore } from '../../store/use-category-store';

const schema = z.object({
  amount: z.string().min(1).refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Valor inválido'),
});
type FormData = z.infer<typeof schema>;

interface BudgetFormProps {
  initialData?: Partial<Budget>;
  month: number;
  year: number;
  onSubmit: (data: Omit<Budget, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function BudgetForm({ initialData, month, year, onSubmit, onCancel }: BudgetFormProps) {
  const categories = useCategoryStore((s) => s.categories);
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId ?? '');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: initialData?.amount ? String(initialData.amount) : '' },
  });

  const onFormSubmit = (data: FormData) => {
    if (!categoryId) return;
    onSubmit({ categoryId, amount: parseFloat(data.amount.replace(',', '.')), month, year });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Feather name="x" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="subtitle">{initialData?.id ? 'Editar orçamento' : 'Novo orçamento'}</ThemedText>
        <Pressable onPress={handleSubmit(onFormSubmit)} hitSlop={8}>
          <ThemedText style={{ color: COLORS.primary, fontWeight: '600' as const, fontSize: 16 }}>Guardar</ThemedText>
        </Pressable>
      </View>

      <View style={styles.form}>
        <ThemedText variant="label" style={styles.sectionLabel}>Categoria</ThemedText>
        <Pressable style={styles.selector} onPress={() => setShowCategoryModal(true)}>
          {selectedCategory ? (
            <View style={styles.selectedCategory}>
              <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} size={32} />
              <ThemedText variant="body">{selectedCategory.name}</ThemedText>
            </View>
          ) : (
            <ThemedText style={{ color: COLORS.text.tertiary }}>Selecionar categoria</ThemedText>
          )}
          <Feather name="chevron-right" size={18} color={COLORS.text.tertiary} />
        </Pressable>

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Limite mensal"
              prefix="€"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              placeholder="0,00"
              error={errors.amount?.message}
            />
          )}
        />
      </View>

      <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Categoria</ThemedText>
            <Pressable onPress={() => setShowCategoryModal(false)}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          <FlatList
            data={expenseCategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.categoryRow, categoryId === item.id && { backgroundColor: COLORS.primaryLight + '10' }]}
                onPress={() => { setCategoryId(item.id); setShowCategoryModal(false); }}
              >
                <CategoryIcon icon={item.icon} color={item.color} size={36} />
                <ThemedText variant="body" style={{ flex: 1, marginLeft: 12 }}>{item.name}</ThemedText>
                {categoryId === item.id && <Feather name="check" size={18} color={COLORS.primary} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
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
  form: { padding: 16 },
  sectionLabel: { marginBottom: 8 },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  selectedCategory: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});
