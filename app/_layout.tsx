import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/error-boundary";
import { useColors, useIsDark } from "@/src/hooks/use-colors";
import { useAccountStore } from "@/src/store/use-account-store";
import { useSettingsStore } from "@/src/store/use-settings-store";
import { useTagStore } from "@/src/store/use-tag-store";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function useOnboardingGate() {
  const segments = useSegments();
  const [bootstrapped, setBootstrapped] = useState(false);

  const loadAccounts = useAccountStore((s) => s.loadAccounts);
  const loadTags = useTagStore((s) => s.loadTags);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  const accounts = useAccountStore((s) => s.accounts);
  const accountsReady = useAccountStore((s) => s.initialized);
  const profile = useSettingsStore((s) => s.profile);
  const settingsReady = useSettingsStore((s) => s.initialized);

  useEffect(() => {
    Promise.all([loadAccounts(), loadTags(), loadSettings()]).finally(() =>
      setBootstrapped(true),
    );
  }, []);

  useEffect(() => {
    if (!bootstrapped || !accountsReady || !settingsReady) return;
    const onOnboarding = segments[0] === "onboarding";
    const needsOnboarding =
      accounts.length === 0 || !profile.onboardingCompleted;
    if (needsOnboarding && !onOnboarding) {
      router.replace("/onboarding");
    } else if (!needsOnboarding && onOnboarding) {
      router.replace("/(tabs)");
    }
  }, [
    bootstrapped,
    accountsReady,
    settingsReady,
    accounts.length,
    profile.onboardingCompleted,
    segments,
  ]);

  return bootstrapped && accountsReady && settingsReady;
}

function RootLayoutNav() {
  useOnboardingGate();
  const COLORS = useColors();
  const isDark = useIsDark();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="transaction-form"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="categories" options={{ headerShown: false }} />
        <Stack.Screen name="accounts" options={{ headerShown: false }} />
        <Stack.Screen name="tags" options={{ headerShown: false }} />
        <Stack.Screen name="forecast" options={{ headerShown: false }} />
        <Stack.Screen name="user-settings" options={{ headerShown: false }} />
        <Stack.Screen name="transfer-form" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
