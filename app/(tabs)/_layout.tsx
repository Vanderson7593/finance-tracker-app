import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Palette } from "@/constants/colors";
import { useColors } from "@/src/hooks/use-colors";

type TabConfig = {
  name: string;
  icon: keyof typeof Feather.glyphMap;
  sfSymbol: { default: string; selected: string };
};

const TAB_CONFIG: TabConfig[] = [
  {
    name: "index",
    icon: "home",
    sfSymbol: { default: "house", selected: "house.fill" },
  },
  {
    name: "transactions",
    icon: "list",
    sfSymbol: { default: "list.bullet", selected: "list.bullet" },
  },
  {
    name: "reports",
    icon: "bar-chart-2",
    sfSymbol: { default: "chart.bar", selected: "chart.bar.fill" },
  },
  {
    name: "budgets",
    icon: "target",
    sfSymbol: { default: "target", selected: "target" },
  },
];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={styles.container}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const tab = TAB_CONFIG.find((t) => t.name === route.name);
          if (!tab) return null;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                if (!isFocused) navigation.navigate(route.name);
              }}
              style={styles.tab}
              activeOpacity={0.75}
            >
              <View
                style={[styles.iconWrap, isFocused && styles.iconWrapActive]}
              >
                {isIOS ? (
                  <SymbolView
                    name={
                      isFocused ? tab.sfSymbol.selected : tab.sfSymbol.default
                    }
                    tintColor={
                      isFocused ? COLORS.surface : COLORS.text.tertiary
                    }
                    size={20}
                  />
                ) : (
                  <Feather
                    name={tab.icon}
                    size={20}
                    color={isFocused ? COLORS.surface : COLORS.text.tertiary}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (COLORS: Palette) =>
  StyleSheet.create({
    wrapper: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    container: {
      flexDirection: "row",
      backgroundColor: COLORS.surface,
      borderRadius: 28,
      paddingVertical: 8,
      paddingHorizontal: 6,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
    },
    iconWrap: {
      width: 44,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapActive: {
      backgroundColor: COLORS.primary,
    },
  });

function NativeTabLayout() {
  return (
    <NativeTabs labelVisibilityMode="unlabeled">
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label hidden>Início</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet" }} />
        <Label hidden>Transações</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reports">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label hidden>Relatórios</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="budgets">
        <Icon sf={{ default: "target", selected: "target" }} />
        <Label hidden>Orçamento</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="budgets" />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
