import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Pressable, FlatList, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from './themed-text';
import { Palette } from '../../constants/colors';
import { useColors } from '../hooks/use-colors';
import { SHORT_MONTHS } from '../constants';

interface MonthStripProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  monthsBack?: number;
}

interface Item {
  month: number;
  year: number;
}

const CHIP_WIDTH = 64;
const CHIP_GAP = 6;

export function MonthStrip({ month, year, onChange, monthsBack = 24 }: MonthStripProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }
    return list;
  }, [monthsBack]);

  const selectedIdx = items.findIndex((m) => m.month === month && m.year === year);
  const listRef = useRef<FlatList<Item>>(null);

  const scrollTo = (idx: number) => {
    if (idx < 0) return;
    listRef.current?.scrollToIndex({
      index: Math.max(0, Math.min(idx, items.length - 1)),
      animated: true,
      viewPosition: 0.5,
    });
  };

  useEffect(() => {
    if (selectedIdx >= 0) {
      setTimeout(() => scrollTo(selectedIdx), 60);
    }
  }, []);

  const select = (idx: number) => {
    const it = items[idx];
    if (!it) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    onChange(it.month, it.year);
    scrollTo(idx);
  };

  const canPrev = selectedIdx > 0;
  const canNext = selectedIdx >= 0 && selectedIdx < items.length - 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          hitSlop={10}
          disabled={!canPrev}
          onPress={() => select(selectedIdx - 1)}
          style={({ pressed }) => [
            styles.arrow,
            !canPrev && styles.arrowDisabled,
            pressed && canPrev && styles.arrowPressed,
          ]}
        >
          <Feather
            name="chevron-left"
            size={18}
            color={canPrev ? COLORS.text.secondary : COLORS.border}
          />
        </Pressable>

        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(it) => `${it.year}-${it.month}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          getItemLayout={(_, index) => ({
            length: CHIP_WIDTH + CHIP_GAP,
            offset: (CHIP_WIDTH + CHIP_GAP) * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: false,
              });
            }, 50);
          }}
          renderItem={({ item, index }) => {
            const active = index === selectedIdx;
            const currentYear = new Date().getFullYear();
            const label =
              item.year === currentYear
                ? SHORT_MONTHS[item.month - 1]
                : `${SHORT_MONTHS[item.month - 1]}.${String(item.year).slice(-2)}`;
            return (
              <Pressable
                onPress={() => select(index)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && !active && styles.chipPressed,
                ]}
              >
                <ThemedText style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {label}
                </ThemedText>
                {active && <View style={styles.chipUnderline} />}
              </Pressable>
            );
          }}
        />

        <Pressable
          hitSlop={10}
          disabled={!canNext}
          onPress={() => select(selectedIdx + 1)}
          style={({ pressed }) => [
            styles.arrow,
            !canNext && styles.arrowDisabled,
            pressed && canNext && styles.arrowPressed,
          ]}
        >
          <Feather
            name="chevron-right"
            size={18}
            color={canNext ? COLORS.text.secondary : COLORS.border}
          />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  wrap: { paddingTop: 6, paddingBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  arrow: {
    width: 28,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  arrowPressed: { backgroundColor: COLORS.surfaceVariant },
  arrowDisabled: { opacity: 0.5 },
  list: { paddingHorizontal: 4, gap: CHIP_GAP, alignItems: 'center' },
  chip: {
    width: CHIP_WIDTH,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  chipPressed: { opacity: 0.6 },
  chipActive: {},
  chipLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.text.tertiary,
    textTransform: 'capitalize' as const,
    letterSpacing: 0.2,
  },
  chipLabelActive: {
    color: COLORS.text.primary,
    fontWeight: '700' as const,
  },
  chipUnderline: {
    position: 'absolute',
    bottom: 4,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
