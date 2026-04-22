import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useColors } from '../hooks/use-colors';
import { formatMonth } from '../lib/formatters';

interface MonthSelectorProps {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthSelector({ month, year, onPrev, onNext }: MonthSelectorProps) {
  const COLORS = useColors();
  const now = new Date();
  const isCurrentOrFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
  return (
    <View style={styles.container}>
      <Pressable style={styles.btn} onPress={onPrev} hitSlop={8}>
        <Feather name="chevron-left" size={20} color={COLORS.text.secondary} />
      </Pressable>
      <ThemedText variant="subtitle" style={styles.label}>{formatMonth(month, year)}</ThemedText>
      <Pressable style={[styles.btn, isCurrentOrFuture && styles.disabled]} onPress={onNext} disabled={isCurrentOrFuture} hitSlop={8}>
        <Feather name="chevron-right" size={20} color={isCurrentOrFuture ? COLORS.border : COLORS.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  btn: { padding: 8 },
  disabled: { opacity: 0.3 },
  label: { minWidth: 160, textAlign: 'center' },
});
