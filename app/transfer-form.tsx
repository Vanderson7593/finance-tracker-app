import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  InputAccessoryView,
  Modal,
  Platform,
  Alert,
  Keyboard,
  ScrollView,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";


import { ThemedText } from "../src/components/themed-text";
import { useColors } from "../src/hooks/use-colors";
import { useAllAccountBalances } from "../src/hooks/use-finance-data";
import { useAccountStore } from "../src/store/use-account-store";
import { useSettingsStore } from "../src/store/use-settings-store";
import {
  formatAmountInput,
  formatCurrency,
  parseAmountInput,
} from "../src/lib/formatters";
import { DEFAULT_CURRENCY, ACCOUNT_TYPE_LABELS, CURRENCY_SYMBOLS } from "../src/constants";
import { Palette } from "../constants/colors";

const { height: SCREEN_H } = Dimensions.get("window");

type AccountWithBalance = ReturnType<typeof useAllAccountBalances>[number];

// ─── Bottom sheet account picker ─────────────────────────────────────────────
function AccountSheet({
  visible,
  title,
  accounts,
  excludeId,
  selectedId,
  currency,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  accounts: AccountWithBalance[];
  excludeId: string;
  selectedId: string;
  currency: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const COLORS = useColors();
  const s = useMemo(() => sheetStyles(COLORS), [COLORS]);

  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_H);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withSpring(0, { damping: 26, stiffness: 280, mass: 0.8 });
    } else {
      translateY.value = withTiming(SCREEN_H, { duration: 280 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  if (!mounted && !visible) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View style={[s.sheetWrapper, sheetStyle]}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.inner}>
            <View style={s.handle} />
            <ThemedText style={s.title}>{title}</ThemedText>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {accounts.map((acc) => {
                const excluded = acc.id === excludeId;
                const selected = acc.id === selectedId;
                return (
                  <Pressable
                    key={acc.id}
                    disabled={excluded}
                    onPress={() => { onSelect(acc.id); onClose(); }}
                    style={[
                      s.row,
                      selected && { borderColor: acc.color, backgroundColor: acc.color + "0F" },
                      excluded && { opacity: 0.3 },
                    ]}
                  >
                    <View style={[s.accDot, { backgroundColor: acc.color }]}>
                      <Feather name={acc.icon as any} size={15} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={s.accName}>{acc.name}</ThemedText>
                      <ThemedText style={s.accSub}>
                        {ACCOUNT_TYPE_LABELS[acc.type as keyof typeof ACCOUNT_TYPE_LABELS]}
                        {"  ·  "}
                        {formatCurrency(acc.balance, currency)}
                      </ThemedText>
                    </View>
                    {selected
                      ? <Feather name="check-circle" size={20} color={acc.color} />
                      : excluded
                      ? <View style={s.badge}>
                          <ThemedText style={s.badgeText}>Em uso</ThemedText>
                        </View>
                      : <Feather name="chevron-right" size={18} color={COLORS.placeholder} />
                    }
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const sheetStyles = (C: Palette) =>
  StyleSheet.create({
    sheetWrapper: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    sheet: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: "hidden",
      backgroundColor: C.surface,
      maxHeight: SCREEN_H * 0.62,
    },
    inner: { padding: 20, paddingBottom: 36 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 20 },
    title: { fontSize: 13, fontWeight: "700" as const, color: C.text.secondary, textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 14 },
    row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, marginBottom: 8, backgroundColor: C.background },
    accDot: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    accName: { fontSize: 15, fontWeight: "600" as const, color: C.text.primary },
    accSub: { fontSize: 12, color: C.text.tertiary, marginTop: 2 },
    badge: { backgroundColor: C.surfaceVariant, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 10, color: C.text.tertiary, fontWeight: "600" as const },
  });

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TransferFormScreen() {
  const COLORS = useColors();
  const s = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const { fromId } = useLocalSearchParams<{ fromId?: string }>();
  const accounts = useAllAccountBalances();
  const currency = useSettingsStore((s) => s.profile.currency ?? DEFAULT_CURRENCY);
  const { transferBetweenAccounts } = useAccountStore();

  const defaultFrom = fromId ?? accounts[0]?.id ?? "";
  const defaultTo = accounts.find((a) => a.id !== defaultFrom)?.id ?? "";

  const [fromId_, setFromId] = useState(defaultFrom);
  const [toId_, setToId] = useState(defaultTo);
  const [raw, setRaw] = useState("");
  const [sheet, setSheet] = useState<"from" | "to" | null>(null);
  const [kbHeight, setKbHeight] = useState(0);

  const inputRef = useRef<TextInput>(null);
  const INPUT_ACCESSORY_ID = "transfer-amount";
  const swapRotate = useSharedValue(0);
  const swapStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swapRotate.value}deg` }],
  }));

  const fromAcc = accounts.find((a) => a.id === fromId_);
  const toAcc = accounts.find((a) => a.id === toId_);
  const amount = parseAmountInput(raw);
  const currSymbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] ?? currency;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      const show = Keyboard.addListener("keyboardDidShow", (e) =>
        setKbHeight(e.endCoordinates.height)
      );
      const hide = Keyboard.addListener("keyboardDidHide", () => setKbHeight(0));
      return () => { show.remove(); hide.remove(); };
    }
  }, []);

  const handleChange = (text: string) => setRaw(formatAmountInput(text));

  const swap = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    swapRotate.value = withSequence(
      withTiming(swapRotate.value + 180, { duration: 260 }),
    );
    setFromId(toId_);
    setToId(fromId_);
  };

  const confirm = async () => {
    if (!fromId_ || !toId_) { Alert.alert("Atenção", "Seleciona as contas."); return; }
    if (fromId_ === toId_) { Alert.alert("Atenção", "As contas têm de ser diferentes."); return; }
    if (amount <= 0) { Alert.alert("Atenção", "Indica o valor a transferir."); return; }
    await transferBetweenAccounts(fromId_, toId_, amount);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const isOverBalance = !!fromAcc && amount > fromAcc.balance;
  const canConfirm = amount > 0 && !!fromId_ && !!toId_ && fromId_ !== toId_ && !isOverBalance;

  return (
    <View style={[s.root, { paddingTop: isWeb ? 67 : insets.top }]}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.delay(0).springify().damping(24)} style={s.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={s.backBtn}>
          <Feather name="x" size={20} color={COLORS.text.primary} />
        </Pressable>
        <ThemedText style={s.headerTitle}>Transferência</ThemedText>
        <View style={{ width: 36 }} />
      </Animated.View>

      {/* ── Main card ── */}
      <Animated.View entering={FadeInDown.delay(80).springify().damping(24)} style={s.card}>

        {/* ── FROM section ── */}
        <Pressable style={s.section} onPress={() => inputRef.current?.focus()}>
          <View style={s.sectionTop}>
            <ThemedText style={s.sectionLabel}>De</ThemedText>
            <Pressable style={s.accountPill} onPress={() => setSheet("from")}>
              {fromAcc
                ? <>
                    <View style={[s.pillDot, { backgroundColor: fromAcc.color }]}>
                      <Feather name={fromAcc.icon as any} size={13} color="#FFF" />
                    </View>
                    <ThemedText style={s.pillName} numberOfLines={1}>{fromAcc.name}</ThemedText>
                  </>
                : <ThemedText style={[s.pillName, { color: COLORS.placeholder }]}>Selecionar</ThemedText>
              }
              <Feather name="chevron-down" size={13} color={COLORS.text.tertiary} />
            </Pressable>
          </View>

          {/* Amount input row */}
          <View style={s.amountRow}>
            <ThemedText style={s.currSymbol}>{currSymbol}</ThemedText>
            <TextInput
              ref={inputRef}
              value={raw}
              onChangeText={handleChange}
              placeholder="0"
              placeholderTextColor={COLORS.placeholder}
              keyboardType="decimal-pad"
              style={[s.amountInput, { color: COLORS.text.primary }]}
              selectionColor={COLORS.primary}
              inputAccessoryViewID={Platform.OS === "ios" ? INPUT_ACCESSORY_ID : undefined}
            />
          </View>

          {fromAcc && (
            isOverBalance ? (
              <View style={s.overAlert}>
                <Feather name="alert-triangle" size={13} color="#92400E" />
                <ThemedText style={s.overAlertText}>
                  Tens apenas {formatCurrency(fromAcc.balance, currency)} disponível
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={s.sectionSub}>
                Disponível: {formatCurrency(fromAcc.balance, currency)}
              </ThemedText>
            )
          )}
        </Pressable>

        {/* ── Divider + swap ── */}
        <View style={s.dividerRow}>
          <View style={[s.dividerLine, { backgroundColor: COLORS.divider }]} />
          <Pressable style={[s.swapCircle, { backgroundColor: COLORS.primaryMuted, borderColor: COLORS.background }]} onPress={swap}>
            <Animated.View style={swapStyle}>
              <Feather name="arrow-down" size={16} color={COLORS.primary} />
            </Animated.View>
          </Pressable>
          <View style={[s.dividerLine, { backgroundColor: COLORS.divider }]} />
        </View>

        {/* ── TO section ── */}
        <View style={s.section}>
          <View style={s.sectionTop}>
            <ThemedText style={s.sectionLabel}>Para</ThemedText>
            <Pressable style={s.accountPill} onPress={() => setSheet("to")}>
              {toAcc
                ? <>
                    <View style={[s.pillDot, { backgroundColor: toAcc.color }]}>
                      <Feather name={toAcc.icon as any} size={13} color="#FFF" />
                    </View>
                    <ThemedText style={s.pillName} numberOfLines={1}>{toAcc.name}</ThemedText>
                  </>
                : <ThemedText style={[s.pillName, { color: COLORS.placeholder }]}>Selecionar</ThemedText>
              }
              <Feather name="chevron-down" size={13} color={COLORS.text.tertiary} />
            </Pressable>
          </View>

          {/* Tappable amount — foca o mesmo input */}
          <Pressable style={s.amountRow} onPress={() => inputRef.current?.focus()}>
            <ThemedText style={s.currSymbol}>{currSymbol}</ThemedText>
            <ThemedText
              style={[
                s.amountInput,
                { color: amount > 0 ? COLORS.income : COLORS.placeholder },
              ]}
            >
              {raw || "0"}
            </ThemedText>
          </Pressable>

          {toAcc && (
            <ThemedText style={s.sectionSub}>
              Saldo actual: {formatCurrency(toAcc.balance, currency)}
            </ThemedText>
          )}
        </View>
      </Animated.View>

      {/* ── Fee / info strip ── */}
      {amount > 0 && fromAcc && toAcc && (
        <Animated.View entering={FadeInDown.duration(220)} style={s.infoStrip}>
          <Feather name="info" size={13} color={COLORS.text.tertiary} />
          <ThemedText style={s.infoText}>
            Sem comissão · transferência instantânea
          </ThemedText>
        </Animated.View>
      )}

      <View style={{ flex: 1 }} />

      {/* ── Confirm button ── */}
      <Animated.View
        entering={FadeInUp.delay(120).springify().damping(24)}
        style={[s.confirmWrap, { paddingBottom: insets.bottom + 16 }]}
      >
        <Pressable
          style={[s.confirmBtn, { backgroundColor: COLORS.primary }, !canConfirm && s.confirmDisabled]}
          onPress={confirm}
          disabled={!canConfirm}
        >
          <ThemedText style={s.confirmText}>
            {amount > 0 ? `Transferir ${formatCurrency(amount, currency)}` : "Transferir"}
          </ThemedText>
          <Feather name="arrow-right" size={18} color="#FFF" />
        </Pressable>
      </Animated.View>

      {/* ── Sheets ── */}
      <AccountSheet
        visible={sheet === "from"}
        title="Conta de origem"
        accounts={accounts}
        excludeId={toId_}
        selectedId={fromId_}
        currency={currency}
        onSelect={setFromId}
        onClose={() => setSheet(null)}
      />
      <AccountSheet
        visible={sheet === "to"}
        title="Conta de destino"
        accounts={accounts}
        excludeId={fromId_}
        selectedId={toId_}
        currency={currency}
        onSelect={setToId}
        onClose={() => setSheet(null)}
      />

      {/* iOS — toolbar colada ao teclado */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={[s.kbAccessory, { backgroundColor: COLORS.surfaceVariant }]}>
            <Pressable style={s.kbDismissBtn} onPress={() => Keyboard.dismiss()}>
              <Feather name="chevron-down" size={18} color={COLORS.primary} />
              <ThemedText style={[s.kbDismissLabel, { color: COLORS.primary }]}>OK</ThemedText>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}

      {/* Android — botão flutuante sobre o teclado */}
      {Platform.OS === "android" && kbHeight > 0 && (
        <Pressable
          style={[s.kbFloatBtn, { bottom: kbHeight + 10, backgroundColor: COLORS.surface }]}
          onPress={() => Keyboard.dismiss()}
        >
          <Feather name="chevron-down" size={20} color={COLORS.primary} />
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.surfaceVariant,
    },
    headerTitle: { fontSize: 16, fontWeight: "700" as const, color: C.text.primary },

    /* Main card */
    card: {
      marginHorizontal: 16,
      backgroundColor: C.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.border,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },

    /* Section (from / to) */
    section: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      gap: 10,
    },
    sectionTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700" as const,
      color: C.text.tertiary,
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
    },
    sectionSub: {
      fontSize: 12,
      color: C.text.tertiary,
    },
    overAlert: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      backgroundColor: "#FEF3C7",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
      alignSelf: "flex-start" as const,
    },
    overAlertText: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: "#92400E",
    },

    /* Account pill */
    accountPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: C.surfaceVariant,
      borderRadius: 22,
      paddingHorizontal: 12,
      paddingVertical: 8,
      maxWidth: "65%",
    },
    pillDot: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    pillName: {
      fontSize: 14,
      fontWeight: "600" as const,
      color: C.text.primary,
      flex: 1,
    },

    /* Amount */
    amountRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 6,
    },
    currSymbol: {
      fontSize: 24,
      fontWeight: "600" as const,
      color: C.text.secondary,
      paddingBottom: 4,
    },
    amountInput: {
      fontSize: 44,
      fontWeight: "700" as const,
      letterSpacing: -1,
      padding: 0,
      flex: 1,
    },

    /* Divider + swap */
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    dividerLine: { flex: 1, height: 1 },
    swapCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      marginHorizontal: 14,
    },

    /* Info strip */
    infoStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginHorizontal: 20,
      marginTop: 14,
    },
    infoText: {
      fontSize: 12,
      color: C.text.tertiary,
    },

    /* Confirm */
    confirmWrap: { paddingHorizontal: 16, paddingTop: 12 },
    confirmBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 17,
      borderRadius: 16,
    },
    confirmDisabled: { opacity: 0.38 },
    confirmText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "700" as const,
      letterSpacing: 0.1,
    },
    kbAccessory: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    kbDismissBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: C.primaryMuted,
    },
    kbDismissLabel: {
      fontSize: 14,
      fontWeight: "700" as const,
    },
    kbFloatBtn: {
      position: "absolute",
      right: 16,
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
  });
