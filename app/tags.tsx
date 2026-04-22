import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '../src/components/themed-text';
import { EmptyState } from '../src/components/empty-state';
import { Palette } from '../constants/colors';
import { useColors } from '../src/hooks/use-colors';
import { useTagStore } from '../src/store/use-tag-store';
import { Tag } from '../src/types';
import { generateId } from '../src/lib/uuid';
import { TAG_COLORS } from '../src/constants';

export default function TagsScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const { tags, addTag, updateTag, deleteTag } = useTagStore();
  const sorted = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name, 'pt')),
    [tags],
  );

  const [editing, setEditing] = useState<Tag | undefined>();
  const [showForm, setShowForm] = useState(false);

  const openCreate = () => {
    setEditing(undefined);
    setShowForm(true);
  };
  const openEdit = (tag: Tag) => {
    setEditing(tag);
    setShowForm(true);
  };

  const handleSubmit = async (data: Omit<Tag, 'id' | 'createdAt'>) => {
    if (editing) {
      await updateTag(editing.id, data);
    } else {
      await addTag({ ...data, id: generateId(), createdAt: new Date().toISOString() });
    }
    setShowForm(false);
    setEditing(undefined);
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert(
      'Eliminar',
      `Eliminar a etiqueta "${tag.name}"? Será removida dos lançamentos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            deleteTag(tag.id);
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
        <ThemedText variant="title">Etiquetas</ThemedText>
        <Pressable style={styles.addBtn} onPress={openCreate}>
          <Feather name="plus" size={22} color="#FFF" />
        </Pressable>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(t) => t.id}
        contentContainerStyle={[styles.list, isWeb && { paddingBottom: 34 }]}
        ListEmptyComponent={
          <EmptyState
            icon="hash"
            title="Sem etiquetas"
            subtitle="Cria etiquetas para organizar lançamentos"
          />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openEdit(item)}>
            <View style={[styles.swatch, { backgroundColor: item.color }]} />
            <ThemedText variant="body" style={{ flex: 1 }}>
              {item.name}
            </ThemedText>
            <Pressable hitSlop={10} onPress={() => handleDelete(item)}>
              <Feather name="trash-2" size={18} color={COLORS.expense} />
            </Pressable>
          </Pressable>
        )}
      />

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <TagForm
          initialData={editing}
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </View>
  );
}

interface FormProps {
  initialData?: Tag;
  onSubmit: (data: Omit<Tag, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function TagForm({ initialData, onSubmit, onCancel }: FormProps) {
  const COLORS = useColors();
  const formStyles = useMemo(() => makeFormStyles(COLORS), [COLORS]);
  const [name, setName] = useState(initialData?.name ?? '');
  const [color, setColor] = useState<string>(initialData?.color ?? TAG_COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Indica um nome para a etiqueta.');
      return;
    }
    onSubmit({ name: name.trim(), color });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={formStyles.modal}
    >
      <View style={formStyles.modalHeader}>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Feather name="x" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="title">
          {initialData ? 'Editar etiqueta' : 'Nova etiqueta'}
        </ThemedText>
        <Pressable onPress={handleSave} hitSlop={8}>
          <ThemedText style={formStyles.saveTxt}>Guardar</ThemedText>
        </Pressable>
      </View>

      <View style={formStyles.body}>
        <View style={[formStyles.preview, { backgroundColor: color + '1A', borderColor: color }]}>
          <View style={[formStyles.previewDot, { backgroundColor: color }]} />
          <ThemedText style={[formStyles.previewLabel, { color }]}>
            {name.trim() || 'Pré-visualização'}
          </ThemedText>
        </View>

        <ThemedText style={formStyles.label}>Nome</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ex: Viagens"
          placeholderTextColor={COLORS.placeholder}
          style={formStyles.input}
          maxLength={24}
        />

        <ThemedText style={formStyles.label}>Cor</ThemedText>
        <View style={formStyles.colorRow}>
          {TAG_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                formStyles.colorDot,
                { backgroundColor: c },
                color === c && formStyles.colorDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
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
  swatch: { width: 14, height: 14, borderRadius: 7 },
});

const makeFormStyles = (COLORS: Palette) => StyleSheet.create({
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  saveTxt: { color: COLORS.primary, fontWeight: '600' as const, fontSize: 15 },
  body: { padding: 20 },
  preview: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 20,
  },
  previewDot: { width: 8, height: 8, borderRadius: 4 },
  previewLabel: { fontSize: 13, fontWeight: '600' as const },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
    marginTop: 10,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorDotActive: { borderColor: COLORS.text.primary },
});
