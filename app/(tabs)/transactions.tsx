import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { TransactionItem } from '../../src/components/transaction-item';
import { MonthStrip } from '../../src/components/month-strip';
import { ThemedText } from '../../src/components/themed-text';
import { EmptyState } from '../../src/components/empty-state';
import { Fab } from '../../src/components/fab';
import { Palette } from '../../constants/colors';
import { useColors } from '../../src/hooks/use-colors';
import { useTransactionStore } from '../../src/store/use-transaction-store';
import { useCategoryStore } from '../../src/store/use-category-store';
import { useAccountStore } from '../../src/store/use-account-store';
import { useTagStore } from '../../src/store/use-tag-store';
import { getCurrentMonth } from '../../src/lib/formatters';

const TYPE_OPTIONS = [
  { label: 'Todos', value: 'all' as const },
  { label: 'Receitas', value: 'income' as const },
  { label: 'Despesas', value: 'expense' as const },
];

type TypeFilter = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const filterStyles = useMemo(() => makeFilterStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [month, setMonth] = useState(getCurrentMonth().month);
  const [year, setYear] = useState(getCurrentMonth().year);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const transactions = useTransactionStore((s) => s.transactions);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const categories = useCategoryStore((s) => s.categories);
  const accounts = useAccountStore((s) => s.accounts);
  const tags = useTagStore((s) => s.tags);

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        const d = new Date(tx.date);
        const matchMonth = d.getMonth() + 1 === month && d.getFullYear() === year;
        const matchType = typeFilter === 'all' || tx.type === typeFilter;
        const matchCat = categoryFilter === 'all' || tx.categoryId === categoryFilter;
        const matchAcc = accountFilter === 'all' || tx.accountId === accountFilter;
        const matchTag =
          tagFilter === 'all' || (tx.tagIds && tx.tagIds.includes(tagFilter));
        return matchMonth && matchType && matchCat && matchAcc && matchTag;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, month, year, typeFilter, categoryFilter, accountFilter, tagFilter]);

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (accountFilter !== 'all' ? 1 : 0) +
    (tagFilter !== 'all' ? 1 : 0);

  const clearAll = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
    setTagFilter('all');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', 'Tens a certeza que queres eliminar esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          if (Platform.OS !== 'web')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteTransaction(id);
        },
      },
    ]);
  };

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <ThemedText variant="title">Transações</ThemedText>
        <Pressable
          style={styles.iconBtn}
          onPress={() => setShowFilters(true)}
          hitSlop={8}
        >
          <Feather name="sliders" size={18} color={COLORS.text.primary} />
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
            </View>
          )}
        </Pressable>
      </View>

      <MonthStrip
        month={month}
        year={year}
        onChange={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, isWeb && { paddingBottom: 34 }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="inbox"
            title="Sem transações"
            subtitle="Sem registos para os filtros selecionados"
          />
        }
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            category={categories.find((c) => c.id === item.categoryId)}
            onPress={() =>
              router.push({ pathname: '/transaction-form', params: { id: item.id } })
            }
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />

      <Fab onPress={() => router.push('/transaction-form')} />

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={filterStyles.modal}>
          <View style={filterStyles.modalHeader}>
            <Pressable onPress={() => setShowFilters(false)} hitSlop={8}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
            <ThemedText variant="title">Filtros</ThemedText>
            <Pressable onPress={clearAll} hitSlop={8}>
              <ThemedText style={filterStyles.clearTxt}>Limpar</ThemedText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={filterStyles.body}>
            <FilterSection title="Tipo">
              {TYPE_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={typeFilter === opt.value}
                  onPress={() => setTypeFilter(opt.value)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Categoria">
              <FilterChip
                label="Todas"
                active={categoryFilter === 'all'}
                onPress={() => setCategoryFilter('all')}
              />
              {categories.map((c) => (
                <FilterChip
                  key={c.id}
                  label={c.name}
                  color={c.color}
                  active={categoryFilter === c.id}
                  onPress={() => setCategoryFilter(c.id)}
                />
              ))}
            </FilterSection>

            {accounts.length > 0 && (
              <FilterSection title="Conta">
                <FilterChip
                  label="Todas"
                  active={accountFilter === 'all'}
                  onPress={() => setAccountFilter('all')}
                />
                {accounts.map((a) => (
                  <FilterChip
                    key={a.id}
                    label={a.name}
                    color={a.color}
                    active={accountFilter === a.id}
                    onPress={() => setAccountFilter(a.id)}
                  />
                ))}
              </FilterSection>
            )}

            {tags.length > 0 && (
              <FilterSection title="Etiqueta">
                <FilterChip
                  label="Todas"
                  active={tagFilter === 'all'}
                  onPress={() => setTagFilter('all')}
                />
                {tags.map((t) => (
                  <FilterChip
                    key={t.id}
                    label={t.name}
                    color={t.color}
                    active={tagFilter === t.id}
                    onPress={() => setTagFilter(t.id)}
                  />
                ))}
              </FilterSection>
            )}
          </ScrollView>

          <View style={[filterStyles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              style={filterStyles.applyBtn}
              onPress={() => setShowFilters(false)}
            >
              <ThemedText style={filterStyles.applyTxt}>
                Ver {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const COLORS = useColors();
  const filterStyles = useMemo(() => makeFilterStyles(COLORS), [COLORS]);
  return (
    <View style={filterStyles.section}>
      <ThemedText style={filterStyles.sectionTitle}>{title}</ThemedText>
      <View style={filterStyles.chipWrap}>{children}</View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  const COLORS = useColors();
  const filterStyles = useMemo(() => makeFilterStyles(COLORS), [COLORS]);
  const accent = color ?? COLORS.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        filterStyles.chip,
        active && {
          backgroundColor: accent + '14',
          borderColor: accent,
        },
      ]}
    >
      {color && (
        <View style={[filterStyles.chipDot, { backgroundColor: color }]} />
      )}
      <ThemedText
        style={[
          filterStyles.chipLabel,
          { color: active ? accent : COLORS.text.secondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFF',
    lineHeight: 12,
  },
  list: { paddingBottom: 100 },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 72 },
});

const makeFilterStyles = (COLORS: Palette) => StyleSheet.create({
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  clearTxt: { color: COLORS.primary, fontWeight: '600' as const, fontSize: 15 },
  body: { padding: 20, paddingBottom: 120, gap: 4 },
  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { fontSize: 13, fontWeight: '600' as const },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyTxt: { color: '#FFF', fontWeight: '700' as const, fontSize: 15 },
});
