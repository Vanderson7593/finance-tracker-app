import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, Modal, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CategoryForm } from '../src/features/categories/category-form';
import { CategoryIcon } from '../src/components/category-icon';
import { ThemedText } from '../src/components/themed-text';
import { SegmentedControl } from '../src/components/segmented-control';
import { EmptyState } from '../src/components/empty-state';
import { Palette } from '../constants/colors';
import { useColors } from '../src/hooks/use-colors';
import { useCategoryStore } from '../src/store/use-category-store';
import { Category, TransactionType } from '../src/types';
import { generateId } from '../src/lib/uuid';

export default function CategoriesScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [type, setType] = useState<TransactionType>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();

  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const filtered = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const handleSubmit = async (data: Omit<Category, 'id'>) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
    } else {
      await addCategory({ ...data, id: generateId() });
    }
    setShowForm(false);
    setEditingCategory(undefined);
  };

  const handleDelete = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Não permitido', 'Os itens padrão não podem ser eliminados.');
      return;
    }

    Alert.alert(
      'Eliminar',
      `Eliminar a categoria "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            deleteCategory(category.id);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="title">Categorias</ThemedText>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            setEditingCategory(undefined);
            setShowForm(true);
          }}
        >
          <Feather name="plus" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.segmentWrapper}>
        <SegmentedControl
          options={[{ label: 'Despesas', value: 'expense' }, { label: 'Receitas', value: 'income' }]}
          selected={type}
          onSelect={(value) => setType(value as TransactionType)}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, isWeb && { paddingBottom: 34 }]}
        ListEmptyComponent={
          <EmptyState
            icon="tag"
            title="Sem categorias"
            subtitle="Cria as tuas categorias"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <CategoryIcon icon={item.icon} color={item.color} size={40} />
            <ThemedText variant="body" style={{ flex: 1 }}>{item.name}</ThemedText>
            {item.isDefault ? (
              <View style={styles.defaultBadge}>
                <ThemedText style={{ fontSize: 11, color: COLORS.primary }}>padrão</ThemedText>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setEditingCategory(item);
                    setShowForm(true);
                  }}
                >
                  <Feather name="edit-2" size={18} color={COLORS.text.secondary} />
                </Pressable>
                <Pressable hitSlop={8} onPress={() => handleDelete(item)}>
                  <Feather name="trash-2" size={18} color={COLORS.expense} />
                </Pressable>
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <CategoryForm
          initialData={editingCategory}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(undefined);
          }}
        />
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrapper: { paddingHorizontal: 16, marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actions: { flexDirection: 'row', gap: 14 },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.primaryMuted,
  },
});
