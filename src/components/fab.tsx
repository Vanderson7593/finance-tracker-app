import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Platform, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Palette } from '../../constants/colors';
import { useColors } from '../hooks/use-colors';

interface FabProps {
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  bottomOffset?: number;
  colors?: readonly [string, string];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Fab({
  icon = 'plus',
  onPress,
  bottomOffset = 86,
  colors,
}: FabProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const resolvedColors: readonly [string, string] =
    colors ?? [COLORS.primaryLight, COLORS.primary];

  const handleIn = () => {
    scale.value = withSpring(0.92, { damping: 14, stiffness: 320 });
  };
  const handleOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 280 });
  };
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bottom = bottomOffset + Math.max(insets.bottom, 0);

  return (
    <AnimatedPressable
      onPressIn={handleIn}
      onPressOut={handleOut}
      onPress={handlePress}
      style={[styles.btn, { bottom }, animStyle]}
    >
      <LinearGradient
        colors={resolvedColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconWrap}>
          <Feather name={icon} size={24} color="#FFF" />
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const makeStyles = (COLORS: Palette) => StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.36,
    shadowRadius: 18,
    elevation: 10,
  },
  gradient: {
    flex: 1,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
});
