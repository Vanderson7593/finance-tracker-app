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
import { COLORS } from '../constants/colors';
import { useCategoryStore } from '../src/store/use-category-store';
import { Category, TransactionType } from '../src/types';
import { groupCategoriesByParent } from '../src/lib/categories';
import { generateId } from '../src/lib/uuid';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [type, setType] = useState<TransactionType>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();

  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const groupedCategories = useMemo(() => groupCategoriesByParent(categories, type), [categories, type]);

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

    if (category.kind === 'category' && categories.some((item) => item.parentCategoryId === category.id)) {
      Alert.alert('Não permitido', 'Remove ou move as subcategorias antes de eliminar a categoria.');
      return;
    }

    Alert.alert(
      'Eliminar',
      `Eliminar ${category.kind === 'category' ? 'a categoria' : 'a subcategoria'} "${category.name}"?`,
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
        data={groupedCategories}
        keyExtractor={(item) => item.parent.id}
        contentContainerStyle={[styles.list, isWeb && { paddingBottom: 34 }]}
        ListEmptyComponent={
          <EmptyState
            icon="tag"
            title="Sem categorias"
            subtitle="Cria uma categoria principal e as respetivas subcategorias"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.groupCard}>
            <View style={styles.parentRow}>
              <View style={styles.parentInfo}>
                <CategoryIcon icon={item.parent.icon} color={item.parent.color} size={44} />
                <View style={{ flex: 1 }}>
                  <ThemedText variant="body" style={{ fontWeight: '700' as const }}>
                    {item.parent.name}
                  </ThemedText>
                  <ThemedText variant="caption">Categoria principal</ThemedText>
                </View>
              </View>
              {item.parent.isDefault ? (
                <View style={styles.defaultBadge}>
                  <ThemedText style={{ fontSize: 11, color: COLORS.primary }}>padrão</ThemedText>
                </View>
              ) : (
                <View style={styles.actions}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      setEditingCategory(item.parent);
                      setShowForm(true);
                    }}
                  >
                    <Feather name="edit-2" size={18} color={COLORS.text.secondary} />
                  </Pressable>
                  <Pressable hitSlop={8} onPress={() => handleDelete(item.parent)}>
                    <Feather name="trash-2" size={18} color={COLORS.expense} />
                  </Pressable>
                </View>
              )}
            </View>

            {item.subcategories.length === 0 ? (
              <View style={styles.emptySubcategories}>
                <ThemedText variant="caption" style={{ color: COLORS.text.secondary }}>
                  Sem subcategorias
                </ThemedText>
              </View>
            ) : (
              item.subcategories.map((subcategory) => (
                <View key={subcategory.id} style={styles.subcategoryRow}>
                  <View style={styles.subcategoryInfo}>
                    <CategoryIcon icon={subcategory.icon} color={subcategory.color} size={36} />
                    <View style={{ flex: 1 }}>
                      <ThemedText variant="body">{subcategory.name}</ThemedText>
                      <ThemedText variant="caption">Subcategoria</ThemedText>
                    </View>
                  </View>
                  {subcategory.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <ThemedText style={{ fontSize: 11, color: COLORS.primary }}>padrão</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.actions}>
                      <Pressable
                        hitSlop={8}
                        onPress={() => {
                          setEditingCategory(subcategory);
                          setShowForm(true);
                        }}
                      >
                        <Feather name="edit-2" size={18} color={COLORS.text.secondary} />
                      </Pressable>
                      <Pressable hitSlop={8} onPress={() => handleDelete(subcategory)}>
                        <Feather name="trash-2" size={18} color={COLORS.expense} />
                      </Pressable>
                    </View>
                  )}
                </View>
              ))
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

const styles = StyleSheet.create({
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
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  groupCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  parentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  subcategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginLeft: 18,
  },
  subcategoryInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  emptySubcategories: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actions: { flexDirection: 'row', gap: 16, marginLeft: 12 },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.primaryMuted,
    marginLeft: 12,
  },
});
