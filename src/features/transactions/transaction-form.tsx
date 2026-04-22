import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";

import { ThemedText } from "../../components/themed-text";
import { CategoryIcon } from "../../components/category-icon";
import { NumericKeypad, KeypadKey } from "../../components/numeric-keypad";
import { DatePickerModal } from "../../components/date-picker-modal";
import { Image } from "expo-image";
import { Palette } from "../../../constants/colors";
import { useColors } from "../../hooks/use-colors";
import { Attachment, Transaction, TransactionType, RecurrenceType } from "../../types";
import {
  deleteAttachmentFile,
  formatFileSize,
  isImage,
  pickDocument,
  pickFromGallery,
  takePhoto,
} from "../../lib/attachments";
import { useCategoryStore } from "../../store/use-category-store";
import { useAccountStore } from "../../store/use-account-store";
import { useTagStore } from "../../store/use-tag-store";
import {
  ACCOUNT_TYPE_ICONS,
  DEFAULT_CURRENCY_SYMBOL,
  RECURRENCE_LABELS,
} from "../../constants";
import { router } from "expo-router";

interface TransactionFormProps {
  initialData?: Partial<Transaction>;
  onSubmit: (data: Omit<Transaction, "id" | "createdAt">) => void;
  onCancel: () => void;
}

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceType }[] = [
  { label: "Nunca", value: "none" },
  { label: "Diária", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Mensal", value: "monthly" },
  { label: "Anual", value: "yearly" },
];

function toRaw(amount?: number): string {
  if (!amount && amount !== 0) return "";
  if (amount === 0) return "";
  return String(amount);
}

function formatAmount(raw: string): { display: string; isEmpty: boolean } {
  if (raw === "") return { display: "0", isEmpty: true };
  const [intRaw, decRaw] = raw.split(".");
  const intStr = (intRaw || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (decRaw === undefined) return { display: intStr, isEmpty: false };
  return { display: `${intStr},${decRaw}`, isEmpty: false };
}

function applyKey(raw: string, key: KeypadKey): string {
  if (key === "back") return raw.slice(0, -1);
  if (key === ",") {
    if (raw === "") return "0.";
    if (raw.includes(".")) return raw;
    return raw + ".";
  }
  const [intPart, decPart] = raw.split(".");
  if (decPart !== undefined) {
    if (decPart.length >= 2) return raw;
    return raw + key;
  }
  if (raw === "0") return key === "0" ? raw : key;
  if ((intPart || "").length >= 12) return raw;
  return raw + key;
}

function dateLabel(iso: string): string {
  try {
    const d = parseISO(iso);
    if (isToday(d)) return "Hoje";
    if (isYesterday(d)) return "Ontem";
    return format(d, "d 'de' MMM", { locale: pt });
  } catch {
    return "Hoje";
  }
}

interface MetaRowProps {
  iconName: string;
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}

function MetaRow({ iconName, label, onPress, children, isLast }: MetaRowProps) {
  const COLORS = useColors();
  const metaStyles = useMemo(() => makeMetaStyles(COLORS), [COLORS]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        metaStyles.row,
        !isLast && metaStyles.rowDivider,
        pressed && metaStyles.rowPressed,
      ]}
    >
      <View style={metaStyles.iconBox}>
        <Feather
          name={iconName as any}
          size={15}
          color={COLORS.text.secondary}
        />
      </View>
      <View style={metaStyles.textStack}>
        <ThemedText style={metaStyles.label}>{label}</ThemedText>
        <View style={metaStyles.valueWrap}>{children}</View>
      </View>
      <Feather name="chevron-right" size={16} color={COLORS.text.tertiary} />
    </Pressable>
  );
}

