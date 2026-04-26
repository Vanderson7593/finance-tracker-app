import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountSwiper } from "../../src/components/account-swiper";
import { TransactionItem } from "../../src/components/transaction-item";
import { BudgetProgressBar } from "../../src/components/budget-progress-bar";
import { ThemedText } from "../../src/components/themed-text";
import { EmptyState } from "../../src/components/empty-state";
import { Fab } from "../../src/components/fab";
import { Feather } from "@expo/vector-icons";
import { Palette } from "../../constants/colors";
import { useColors } from "../../src/hooks/use-colors";
import { useTransactionStore } from "../../src/store/use-transaction-store";
import { useCategoryStore } from "../../src/store/use-category-store";
import { useBudgetStore } from "../../src/store/use-budget-store";
import { useSettingsStore } from "../../src/store/use-settings-store";
import { useAccountStore } from "../../src/store/use-account-store";
import {
  useBudgetProgress,
  useAllAccountBalances,
} from "../../src/hooks/use-finance-data";
import { useNotificationCount } from "../../src/hooks/use-notification-count";
import { formatCurrency, getCurrentMonth } from "../../src/lib/formatters";
import {
  useAmountVisibility,
  hiddenCurrency,
} from "../../src/hooks/use-amount-visibility";
import { DEFAULT_CURRENCY } from "../../src/constants";

export default function HomeScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const { month, year } = getCurrentMonth();
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const loadBudgets = useBudgetStore((s) => s.loadBudgets);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadAccounts = useAccountStore((s) => s.loadAccounts);
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const profile = useSettingsStore((s) => s.profile);
  const currency = profile.currency ?? DEFAULT_CURRENCY;
  const budgetProgress = useBudgetProgress(month, year);
  const accountBalances = useAllAccountBalances();
  const { showAmounts, toggleAmountVisibility } = useAmountVisibility();
  const notifCount = useNotificationCount();

  const totalBalance = useMemo(
    () => accountBalances.reduce((sum, a) => sum + a.balance, 0),
    [accountBalances],
  );

  const recentTxs = useMemo(
    () =>
      [...transactions]
        .filter((t) => !t.transferId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [transactions],
  );

  useEffect(() => {
    Promise.all([
      loadTransactions(),
      loadCategories(),
      loadBudgets(),
      loadSettings(),
      loadAccounts(),
    ]);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadTransactions(),
      loadCategories(),
      loadBudgets(),
      loadAccounts(),
    ]);
    setRefreshing(false);
  };

  const topPad = isWeb ? 67 : insets.top;

  const initials = useMemo(() => {
    const parts = profile.name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  }, [profile.name]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={[styles.avatar, { backgroundColor: COLORS.primary }]}
          onPress={() => router.push("/user-settings")}
        >
          <ThemedText style={styles.avatarText}>{initials}</ThemedText>
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: COLORS.surfaceVariant }]}
            onPress={() => router.push("/notifications")}
            hitSlop={8}
          >
            <Feather name="bell" size={17} color={notifCount > 0 ? COLORS.primary : COLORS.text.secondary} />
            {notifCount > 0 && (
              <View style={[styles.bellDot, { backgroundColor: COLORS.primary }]} />
            )}
          </Pressable>
          <Pressable
            style={[
              styles.iconBtn,
              {
                backgroundColor: showAmounts
                  ? COLORS.primaryMuted
                  : COLORS.primary + "18",
              },
            ]}
            onPress={() => void toggleAmountVisibility()}
            hitSlop={8}
          >
            <Feather
              name={showAmounts ? "eye" : "eye-off"}
              size={17}
              color={COLORS.primary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, isWeb && { paddingBottom: 34 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── Total balance ── */}
        <View style={styles.totalBlock}>
          <ThemedText style={styles.totalLabel}>Saldo Total</ThemedText>
          <ThemedText style={styles.totalAmount}>
            {showAmounts
              ? formatCurrency(totalBalance, currency)
              : hiddenCurrency(currency)}
          </ThemedText>
        </View>

        <AccountSwiper />

        {budgetProgress.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="subtitle">Orçamentos</ThemedText>
              <Pressable onPress={() => router.push("/(tabs)/budgets")}>
                <ThemedText variant="label" style={{ color: COLORS.primary }}>
                  Ver todos
                </ThemedText>
              </Pressable>
            </View>
            {budgetProgress.slice(0, 3).map((bp) => (
              <BudgetProgressBar
                key={bp.budget.id}
                progress={bp}
                compact
                onPress={() => router.push("/(tabs)/budgets")}
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle">Recentes</ThemedText>
            <Pressable onPress={() => router.push("/(tabs)/transactions")}>
              <ThemedText variant="label" style={{ color: COLORS.primary }}>
                Ver todos
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.transactionsList}>
            {recentTxs.length === 0 ? (
              <EmptyState
                icon="inbox"
                title="Sem transações"
                subtitle="Regista a tua primeira transação"
              />
            ) : (
              recentTxs.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  category={categories.find((c) => c.id === tx.categoryId)}
                  onPress={() =>
                    router.push({
                      pathname: "/transaction-form",
                      params: { id: tx.id },
                    })
                  }
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Fab onPress={() => router.push("/transaction-form")} />
    </View>
  );
}

const makeStyles = (COLORS: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    avatarText: {
      fontSize: 15,
      fontWeight: "800" as const,
      color: "#FFF",
      letterSpacing: 0.5,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    bellDot: {
      position: "absolute",
      width: 8,
      height: 8,
      borderRadius: 4,
      top: 7,
      right: 7,
      borderWidth: 1.5,
      borderColor: COLORS.background,
    },
    scroll: { paddingBottom: 100 },
    totalBlock: {
      paddingHorizontal: 22,
      paddingTop: 2,
      paddingBottom: 22,
    },
    totalLabel: {
      fontSize: 13,
      fontWeight: "500" as const,
      color: COLORS.text.tertiary,
      marginBottom: 4,
    },
    totalAmount: {
      fontSize: 40,
      fontWeight: "800" as const,
      color: COLORS.text.primary,
      letterSpacing: -1.5,
    },
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    transactionsList: {
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  });
