import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '../src/components/themed-text';
import { Palette } from '../constants/colors';
import { useColors } from '../src/hooks/use-colors';
import { useAccountStore } from '../src/store/use-account-store';
import { useSettingsStore } from '../src/store/use-settings-store';
import { generateId } from '../src/lib/uuid';
import { ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_LABELS } from '../src/constants';
import { AccountType } from '../src/types';

const TYPE_OPTIONS: AccountType[] = ['cash', 'bank', 'card', 'wallet', 'savings'];
const TYPE_COLORS: Record<AccountType, string> = {
  cash: '#22C55E',
  bank: '#6366F1',
  card: '#F97316',
  wallet: '#A855F7',
  savings: '#14B8A6',
};

export default function OnboardingScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [name, setName] = useState('Conta');
  const [type, setType] = useState<AccountType>('cash');
  const [submitting, setSubmitting] = useState(false);

  const addAccount = useAccountStore((s) => s.addAccount);
  const updateProfile = useSettingsStore((s) => s.updateProfile);

  const handleStart = async () => {
    const trimmed = name.trim() || 'Conta';
    if (submitting) return;
    setSubmitting(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    await addAccount({
      id: generateId(),
      name: trimmed,
      type,
      icon: ACCOUNT_TYPE_ICONS[type],
      color: TYPE_COLORS[type],
      initialBalance: 0,
      createdAt: new Date().toISOString(),
    });
    await updateProfile({ onboardingCompleted: true });
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#EEF2FF', '#F8F9FC']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={[
            styles.container,
            { paddingTop: insets.top + 32, paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Animated.View entering={FadeInUp.duration(420)} style={styles.brandRow}>
            <LinearGradient
              colors={['#818CF8', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandMark}
            >
              <Feather name="trending-up" size={22} color="#FFF" />
            </LinearGradient>
            <ThemedText style={styles.brandText}>Kumbu+</ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(480).delay(60)} style={styles.intro}>
            <ThemedText style={styles.kicker}>Boas-vindas</ThemedText>
            <ThemedText style={styles.title}>Vamos começar pela{'\n'}tua primeira conta</ThemedText>
            <ThemedText style={styles.subtitle}>
              Cada lançamento pertence a uma conta. Cria a tua principal — podes adicionar
              mais nas Definições.
            </ThemedText>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(520).delay(140)}
            style={styles.card}
          >
            <ThemedText style={styles.fieldLabel}>Nome da conta</ThemedText>
            <Pressable onPress={() => inputRef.current?.focus()} style={styles.inputBox}>
              <TextInput
                ref={inputRef}
                value={name}
                onChangeText={setName}
                placeholder="Conta"
                placeholderTextColor={COLORS.text.tertiary}
                style={styles.input}
                maxLength={32}
                autoCapitalize="sentences"
                returnKeyType="done"
                onSubmitEditing={handleStart}
              />
            </Pressable>

            <ThemedText style={[styles.fieldLabel, { marginTop: 18 }]}>Tipo</ThemedText>
            <View style={styles.typeGrid}>
              {TYPE_OPTIONS.map((opt) => {
                const active = type === opt;
                const color = TYPE_COLORS[opt];
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                      setType(opt);
                    }}
                    style={[
                      styles.typePill,
                      active && {
                        backgroundColor: color + '14',
                        borderColor: color,
                      },
                    ]}
                  >
                    <Feather
                      name={ACCOUNT_TYPE_ICONS[opt] as any}
                      size={14}
                      color={active ? color : COLORS.text.secondary}
                    />
                    <ThemedText
                      style={[
                        styles.typePillLabel,
                        { color: active ? color : COLORS.text.secondary },
                      ]}
                    >
                      {ACCOUNT_TYPE_LABELS[opt]}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          <View style={{ flex: 1 }} />

          <Animated.View entering={FadeInDown.duration(540).delay(220)}>
            <Pressable
              onPress={handleStart}
              disabled={submitting}
              style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}
              >
                <ThemedText style={styles.ctaLabel}>Começar</ThemedText>
                <Feather name="arrow-right" size={18} color="#FFF" />
              </LinearGradient>
            </Pressable>
            <ThemedText style={styles.footnote}>
              Os teus dados ficam guardados apenas no dispositivo.
            </ThemedText>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
    color: COLORS.text.primary,
  },
  intro: { marginTop: 36 },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.6,
    fontWeight: '600' as const,
    color: COLORS.primary,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.secondary,
    maxWidth: 320,
  },
  card: {
    marginTop: 28,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  inputBox: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.text.primary,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typePillLabel: { fontSize: 13, fontWeight: '600' as const },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  ctaLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
  },
  footnote: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
});
