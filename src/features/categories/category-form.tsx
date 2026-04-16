import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, FlatList, Modal, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';
import { FormInput } from '../../components/form-input';
import { SegmentedControl } from '../../components/segmented-control';
import { CategoryIcon } from '../../components/category-icon';
import { ThemedText } from '../../components/themed-text';
import { COLORS } from '../../../constants/colors';
import { Category, CategoryKind, TransactionType } from '../../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../constants';
import { useCategoryStore } from '../../store/use-category-store';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(30),
});
type FormData = z.infer<typeof schema>;

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: Omit<Category, 'id'>) => void;
  onCancel: () => void;
}

export function CategoryForm({ initialData, onSubmit, onCancel }: CategoryFormProps) {
  const categories = useCategoryStore((s) => s.categories);
  const [type, setType] = useState<TransactionType>(initialData?.type ?? 'expense');
  const [kind, setKind] = useState<CategoryKind>(initialData?.kind ?? 'subcategory');
  const [parentCategoryId, setParentCategoryId] = useState(initialData?.parentCategoryId ?? '');
  const [icon, setIcon] = useState<string>(initialData?.icon ?? 'tag');
  const [color, setColor] = useState<string>(initialData?.color ?? CATEGORY_COLORS[0]!);
  const [showParentModal, setShowParentModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

  const parentCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === type && category.kind === 'category' && category.id !== initialData?.id,
      ),
    [categories, type, initialData?.id],
  );

  const selectedParentCategory = parentCategories.find((category) => category.id === parentCategoryId);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialData?.name ?? '' },
  });

  useEffect(() => {
    if (kind !== 'subcategory') {
      setParentCategoryId('');
      return;
    }

    if (parentCategories.length === 0) {
      setParentCategoryId('');
      return;
    }

    if (!parentCategories.some((category) => category.id === parentCategoryId)) {
      setParentCategoryId(parentCategories[0]?.id ?? '');
    }
  }, [kind, parentCategories, parentCategoryId]);

  const onFormSubmit = (data: FormData) => {
    if (kind === 'subcategory' && !parentCategoryId) {
      Alert.alert('Atenção', 'Seleciona uma categoria principal');
      return;
    }

    onSubmit({
      name: data.name.trim(),
      icon,
      color,
      type,
      kind,
      parentCategoryId: kind === 'subcategory' ? parentCategoryId : undefined,
      isDefault: initialData?.isDefault,
    });
  };

  const formTitle = initialData?.id
    ? initialData.kind === 'category'
      ? 'Editar categoria'
      : 'Editar subcategoria'
    : kind === 'category'
      ? 'Nova categoria'
      : 'Nova subcategoria';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Feather name="x" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="subtitle">{formTitle}</ThemedText>
        <Pressable onPress={handleSubmit(onFormSubmit)} hitSlop={8}>
          <ThemedText style={{ color: COLORS.primary, fontWeight: '600' as const, fontSize: 16 }}>Guardar</ThemedText>
        </Pressable>
      </View>

      <View style={styles.preview}>
        <CategoryIcon icon={icon} color={color} size={64} />
      </View>

      <View style={styles.form}>
        <SegmentedControl
          options={[{ label: 'Despesa', value: 'expense' }, { label: 'Receita', value: 'income' }]}
          selected={type}
          onSelect={(value) => setType(value as TransactionType)}
        />
        <View style={{ height: 16 }} />
        <SegmentedControl
          options={[{ label: 'Categoria', value: 'category' }, { label: 'Subcategoria', value: 'subcategory' }]}
          selected={kind}
          onSelect={(value) => setKind(value as CategoryKind)}
        />
        <View style={{ height: 16 }} />

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Nome"
              value={value}
              onChangeText={onChange}
              placeholder={kind === 'category' ? 'Ex: Alimentação' : 'Ex: Supermercado'}
              error={errors.name?.message}
            />
          )}
        />

        {kind === 'subcategory' && (
          <>
            <ThemedText variant="label" style={styles.sectionLabel}>Categoria principal</ThemedText>
            <Pressable style={styles.selector} onPress={() => setShowParentModal(true)}>
              {selectedParentCategory ? (
                <View style={styles.selectedCategory}>
                  <CategoryIcon
                    icon={selectedParentCategory.icon}
                    color={selectedParentCategory.color}
                    size={32}
                  />
                  <ThemedText variant="body">{selectedParentCategory.name}</ThemedText>
                </View>
              ) : (
                <ThemedText style={{ color: COLORS.text.tertiary }}>
                  {parentCategories.length === 0 ? 'Cria primeiro uma categoria principal' : 'Selecionar categoria principal'}
                </ThemedText>
              )}
              <Feather name="chevron-right" size={18} color={COLORS.text.tertiary} />
            </Pressable>
          </>
        )}

        <ThemedText variant="label" style={styles.sectionLabel}>Ícone</ThemedText>
        <Pressable style={styles.selector} onPress={() => setShowIconModal(true)}>
          <Feather name={icon as any} size={20} color={COLORS.text.primary} />
          <ThemedText variant="body" style={{ flex: 1, marginLeft: 10 }}>{icon}</ThemedText>
          <Feather name="chevron-right" size={18} color={COLORS.text.tertiary} />
        </Pressable>

        <ThemedText variant="label" style={styles.sectionLabel}>Cor</ThemedText>
        <Pressable style={styles.selector} onPress={() => setShowColorModal(true)}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <ThemedText variant="body" style={{ flex: 1, marginLeft: 10 }}>{color}</ThemedText>
          <Feather name="chevron-right" size={18} color={COLORS.text.tertiary} />
        </Pressable>
      </View>

      <Modal visible={showParentModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Categoria principal</ThemedText>
            <Pressable onPress={() => setShowParentModal(false)}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          <FlatList
            data={parentCategories}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ThemedText variant="caption" style={{ color: COLORS.text.secondary }}>
                  Não existem categorias principais para este tipo.
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={[styles.parentRow, parentCategoryId === item.id && styles.parentRowSelected]}
                onPress={() => {
                  setParentCategoryId(item.id);
                  setShowParentModal(false);
                }}
              >
                <CategoryIcon icon={item.icon} color={item.color} size={36} />
                <ThemedText variant="body" style={{ flex: 1, marginLeft: 12 }}>{item.name}</ThemedText>
                {parentCategoryId === item.id && <Feather name="check" size={18} color={COLORS.primary} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showIconModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Escolher ícone</ThemedText>
            <Pressable onPress={() => setShowIconModal(false)}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          <FlatList
            data={CATEGORY_ICONS}
            keyExtractor={(item) => item}
            numColumns={5}
            contentContainerStyle={styles.iconGrid}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.iconCell, icon === item && { backgroundColor: color + '20', borderColor: color }]}
                onPress={() => {
                  setIcon(item);
                  setShowIconModal(false);
                }}
              >
                <Feather name={item as any} size={22} color={icon === item ? color : COLORS.text.secondary} />
              </Pressable>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showColorModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Escolher cor</ThemedText>
            <Pressable onPress={() => setShowColorModal(false)}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          <FlatList
            data={CATEGORY_COLORS}
            keyExtractor={(item) => item}
            numColumns={5}
            contentContainerStyle={styles.iconGrid}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.colorCell, { backgroundColor: item }, color === item && styles.colorSelected]}
                onPress={() => {
                  setColor(item);
                  setShowColorModal(false);
                }}
              >
                {color === item && <Feather name="check" size={18} color="#FFF" />}
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
  preview: { alignItems: 'center', paddingVertical: 24 },
  form: { paddingHorizontal: 16 },
  sectionLabel: { marginBottom: 8, marginTop: 8 },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  selectedCategory: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  emptyState: { padding: 24, alignItems: 'center' },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  parentRowSelected: {
    backgroundColor: COLORS.primaryLight + '10',
  },
  iconGrid: { padding: 16 },
  iconCell: {
    flex: 1,
    margin: 6,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  colorCell: { flex: 1, margin: 6, aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#FFF' },
});
