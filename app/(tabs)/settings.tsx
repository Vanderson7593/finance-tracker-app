import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Pressable, Alert, Platform, Modal, Share, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import { ThemedText } from '../../src/components/themed-text';
import { Card } from '../../src/components/card';
import { FormInput } from '../../src/components/form-input';
import { Palette } from '../../constants/colors';
import { useColors } from '../../src/hooks/use-colors';
import { useSettingsStore } from '../../src/store/use-settings-store';
import { useTransactionStore } from '../../src/store/use-transaction-store';
import { useAccountStore } from '../../src/store/use-account-store';
import { useCategoryStore } from '../../src/store/use-category-store';
import { useBudgetStore } from '../../src/store/use-budget-store';
import { useTagStore } from '../../src/store/use-tag-store';
import { ThemePreference } from '../../src/types';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '../../src/hooks/use-notifications';

const makeRowStyles = (COLORS: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  iconBg: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
});

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingBottom: 4 },
  backBtn: { width: 34, height: 34, alignItems: 'center' as const, justifyContent: 'center' as const },
  profileHero: { alignItems: 'center' as const, paddingVertical: 20, paddingHorizontal: 20, gap: 12 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  avatarText: { fontSize: 26, fontWeight: '800' as const, color: '#FFF', letterSpacing: 1 },
  nameRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  heroName: { fontSize: 20, fontWeight: '700' as const, color: COLORS.text.primary },
  nameEdit: { width: '100%' as const, gap: 8 },
  actionRow: { flexDirection: 'row' as const, gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center' as const, borderRadius: 10, backgroundColor: COLORS.surfaceVariant },
  saveBtn: { flex: 1, padding: 12, alignItems: 'center' as const, borderRadius: 10, backgroundColor: COLORS.primary },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  sectionTitle: { marginTop: 24, marginBottom: 8, paddingHorizontal: 4 },
  card: { borderRadius: 16, overflow: 'hidden' as const, marginBottom: 4 },
  version: { textAlign: 'center' as const, marginTop: 32 },
  themePickerRow: { flexDirection: 'row' as const, padding: 8, gap: 6 },
  themeOption: {
    flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const,
    gap: 6, paddingVertical: 14, borderRadius: 12,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1, borderColor: 'transparent' as const,
  },
  themeOptionActive: { backgroundColor: COLORS.primaryMuted, borderColor: COLORS.primary },
  themeOptionLabel: { letterSpacing: 0.2 },
  timePill: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  timePillText: { fontSize: 15, fontWeight: '700' as const },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  modalBox: {
    width: 280, borderRadius: 24, padding: 28,
    alignItems: 'center' as const, gap: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' as const },
  timeRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  timeCol: { alignItems: 'center' as const, gap: 8 },
  timeArrow: { padding: 4 },
  timeBox: { width: 72, height: 72, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const },
  timeValue: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -1 },
  timeSep: { fontSize: 34, fontWeight: '800' as const, marginBottom: 8 },
  modalSave: {
    width: '100%' as const, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center' as const,
  },
  modalSaveText: { color: '#FFF', fontSize: 15, fontWeight: '700' as const },
  exportSub: { fontSize: 11, color: '#6B7280', marginTop: 1 },
});

