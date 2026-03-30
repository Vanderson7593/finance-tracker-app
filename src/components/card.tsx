import React from 'react';
import { View, ViewProps, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../../constants/colors';

interface CardProps extends ViewProps {
  onPress?: () => void;
  padding?: number;
}

export function Card({ children, style, onPress, padding = 16, ...props }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, { padding }, pressed && styles.pressed, style]}
        onPress={onPress}
        {...(props as any)}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
