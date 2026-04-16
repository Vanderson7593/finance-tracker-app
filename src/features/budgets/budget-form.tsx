import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';
import { FormInput } from '../../components/form-input';
import { CategoryIcon } from '../../components/category-icon';
import { ThemedText } from '../../components/themed-text';
import { COLORS } from '../../../constants/colors';
import { Budget } from '../../types';
import { DEFAULT_CURRENCY_SYMBOL } from '../../constants';
import { useCategoryStore } from '../../store/use-category-store';
import { getParentCategory, groupCategoriesByParent } from '../../lib/categories';

const schema = z.object({
  amount: z.string().min(1).refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, 'Valor inválido'),
});
type FormData = z.infer<typeof schema>;

interface BudgetFormProps {
  initialData?: Partial<Budget>;
  month: number;
  year: number;
  onSubmit: (data: Omit<Budget, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function BudgetForm({ initialData, month, year, onSubmit, onCancel, onDelete }: BudgetFormProps) {
  const categories = useCategoryStore((s) => s.categories);
  const groupedCategories = useMemo(() => groupCategoriesByParent(categories, 'expense'), [categories]);
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId ?? '');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const selectedParentCategory = getParentCategory(selectedCategory, categories);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: initialData?.amount ? String(initialData.amount) : '' },
  });

  const onFormSubmit = (data: FormData) => {
    if (!categoryId) {
      Alert.alert('Atenção', 'Seleciona uma subcategoria');
      return;
    }

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
        <ThemedText variant="label" style={styles.sectionLabel}>Subcategoria</ThemedText>
        <Pressable style={styles.selector} onPress={() => setShowCategoryModal(true)}>
          {selectedCategory ? (
            <View style={styles.selectedCategory}>
              <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} size={32} />
              <View>
                <ThemedText variant="body">{selectedCategory.name}</ThemedText>
                {selectedParentCategory && (
                  <ThemedText variant="caption" style={{ color: COLORS.text.secondary }}>
                    {selectedParentCategory.name}
                  </ThemedText>
                )}
              </View>
            </View>
          ) : (
            <ThemedText style={{ color: COLORS.text.tertiary }}>Selecionar subcategoria</ThemedText>
          )}
          <Feather name="chevron-right" size={18} color={COLORS.text.tertiary} />
        </Pressable>

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Limite mensal"
              prefix={DEFAULT_CURRENCY_SYMBOL}
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              placeholder="0,00"
              error={errors.amount?.message}
            />
          )}
        />

        {initialData?.id && onDelete && (
          <Pressable
            style={styles.deleteBtn}
            onPress={() =>
              Alert.alert('Eliminar', 'Eliminar este orçamento?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: onDelete },
              ])
            }
          >
            <Feather name="trash-2" size={18} color={COLORS.expense} />
            <ThemedText style={styles.deleteLabel}>Eliminar orçamento</ThemedText>
          </Pressable>
        )}
      </View>

      <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Subcategoria</ThemedText>
            <Pressable onPress={() => setShowCategoryModal(false)}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.categoryGroups}>
            {groupedCategories.map((group) => (
              <View key={group.parent.id} style={styles.categoryGroup}>
                <View style={styles.groupHeader}>
                  <CategoryIcon icon={group.parent.icon} color={group.parent.color} size={32} />
                  <ThemedText variant="subtitle">{group.parent.name}</ThemedText>
                </View>
                {group.subcategories.map((subcategory) => (
                  <Pressable
                    key={subcategory.id}
                    style={[
                      styles.subcategoryItem,
                      categoryId === subcategory.id && {
                        backgroundColor: subcategory.color + '12',
                        borderColor: subcategory.color,
                      },
                    ]}
                    onPress={() => {
                      setCategoryId(subcategory.id);
                      setShowCategoryModal(false);
                    }}
                  >
                    <CategoryIcon icon={subcategory.icon} color={subcategory.color} size={36} />
                    <ThemedText variant="body" style={{ flex: 1 }}>{subcategory.name}</ThemedText>
                    {categoryId === subcategory.id && <Feather name="check" size={18} color={COLORS.primary} />}
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
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
  categoryGroups: { padding: 16, paddingBottom: 40 },
  categoryGroup: { marginBottom: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.expense + '40',
    backgroundColor: COLORS.expense + '10',
  },
  deleteLabel: { color: COLORS.expense, fontSize: 15, fontWeight: '600' as const },
});
