import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { ThemedText } from '../../src/components/ThemedText';
import { MonthSelector } from '../../src/components/MonthSelector';
import { InsightCard } from '../../src/components/InsightCard';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { Card } from '../../src/components/Card';
import { COLORS } from '../../constants/colors';
import { useCategorySpending, useMonthSummary, useMonthlyTrend } from '../../src/hooks/useFinanceData';
import { formatCurrency, formatShortMonth, getCurrentMonth } from '../../src/lib/formatters';

const screenWidth = Dimensions.get('window').width;

const CHART_CONFIG = {
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: () => COLORS.text.secondary,
  style: { borderRadius: 12 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
};

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [month, setMonth] = useState(getCurrentMonth().month);
  const [year, setYear] = useState(getCurrentMonth().year);

  const summary = useMonthSummary(month, year);
  const categorySpending = useCategorySpending(month, year);
  const monthlyTrend = useMonthlyTrend(6);

  const goToPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goToNextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const topCategory = categorySpending[0];
  const prevMonth = monthlyTrend[monthlyTrend.length - 2];
  const currMonth = monthlyTrend[monthlyTrend.length - 1];
  const expenseVariation =
    prevMonth && prevMonth.expenses > 0
      ? ((currMonth?.expenses ?? 0) - prevMonth.expenses) / prevMonth.expenses * 100
      : 0;

  const avgExpenses = monthlyTrend.length > 0
    ? monthlyTrend.reduce((s, m) => s + m.expenses, 0) / monthlyTrend.length
    : 0;

  const barChartData = {
    labels: monthlyTrend.map((m) => formatShortMonth(m.month)),
    datasets: [
      { data: monthlyTrend.map((m) => m.income), color: () => COLORS.income },
      { data: monthlyTrend.map((m) => m.expenses), color: () => COLORS.expense },
    ],
    legend: ['Receitas', 'Despesas'],
  };

  const pieData = categorySpending.slice(0, 6).map((cs) => ({
    name: cs.category.name,
    population: cs.total,
    color: cs.category.color,
    legendFontColor: COLORS.text.secondary,
    legendFontSize: 12,
  }));

  const chartWidth = Math.min(screenWidth - 32, 400);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <ThemedText variant="title">Relatórios</ThemedText>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, isWeb && { paddingBottom: 34 }]}>
        <MonthSelector month={month} year={year} onPrev={goToPrevMonth} onNext={goToNextMonth} />
        <View style={{ height: 16 }} />

        {/* Insights */}
        <View style={styles.insightRow}>
          <InsightCard
            icon="trending-down"
            iconColor={COLORS.expense}
            title="Maior gasto"
            value={topCategory ? topCategory.category.name : 'N/A'}
            subtitle={topCategory ? formatCurrency(topCategory.total) : undefined}
          />
          <View style={{ width: 12 }} />
          <InsightCard
            icon="activity"
            iconColor={COLORS.primary}
            title="Variação mensal"
            value={expenseVariation !== 0 ? `${expenseVariation > 0 ? '+' : ''}${expenseVariation.toFixed(1)}%` : '0%'}
            subtitle="vs mês anterior"
            trend={expenseVariation > 0 ? 'down' : 'up'}
          />
        </View>
        <View style={{ height: 12 }} />
        <View style={styles.insightRow}>
          <InsightCard
            icon="bar-chart-2"
            iconColor={COLORS.warning}
            title="Média de despesas"
            value={formatCurrency(avgExpenses)}
            subtitle="últimos 6 meses"
          />
          <View style={{ width: 12 }} />
          <InsightCard
            icon="check-circle"
            iconColor={COLORS.income}
            title="Taxa de poupança"
            value={summary.totalIncome > 0 ? `${((summary.balance / summary.totalIncome) * 100).toFixed(0)}%` : 'N/A'}
            subtitle="do rendimento"
            trend={summary.balance > 0 ? 'up' : 'down'}
          />
        </View>

        {/* Monthly trend chart */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>Evolução mensal</ThemedText>
          {monthlyTrend.some((m) => m.income > 0 || m.expenses > 0) ? (
            <Card padding={12}>
              <LineChart
                data={{
                  labels: monthlyTrend.map((m) => formatShortMonth(m.month)),
                  datasets: [
                    { data: monthlyTrend.map((m) => m.income || 0), color: () => COLORS.income, strokeWidth: 2 },
                    { data: monthlyTrend.map((m) => m.expenses || 0), color: () => COLORS.expense, strokeWidth: 2 },
                  ],
                  legend: ['Receitas', 'Despesas'],
                }}
                width={chartWidth - 24}
                height={180}
                chartConfig={CHART_CONFIG}
                bezier
                style={{ borderRadius: 12 }}
                withInnerLines={false}
                withOuterLines={false}
              />
            </Card>
          ) : (
            <ThemedText variant="caption" style={{ textAlign: 'center', color: COLORS.text.tertiary }}>
              Sem dados suficientes
            </ThemedText>
          )}
        </View>

        {/* Category breakdown */}
        {categorySpending.length > 0 && (
          <View style={styles.section}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>Por categoria</ThemedText>
            {pieData.length > 0 && (
              <Card padding={12} style={styles.chartCard}>
                <PieChart
                  data={pieData}
                  width={chartWidth - 24}
                  height={180}
                  chartConfig={CHART_CONFIG}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="16"
                  hasLegend
                />
              </Card>
            )}
            <View style={styles.categoryList}>
              {categorySpending.map((cs) => (
                <View key={cs.categoryId} style={styles.categoryRow}>
                  <CategoryIcon icon={cs.category.icon} color={cs.category.color} size={36} />
                  <View style={styles.categoryInfo}>
                    <ThemedText variant="body">{cs.category.name}</ThemedText>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${cs.percentage}%` as any, backgroundColor: cs.category.color }]} />
                    </View>
                  </View>
                  <View style={styles.categoryAmounts}>
                    <ThemedText variant="body" style={{ fontWeight: '600' as const }}>
                      {formatCurrency(cs.total)}
                    </ThemedText>
                    <ThemedText variant="caption">{cs.percentage.toFixed(1)}%</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  insightRow: { flexDirection: 'row' },
  section: { marginTop: 24 },
  sectionTitle: { marginBottom: 12 },
  chartCard: { alignItems: 'center' },
  categoryList: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryInfo: { flex: 1 },
  barBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  categoryAmounts: { alignItems: 'flex-end' },
});
