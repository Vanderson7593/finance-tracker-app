import { useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS, Palette } from '../../constants/colors';
import { useSettingsStore } from '../store/use-settings-store';

export function useIsDark(): boolean {
  const theme = useSettingsStore((s) => s.settings.theme);
  const systemScheme = useColorScheme();
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return systemScheme === 'dark';
}

export function useColors(): Palette {
  return useIsDark() ? DARK_COLORS : LIGHT_COLORS;
}

type NamedStyles<T> = { [P in keyof T]: any };

export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: Palette) => T,
): T {
  const colors = useColors();
  return useMemo(() => StyleSheet.create(factory(colors)) as T, [colors]);
}
