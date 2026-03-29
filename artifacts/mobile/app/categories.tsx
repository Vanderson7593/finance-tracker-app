import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, Modal, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CategoryForm } from '../src/features/categories/CategoryForm';
import { CategoryIcon } from '../src/components/CategoryIcon';
import { ThemedText } from '../src/components/ThemedText';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { EmptyState } from '../src/components/EmptyState';
import { COLORS } from '../constants/colors';
import { useCategoryStore } from '../src/store/useCategoryStore';
import { Category, TransactionType } from '../src/types';
import { generateId } from '../src/lib/uuid';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [type, setType] = useState<TransactionType>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();

  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const filtered = categories.filter((c) => c.type === type);

  const handleSubmit = async (data: Omit<Category, 'id'>) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
    } else {
      await addCategory({ ...data, id: generateId() });
    }
    setShowForm(false);
    setEditingCategory(undefined);
  };

  const handleDelete = (cat: Category) => {
    if (cat.isDefault) {
      Alert.alert('Não permitido', 'As categorias padrão não podem ser eliminadas.');
      return;
    }
    Alert.alert('Eliminar', `Eliminar a categoria "${cat.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteCategory(cat.id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="title">Categorias</ThemedText>
        <Pressable style={styles.addBtn} onPress={() => { setEditingCategory(undefined); setShowForm(true); }}>
          <Feather name="plus" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.segmentWrapper}>
        <SegmentedControl
          options={[{ label: 'Despesas', value: 'expense' }, { label: 'Receitas', value: 'income' }]}
          selected={type}
          onSelect={(v) => setType(v as TransactionType)}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, isWeb && { paddingBottom: 34 }]}
        ListEmptyComponent={<EmptyState icon="tag" title="Sem categorias" subtitle="Cria a tua primeira categoria" />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <CategoryIcon icon={item.icon} color={item.color} size={44} />
            <ThemedText variant="body" style={{ flex: 1 }}>{item.name}</ThemedText>
            {item.isDefault ? (
              <View style={styles.defaultBadge}>
                <ThemedText style={{ fontSize: 11, color: COLORS.primary }}>padrão</ThemedText>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable hitSlop={8} onPress={() => { setEditingCategory(item); setShowForm(true); }}>
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
          onCancel={() => { setShowForm(false); setEditingCategory(undefined); }}
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
  list: { paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  actions: { flexDirection: 'row', gap: 16 },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.primaryMuted,
  },
});
