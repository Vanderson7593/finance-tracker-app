import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Dimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../../src/components/themed-text';
import { MonthStrip } from '../../src/components/month-strip';
import { InsightCard } from '../../src/components/insight-card';
import { CategoryIcon } from '../../src/components/category-icon';
import { Card } from '../../src/components/card';
import { SummaryCard } from '../../src/components/summary-card';
import { Palette } from '../../constants/colors';
import { useColors } from '../../src/hooks/use-colors';
import { HIDDEN_AMOUNT, useAmountVisibility } from '../../src/hooks/use-amount-visibility';
import {
  useCategorySpending,
  useMonthSummary,
  useMonthlyTrend,
  useMonthTransactions,
  useAllAccountBalances,
} from '../../src/hooks/use-finance-data';
import { useTransactionStore } from '../../src/store/use-transaction-store';
import { useAccountStore } from '../../src/store/use-account-store';
import { useCategoryStore } from '../../src/store/use-category-store';
import { formatCurrency, formatMonth, formatShortMonth, getCurrentMonth } from '../../src/lib/formatters';
import { ReorderModal, ReorderEntry } from '../../src/components/reorder-modal';
import { useReportOrder } from '../../src/hooks/use-report-order';

const screenWidth = Dimensions.get('window').width;
const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ReportsScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const CHART_CONFIG = useMemo(() => ({
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: () => COLORS.text.secondary,
    style: { borderRadius: 12 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
  }), [COLORS]);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [month, setMonth] = useState(getCurrentMonth().month);
  const [year, setYear] = useState(getCurrentMonth().year);
  const [showReorder, setShowReorder] = useState(false);
  const { order, saveOrder } = useReportOrder();

  const summary = useMonthSummary(month, year);
  const categorySpending = useCategorySpending(month, year);
  const monthlyTrend = useMonthlyTrend(6);
  const monthTxs = useMonthTransactions(month, year);
  const accountBalances = useAllAccountBalances();
  const allTransactions = useTransactionStore((s) => s.transactions);
  const accounts = useAccountStore((s) => s.accounts);
  const categories = useCategoryStore((s) => s.categories);
  const { showAmounts } = useAmountVisibility();

  const chartWidth = Math.min(screenWidth - 32, 400);

  // ── Existing derived data ──────────────────────────────────────────────────
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

  const pieData = categorySpending.slice(0, 6).map((cs) => ({
    name: cs.category.name,
    population: cs.total,
    color: cs.category.color,
    legendFontColor: COLORS.text.secondary,
    legendFontSize: 12,
  }));

  // ── 1. Top 5 transações do mês ─────────────────────────────────────────────
  const top5Txs = useMemo(() =>
    monthTxs
      .filter((t) => t.type === 'expense' && !t.transferId)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
    [monthTxs]);

  // ── 2. Receitas vs Despesas YTD ────────────────────────────────────────────
  const ytdData = useMemo(() => {
    const now = new Date();
    const lastMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12;
    const months = [];
    for (let m = 1; m <= lastMonth; m++) {
      const txs = allTransactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === m && d.getFullYear() === year && !t.transferId;
      });
      months.push({
        month: m,
        income: txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expenses: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [allTransactions, year]);

  const ytdIncome = ytdData.reduce((s, m) => s + m.income, 0);
  const ytdExpenses = ytdData.reduce((s, m) => s + m.expenses, 0);

  // ── 3. Saldo acumulado por conta (últimos 6 meses) ─────────────────────────
  const accountBalanceHistory = useMemo(() => {
    const now = new Date();
    const last6: { m: number; y: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6.push({ m: d.getMonth() + 1, y: d.getFullYear() });
    }
    return accounts.slice(0, 3).map((account) => ({
      account,
      balances: last6.map(({ m, y }) => {
        const txs = allTransactions.filter((t) => {
          const d = new Date(t.date);
          const txM = d.getMonth() + 1;
          const txY = d.getFullYear();
          return t.accountId === account.id &&
            (txY < y || (txY === y && txM <= m));
        });
        const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        return Math.max(0, account.initialBalance + income - expenses);
      }),
    }));
  }, [accounts, allTransactions]);

  // ── 4. Dias com mais gastos ────────────────────────────────────────────────
  const expensesByDow = useMemo(() => {
    const sums = Array(7).fill(0);
    monthTxs
      .filter((t) => t.type === 'expense' && !t.transferId)
      .forEach((t) => {
        sums[new Date(t.date).getDay()] += t.amount;
      });
    return sums;
  }, [monthTxs]);

  const maxDow = Math.max(...expensesByDow, 1);

  // ── 5. Distribuição de gastos por conta ────────────────────────────────────
  const spendingByAccount = useMemo(() => {
    const map = new Map<string, number>();
    monthTxs
      .filter((t) => t.type === 'expense' && !t.transferId)
      .forEach((t) => map.set(t.accountId, (map.get(t.accountId) ?? 0) + t.amount));
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([accountId, amount]) => ({
        account: accounts.find((a) => a.id === accountId),
        amount,
        pct: total > 0 ? (amount / total) * 100 : 0,
      }))
      .filter((x) => x.account)
      .sort((a, b) => b.amount - a.amount);
  }, [monthTxs, accounts]);

  const accountPieData = spendingByAccount.map((x) => ({
    name: x.account!.name,
    population: x.amount,
    color: x.account!.color,
    legendFontColor: COLORS.text.secondary,
    legendFontSize: 12,
  }));

  // ── Section header ─────────────────────────────────────────────────────────
  const SectionTitle = ({ title }: { title: string }) => (
    <ThemedText variant="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <ThemedText variant="title">Relatórios</ThemedText>
        <Pressable
          onPress={() => setShowReorder(true)}
          style={[styles.editBtn, { backgroundColor: COLORS.surfaceVariant }]}
        >
          <Feather name="sliders" size={15} color={COLORS.text.secondary} />
          <ThemedText style={[styles.editBtnText, { color: COLORS.text.secondary }]}>Organizar</ThemedText>
        </Pressable>
      </View>

      <MonthStrip month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, isWeb && { paddingBottom: 34 }]}
      >

        {/* Summary */}
        <View style={styles.summaryWrap}>
          <SummaryCard
            totalIncome={summary.totalIncome}
            totalExpenses={summary.totalExpenses}
            balance={summary.balance}
            monthLabel={formatMonth(month, year)}
          />
        </View>

        {/* Insights */}
        <View style={styles.insightRow}>
          <InsightCard icon="trending-down" iconColor={COLORS.expense} title="Maior gasto"
            value={topCategory ? topCategory.category.name : 'N/A'}
            subtitle={topCategory ? (showAmounts ? formatCurrency(topCategory.total) : HIDDEN_AMOUNT) : undefined} />
          <View style={{ width: 12 }} />
          <InsightCard icon="activity" iconColor={COLORS.primary} title="Variação mensal"
            value={expenseVariation !== 0 ? `${expenseVariation > 0 ? '+' : ''}${expenseVariation.toFixed(1)}%` : '0%'}
            subtitle="vs mês anterior" trend={expenseVariation > 0 ? 'down' : 'up'} />
        </View>
        <View style={{ height: 12 }} />
        <View style={styles.insightRow}>
          <InsightCard icon="bar-chart-2" iconColor={COLORS.warning} title="Média de despesas"
            value={showAmounts ? formatCurrency(avgExpenses) : HIDDEN_AMOUNT} subtitle="últimos 6 meses" />
          <View style={{ width: 12 }} />
          <InsightCard icon="check-circle" iconColor={COLORS.income} title="Taxa de poupança"
            value={summary.totalIncome > 0 ? `${((summary.balance / summary.totalIncome) * 100).toFixed(0)}%` : 'N/A'}
            subtitle="do rendimento" trend={summary.balance > 0 ? 'up' : 'down'} />
        </View>

        {(() => {
          const sectionMap: Record<string, React.ReactNode> = {
            evolution: (
                <View style={styles.section}>
                  <SectionTitle title="Evolução mensal" />
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
                        width={chartWidth - 24} height={180} chartConfig={CHART_CONFIG}
                        formatYLabel={(l) => showAmounts ? l : '••'} bezier
                        style={{ borderRadius: 12 }} withInnerLines={false} withOuterLines={false}
                      />
                    </Card>
                  ) : <EmptyChart />}
                </View>
              ),
            categories: (
                <View style={styles.section}>
                  <SectionTitle title="Por categoria" />
                  {pieData.length > 0 && (
                    <Card padding={12} style={styles.chartCard}>
                      <PieChart data={pieData} width={chartWidth - 24} height={180}
                        chartConfig={CHART_CONFIG} accessor="population"
                        backgroundColor="transparent" paddingLeft="16" hasLegend />
                    </Card>
                  )}
                  {categorySpending.length > 0 ? (
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
                              {showAmounts ? formatCurrency(cs.total) : HIDDEN_AMOUNT}
                            </ThemedText>
                            <ThemedText variant="caption">{cs.percentage.toFixed(1)}%</ThemedText>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : <EmptyChart />}
                </View>
              ),
            top5: (
                <View style={styles.section}>
                  <SectionTitle title="Top 5 maiores despesas" />
                  {top5Txs.length === 0 ? <EmptyChart /> : (
                    <Card padding={0} style={{ overflow: 'hidden' }}>
                      {top5Txs.map((tx, i) => {
                        const cat = categories.find((c) => c.id === tx.categoryId);
                        const pct = summary.totalExpenses > 0 ? (tx.amount / summary.totalExpenses) * 100 : 0;
                        return (
                          <View key={tx.id} style={[styles.top5Row, i === top5Txs.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={[styles.top5Rank, { backgroundColor: COLORS.primaryMuted }]}>
                              <ThemedText style={[styles.top5RankText, { color: COLORS.primary }]}>#{i + 1}</ThemedText>
                            </View>
                            <View style={{ flex: 1 }}>
                              <ThemedText style={styles.top5Title} numberOfLines={1}>
                                {tx.title || cat?.name || 'Despesa'}
                              </ThemedText>
                              <View style={styles.barBg}>
                                <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: cat?.color ?? COLORS.expense }]} />
                              </View>
                            </View>
                            <ThemedText style={[styles.top5Amount, { color: COLORS.expense }]}>
                              {showAmounts ? formatCurrency(tx.amount) : HIDDEN_AMOUNT}
                            </ThemedText>
                          </View>
                        );
                      })}
                    </Card>
                  )}
                </View>
              ),
            ytd: (
                <View style={styles.section}>
                  <SectionTitle title={`Receitas vs Despesas ${year}`} />
                  <View style={styles.ytdSummary}>
                    <View style={[styles.ytdBadge, { backgroundColor: COLORS.income + '18' }]}>
                      <Feather name="arrow-down-circle" size={14} color={COLORS.income} />
                      <ThemedText style={[styles.ytdLabel, { color: COLORS.income }]}>
                        {showAmounts ? formatCurrency(ytdIncome) : HIDDEN_AMOUNT}
                      </ThemedText>
                    </View>
                    <View style={[styles.ytdBadge, { backgroundColor: COLORS.expense + '18' }]}>
                      <Feather name="arrow-up-circle" size={14} color={COLORS.expense} />
                      <ThemedText style={[styles.ytdLabel, { color: COLORS.expense }]}>
                        {showAmounts ? formatCurrency(ytdExpenses) : HIDDEN_AMOUNT}
                      </ThemedText>
                    </View>
                  </View>
                  {ytdData.some((m) => m.income > 0 || m.expenses > 0) ? (
                    <Card padding={12}>
                      <BarChart
                        data={{
                          labels: ytdData.map((m) => formatShortMonth(m.month)),
                          datasets: [{ data: ytdData.map((m) => m.expenses || 0) }],
                        }}
                        width={chartWidth - 24} height={180}
                        chartConfig={{ ...CHART_CONFIG, color: (opacity = 1) => `rgba(239,68,68,${opacity})` }}
                        style={{ borderRadius: 12 }}
                        withInnerLines={false} showValuesOnTopOfBars={false}
                        yAxisLabel="" yAxisSuffix="" fromZero
                      />
                    </Card>
                  ) : <EmptyChart />}
                </View>
              ),
            'balance-history': (
                <View style={styles.section}>
                  <SectionTitle title="Saldo acumulado por conta" />
                  {accountBalanceHistory.some((a) => a.balances.some((b) => b > 0)) ? (
                    <Card padding={12}>
                      <LineChart
                        data={{
                          labels: Array.from({ length: 6 }, (_, i) => {
                            const now = new Date();
                            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                            return formatShortMonth(d.getMonth() + 1);
                          }),
                          datasets: accountBalanceHistory.map((a) => ({
                            data: a.balances.map((b) => b || 0),
                            color: () => a.account.color,
                            strokeWidth: 2,
                          })),
                          legend: accountBalanceHistory.map((a) => a.account.name),
                        }}
                        width={chartWidth - 24} height={200} chartConfig={CHART_CONFIG}
                        formatYLabel={(l) => showAmounts ? l : '••'}
                        bezier style={{ borderRadius: 12 }}
                        withInnerLines={false} withOuterLines={false}
                      />
                    </Card>
                  ) : <EmptyChart />}
                </View>
              ),
            dow: (
                <View style={styles.section}>
                  <SectionTitle title="Gastos por dia da semana" />
                  {expensesByDow.some((v) => v > 0) ? (
                    <Card padding={16}>
                      <View style={styles.dowRow}>
                        {expensesByDow.map((val, i) => {
                          const pct = maxDow > 0 ? val / maxDow : 0;
                          const isMax = val === maxDow && val > 0;
                          return (
                            <View key={i} style={styles.dowCol}>
                              <ThemedText style={[styles.dowAmt, { color: isMax ? COLORS.expense : COLORS.text.tertiary }]}>
                                {showAmounts && val > 0 ? formatShortAmount(val) : ''}
                              </ThemedText>
                              <View style={styles.dowBarBg}>
                                <View style={[styles.dowBarFill, {
                                  height: `${Math.round(pct * 100)}%` as any,
                                  backgroundColor: isMax ? COLORS.expense : COLORS.primary + 'AA',
                                }]} />
                              </View>
                              <ThemedText style={[styles.dowLabel, isMax && { color: COLORS.expense, fontWeight: '700' as const }]}>
                                {DOW_LABELS[i]}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>
                    </Card>
                  ) : <EmptyChart />}
                </View>
              ),
            'by-account': (
                <View style={styles.section}>
                  <SectionTitle title="Gastos por conta" />
                  {accountPieData.length > 0 && (
                    <Card padding={12} style={styles.chartCard}>
                      <PieChart data={accountPieData} width={chartWidth - 24} height={180}
                        chartConfig={CHART_CONFIG} accessor="population"
                        backgroundColor="transparent" paddingLeft="16" hasLegend />
                    </Card>
                  )}
                  {spendingByAccount.length > 0 ? (
                    <Card padding={0} style={{ overflow: 'hidden', marginTop: 12 }}>
                      {spendingByAccount.map((x, i) => (
                        <View key={x.account!.id} style={[styles.categoryRow, i === spendingByAccount.length - 1 && { borderBottomWidth: 0 }]}>
                          <View style={[styles.accountDot, { backgroundColor: x.account!.color }]}>
                            <Feather name={x.account!.icon as any} size={14} color="#FFF" />
                          </View>
                          <View style={styles.categoryInfo}>
                            <ThemedText variant="body">{x.account!.name}</ThemedText>
                            <View style={styles.barBg}>
                              <View style={[styles.barFill, { width: `${x.pct}%` as any, backgroundColor: x.account!.color }]} />
                            </View>
                          </View>
                          <View style={styles.categoryAmounts}>
                            <ThemedText variant="body" style={{ fontWeight: '600' as const }}>
                              {showAmounts ? formatCurrency(x.amount) : HIDDEN_AMOUNT}
                            </ThemedText>
                            <ThemedText variant="caption">{x.pct.toFixed(1)}%</ThemedText>
                          </View>
                        </View>
                      ))}
                    </Card>
                  ) : <EmptyChart />}
                </View>
              ),
            'vs-initial': (
                <View style={styles.section}>
                  <SectionTitle title="Saldo actual vs inicial" />
                  <Card padding={0} style={{ overflow: 'hidden' }}>
                    {accountBalances.map((acc, i) => {
                      const diff = acc.balance - acc.initialBalance;
                      const isPos = diff >= 0;
                      const maxVal = Math.max(acc.balance, acc.initialBalance, 1);
                      return (
                        <View key={acc.id} style={[styles.balanceCompRow, i === accountBalances.length - 1 && { borderBottomWidth: 0 }]}>
                          <View style={[styles.accountDot, { backgroundColor: acc.color }]}>
                            <Feather name={acc.icon as any} size={14} color="#FFF" />
                          </View>
                          <View style={{ flex: 1, gap: 6 }}>
                            <View style={styles.balanceCompHeader}>
                              <ThemedText style={styles.balanceCompName}>{acc.name}</ThemedText>
                              <View style={[styles.diffBadge, { backgroundColor: isPos ? COLORS.income + '18' : COLORS.expense + '18' }]}>
                                <Feather name={isPos ? 'trending-up' : 'trending-down'} size={11} color={isPos ? COLORS.income : COLORS.expense} />
                                <ThemedText style={[styles.diffText, { color: isPos ? COLORS.income : COLORS.expense }]}>
                                  {showAmounts ? `${isPos ? '+' : ''}${formatCurrency(diff)}` : HIDDEN_AMOUNT}
                                </ThemedText>
                              </View>
                            </View>
                            <View style={styles.barCompRow}>
                              <ThemedText style={styles.barCompLabel}>Inicial</ThemedText>
                              <View style={[styles.barBg, { flex: 1 }]}>
                                <View style={[styles.barFill, { width: `${Math.min((acc.initialBalance / maxVal) * 100, 100)}%` as any, backgroundColor: COLORS.border }]} />
                              </View>
                              <ThemedText style={styles.barCompVal}>
                                {showAmounts ? formatCurrency(acc.initialBalance) : HIDDEN_AMOUNT}
                              </ThemedText>
                            </View>
                            <View style={styles.barCompRow}>
                              <ThemedText style={styles.barCompLabel}>Actual</ThemedText>
                              <View style={[styles.barBg, { flex: 1 }]}>
                                <View style={[styles.barFill, { width: `${Math.min((Math.max(acc.balance, 0) / maxVal) * 100, 100)}%` as any, backgroundColor: acc.color }]} />
                              </View>
                              <ThemedText style={[styles.barCompVal, { color: acc.color, fontWeight: '700' as const }]}>
                                {showAmounts ? formatCurrency(acc.balance) : HIDDEN_AMOUNT}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </Card>
                </View>
              ),
          };
          return (order as string[]).map((id) =>
            sectionMap[id] ? (
              <React.Fragment key={id}>{sectionMap[id]}</React.Fragment>
            ) : null
          );
        })()}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ReorderModal
        visible={showReorder}
        entries={[
          { id: 'evolution',       label: 'Evolução mensal' },
          { id: 'categories',      label: 'Por categoria' },
          { id: 'top5',            label: 'Top 5 maiores despesas' },
          { id: 'ytd',             label: `Receitas vs Despesas ${year}` },
          { id: 'balance-history', label: 'Saldo acumulado por conta' },
          { id: 'dow',             label: 'Gastos por dia da semana' },
          { id: 'by-account',      label: 'Gastos por conta' },
          { id: 'vs-initial',      label: 'Saldo actual vs inicial' },
        ].filter((e) => (order as string[]).includes(e.id))}
        onSave={saveOrder}
        onClose={() => setShowReorder(false)}
      />
    </View>
  );
}

function EmptyChart() {
  const COLORS = useColors();
  return (
    <ThemedText variant="caption" style={{ textAlign: 'center', color: COLORS.text.tertiary, paddingVertical: 20 }}>
      Sem dados suficientes
    </ThemedText>
  );
}

function formatShortAmount(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
  return `${Math.round(val)}`;
}

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  editBtnText: { fontSize: 13, fontWeight: '600' as const },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  summaryWrap: { marginHorizontal: -16, marginTop: 4, marginBottom: 16 },
  insightRow: { flexDirection: 'row' },
  section: { marginTop: 24 },
  sectionTitle: { marginBottom: 12 },
  chartCard: { alignItems: 'center' },

  categoryList: { marginTop: 12, backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden' },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoryInfo: { flex: 1 },
  barBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  categoryAmounts: { alignItems: 'flex-end' },

  /* Top 5 */
  top5Row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  top5Rank: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  top5RankText: { fontSize: 11, fontWeight: '800' as const },
  top5Title: { fontSize: 14, fontWeight: '600' as const, color: COLORS.text.primary, marginBottom: 2 },
  top5Amount: { fontSize: 14, fontWeight: '700' as const },

  /* YTD */
  ytdSummary: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  ytdBadge: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  ytdLabel: { fontSize: 13, fontWeight: '700' as const, flex: 1 },

  /* Day of week */
  dowRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140 },
  dowCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  dowAmt: { fontSize: 9, fontWeight: '600' as const, marginBottom: 4 },
  dowBarBg: {
    width: '100%', flex: 1, maxHeight: 80,
    backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  dowBarFill: { width: '100%', borderRadius: 4 },
  dowLabel: { fontSize: 10, color: COLORS.text.tertiary, marginTop: 4 },

  /* By account */
  accountDot: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  /* Balance comparison */
  balanceCompRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  balanceCompHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceCompName: { fontSize: 14, fontWeight: '600' as const, color: COLORS.text.primary },
  diffBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  diffText: { fontSize: 11, fontWeight: '700' as const },
  barCompRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barCompLabel: { fontSize: 11, color: COLORS.text.tertiary, width: 40 },
  barCompVal: { fontSize: 11, color: COLORS.text.secondary, width: 80, textAlign: 'right' as const },
});
