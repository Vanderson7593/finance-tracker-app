import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: number;
  backgroundColor?: string;
}

export function CategoryIcon({ icon, color, size = 24, backgroundColor }: CategoryIconProps) {
  const bg = backgroundColor ?? color + '20';
  const iconSize = size * 0.55;
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Feather name={icon as any} size={iconSize} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
