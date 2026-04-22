import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  addMonths,
  endOfMonth,
  format,
  isFuture,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { ThemedText } from './themed-text';
import { Palette } from '../../constants/colors';
import { useColors } from '../hooks/use-colors';

interface DatePickerModalProps {
  visible: boolean;
  value: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
  maxDate?: Date;
}

const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export function DatePickerModal({ visible, value, onSelect, onClose, maxDate }: DatePickerModalProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const initial = useMemo(() => {
    try { return parseISO(value); } catch { return new Date(); }
  }, [value]);

  const [viewMonth, setViewMonth] = useState(startOfMonth(initial));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    const out: Date[] = [];
    let d = start;
    while (d <= end) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [viewMonth]);

  const today = new Date();
  const yesterday = addDays(today, -1);

  const handleSelect = (d: Date) => {
    if (maxDate && d > maxDate) return;
    onSelect(d.toISOString());
    onClose();
  };

  const isDisabled = (d: Date) => (maxDate ? d > maxDate : false);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="title">Data</ThemedText>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={COLORS.text.secondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.quickRow}>
            <Pressable style={styles.quickChip} onPress={() => handleSelect(today)}>
              <ThemedText style={styles.quickChipLabel}>Hoje</ThemedText>
            </Pressable>
            <Pressable style={styles.quickChip} onPress={() => handleSelect(yesterday)}>
              <ThemedText style={styles.quickChipLabel}>Ontem</ThemedText>
            </Pressable>
            <Pressable style={styles.quickChip} onPress={() => handleSelect(addDays(today, -2))}>
              <ThemedText style={styles.quickChipLabel}>Anteontem</ThemedText>
            </Pressable>
          </View>

          <View style={styles.monthBar}>
            <Pressable hitSlop={8} onPress={() => setViewMonth((m) => addMonths(m, -1))}>
              <Feather name="chevron-left" size={20} color={COLORS.text.secondary} />
            </Pressable>
            <ThemedText variant="subtitle">
              {format(viewMonth, 'MMMM yyyy', { locale: pt })}
            </ThemedText>
            <Pressable
              hitSlop={8}
              onPress={() => setViewMonth((m) => addMonths(m, 1))}
              disabled={maxDate ? isFuture(addMonths(viewMonth, 1)) && addMonths(viewMonth, 1) > maxDate : false}
            >
              <Feather name="chevron-right" size={20} color={COLORS.text.secondary} />
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {WEEKDAYS.map((w, i) => (
              <ThemedText key={i} style={styles.weekday}>{w}</ThemedText>
            ))}
          </View>

          <View style={styles.grid}>
            {days.map((d) => {
              const inMonth = isSameMonth(d, viewMonth);
              const selected = isSameDay(d, initial);
              const isToday = isSameDay(d, today);
              const disabled = isDisabled(d);
              return (
                <Pressable
                  key={d.toISOString()}
                  style={styles.cell}
                  onPress={() => handleSelect(d)}
                  disabled={disabled}
                >
                  <View style={[
                    styles.dayPill,
                    selected && styles.dayPillSelected,
                    !selected && isToday && styles.dayPillToday,
                  ]}>
                    <ThemedText style={[
                      styles.dayLabel,
                      !inMonth && { color: COLORS.text.tertiary },
                      disabled && { color: COLORS.border },
                      selected && { color: '#FFF', fontWeight: '700' as const },
                    ]}>
                      {d.getDate()}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scroll: { padding: 16, paddingBottom: 40 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickChipLabel: { fontSize: 13, fontWeight: '500' as const, color: COLORS.text.primary },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
  },
  weekHeader: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontWeight: '600' as const,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dayPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: { backgroundColor: COLORS.primary },
  dayPillToday: { borderWidth: 1, borderColor: COLORS.primary },
  dayLabel: { fontSize: 14, color: COLORS.text.primary },
});
