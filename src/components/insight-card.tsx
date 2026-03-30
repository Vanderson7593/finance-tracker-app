import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { Card } from './card';
import { COLORS } from '../../constants/colors';

interface InsightCardProps {
  icon: string;
  iconColor: string;
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function InsightCard({ icon, iconColor, title, value, subtitle, trend }: InsightCardProps) {
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus';
  const trendColor = trend === 'up' ? COLORS.income : trend === 'down' ? COLORS.expense : COLORS.text.tertiary;
  return (
    <Card style={styles.card} padding={16}>
      <View style={[styles.iconBg, { backgroundColor: iconColor + '15' }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <ThemedText variant="caption" style={styles.title}>{title}</ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
      {subtitle && (
        <View style={styles.trendRow}>
          {trend && <Feather name={trendIcon as any} size={12} color={trendColor} />}
          <ThemedText variant="caption" style={{ color: trendColor }}>{subtitle}</ThemedText>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  title: { marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '700' as const, color: COLORS.text.primary, marginBottom: 4 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
