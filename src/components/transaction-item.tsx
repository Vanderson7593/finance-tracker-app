import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./themed-text";
import { CategoryIcon } from "./category-icon";
import { Palette } from "../../constants/colors";
import { useColors } from "../hooks/use-colors";
import { Transaction, Category } from "../types";
import { formatCurrency, formatDate } from "../lib/formatters";
import {
  HIDDEN_AMOUNT,
  useAmountVisibility,
} from "../hooks/use-amount-visibility";

interface TransactionItemProps {
  transaction: Transaction;
  category: Category | undefined;
  onPress?: () => void;
  onDelete?: () => void;
}

export function TransactionItem({
  transaction,
  category,
  onPress,
}: TransactionItemProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? COLORS.income : COLORS.expense;
  const prefix = isIncome ? "+" : "-";
  const { showAmounts } = useAmountVisibility();
  const title = transaction.title?.trim() || category?.name || "Sem título";

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <CategoryIcon
        icon={category?.icon ?? "tag"}
        color={category?.color ?? "#ccc"}
        size={44}
      />
      <View style={styles.content}>
        <ThemedText variant="subtitle" numberOfLines={1} style={styles.title}>
          {title}
        </ThemedText>
        <View style={styles.metaLeft}>
          <ThemedText variant="caption" numberOfLines={1}>
            {category?.name ?? "Sem categoria"}
          </ThemedText>
          {transaction.recurrence !== "none" && (
            <View style={styles.recurringBadge}>
              <Feather name="repeat" size={10} color={COLORS.primary} />
            </View>
          )}
        </View>
      </View>
      <View style={styles.right}>
        <ThemedText
          style={[styles.amount, { color: amountColor }]}
          numberOfLines={1}
        >
          {showAmounts
            ? `${prefix}${formatCurrency(transaction.amount)}`
            : `${prefix}${HIDDEN_AMOUNT}`}
        </ThemedText>
        <ThemedText variant="caption" style={styles.date} numberOfLines={1}>
          {formatDate(transaction.date)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const makeStyles = (COLORS: Palette) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      backgroundColor: COLORS.surface,
    },
    pressed: { opacity: 0.75 },
    content: { flex: 1, minWidth: 0 },
    title: { fontSize: 15, marginBottom: 3 },
    metaLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minWidth: 0,
    },
    right: { alignItems: "flex-end", gap: 3 },
    amount: { fontSize: 16, fontWeight: "600" as const },
    date: { color: COLORS.text.tertiary },
    recurringBadge: {
      backgroundColor: COLORS.primaryLight,
      borderRadius: 4,
      paddingHorizontal: 3,
      paddingVertical: 2,
      alignItems: "center",
      justifyContent: "center",
    },
  });
