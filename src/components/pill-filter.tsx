import React from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { COLORS } from '../../constants/colors';

interface PillOption {
  label: string;
  value: string;
}

interface PillFilterProps {
  options: PillOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function PillFilter({ options, selected, onSelect }: PillFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            style={[styles.pill, isSelected && styles.selected]}
            onPress={() => onSelect(opt.value)}
          >
            <ThemedText style={[styles.label, isSelected && styles.selectedLabel]}>{opt.label}</ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  container: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: COLORS.text.secondary,
    lineHeight: 18,
    includeFontPadding: false,
  },
  selectedLabel: { color: '#FFF' },
});
