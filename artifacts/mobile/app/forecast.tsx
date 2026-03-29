import React from 'react';
import { View, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from '../src/components/ThemedText';
import { Card } from '../src/components/Card';
import { COLORS } from '../constants/colors';
import { useForecast, useMonthlyTrend, useMonthSummary } from '../src/hooks/useFinanceData';
import { formatCurrency, formatShortMonth, getCurrentMonth } from '../src/lib/formatters';

const screenWidth = Dimensions.get('window').width;

const CHART_CONFIG = {
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: () => COLORS.text.secondary,
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
};

export default function ForecastScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const { month, year } = getCurrentMonth();
  const forecast = useForecast(month, year);
  const trend = useMonthlyTrend(4);
  const summary = useMonthSummary(month, year);

  const projectedMonths = [...trend, {
    month: month + 1 > 12 ? 1 : month + 1,
    year: month + 1 > 12 ? year + 1 : year,
    income: forecast.projectedIncome,
    expenses: forecast.projectedExpenses,
    balance: forecast.projectedBalance,
  }];

  const isGood = forecast.projectedBalance > 0;
  const confidenceLabel = forecast.confidence === 'high' ? 'Alta' : forecast.confidence === 'medium' ? 'Média' : 'Baixa';
  const confidenceColor = forecast.confidence === 'high' ? COLORS.income : forecast.confidence === 'medium' ? COLORS.warning : COLORS.expense;

  const chartWidth = Math.min(screenWidth - 32, 400);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="title">Previsão Financeira</ThemedText>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, isWeb && { paddingBottom: 34 }]}>
        {/* Main forecast card */}
        <Card style={[styles.forecastCard, { borderLeftColor: isGood ? COLORS.income : COLORS.expense, borderLeftWidth: 4 }]} padding={20}>
          <View style={styles.forecastHeader}>
            <View style={[styles.forecastIcon, { backgroundColor: isGood ? COLORS.incomeLight : COLORS.expenseLight }]}>
              <Feather name={isGood ? 'trending-up' : 'trending-down'} size={24} color={isGood ? COLORS.income : COLORS.expense} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <ThemedText variant="caption">Saldo previsto no fim do mês</ThemedText>
              <ThemedText style={{ fontSize: 28, fontWeight: '700' as const, color: isGood ? COLORS.income : COLORS.expense }}>
                {forecast.projectedBalance >= 0 ? '' : '-'}{formatCurrency(Math.abs(forecast.projectedBalance))}
              </ThemedText>
            </View>
          </View>
          <ThemedText variant="body" style={styles.message}>{forecast.message}</ThemedText>
          <View style={styles.confidenceRow}>
            <ThemedText variant="caption">Confiança na previsão:</ThemedText>
            <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '20' }]}>
              <ThemedText style={{ fontSize: 12, color: confidenceColor, fontWeight: '600' as const }}>{confidenceLabel}</ThemedText>
            </View>
          </View>
        </Card>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} padding={16}>
            <Feather name="arrow-down-circle" size={20} color={COLORS.income} />
            <ThemedText variant="caption" style={{ marginTop: 8 }}>Receitas previstas</ThemedText>
            <ThemedText style={{ fontSize: 16, fontWeight: '700' as const, color: COLORS.income }}>
              {formatCurrency(forecast.projectedIncome)}
            </ThemedText>
          </Card>
          <Card style={styles.statCard} padding={16}>
            <Feather name="arrow-up-circle" size={20} color={COLORS.expense} />
            <ThemedText variant="caption" style={{ marginTop: 8 }}>Despesas previstas</ThemedText>
            <ThemedText style={{ fontSize: 16, fontWeight: '700' as const, color: COLORS.expense }}>
              {formatCurrency(forecast.projectedExpenses)}
            </ThemedText>
          </Card>
        </View>

        {/* Progress info */}
        <Card style={{ marginTop: 16 }} padding={16}>
          <ThemedText variant="subtitle" style={{ marginBottom: 12 }}>Estado atual</ThemedText>
          <View style={styles.progressRow}>
            <ThemedText variant="body">Receitas registadas</ThemedText>
            <ThemedText style={{ fontWeight: '600' as const, color: COLORS.income }}>{formatCurrency(summary.totalIncome)}</ThemedText>
          </View>
          <View style={styles.progressRow}>
            <ThemedText variant="body">Despesas registadas</ThemedText>
            <ThemedText style={{ fontWeight: '600' as const, color: COLORS.expense }}>{formatCurrency(summary.totalExpenses)}</ThemedText>
          </View>
          <View style={styles.progressRow}>
            <ThemedText variant="body">Dias restantes</ThemedText>
            <ThemedText style={{ fontWeight: '600' as const }}>{forecast.daysLeft} dias</ThemedText>
          </View>
          <View style={[styles.progressRow, { borderBottomWidth: 0 }]}>
            <ThemedText variant="body">Saldo atual</ThemedText>
            <ThemedText style={{ fontWeight: '700' as const, color: summary.balance >= 0 ? COLORS.income : COLORS.expense }}>
              {formatCurrency(Math.abs(summary.balance))}
            </ThemedText>
          </View>
        </Card>

        {/* Trend chart */}
        <View style={{ marginTop: 24 }}>
          <ThemedText variant="subtitle" style={{ marginBottom: 12 }}>Projeção de saldo</ThemedText>
          <Card padding={12}>
            <LineChart
              data={{
                labels: projectedMonths.map((m) => formatShortMonth(m.month)),
                datasets: [
                  {
                    data: projectedMonths.map((m) => Math.max(m.balance, 0)),
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={chartWidth - 24}
              height={160}
              chartConfig={CHART_CONFIG}
              bezier
              style={{ borderRadius: 12 }}
              withInnerLines={false}
              withOuterLines={false}
            />
          </Card>
          <ThemedText variant="caption" style={styles.chartNote}>
            * O último ponto representa a previsão para o mês atual
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  forecastCard: { marginBottom: 0 },
  forecastHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  forecastIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  message: { color: COLORS.text.secondary, lineHeight: 22, marginBottom: 16 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statCard: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chartNote: { textAlign: 'center', marginTop: 8, color: COLORS.text.tertiary },
});
