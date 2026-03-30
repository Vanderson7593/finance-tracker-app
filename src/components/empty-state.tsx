import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { COLORS } from '../../constants/colors';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name={icon as any} size={32} color={COLORS.text.secondary} />
      </View>
      <ThemedText variant="subtitle" style={styles.title}>{title}</ThemedText>
      {subtitle && <ThemedText variant="caption" style={styles.subtitle}>{subtitle}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { textAlign: 'center', color: COLORS.text.secondary, marginBottom: 8 },
  subtitle: { textAlign: 'center', color: COLORS.text.tertiary },
});
