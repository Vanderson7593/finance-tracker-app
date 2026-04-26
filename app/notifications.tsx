import React, { useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedText } from "../src/components/themed-text";
import { EmptyState } from "../src/components/empty-state";
import { useColors } from "../src/hooks/use-colors";
import { useTransactionStore } from "../src/store/use-transaction-store";
import { useAllAccountBalances, useBudgetProgress } from "../src/hooks/use-finance-data";
import { useSettingsStore } from "../src/store/use-settings-store";
import { formatCurrency, getCurrentMonth, formatDate } from "../src/lib/formatters";
import { DEFAULT_CURRENCY } from "../src/constants";
import { Palette } from "../constants/colors";

interface NotifItem {
  id: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  tag: string;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function NotifCard({
  item, index, onDismiss, COLORS,
}: {
  item: NotifItem; index: number; onDismiss: () => void; COLORS: Palette;
}) {
  const s = useMemo(() => cardStyles(COLORS), [COLORS]);
  return (
    <View style={s.card}>
        <View style={[s.iconWrap, { backgroundColor: item.iconBg }]}>
          <Feather name={item.icon as any} size={21} color={item.iconColor} />
        </View>

        <View style={s.content}>
          <View style={s.titleRow}>
            <ThemedText style={s.title} numberOfLines={1}>{item.title}</ThemedText>
            <ThemedText style={s.time}>{item.time}</ThemedText>
          </View>
          <ThemedText style={s.body}>{item.body}</ThemedText>
          <View style={[s.tag, { backgroundColor: item.iconBg }]}>
            <ThemedText style={[s.tagText, { color: item.iconColor }]}>{item.tag}</ThemedText>
          </View>
        </View>

        <Pressable hitSlop={10} onPress={onDismiss} style={s.closeBtn}>
          <Feather name="x" size={12} color={COLORS.text.tertiary} />
        </Pressable>
    </View>
  );
}

const cardStyles = (C: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 13,
      backgroundColor: C.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    content: { flex: 1, gap: 5 },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
    },
    title: { fontSize: 14, fontWeight: "700" as const, color: C.text.primary, flex: 1 },
    time: { fontSize: 11, color: C.text.tertiary, fontWeight: "500" as const },
    body: { fontSize: 13, color: C.text.secondary, lineHeight: 19 },
    tag: {
      alignSelf: "flex-start",
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 20,
      marginTop: 2,
    },
    tagText: { fontSize: 11, fontWeight: "600" as const },
    closeBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(0,0,0,0.06)",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
      flexShrink: 0,
    },
  });

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const COLORS = useColors();
  const s = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { month, year } = getCurrentMonth();
  const transactions = useTransactionStore((t) => t.transactions);
  const budgetProgress = useBudgetProgress(month, year);
  const accounts = useAllAccountBalances();
  const currency = useSettingsStore((st) => st.profile.currency ?? DEFAULT_CURRENCY);
  const settings = useSettingsStore((st) => st.settings);

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const dismiss = (id: string) => setDismissed((p) => new Set([...p, id]));

  const notifications = useMemo<NotifItem[]>(() => {
    const now = new Date();
    const items: NotifItem[] = [];

    // ── 1. Orçamento excedido ──────────────────────────────────────────────
    budgetProgress.filter((b) => b.isOverBudget).forEach((b) => {
      items.push({
        id: `budget-over-${b.budget.id}`,
        icon: "alert-circle",
        iconColor: "#EF4444",
        iconBg: "#FEE2E2",
        title: "Orçamento excedido",
        body: `Ultrapassaste o limite de "${b.category.name}" em ${formatCurrency(b.spent - b.budget.amount, currency)}.`,
        time: "Hoje",
        tag: "Orçamento",
      });
    });

    // ── 2. Quase no limite ─────────────────────────────────────────────────
    budgetProgress.filter((b) => b.isNearLimit && !b.isOverBudget).forEach((b) => {
      items.push({
        id: `budget-near-${b.budget.id}`,
        icon: "alert-triangle",
        iconColor: "#D97706",
        iconBg: "#FEF3C7",
        title: "Quase no limite",
        body: `Usaste ${Math.round(b.percentage)}% de "${b.category.name}". Resta ${formatCurrency(b.remaining, currency)}.`,
        time: "Hoje",
        tag: "Orçamento",
      });
    });

    // ── 3. Saldo negativo ──────────────────────────────────────────────────
    accounts.filter((a) => a.balance < 0).forEach((a) => {
      items.push({
        id: `neg-balance-${a.id}`,
        icon: "trending-down",
        iconColor: "#EF4444",
        iconBg: "#FEE2E2",
        title: "Saldo negativo",
        body: `A conta "${a.name}" está negativa em ${formatCurrency(Math.abs(a.balance), currency)}.`,
        time: "Hoje",
        tag: "Conta",
      });
    });

    // ── 4. Saldo baixo (< 5% do saldo inicial, mas ainda positivo) ─────────
    accounts
      .filter((a) => a.balance > 0 && a.initialBalance > 0 && a.balance < a.initialBalance * 0.05)
      .forEach((a) => {
        items.push({
          id: `low-balance-${a.id}`,
          icon: "battery",
          iconColor: "#F59E0B",
          iconBg: "#FEF3C7",
          title: "Saldo quase esgotado",
          body: `A conta "${a.name}" tem apenas ${formatCurrency(a.balance, currency)} disponível.`,
          time: "Hoje",
          tag: "Conta",
        });
      });

    // ── 5. Transferências recentes ─────────────────────────────────────────
    const seenIds = new Set<string>();
    transactions
      .filter((t) => t.transferId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .forEach((tx) => {
        if (!tx.transferId || seenIds.has(tx.transferId)) return;
        seenIds.add(tx.transferId);
        const paired = transactions.find((t) => t.transferId === tx.transferId && t.id !== tx.id);
        if (!paired) return;
        const fromAcc = accounts.find((a) => a.id === tx.accountId);
        const toAcc = accounts.find((a) => a.id === paired.accountId);
        if (!fromAcc || !toAcc) return;
        const date = new Date(tx.createdAt);
        const isToday = now.toDateString() === date.toDateString();
        items.push({
          id: `transfer-${tx.transferId}`,
          icon: "repeat",
          iconColor: "#6366F1",
          iconBg: "#EEF2FF",
          title: "Transferência realizada",
          body: `${formatCurrency(tx.amount, currency)} movido de "${fromAcc.name}" para "${toAcc.name}".`,
          time: isToday ? "Hoje" : formatDate(tx.createdAt),
          tag: "Transferência",
        });
      });

    // ── 6. Despesa elevada (> 3× média das despesas do mês) ────────────────
    const monthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
    const expenses = monthTxs.filter((t) => t.type === "expense" && !t.transferId);
    if (expenses.length > 2) {
      const avg = expenses.reduce((s, t) => s + t.amount, 0) / expenses.length;
      expenses
        .filter((t) => t.amount > avg * 3)
        .slice(0, 3)
        .forEach((t) => {
          items.push({
            id: `big-expense-${t.id}`,
            icon: "zap",
            iconColor: "#7C3AED",
            iconBg: "#EDE9FE",
            title: "Despesa elevada",
            body: `Registaste uma despesa de ${formatCurrency(t.amount, currency)}${t.title ? ` em "${t.title}"` : ""}, acima da média do mês.`,
            time: formatDate(t.date),
            tag: "Despesa",
          });
        });
    }

    // ── 7. Receita recente ─────────────────────────────────────────────────
    const recentIncome = transactions
      .filter((t) => t.type === "income" && !t.transferId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2);
    recentIncome.forEach((t) => {
      const date = new Date(t.date);
      const isToday = now.toDateString() === date.toDateString();
      if (!isToday) return;
      items.push({
        id: `income-${t.id}`,
        icon: "arrow-down-circle",
        iconColor: "#10B981",
        iconBg: "#D1FAE5",
        title: "Receita registada",
        body: `${formatCurrency(t.amount, currency)} adicionado${t.title ? ` — "${t.title}"` : ""}.`,
        time: "Hoje",
        tag: "Receita",
      });
    });

    // ── 8. Transações recorrentes a vencer ─────────────────────────────────
    const recurringTxs = transactions.filter(
      (t) => t.recurrence !== "none" && !t.transferId
    );
    if (recurringTxs.length > 0) {
      items.push({
        id: "recurring-reminder",
        icon: "refresh-cw",
        iconColor: "#0EA5E9",
        iconBg: "#E0F2FE",
        title: `${recurringTxs.length} transaç${recurringTxs.length === 1 ? "ão recorrente" : "ões recorrentes"}`,
        body: `Tens ${recurringTxs.length} transaç${recurringTxs.length === 1 ? "ão configurada" : "ões configuradas"} com recorrência activa.`,
        time: "Informação",
        tag: "Recorrente",
      });
    }

    // ── 9. Sem registos nos últimos 7 dias ────────────────────────────────
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const recentAny = transactions.some(
      (t) => new Date(t.date) >= sevenDaysAgo && !t.transferId
    );
    if (!recentAny && transactions.length > 0) {
      items.push({
        id: "no-recent-txs",
        icon: "clock",
        iconColor: "#64748B",
        iconBg: "#F1F5F9",
        title: "Sem registos recentes",
        body: "Não registaste nenhuma transação nos últimos 7 dias. Mantém o controlo atualizado.",
        time: "Lembrete",
        tag: "Actividade",
      });
    }

    // ── 10. Relatório mensal disponível ───────────────────────────────────
    if (settings.weeklyReport && monthTxs.length >= 5) {
      const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
      const totalInc = monthTxs
        .filter((t) => t.type === "income" && !t.transferId)
        .reduce((s, t) => s + t.amount, 0);
      items.push({
        id: "monthly-report",
        icon: "bar-chart-2",
        iconColor: "#6366F1",
        iconBg: "#EEF2FF",
        title: "Resumo do mês",
        body: `Receitas ${formatCurrency(totalInc, currency)} · Despesas ${formatCurrency(totalExp, currency)} · ${monthTxs.length} transações registadas.`,
        time: "Este mês",
        tag: "Relatório",
      });
    }

    return items;
  }, [budgetProgress, transactions, accounts, currency, month, year, settings]);

  const visible = notifications.filter((n) => !dismissed.has(n.id));

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="title">Notificações</ThemedText>
        {visible.length > 0 ? (
          <Pressable
            hitSlop={8}
            onPress={() => setDismissed(new Set(notifications.map((n) => n.id)))}
            style={[s.clearBtn, { backgroundColor: COLORS.surfaceVariant }]}
          >
            <ThemedText style={[s.clearText, { color: COLORS.text.secondary }]}>Limpar</ThemedText>
          </Pressable>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {visible.length === 0 ? (
          <View style={s.emptyWrap}>
            <EmptyState icon="bell" title="Tudo em ordem" subtitle="Não tens notificações pendentes" />
          </View>
        ) : (
          visible.map((n, i) => (
            <NotifCard key={n.id} item={n} index={i} onDismiss={() => dismiss(n.id)} COLORS={COLORS} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    backBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
    clearBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    clearText: { fontSize: 12, fontWeight: "600" as const },
    scroll: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 4 },
    emptyWrap: { marginTop: 60 },
  });
