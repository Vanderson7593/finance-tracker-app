import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../lib/formatters';

interface SummaryCardProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  currency?: string;
  monthLabel: string;
}

export function SummaryCard({ totalIncome, totalExpenses, balance, currency = 'EUR', monthLabel }: SummaryCardProps) {
  const isNegative = balance < 0;
  return (
    <LinearGradient
      colors={isNegative ? ['#1E293B', '#334155'] : [COLORS.primaryDark, COLORS.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <ThemedText style={styles.label}>{monthLabel}</ThemedText>
        <View style={styles.icon}>
          <Feather name="trending-up" size={16} color="rgba(255,255,255,0.6)" />
        </View>
      </View>
      <ThemedText style={styles.balance}>
        {isNegative ? '-' : ''}{formatCurrency(Math.abs(balance), currency)}
      </ThemedText>
      <ThemedText style={styles.balanceLabel}>Saldo do mês</ThemedText>
      <View style={styles.row}>
        <View style={styles.stat}>
          <View style={styles.statIcon}>
            <Feather name="arrow-down-circle" size={14} color={COLORS.incomeLight} />
          </View>
          <View>
            <ThemedText style={styles.statLabel}>Receitas</ThemedText>
            <ThemedText style={styles.statAmount}>{formatCurrency(totalIncome, currency)}</ThemedText>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <View style={[styles.statIcon, styles.expenseIcon]}>
            <Feather name="arrow-up-circle" size={14} color={COLORS.expenseLight} />
          </View>
          <View>
            <ThemedText style={styles.statLabel}>Despesas</ThemedText>
            <ThemedText style={styles.statAmount}>{formatCurrency(totalExpenses, currency)}</ThemedText>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const },
  icon: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 6 },
  balance: { fontSize: 38, fontWeight: '700' as const, color: '#FFF', letterSpacing: -1, marginBottom: 4 },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statIcon: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 8, padding: 4 },
  expenseIcon: { backgroundColor: 'rgba(239,68,68,0.15)' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  statAmount: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
  divider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16 },
});
