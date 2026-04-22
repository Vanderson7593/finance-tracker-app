import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, FlatList, Modal } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';
import { FormInput } from '../../components/form-input';
import { SegmentedControl } from '../../components/segmented-control';
import { CategoryIcon } from '../../components/category-icon';
import { ThemedText } from '../../components/themed-text';
import { Palette } from '../../../constants/colors';
import { useColors } from '../../hooks/use-colors';
import { Category, TransactionType } from '../../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../constants';

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
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const [type, setType] = useState<TransactionType>(initialData?.type ?? 'expense');
  const [icon, setIcon] = useState<string>(initialData?.icon ?? 'tag');
  const [color, setColor] = useState<string>(initialData?.color ?? CATEGORY_COLORS[0]!);
  const [showIconModal, setShowIconModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialData?.name ?? '' },
  });

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      name: data.name.trim(),
      icon,
      color,
      type,
      isDefault: initialData?.isDefault,
    });
  };

  const formTitle = initialData?.id ? 'Editar categoria' : 'Nova categoria';

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

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Nome"
              value={value}
              onChangeText={onChange}
              placeholder="Ex: Alimentação"
              error={errors.name?.message}
            />
          )}
        />

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
