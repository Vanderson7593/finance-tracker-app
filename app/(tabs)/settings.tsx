import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Pressable, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '../../src/components/themed-text';
import { Card } from '../../src/components/card';
import { FormInput } from '../../src/components/form-input';
import { Palette } from '../../constants/colors';
import { useColors } from '../../src/hooks/use-colors';
import { useSettingsStore } from '../../src/store/use-settings-store';
import { ThemePreference } from '../../src/types';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '../../src/hooks/use-notifications';

function SettingRow({
  icon,
  label,
  children,
  COLORS,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
  COLORS: Palette;
}) {
  const rowStyles = useMemo(() => makeRowStyles(COLORS), [COLORS]);
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconBg}>
        <Feather name={icon as any} size={16} color={COLORS.primary} />
      </View>
      <ThemedText variant="body" style={{ flex: 1 }}>{label}</ThemedText>
      {children}
    </View>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Escuro', icon: 'moon' },
  { value: 'system', label: 'Sistema', icon: 'smartphone' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const rowStyles = useMemo(() => makeRowStyles(COLORS), [COLORS]);

  const { settings, profile, updateSettings, updateProfile, setTheme } = useSettingsStore();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile.name);

  const handleDailyReminderToggle = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permissão necessária', 'Ativa as notificações nas definições do sistema.');
        return;
      }
      await scheduleDailyReminder(settings.dailyReminderTime);
    } else {
      await cancelDailyReminder();
    }
    updateSettings({ dailyReminder: val });
  };

  const handleSaveName = () => {
    updateProfile({ name: nameValue });
    setEditingName(false);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <ThemedText variant="title">Definições</ThemedText>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, isWeb && { paddingBottom: 34 }]}>
        {/* Profile */}
        <ThemedText variant="label" style={styles.sectionTitle}>Perfil</ThemedText>
        <Card padding={0} style={styles.card}>
          {editingName ? (
            <View style={{ padding: 16 }}>
              <FormInput label="Nome" value={nameValue} onChangeText={setNameValue} />
              <View style={styles.actionRow}>
                <Pressable onPress={() => setEditingName(false)} style={styles.cancelBtn}>
                  <ThemedText variant="body" style={{ color: COLORS.text.secondary }}>Cancelar</ThemedText>
                </Pressable>
                <Pressable onPress={handleSaveName} style={styles.saveBtn}>
                  <ThemedText variant="body" style={{ color: '#FFF', fontWeight: '600' as const }}>Guardar</ThemedText>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={rowStyles.row} onPress={() => setEditingName(true)}>
              <View style={rowStyles.iconBg}>
                <Feather name="user" size={16} color={COLORS.primary} />
              </View>
              <ThemedText variant="body" style={{ flex: 1 }}>{profile.name}</ThemedText>
              <Feather name="edit-2" size={16} color={COLORS.text.tertiary} />
            </Pressable>
          )}
          <Pressable style={rowStyles.row} onPress={() => router.push('/accounts')}>
            <View style={rowStyles.iconBg}>
              <Feather name="briefcase" size={16} color={COLORS.primary} />
            </View>
            <ThemedText variant="body" style={{ flex: 1 }}>Contas</ThemedText>
            <Feather name="chevron-right" size={16} color={COLORS.text.tertiary} />
          </Pressable>
          <Pressable style={rowStyles.row} onPress={() => router.push('/categories')}>
            <View style={rowStyles.iconBg}>
              <Feather name="tag" size={16} color={COLORS.primary} />
            </View>
            <ThemedText variant="body" style={{ flex: 1 }}>Categorias</ThemedText>
            <Feather name="chevron-right" size={16} color={COLORS.text.tertiary} />
          </Pressable>
          <Pressable style={rowStyles.row} onPress={() => router.push('/tags')}>
            <View style={rowStyles.iconBg}>
              <Feather name="hash" size={16} color={COLORS.primary} />
            </View>
            <ThemedText variant="body" style={{ flex: 1 }}>Etiquetas</ThemedText>
            <Feather name="chevron-right" size={16} color={COLORS.text.tertiary} />
          </Pressable>
          <Pressable style={[rowStyles.row, { borderBottomWidth: 0 }]} onPress={() => router.push('/forecast')}>
            <View style={rowStyles.iconBg}>
              <Feather name="trending-up" size={16} color={COLORS.primary} />
            </View>
            <ThemedText variant="body" style={{ flex: 1 }}>Previsão Financeira</ThemedText>
            <Feather name="chevron-right" size={16} color={COLORS.text.tertiary} />
          </Pressable>
        </Card>

        {/* Appearance */}
        <ThemedText variant="label" style={styles.sectionTitle}>Aparência</ThemedText>
        <Card padding={0} style={styles.card}>
          <View style={styles.themePickerRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = settings.theme === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setTheme(opt.value)}
                  style={[
                    styles.themeOption,
                    active && styles.themeOptionActive,
                  ]}
                >
                  <Feather
                    name={opt.icon as any}
                    size={18}
                    color={active ? COLORS.primary : COLORS.text.secondary}
                  />
                  <ThemedText
                    variant="caption"
                    style={[
                      styles.themeOptionLabel,
                      { color: active ? COLORS.primary : COLORS.text.secondary, fontWeight: active ? '600' : '500' },
                    ]}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Notifications */}
        <ThemedText variant="label" style={styles.sectionTitle}>Notificações</ThemedText>
        <Card padding={0} style={styles.card}>
          <SettingRow icon="eye" label="Mostrar valores" COLORS={COLORS}>
            <Switch
              value={settings.showAmounts}
              onValueChange={(val) => updateSettings({ showAmounts: val })}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFF"
            />
          </SettingRow>
          <SettingRow icon="bell" label="Lembrete diário" COLORS={COLORS}>
            <Switch
              value={settings.dailyReminder}
              onValueChange={handleDailyReminderToggle}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFF"
            />
          </SettingRow>
          {settings.dailyReminder && (
            <View style={[rowStyles.row]}>
              <View style={rowStyles.iconBg}>
                <Feather name="clock" size={16} color={COLORS.primary} />
              </View>
              <ThemedText variant="body" style={{ flex: 1 }}>Hora do lembrete</ThemedText>
              <ThemedText variant="body" style={{ color: COLORS.primary, fontWeight: '600' as const }}>
                {settings.dailyReminderTime}
              </ThemedText>
            </View>
          )}
          <SettingRow icon="alert-triangle" label="Alertas de orçamento" COLORS={COLORS}>
            <Switch
              value={settings.budgetAlerts}
              onValueChange={(val) => updateSettings({ budgetAlerts: val })}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFF"
            />
          </SettingRow>
          <View style={[rowStyles.row, { borderBottomWidth: 0 }]}>
            <SettingRow icon="bar-chart" label="Relatório semanal" COLORS={COLORS}>
              <Switch
                value={settings.weeklyReport}
                onValueChange={(val) => updateSettings({ weeklyReport: val })}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#FFF"
              />
            </SettingRow>
          </View>
        </Card>

        <ThemedText variant="caption" style={styles.version}>Kumbu+ v1.0.0 · MVP</ThemedText>
      </ScrollView>
    </View>
  );
}

const makeRowStyles = (COLORS: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionTitle: { marginTop: 24, marginBottom: 8, paddingHorizontal: 4 },
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: COLORS.surfaceVariant },
  saveBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: COLORS.primary },
  version: { textAlign: 'center', marginTop: 32 },
  themePickerRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  themeOptionLabel: {
    letterSpacing: 0.2,
  },
});
