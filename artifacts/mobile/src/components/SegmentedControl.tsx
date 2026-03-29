import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import { COLORS } from '../../constants/colors';

interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function SegmentedControl({ options, selected, onSelect }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            style={[styles.segment, isSelected && styles.selected]}
            onPress={() => onSelect(opt.value)}
          >
            <ThemedText style={[styles.label, isSelected && styles.selectedLabel]}>{opt.label}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  selected: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: '500' as const, color: COLORS.text.secondary },
  selectedLabel: { color: COLORS.text.primary, fontWeight: '600' as const },
});