function SettingRow({
  icon, label, children, last, COLORS,
}: {
  icon: string; label: string; children: React.ReactNode; last?: boolean; COLORS: Palette;
}) {
  const s = useMemo(() => makeRowStyles(COLORS), [COLORS]);
  return (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <View style={s.iconBg}>
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
  const transactions = useTransactionStore((s) => s.transactions);
  const accounts = useAccountStore((s) => s.accounts);
  const categories = useCategoryStore((s) => s.categories);
  const budgets = useBudgetStore((s) => s.budgets);
  const tags = useTagStore((s) => s.tags);

  const [editingName, setEditingName] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [nameValue, setNameValue] = useState(profile.name);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerHour, setPickerHour] = useState(() => {
    const defaultTime = settings.dailyReminderTime ?? '22:00';
    return parseInt(defaultTime.split(':')[0], 10);
  });
  const [pickerMinute, setPickerMinute] = useState(() => {
    const defaultTime = settings.dailyReminderTime ?? '22:00';
    return parseInt(defaultTime.split(':')[1], 10);
  });

  const initials = useMemo(() => {
    const parts = profile.name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }, [profile.name]);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        profile,
        settings,
        accounts,
        categories,
        budgets,
        tags,
        transactions,
      };
      const json = JSON.stringify(payload, null, 2);
      const filename = `kumbu-export-${new Date().toISOString().slice(0, 10)}.json`;

      if (Platform.OS === 'web') {
        Alert.alert('Exportar', 'Exportação de ficheiros não suportada no browser.');
        return;
      }

      const file = new File(Paths.cache, filename);
      file.create();
      file.write(json);
      await Share.share({ url: file.uri, title: filename });
    } catch {
      Alert.alert('Erro', 'Não foi possível exportar os dados.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header — só back btn */}
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.text.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, isWeb && { paddingBottom: 34 }]} showsVerticalScrollIndicator={false}>

        {/* Avatar + nome */}
        <View style={styles.profileHero}>
          <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
            <ThemedText style={styles.avatarText}>{initials}</ThemedText>
          </View>
          {editingName ? (
            <View style={styles.nameEdit}>
              <FormInput label="" value={nameValue} onChangeText={setNameValue} />
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
            <Pressable style={styles.nameRow} onPress={() => setEditingName(true)}>
              <ThemedText style={styles.heroName}>{profile.name}</ThemedText>
              <Feather name="edit-2" size={14} color={COLORS.text.tertiary} />
            </Pressable>
          )}
        </View>

        {/* Conta */}
        <ThemedText variant="label" style={styles.sectionTitle}>Conta</ThemedText>
        <Card padding={0} style={styles.card}>
          <Pressable style={rowStyles.row} onPress={() => router.push('/accounts')}>
            <View style={rowStyles.iconBg}><Feather name="briefcase" size={16} color={COLORS.primary} /></View>
            <ThemedText variant="body" style={{ flex: 1 }}>Contas</ThemedText>
            <Feather name="chevron-right" size={16} color={COLORS.text.tertiary} />
          </Pressable>
          <Pressable style={rowStyles.row} onPress={() => router.push('/categories')}>
            <View style={rowStyles.iconBg}><Feather name="tag" size={16} color={COLORS.primary} /></View>
            <ThemedText variant="body" style={{ flex: 1 }}>Categorias</ThemedText>
            <Feather name="chevron-right" size={16} color={COLORS.text.tertiary} />
          </Pressable>
          <Pressable style={rowStyles.row} onPress={() => router.push('/tags')}>
            <View style={rowStyles.iconBg}><Feather name="hash" size={16} color={COLORS.primary} /></View>
            <ThemedText variant="body" style={{ flex: 1 }}>Etiquetas</ThemedText>
            <Feather name="chevron-right" size={16} color={COLORS.text.tertiary} />
          </Pressable>
          <Pressable style={rowStyles.row} onPress={() => router.push('/forecast')}>
            <View style={rowStyles.iconBg}><Feather name="trending-up" size={16} color={COLORS.primary} /></View>
            <ThemedText variant="body" style={{ flex: 1 }}>Previsão Financeira</ThemedText>
            <Feather name="chevron-right" size={16} color={COLORS.text.tertiary} />
          </Pressable>
          <Pressable
            style={[rowStyles.row, { borderBottomWidth: 0 }]}
            onPress={handleExport}
            disabled={exporting}
          >
            <View style={[rowStyles.iconBg, { backgroundColor: COLORS.income + '22' }]}>
              <Feather name="download" size={16} color={COLORS.income} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="body">Exportar dados</ThemedText>
              <ThemedText style={styles.exportSub}>JSON · contas, transações, orçamentos</ThemedText>
            </View>
            {exporting
              ? <Feather name="loader" size={16} color={COLORS.text.tertiary} />
              : <Feather name="chevron-right" size={16} color={COLORS.text.tertiary} />
            }
          </Pressable>
        </Card>

        {/* Aparência */}
        <ThemedText variant="label" style={styles.sectionTitle}>Aparência</ThemedText>
        <Card padding={0} style={styles.card}>
          <View style={styles.themePickerRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = settings.theme === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setTheme(opt.value)}
                  style={[styles.themeOption, active && styles.themeOptionActive]}
                >
                  <Feather name={opt.icon as any} size={18} color={active ? COLORS.primary : COLORS.text.secondary} />
                  <ThemedText
                    variant="caption"
                    style={[styles.themeOptionLabel, { color: active ? COLORS.primary : COLORS.text.secondary, fontWeight: active ? '600' : '500' }]}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Notificações */}
        <ThemedText variant="label" style={styles.sectionTitle}>Notificações</ThemedText>
        <Card padding={0} style={styles.card}>
          <SettingRow icon="bell" label="Lembrete diário" COLORS={COLORS}>
            <Switch
              value={settings.dailyReminder}
              onValueChange={handleDailyReminderToggle}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFF"
            />
          </SettingRow>
          <Pressable onPress={() => setShowTimePicker(true)}>
            <SettingRow icon="clock" label="Hora do lembrete" COLORS={COLORS}>
              <View style={styles.timePill}>
                <ThemedText style={[styles.timePillText, { color: COLORS.primary }]}>
                  {settings.dailyReminderTime ?? '22:00'}
                </ThemedText>
                <Feather name="chevron-right" size={13} color={COLORS.primary} />
              </View>
            </SettingRow>
          </Pressable>
          <SettingRow icon="alert-triangle" label="Alertas de orçamento" COLORS={COLORS}>
            <Switch
              value={settings.budgetAlerts}
              onValueChange={(val) => updateSettings({ budgetAlerts: val })}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFF"
            />
          </SettingRow>
          <SettingRow icon="bar-chart-2" label="Relatório semanal" last COLORS={COLORS}>
            <Switch
              value={settings.weeklyReport}
              onValueChange={(val) => updateSettings({ weeklyReport: val })}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFF"
            />
          </SettingRow>
        </Card>

        <ThemedText variant="caption" style={styles.version}>Kumbu+ v1.0.0 · MVP</ThemedText>
        <ThemedText variant="caption" style={[styles.version, { marginTop: 8 }]}>Desenvolvido por Vanderson Telema</ThemedText>
        <Pressable onPress={() => Linking.openURL('https://www.linkedin.com/in/vanderson-telema')}>
          <ThemedText variant="caption" style={[styles.version, { marginTop: 2, color: COLORS.primary }]}>
            linkedin.com/in/vanderson-telema
          </ThemedText>
        </Pressable>
      </ScrollView>

      {/* Time picker modal */}
      <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: COLORS.surface }]} onPress={() => {}}>
            <ThemedText style={styles.modalTitle}>Hora do lembrete</ThemedText>

            <View style={styles.timeRow}>
              {/* Hours */}
              <View style={styles.timeCol}>
                <Pressable hitSlop={8} onPress={() => setPickerHour((h) => (h + 1) % 24)} style={styles.timeArrow}>
                  <Feather name="chevron-up" size={22} color={COLORS.primary} />
                </Pressable>
                <View style={[styles.timeBox, { backgroundColor: COLORS.primaryMuted }]}>
                  <ThemedText style={[styles.timeValue, { color: COLORS.primary }]}>
                    {String(pickerHour).padStart(2, '0')}
                  </ThemedText>
                </View>
                <Pressable hitSlop={8} onPress={() => setPickerHour((h) => (h - 1 + 24) % 24)} style={styles.timeArrow}>
                  <Feather name="chevron-down" size={22} color={COLORS.primary} />
                </Pressable>
              </View>

              <ThemedText style={[styles.timeSep, { color: COLORS.primary }]}>:</ThemedText>

              {/* Minutes */}
              <View style={styles.timeCol}>
                <Pressable hitSlop={8} onPress={() => setPickerMinute((m) => (m + 5) % 60)} style={styles.timeArrow}>
                  <Feather name="chevron-up" size={22} color={COLORS.primary} />
                </Pressable>
                <View style={[styles.timeBox, { backgroundColor: COLORS.primaryMuted }]}>
                  <ThemedText style={[styles.timeValue, { color: COLORS.primary }]}>
                    {String(pickerMinute).padStart(2, '0')}
                  </ThemedText>
                </View>
                <Pressable hitSlop={8} onPress={() => setPickerMinute((m) => (m - 5 + 60) % 60)} style={styles.timeArrow}>
                  <Feather name="chevron-down" size={22} color={COLORS.primary} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.modalSave, { backgroundColor: COLORS.primary }]}
              onPress={async () => {
                const time = `${String(pickerHour).padStart(2, '0')}:${String(pickerMinute).padStart(2, '0')}`;
                updateSettings({ dailyReminderTime: time });
                if (settings.dailyReminder) await scheduleDailyReminder(time);
                setShowTimePicker(false);
              }}
            >
              <ThemedText style={styles.modalSaveText}>Guardar</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

