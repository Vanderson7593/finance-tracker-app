import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useDerivedValue,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ThemedText } from "./themed-text";
import { useColors } from "../hooks/use-colors";
import { useAllAccountBalances } from "../hooks/use-finance-data";
import { useAmountVisibility, hiddenCurrency } from "../hooks/use-amount-visibility";
import { formatCurrency } from "../lib/formatters";
import { useSettingsStore } from "../store/use-settings-store";
import { ACCOUNT_TYPE_LABELS, DEFAULT_CURRENCY } from "../constants";
import { Palette } from "../../constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_H = 200;

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darken(hex: string) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function AnimatedDot({
  active,
  activeColor,
  inactiveColor,
}: {
  active: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, {
      damping: 20,
      stiffness: 260,
      mass: 0.6,
    });
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    width: 6 + progress.value * 14, // 6 → 20
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor],
    ),
  }));

  return <Animated.View style={[dotBaseStyle, animStyle]} />;
}

const dotBaseStyle = {
  height: 6,
  borderRadius: 3,
};

export function AccountSwiper() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const accounts = useAllAccountBalances();
  const { showAmounts, toggleAmountVisibility } = useAmountVisibility();
  const currency = useSettingsStore((s) => s.profile.currency ?? DEFAULT_CURRENCY);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  if (accounts.length === 0) {
    return (
      <Pressable
        style={styles.emptyCard}
        onPress={() => router.push("/accounts")}
      >
        <Feather name="plus-circle" size={28} color={COLORS.primary} />
        <ThemedText variant="body" style={{ color: COLORS.primary, marginTop: 8 }}>
          Adicionar conta
        </ThemedText>
      </Pressable>
    );
  }

  const handleScroll = (e: any) => {
    const offset = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offset / SCREEN_W);
    setActiveIndex(Math.max(0, Math.min(idx, accounts.length - 1)));
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={accounts}
        keyExtractor={(a) => a.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => {
          const base = item.color || COLORS.primary;
          const dark = darken(base);
          const isNeg = item.balance < 0;
          const gradColors: [string, string] = isNeg
            ? ["#1E293B", "#334155"]
            : [dark, base];
          return (
            <LinearGradient
              colors={gradColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Top row */}
              <View style={styles.cardHeader}>
                <View style={styles.accountMeta}>
                  <View style={[styles.iconBg, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                    <Feather name={item.icon as any} size={16} color="#FFF" />
                  </View>
                  <View>
                    <ThemedText style={styles.accountName}>{item.name}</ThemedText>
                    <ThemedText style={styles.accountType}>
                      {ACCOUNT_TYPE_LABELS[item.type as keyof typeof ACCOUNT_TYPE_LABELS]}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Balance */}
              <View style={styles.balanceBlock}>
                <ThemedText style={styles.balanceLabel}>Saldo disponível</ThemedText>
                <ThemedText style={styles.balanceAmount}>
                  {showAmounts
                    ? `${isNeg ? "-" : ""}${formatCurrency(Math.abs(item.balance), currency)}`
                    : hiddenCurrency(currency)}
                </ThemedText>
              </View>

              {/* Transfer button */}
              <Pressable
                style={styles.transferBtn}
                onPress={() =>
                  router.push({
                    pathname: "/transfer-form",
                    params: { fromId: item.id },
                  })
                }
              >
                <Feather name="repeat" size={14} color="#FFF" />
                <ThemedText style={styles.transferBtnLabel}>Transferir</ThemedText>
              </Pressable>
            </LinearGradient>
          );
        }}
      />

      {/* Dot indicators */}
      {accounts.length > 1 && (
        <View style={styles.dots}>
          {accounts.map((_, i) => (
            <AnimatedDot
              key={i}
              active={i === activeIndex}
              activeColor={COLORS.primary}
              inactiveColor={COLORS.border}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (COLORS: Palette) =>
  StyleSheet.create({
    emptyCard: {
      marginHorizontal: 16,
      height: CARD_H,
      backgroundColor: COLORS.surface,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: COLORS.border,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      width: SCREEN_W - 32,
      marginHorizontal: 16,
      height: CARD_H,
      borderRadius: 20,
      padding: 20,
      justifyContent: "space-between",
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    accountMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
    iconBg: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    accountName: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: "#FFF",
    },
    accountType: {
      fontSize: 11,
      color: "rgba(255,255,255,0.65)",
      marginTop: 1,
    },
    balanceBlock: {},
    balanceLabel: {
      fontSize: 11,
      color: "rgba(255,255,255,0.6)",
      marginBottom: 4,
    },
    balanceAmount: {
      fontSize: 32,
      fontWeight: "700" as const,
      color: "#FFF",
      letterSpacing: -0.5,
    },
    transferBtn: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    transferBtnLabel: {
      color: "#FFF",
      fontSize: 13,
      fontWeight: "600" as const,
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: 12,
    },
  });
