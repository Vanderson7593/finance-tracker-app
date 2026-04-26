import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ThemedText } from "../src/components/themed-text";
import { EmptyState } from "../src/components/empty-state";
import { Palette } from "../constants/colors";
import { useColors } from "../src/hooks/use-colors";
import { useAccountStore } from "../src/store/use-account-store";
import { Account, AccountType } from "../src/types";
import { generateId } from "../src/lib/uuid";
import {
  ACCOUNT_TYPE_ICONS,
  ACCOUNT_TYPE_LABELS,
  CATEGORY_COLORS,
  DEFAULT_CURRENCY_SYMBOL,
} from "../src/constants";
import {
  formatAmountInput,
  formatCurrency,
  parseAmountInput,
} from "../src/lib/formatters";

const TYPES: AccountType[] = ["bank", "wallet", "digital", "card", "savings", "other"];

export default function AccountsScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const { accounts, addAccount, updateAccount, deleteAccount } =
    useAccountStore();
  const sorted = useMemo(
    () => [...accounts].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [accounts],
  );

  const [editing, setEditing] = useState<Account | undefined>();
  const [showForm, setShowForm] = useState(false);

  const openCreate = () => {
    setEditing(undefined);
    setShowForm(true);
  };
  const openEdit = (acc: Account) => {
    setEditing(acc);
    setShowForm(true);
  };

  const handleSubmit = async (data: Omit<Account, "id" | "createdAt">) => {
    if (editing) {
      await updateAccount(editing.id, data);
    } else {
      await addAccount({
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      });
    }
    setShowForm(false);
    setEditing(undefined);
  };

  const handleDelete = (acc: Account) => {
    if (accounts.length <= 1) {
      Alert.alert("Não permitido", "Tens de manter pelo menos uma conta.");
      return;
    }
    Alert.alert(
      "Eliminar",
      `Eliminar "${acc.name}"? Os lançamentos associados serão movidos para outra conta.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
            }
            deleteAccount(acc.id);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="title">Contas</ThemedText>
        <Pressable style={styles.addBtn} onPress={openCreate}>
          <Feather name="plus" size={22} color="#FFF" />
        </Pressable>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(a) => a.id}
        contentContainerStyle={[styles.list, isWeb && { paddingBottom: 34 }]}
        ListEmptyComponent={<EmptyState icon="briefcase" title="Sem contas" />}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openEdit(item)}>
            <View
              style={[styles.iconBg, { backgroundColor: item.color + "1A" }]}
            >
              <Feather name={item.icon as any} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="body" style={{ fontWeight: "600" as const }}>
                {item.name}
              </ThemedText>
              <ThemedText
                variant="caption"
                style={{ color: COLORS.text.tertiary }}
              >
                {ACCOUNT_TYPE_LABELS[item.type]} · saldo inicial{" "}
                {formatCurrency(item.initialBalance)}
              </ThemedText>
            </View>
            <Pressable hitSlop={10} onPress={() => handleDelete(item)}>
              <Feather name="trash-2" size={18} color={COLORS.expense} />
            </Pressable>
          </Pressable>
        )}
      />

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <AccountForm
          initialData={editing}
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </View>
  );
}

interface FormProps {
  initialData?: Account;
  onSubmit: (data: Omit<Account, "id" | "createdAt">) => void;
  onCancel: () => void;
}

function AccountForm({ initialData, onSubmit, onCancel }: FormProps) {
  const COLORS = useColors();
  const formStyles = useMemo(() => makeFormStyles(COLORS), [COLORS]);
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState<AccountType>(initialData?.type ?? "bank");
  const [color, setColor] = useState<string>(
    initialData?.color ?? CATEGORY_COLORS[0],
  );
  const [icon, setIcon] = useState<string>(
    initialData?.icon ?? ACCOUNT_TYPE_ICONS["bank"],
  );
  const [balanceText, setBalanceText] = useState(
    initialData
      ? formatAmountInput(String(initialData.initialBalance).replace(".", ","))
      : "",
  );

  const handleType = (t: AccountType) => {
    setType(t);
    if (!initialData) setIcon(ACCOUNT_TYPE_ICONS[t]);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Atenção", "Indica um nome para a conta.");
      return;
    }
    onSubmit({
      name: name.trim(),
      type,
      icon,
      color,
      initialBalance: parseAmountInput(balanceText),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={formStyles.modal}
    >
      <View style={formStyles.modalHeader}>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Feather name="x" size={22} color={COLORS.text.secondary} />
        </Pressable>
        <ThemedText variant="title">
          {initialData ? "Editar conta" : "Nova conta"}
        </ThemedText>
        <Pressable onPress={handleSave} hitSlop={8}>
          <ThemedText style={formStyles.saveTxt}>Guardar</ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={formStyles.body}>
        <ThemedText style={formStyles.label}>Nome</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ex: Conta principal"
          placeholderTextColor={COLORS.placeholder}
          style={formStyles.input}
          maxLength={32}
        />

        <ThemedText style={formStyles.label}>Tipo</ThemedText>
        <View style={formStyles.row}>
          {TYPES.map((t) => {
            const active = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => handleType(t)}
                style={[
                  formStyles.chip,
                  active && {
                    backgroundColor: color + "14",
                    borderColor: color,
                  },
                ]}
              >
                <Feather
                  name={ACCOUNT_TYPE_ICONS[t] as any}
                  size={14}
                  color={active ? color : COLORS.text.secondary}
                />
                <ThemedText
                  style={[
                    formStyles.chipLabel,
                    { color: active ? color : COLORS.text.secondary },
                  ]}
                >
                  {ACCOUNT_TYPE_LABELS[t]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={formStyles.label}>Cor</ThemedText>
        <View style={formStyles.row}>
          {CATEGORY_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                formStyles.colorDot,
                { backgroundColor: c },
                color === c && formStyles.colorDotActive,
              ]}
            />
          ))}
        </View>

        <ThemedText style={formStyles.label}>
          Saldo inicial ({DEFAULT_CURRENCY_SYMBOL})
        </ThemedText>
        <TextInput
          value={balanceText}
          onChangeText={(text) => setBalanceText(formatAmountInput(text))}
          placeholder="0"
          placeholderTextColor={COLORS.placeholder}
          style={formStyles.input}
          keyboardType="decimal-pad"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (COLORS: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    list: { paddingHorizontal: 16, paddingBottom: 100, gap: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: COLORS.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    iconBg: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
  });

const makeFormStyles = (COLORS: Palette) =>
  StyleSheet.create({
    modal: { flex: 1, backgroundColor: COLORS.background },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 18,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    saveTxt: {
      color: COLORS.primary,
      fontWeight: "600" as const,
      fontSize: 15,
    },
    body: { padding: 20, gap: 4 },
    label: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: COLORS.text.secondary,
      letterSpacing: 0.4,
      textTransform: "uppercase" as const,
      marginTop: 14,
      marginBottom: 8,
    },
    input: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: COLORS.text.primary,
    },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    chipLabel: { fontSize: 13, fontWeight: "600" as const },
    colorDot: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: "transparent",
    },
    colorDotActive: { borderColor: COLORS.text.primary },
  });
