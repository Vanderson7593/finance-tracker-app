import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ThemedText } from './themed-text';
import { Palette } from '../../constants/colors';
import { useColors } from '../hooks/use-colors';

export type KeypadKey = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | ',' | 'back';

interface NumericKeypadProps {
  onKeyPress: (key: KeypadKey) => void;
  onBackspaceLongPress?: () => void;
  accentColor?: string;
}

const KEYS: KeypadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', 'back'],
];

interface KeyButtonProps {
  k: KeypadKey;
  onPress: (k: KeypadKey) => void;
  onLongPress?: () => void;
  accentColor: string;
}

function KeyButton({ k, onPress, onLongPress, accentColor }: KeyButtonProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleIn = () => {
    scale.value = withSpring(0.94, { damping: 22, stiffness: 420 });
  };
  const handleOut = () => {
    scale.value = withSpring(1, { damping: 16, stiffness: 280 });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress(k);
  };

  return (
    <Pressable
      style={styles.cell}
      onPressIn={handleIn}
      onPressOut={handleOut}
      onPress={handlePress}
      onLongPress={k === 'back' ? onLongPress : undefined}
    >
      {({ pressed }) => (
        <Animated.View style={[styles.key, pressed && styles.keyPressed, animStyle]}>
          {k === 'back' ? (
            <Feather name="delete" size={22} color={COLORS.text.secondary} />
          ) : k === ',' ? (
            <ThemedText style={[styles.label, { color: accentColor, fontSize: 30 }]}>,</ThemedText>
          ) : (
            <ThemedText style={[styles.label, { color: accentColor }]}>{k}</ThemedText>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

export function NumericKeypad({
  onKeyPress,
  onBackspaceLongPress,
  accentColor,
}: NumericKeypadProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const resolvedAccent = accentColor ?? COLORS.text.primary;
  return (
    <View style={styles.pad}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((k) => (
            <KeyButton
              key={k}
              k={k}
              onPress={onKeyPress}
              onLongPress={onBackspaceLongPress}
              accentColor={resolvedAccent}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  pad: { paddingHorizontal: 8, paddingTop: 4 },
  row: { flexDirection: 'row' },
  cell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  key: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  keyPressed: {
    backgroundColor: COLORS.surfaceVariant,
  },
  label: {
    fontSize: 22,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
});
