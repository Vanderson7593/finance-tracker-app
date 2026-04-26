import React, { useState } from "react";
import { View, StyleSheet, Modal, Pressable, Platform } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "../hooks/use-colors";
import { ThemedText } from "./themed-text";
import { Palette } from "../../constants/colors";

export interface ReorderEntry {
  id: string;
  label: string;
}

interface Props {
  visible: boolean;
  entries: ReorderEntry[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
}

export function ReorderModal({ visible, entries, onSave, onClose }: Props) {
  const COLORS = useColors();
  const s = makeStyles(COLORS);
  const [data, setData] = useState<ReorderEntry[]>(entries);

  // Sync when entries change (modal reopens)
  React.useEffect(() => {
    if (visible) setData(entries);
  }, [visible]);

  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ReorderEntry>) => (
    <ScaleDecorator activeScale={1.03}>
      <Pressable
        onLongPress={() => {
          if (Platform.OS !== "web")
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          drag();
        }}
        style={[
          s.row,
          { borderBottomColor: COLORS.border },
          isActive && { backgroundColor: COLORS.surfaceVariant },
        ]}
      >
        <View style={[s.handleWrap, { backgroundColor: COLORS.border + "80" }]}>
          <Feather name="menu" size={16} color={COLORS.text.tertiary} />
        </View>
        <ThemedText style={s.label}>{item.label}</ThemedText>
        <Feather name="align-justify" size={14} color={COLORS.text.tertiary} />
      </Pressable>
    </ScaleDecorator>
  );

  const handleSave = () => {
    onSave(data.map((e) => e.id));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable
          style={[s.sheet, { backgroundColor: COLORS.surface }]}
          onPress={() => {}}
        >
          <View style={[s.handle, { backgroundColor: COLORS.border }]} />

          <View style={s.header}>
            <ThemedText style={s.title}>Organizar relatórios</ThemedText>
            <ThemedText style={[s.hint, { color: COLORS.text.tertiary }]}>
              Mantém premido para arrastar
            </ThemedText>
          </View>

          <GestureHandlerRootView style={{ maxHeight: 660 }}>
            <DraggableFlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              onDragEnd={({ data: next }) => setData(next)}
              activationDistance={5}
              scrollEnabled
            />
          </GestureHandlerRootView>

          <View style={[s.footer, { borderTopColor: COLORS.border }]}>
            <Pressable
              style={[s.btn, { backgroundColor: COLORS.surfaceVariant }]}
              onPress={onClose}
            >
              <ThemedText
                style={{
                  color: COLORS.text.secondary,
                  fontWeight: "600" as const,
                }}
              >
                Cancelar
              </ThemedText>
            </Pressable>
            <Pressable
              style={[s.btn, { backgroundColor: COLORS.primary }]}
              onPress={handleSave}
            >
              <ThemedText style={{ color: "#FFF", fontWeight: "700" as const }}>
                Guardar
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (C: Palette) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "flex-end",
    },
    sheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 32,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 8,
    },
    header: { paddingHorizontal: 20, paddingVertical: 14 },
    title: { fontSize: 16, fontWeight: "700" as const },
    hint: { fontSize: 12, marginTop: 3 },
    row: {
      height: 58,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      gap: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      backgroundColor: C.surface,
    },
    handleWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    label: { flex: 1, fontSize: 15, fontWeight: "500" as const },
    footer: {
      flexDirection: "row",
      gap: 12,
      padding: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: 8,
    },
    btn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
  });