export function TransactionForm({
  initialData,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const categories = useCategoryStore((s) => s.categories);
  const accounts = useAccountStore((s) => s.accounts);
  const tags = useTagStore((s) => s.tags);

  const [type, setType] = useState<TransactionType>(
    initialData?.type ?? "expense",
  );
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.categoryId ?? "",
  );
  const [accountId, setAccountId] = useState<string>(
    initialData?.accountId ?? accounts[0]?.id ?? "",
  );
  const [tagIds, setTagIds] = useState<string[]>(initialData?.tagIds ?? []);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    initialData?.recurrence ?? "none",
  );
  const [date, setDate] = useState<string>(
    initialData?.date ?? new Date().toISOString(),
  );
  const [raw, setRaw] = useState<string>(toRaw(initialData?.amount));
  const [title, setTitle] = useState<string>(initialData?.title ?? "");
  const [description, setDescription] = useState<string>(
    initialData?.description ?? "",
  );
  const [attachments, setAttachments] = useState<Attachment[]>(
    initialData?.attachments ?? [],
  );
  const [pickerBusy, setPickerBusy] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
  }, [accountId, accounts]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedTags = tags.filter((t) => tagIds.includes(t.id));

  const accent = type === "expense" ? COLORS.expense : COLORS.income;
  const gradientColors: readonly [string, string] =
    type === "expense" ? ["#FB7185", "#E11D48"] : ["#34D399", "#059669"];

  const typeCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );
  const availableCategoryIds = useMemo(
    () => new Set(typeCategories.map((c) => c.id)),
    [typeCategories],
  );
  const selectedCategory = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    if (categoryId && !availableCategoryIds.has(categoryId)) setCategoryId("");
  }, [categoryId, availableCategoryIds]);

  const scale = useSharedValue(1);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    scale.value = withSequence(
      withTiming(1.05, { duration: 70, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
    );
  }, [raw]);
  const amountAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleKey = (k: KeypadKey) => {
    setRaw((r) => applyKey(r, k));
  };
  const handleClearLong = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setRaw("");
  };

  const numeric = parseFloat(raw || "0");
  const canSubmit = numeric > 0 && categoryId !== "" && accountId !== "";

  const handleSubmit = () => {
    if (numeric <= 0) {
      Alert.alert("Atenção", "Introduz um valor maior que zero.");
      return;
    }
    if (!categoryId) {
      Alert.alert("Atenção", "Seleciona uma categoria.");
      return;
    }
    if (!accountId) {
      Alert.alert("Atenção", "Seleciona uma conta.");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    onSubmit({
      title: title.trim() || undefined,
      amount: numeric,
      type,
      categoryId,
      accountId,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
      date,
      description: description.trim() || undefined,
      recurrence,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  const runPicker = async (fn: () => Promise<Attachment[]>) => {
    if (pickerBusy) return;
    setPickerBusy(true);
    try {
      const picked = await fn();
      if (picked.length > 0) {
        setAttachments((prev) => [...prev, ...picked]);
        if (Platform.OS !== "web") {
          Haptics.selectionAsync().catch(() => {});
        }
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível anexar o ficheiro.");
    } finally {
      setPickerBusy(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) deleteAttachmentFile(target);
      return prev.filter((a) => a.id !== id);
    });
  };

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const { display, isEmpty } = formatAmount(raw);
  const amountColor = isEmpty ? COLORS.placeholder : accent;

  return (
    <View style={[styles.container, { paddingTop: 16 }]}>
      <View style={styles.typeRow}>
        {(["expense", "income"] as const).map((t) => {
          const active = type === t;
          const tAccent = t === "expense" ? COLORS.expense : COLORS.income;
          const label = t === "expense" ? "Despesa" : "Receita";
          const icon = t === "expense" ? "arrow-down-left" : "arrow-up-right";
          return (
            <Pressable
              key={t}
              onPress={() => {
                if (Platform.OS !== "web")
                  Haptics.selectionAsync().catch(() => {});
                setType(t);
              }}
              style={[
                styles.typePill,
                active && { backgroundColor: tAccent, borderColor: tAccent },
              ]}
            >
              <Feather
                name={icon as any}
                size={14}
                color={active ? "#FFF" : COLORS.text.secondary}
              />
              <ThemedText
                style={[
                  styles.typePillLabel,
                  { color: active ? "#FFF" : COLORS.text.secondary },
                ]}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.amountBlock}>
        <View style={styles.amountRow}>
          <View style={styles.currencyStack}>
            <ThemedText style={[styles.currencyMark, { color: amountColor }]}>
              {type === "expense" ? "−" : "+"}
            </ThemedText>
            <ThemedText
              style={[styles.currencyCode, { color: COLORS.text.tertiary }]}
            >
              {DEFAULT_CURRENCY_SYMBOL}
            </ThemedText>
          </View>
          <Animated.Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
            style={[styles.amountText, { color: amountColor }, amountAnim]}
          >
            {display}
          </Animated.Text>
        </View>
      </View>

      <View style={styles.metaCard}>
        <MetaRow
          iconName="tag"
          label="Categoria"
          onPress={() => setShowCategoryModal(true)}
          isFirst
        >
          {selectedCategory ? (
            <View style={styles.metaValueDotRow}>
              <View
                style={[
                  styles.metaDot,
                  { backgroundColor: selectedCategory.color },
                ]}
              />
              <ThemedText style={styles.metaValue} numberOfLines={1}>
                {selectedCategory.name}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={[styles.metaValue, styles.metaValueMuted]}>
              Selecionar
            </ThemedText>
          )}
        </MetaRow>
        <MetaRow
          iconName="briefcase"
          label="Conta"
          onPress={() => setShowAccountModal(true)}
        >
          {selectedAccount ? (
            <View style={styles.metaValueDotRow}>
              <View
                style={[
                  styles.metaDot,
                  { backgroundColor: selectedAccount.color },
                ]}
              />
              <ThemedText style={styles.metaValue} numberOfLines={1}>
                {selectedAccount.name}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={[styles.metaValue, styles.metaValueMuted]}>
              Selecionar
            </ThemedText>
          )}
        </MetaRow>
        <MetaRow
          iconName="hash"
          label="Etiquetas"
          onPress={() => setShowTagModal(true)}
        >
          {selectedTags.length > 0 ? (
            <View style={styles.tagInline}>
              {selectedTags.slice(0, 2).map((t) => (
                <View
                  key={t.id}
                  style={[
                    styles.tagInlineChip,
                    { backgroundColor: t.color + "1A", borderColor: t.color },
                  ]}
                >
                  <ThemedText
                    style={[styles.tagInlineLabel, { color: t.color }]}
                  >
                    {t.name}
                  </ThemedText>
                </View>
              ))}
              {selectedTags.length > 2 && (
                <ThemedText
                  style={[styles.metaValue, { color: COLORS.text.tertiary }]}
                >
                  +{selectedTags.length - 2}
                </ThemedText>
              )}
            </View>
          ) : (
            <ThemedText style={[styles.metaValue, styles.metaValueMuted]}>
              Nenhuma
            </ThemedText>
          )}
        </MetaRow>
        <MetaRow
          iconName="calendar"
          label="Data"
          onPress={() => setShowDateModal(true)}
        >
          <ThemedText style={styles.metaValue} numberOfLines={1}>
            {dateLabel(date)}
          </ThemedText>
        </MetaRow>
        <MetaRow
          iconName="repeat"
          label="Recorrência"
          onPress={() => setShowRecurrenceModal(true)}
        >
          <ThemedText
            style={[
              styles.metaValue,
              recurrence === "none" && styles.metaValueMuted,
            ]}
            numberOfLines={1}
          >
            {recurrence === "none"
              ? "Sem repetição"
              : RECURRENCE_LABELS[recurrence]}
          </ThemedText>
        </MetaRow>
        <MetaRow
          iconName="paperclip"
          label="Anexos"
          onPress={() => setShowAttachmentsModal(true)}
        >
          {attachments.length > 0 ? (
            <View style={styles.attachInline}>
              {attachments.slice(0, 3).map((a) =>
                isImage(a) ? (
                  <Image
                    key={a.id}
                    source={{ uri: a.uri }}
                    style={styles.attachThumb}
                    contentFit="cover"
                  />
                ) : (
                  <View key={a.id} style={[styles.attachThumb, styles.attachDocThumb]}>
                    <Feather name="file" size={14} color={COLORS.text.secondary} />
                  </View>
                ),
              )}
              {attachments.length > 3 && (
                <ThemedText
                  style={[styles.metaValue, { color: COLORS.text.tertiary }]}
                >
                  +{attachments.length - 3}
                </ThemedText>
              )}
            </View>
          ) : (
            <ThemedText style={[styles.metaValue, styles.metaValueMuted]}>
              Adicionar
            </ThemedText>
          )}
        </MetaRow>
        <MetaRow
          iconName="edit-3"
          label="Notas"
          onPress={() => setShowNotesModal(true)}
          isLast
        >
          <ThemedText
            style={[
              styles.metaValue,
              !title && !description && styles.metaValueMuted,
            ]}
            numberOfLines={1}
          >
            {title || description || "Adicionar..."}
          </ThemedText>
        </MetaRow>
      </View>

      <View style={styles.spacer} />

      <Animated.View
        entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
        style={[styles.padDeck, { paddingBottom: Math.max(insets.bottom, 14) }]}
      >
        <View style={styles.padDeckHandle} />
        <NumericKeypad
          onKeyPress={handleKey}
          onBackspaceLongPress={handleClearLong}
          accentColor={COLORS.text.primary}
        />
        <View style={styles.ctaWrap}>
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
          >
            <LinearGradient
              colors={canSubmit ? gradientColors : ["#CBD5E1", "#94A3B8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.ctaBtn,
                canSubmit && {
                  shadowColor: accent,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  elevation: 6,
                },
              ]}
            >
              <View style={styles.ctaCheck}>
                <Feather
                  name="check"
                  size={18}
                  color={canSubmit ? accent : COLORS.text.tertiary}
                />
              </View>
              <ThemedText style={styles.ctaLabel}>
                {initialData?.id
                  ? "Guardar alterações"
                  : "Confirmar lançamento"}
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>

      {/* Category modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Categoria</ThemedText>
            <Pressable onPress={() => setShowCategoryModal(false)} hitSlop={8}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.categoryList}>
            {typeCategories.length === 0 ? (
              <View style={styles.emptyModalState}>
                <ThemedText
                  variant="caption"
                  style={{ color: COLORS.text.secondary }}
                >
                  Não existem categorias para este tipo.
                </ThemedText>
              </View>
            ) : (
              typeCategories.map((c) => {
                const sel = categoryId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    style={[
                      styles.categoryItem,
                      sel && {
                        backgroundColor: c.color + "14",
                        borderColor: c.color,
                      },
                    ]}
                    onPress={() => {
                      setCategoryId(c.id);
                      setShowCategoryModal(false);
                    }}
                  >
                    <CategoryIcon icon={c.icon} color={c.color} size={36} />
                    <ThemedText variant="body" style={{ flex: 1 }}>
                      {c.name}
                    </ThemedText>
                    {sel && <Feather name="check" size={18} color={c.color} />}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Recurrence modal */}
      <Modal
        visible={showRecurrenceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecurrenceModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Recorrência</ThemedText>
            <Pressable
              onPress={() => setShowRecurrenceModal(false)}
              hitSlop={8}
            >
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          {RECURRENCE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.recurrenceItem,
                recurrence === opt.value && {
                  backgroundColor: COLORS.primaryMuted,
                },
              ]}
              onPress={() => {
                setRecurrence(opt.value);
                setShowRecurrenceModal(false);
              }}
            >
              <ThemedText variant="body">{opt.label}</ThemedText>
              {recurrence === opt.value && (
                <Feather name="check" size={18} color={COLORS.primary} />
              )}
            </Pressable>
          ))}
        </View>
      </Modal>

      {/* Notes modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowNotesModal(false)} hitSlop={8}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
            <ThemedText variant="title">Detalhes</ThemedText>
            <Pressable onPress={() => setShowNotesModal(false)} hitSlop={8}>
              <ThemedText style={styles.notesDone}>OK</ThemedText>
            </Pressable>
          </View>
          <View style={styles.notesBody}>
            <View>
              <ThemedText variant="label" style={styles.notesFieldLabel}>
                Título
              </ThemedText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Se vazio, usamos a categoria"
                placeholderTextColor={COLORS.placeholder}
                style={styles.notesInput}
                maxLength={80}
              />
            </View>
            <View>
              <ThemedText variant="label" style={styles.notesFieldLabel}>
                Descrição
              </ThemedText>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Notas adicionais..."
                placeholderTextColor={COLORS.placeholder}
                style={[styles.notesInput, styles.notesTextarea]}
                multiline
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Account modal */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Conta</ThemedText>
            <Pressable onPress={() => setShowAccountModal(false)} hitSlop={8}>
              <Feather name="x" size={22} color={COLORS.text.secondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.categoryList}>
            {accounts.length === 0 ? (
              <View style={styles.emptyModalState}>
                <ThemedText
                  variant="caption"
                  style={{ color: COLORS.text.secondary }}
                >
                  Não existem contas. Cria uma nas Definições.
                </ThemedText>
              </View>
            ) : (
              accounts.map((a) => {
                const sel = accountId === a.id;
                return (
                  <Pressable
                    key={a.id}
                    style={[
                      styles.categoryItem,
                      sel && {
                        backgroundColor: a.color + "14",
                        borderColor: a.color,
                      },
                    ]}
                    onPress={() => {
                      setAccountId(a.id);
                      setShowAccountModal(false);
                    }}
                  >
                    <View
                      style={[
                        styles.accountIconBg,
                        { backgroundColor: a.color + "1A" },
                      ]}
                    >
                      <Feather
                        name={(a.icon || ACCOUNT_TYPE_ICONS[a.type]) as any}
                        size={18}
                        color={a.color}
                      />
                    </View>
                    <ThemedText variant="body" style={{ flex: 1 }}>
                      {a.name}
                    </ThemedText>
                    {sel && <Feather name="check" size={18} color={a.color} />}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Tags modal */}
      <Modal
        visible={showTagModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Etiquetas</ThemedText>
            <Pressable onPress={() => setShowTagModal(false)} hitSlop={8}>
              <ThemedText style={styles.notesDone}>OK</ThemedText>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.categoryList}>
            {tags.length === 0 ? (
              <View style={styles.emptyModalState}>
                <ThemedText
                  variant="caption"
                  style={{ color: COLORS.text.secondary, textAlign: "center" }}
                >
                  Sem etiquetas ainda.
                </ThemedText>
                <Pressable
                  style={styles.addTagBtn}
                  onPress={() => {
                    setShowTagModal(false);
                    router.push("/tags");
                  }}
                >
                  <Feather name="plus" size={14} color={COLORS.primary} />
                  <ThemedText
                    style={{
                      color: COLORS.primary,
                      fontWeight: "600" as const,
                    }}
                  >
                    Criar etiqueta
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <>
                {tags.map((t) => {
                  const sel = tagIds.includes(t.id);
                  return (
                    <Pressable
                      key={t.id}
                      style={[
                        styles.categoryItem,
                        sel && {
                          backgroundColor: t.color + "14",
                          borderColor: t.color,
                        },
                      ]}
                      onPress={() => toggleTag(t.id)}
                    >
                      <View
                        style={[styles.tagSwatch, { backgroundColor: t.color }]}
                      />
                      <ThemedText variant="body" style={{ flex: 1 }}>
                        {t.name}
                      </ThemedText>
                      {sel && (
                        <Feather name="check" size={18} color={t.color} />
                      )}
                    </Pressable>
                  );
                })}
                <Pressable
                  style={styles.addTagBtn}
                  onPress={() => {
                    setShowTagModal(false);
                    router.push("/tags");
                  }}
                >
                  <Feather name="plus" size={14} color={COLORS.primary} />
                  <ThemedText
                    style={{
                      color: COLORS.primary,
                      fontWeight: "600" as const,
                    }}
                  >
                    Nova etiqueta
                  </ThemedText>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Attachments modal */}
      <Modal
        visible={showAttachmentsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAttachmentsModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Anexos</ThemedText>
            <Pressable onPress={() => setShowAttachmentsModal(false)} hitSlop={8}>
              <ThemedText style={styles.notesDone}>OK</ThemedText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.attachBody}>
            <View style={styles.attachActions}>
              <Pressable
                style={[styles.attachActionBtn, pickerBusy && { opacity: 0.5 }]}
                onPress={() => runPicker(takePhoto)}
                disabled={pickerBusy}
              >
                <Feather name="camera" size={20} color={COLORS.primary} />
                <ThemedText style={styles.attachActionLabel}>Câmara</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.attachActionBtn, pickerBusy && { opacity: 0.5 }]}
                onPress={() => runPicker(pickFromGallery)}
                disabled={pickerBusy}
              >
                <Feather name="image" size={20} color={COLORS.primary} />
                <ThemedText style={styles.attachActionLabel}>Galeria</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.attachActionBtn, pickerBusy && { opacity: 0.5 }]}
                onPress={() => runPicker(pickDocument)}
                disabled={pickerBusy}
              >
                <Feather name="file-text" size={20} color={COLORS.primary} />
                <ThemedText style={styles.attachActionLabel}>Documento</ThemedText>
              </Pressable>
            </View>

            {attachments.length === 0 ? (
              <View style={styles.attachEmpty}>
                <Feather name="paperclip" size={28} color={COLORS.text.tertiary} />
                <ThemedText
                  variant="caption"
                  style={{ color: COLORS.text.secondary, marginTop: 8 }}
                >
                  Sem anexos. Adiciona um recibo ou comprovativo.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.attachList}>
                {attachments.map((a) => (
                  <View key={a.id} style={styles.attachItem}>
                    {isImage(a) ? (
                      <Image
                        source={{ uri: a.uri }}
                        style={styles.attachItemThumb}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[styles.attachItemThumb, styles.attachItemDocThumb]}
                      >
                        <Feather
                          name="file"
                          size={20}
                          color={COLORS.text.secondary}
                        />
                      </View>
                    )}
                    <View style={styles.attachItemInfo}>
                      <ThemedText
                        variant="body"
                        numberOfLines={1}
                        style={{ fontWeight: "600" as const }}
                      >
                        {a.name}
                      </ThemedText>
                      <ThemedText
                        variant="caption"
                        style={{ color: COLORS.text.tertiary }}
                      >
                        {a.kind === "image" ? "Imagem" : "Documento"}
                        {a.size ? ` · ${formatFileSize(a.size)}` : ""}
                      </ThemedText>
                    </View>
                    <Pressable
                      hitSlop={10}
                      onPress={() => removeAttachment(a.id)}
                      style={styles.attachRemoveBtn}
                    >
                      <Feather name="trash-2" size={18} color={COLORS.expense} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <DatePickerModal
        visible={showDateModal}
        value={date}
        onSelect={setDate}
        onClose={() => setShowDateModal(false)}
        maxDate={new Date()}
      />
    </View>
  );
}

const makeStyles = (COLORS: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 2,
    },
    headerBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    headerTitle: {
      fontSize: 12,
      fontWeight: "700" as const,
      color: COLORS.text.tertiary,
      letterSpacing: 0.8,
      textTransform: "uppercase" as const,
    },
    typeRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 6,
      justifyContent: "center",
    },
    typePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    typePillLabel: {
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
    amountBlock: {
      paddingHorizontal: 20,
      height: 84,
      justifyContent: "center",
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 8,
    },
    currencyStack: {
      alignItems: "flex-end",
      justifyContent: "center",
      paddingTop: 6,
    },
    currencyMark: {
      fontSize: 22,
      fontWeight: "700" as const,
      lineHeight: 24,
      includeFontPadding: false,
    },
    currencyCode: {
      fontSize: 12,
      fontWeight: "600" as const,
      letterSpacing: 1,
      lineHeight: 14,
      includeFontPadding: false,
      marginTop: 2,
    },
    amountText: {
      fontSize: 46,
      fontWeight: "700" as const,
      letterSpacing: -1.4,
      textAlign: "right",
      includeFontPadding: false,
      flexShrink: 1,
    },
    metaCard: {
      marginHorizontal: 16,
      backgroundColor: COLORS.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: COLORS.border,
      overflow: "hidden",
    },
    metaValueDotRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },
    metaDot: { width: 8, height: 8, borderRadius: 4 },
    metaValue: {
      fontSize: 15,
      fontWeight: "600" as const,
      color: COLORS.text.primary,
      flexShrink: 1,
    },
    metaValueMuted: { color: COLORS.text.tertiary, fontWeight: "500" as const },
    spacer: { flex: 1, minHeight: 8 },
    padDeck: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 8,
    },
    padDeckHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: COLORS.border,
      alignSelf: "center",
      marginBottom: 4,
    },
    ctaWrap: { paddingHorizontal: 16, paddingTop: 10 },
    ctaBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 18,
    },
    ctaCheck: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    ctaLabel: {
      color: "#FFF",
      fontWeight: "700" as const,
      fontSize: 15,
      letterSpacing: 0.3,
    },
    modal: { flex: 1, backgroundColor: COLORS.background },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    categoryList: { padding: 16, paddingBottom: 40, gap: 10 },
    categoryItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
    },
    emptyModalState: { paddingVertical: 32, alignItems: "center" },
    recurrenceItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    notesBody: { padding: 20, gap: 16 },
    notesFieldLabel: { marginBottom: 6 },
    notesDone: {
      color: COLORS.primary,
      fontWeight: "600" as const,
      fontSize: 15,
    },
    notesInput: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: COLORS.text.primary,
    },
    notesTextarea: { minHeight: 110, textAlignVertical: "top" as const },
    tagInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
      flexWrap: "wrap",
    },
    tagInlineChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
    },
    tagInlineLabel: {
      fontSize: 11,
      fontWeight: "600" as const,
    },
    accountIconBg: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    tagSwatch: { width: 14, height: 14, borderRadius: 7 },
    addTagBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      marginTop: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "dashed" as const,
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primaryMuted,
    },
    attachInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
    },
    attachThumb: {
      width: 28,
      height: 28,
      borderRadius: 7,
      backgroundColor: COLORS.surfaceVariant,
    },
    attachDocThumb: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    attachBody: { padding: 16, paddingBottom: 40, gap: 16 },
    attachActions: {
      flexDirection: "row",
      gap: 10,
    },
    attachActionBtn: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: COLORS.primaryMuted,
      borderWidth: 1,
      borderColor: COLORS.primary + "30",
    },
    attachActionLabel: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: COLORS.primary,
      letterSpacing: 0.2,
    },
    attachEmpty: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
    },
    attachList: { gap: 10 },
    attachItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 10,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 14,
    },
    attachItemThumb: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: COLORS.surfaceVariant,
    },
    attachItemDocThumb: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    attachItemInfo: { flex: 1, gap: 2 },
    attachRemoveBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      backgroundColor: COLORS.surfaceVariant,
    },
  });

const makeMetaStyles = (COLORS: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: COLORS.surface,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.border,
    },
    rowPressed: { backgroundColor: COLORS.surfaceVariant },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: COLORS.surfaceVariant,
      alignItems: "center",
      justifyContent: "center",
    },
    textStack: {
      flex: 1,
      flexDirection: "column",
      gap: 2,
    },
    label: {
      fontSize: 11,
      fontWeight: "600" as const,
      color: COLORS.text.tertiary,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
    },
    valueWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
  });
