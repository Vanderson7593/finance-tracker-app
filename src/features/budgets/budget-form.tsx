import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';
import { FormInput } from '../../components/form-input';
import { CategoryIcon } from '../../components/category-icon';
import { ThemedText } from '../../components/themed-text';
import { Palette } from '../../../constants/colors';
import { useColors } from '../../hooks/use-colors';
import { Budget } from '../../types';
import { DEFAULT_CURRENCY_SYMBOL } from '../../constants';
import { useCategoryStore } from '../../store/use-category-store';
import { formatAmountInput, parseAmountInput } from '../../lib/formatters';

const schema = z.object({
  amount: z.string().min(1).refine((value) => parseAmountInput(value) > 0, 'Valor inválido'),
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
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const categories = useCategoryStore((s) => s.categories);
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories],
  );
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId ?? '');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const selectedCategory = categories.find((category) => category.id === categoryId);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: initialData?.amount ? formatAmountInput(String(initialData.amount).replace('.', ',')) : '' },
  });

  const onFormSubmit = (data: FormData) => {
    if (!categoryId) {
      Alert.alert('Atenção', 'Seleciona uma categoria');
      return;
    }

    onSubmit({ categoryId, amount: parseAmountInput(data.amount), month, year });
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
              prefix={DEFAULT_CURRENCY_SYMBOL}
              value={value}
              onChangeText={(text) => onChange(formatAmountInput(text))}
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
            <ThemedText variant="title">Categoria</ThemedText>
            <Pressable onPress={() => setShowCategoryModal(false)}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.categoryList}>
            {expenseCategories.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryItem,
                  categoryId === category.id && {
                    backgroundColor: category.color + '12',
                    borderColor: category.color,
                  },
                ]}
                onPress={() => {
                  setCategoryId(category.id);
                  setShowCategoryModal(false);
                }}
              >
                <CategoryIcon icon={category.icon} color={category.color} size={36} />
                <ThemedText variant="body" style={{ flex: 1 }}>{category.name}</ThemedText>
                {categoryId === category.id && <Feather name="check" size={18} color={COLORS.primary} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  categoryList: { padding: 16, paddingBottom: 40, gap: 10 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
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
