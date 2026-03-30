import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/keyboard-aware-scroll-view-compat';
import { FormInput } from '../../components/form-input';
import { SegmentedControl } from '../../components/segmented-control';
import { CategoryIcon } from '../../components/category-icon';
import { ThemedText } from '../../components/themed-text';
import { COLORS } from '../../../constants/colors';
import { Transaction, TransactionType, RecurrenceType, Category } from '../../types';
import { useCategoryStore } from '../../store/use-category-store';
import { formatDate } from '../../lib/formatters';
import { RECURRENCE_LABELS } from '../../constants';

const schema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  amount: z.string().min(1, 'Valor obrigatório').refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Valor inválido'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TransactionFormProps {
  initialData?: Partial<Transaction>;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceType }[] = [
  { label: 'Nunca', value: 'none' },
  { label: 'Diária', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensal', value: 'monthly' },
  { label: 'Anual', value: 'yearly' },
];

export function TransactionForm({ initialData, onSubmit, onCancel }: TransactionFormProps) {
  const categories = useCategoryStore((s) => s.categories);
  const [type, setType] = useState<TransactionType>(initialData?.type ?? 'expense');
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId ?? '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(initialData?.recurrence ?? 'none');
  const [date, setDate] = useState<string>(initialData?.date ?? new Date().toISOString());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? '',
      amount: initialData?.amount ? String(initialData.amount) : '',
      description: initialData?.description ?? '',
    },
  });

  const handleTypeChange = (val: string) => {
    setType(val as TransactionType);
    setCategoryId('');
  };

  const onFormSubmit = (data: FormData) => {
    if (!categoryId) {
      Alert.alert('Atenção', 'Seleciona uma categoria');
      return;
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit({
      title: data.title,
      amount: parseFloat(data.amount.replace(',', '.')),
      type,
      categoryId,
      date,
      description: data.description,
      recurrence,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Feather name="x" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="subtitle">{initialData?.id ? 'Editar lançamento' : 'Novo lançamento'}</ThemedText>
        <Pressable onPress={handleSubmit(onFormSubmit)} hitSlop={8}>
          <ThemedText style={{ color: COLORS.primary, fontWeight: '600' as const, fontSize: 16 }}>Guardar</ThemedText>
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <SegmentedControl
            options={[{ label: 'Despesa', value: 'expense' }, { label: 'Receita', value: 'income' }]}
            selected={type}
            onSelect={handleTypeChange}
          />
        </View>

        <View style={styles.section}>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Valor"
                prefix="€"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                placeholder="0,00"
                error={errors.amount?.message}
                style={styles.amountInput}
              />
            )}
          />
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Título"
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Supermercado"
                error={errors.title?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Descrição (opcional)"
                value={value}
                onChangeText={onChange}
                placeholder="Notas adicionais..."
                multiline
                numberOfLines={2}
              />
            )}
          />
        </View>

        <View style={styles.section}>
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
        </View>

        <View style={styles.section}>
          <ThemedText variant="label" style={styles.sectionLabel}>Recorrência</ThemedText>
          <Pressable style={styles.selector} onPress={() => setShowRecurrenceModal(true)}>
            <ThemedText variant="body">{RECURRENCE_LABELS[recurrence]}</ThemedText>
            <Feather name="chevron-right" size={18} color={COLORS.text.tertiary} />
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Categoria</ThemedText>
            <Pressable onPress={() => setShowCategoryModal(false)}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.categoryGrid}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.categoryItem, categoryId === item.id && { backgroundColor: item.color + '15', borderColor: item.color }]}
                onPress={() => { setCategoryId(item.id); setShowCategoryModal(false); }}
              >
                <CategoryIcon icon={item.icon} color={item.color} size={40} />
                <ThemedText variant="caption" style={styles.categoryName} numberOfLines={1}>{item.name}</ThemedText>
              </Pressable>
            )}
          />
        </View>
      </Modal>

      {/* Recurrence Modal */}
      <Modal visible={showRecurrenceModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Recorrência</ThemedText>
            <Pressable onPress={() => setShowRecurrenceModal(false)}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          {RECURRENCE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.recurrenceItem, recurrence === opt.value && styles.recurrenceSelected]}
              onPress={() => { setRecurrence(opt.value); setShowRecurrenceModal(false); }}
            >
              <ThemedText variant="body">{opt.label}</ThemedText>
              {recurrence === opt.value && <Feather name="check" size={18} color={COLORS.primary} />}
            </Pressable>
          ))}
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
  scroll: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionLabel: { marginBottom: 8 },
  amountInput: { fontSize: 24, fontWeight: '700' as const },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  categoryGrid: { padding: 16, gap: 12 },
  categoryItem: {
    flex: 1,
    margin: 4,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoryName: { marginTop: 6, textAlign: 'center' },
  recurrenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recurrenceSelected: { backgroundColor: COLORS.primaryLight + '10' },
});
