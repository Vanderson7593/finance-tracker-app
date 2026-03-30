import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface ThemedTextProps extends TextProps {
  variant?: 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label' | 'amount';
  color?: string;
}

export function ThemedText({ variant = 'body', color, style, ...props }: ThemedTextProps) {
  return <Text style={[styles[variant], color ? { color } : undefined, style]} {...props} />;
}

const styles = StyleSheet.create({
  hero: { fontSize: 36, fontWeight: '700' as const, color: COLORS.text.primary, letterSpacing: -1 },
  title: { fontSize: 22, fontWeight: '700' as const, color: COLORS.text.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, fontWeight: '600' as const, color: COLORS.text.primary },
  body: { fontSize: 15, fontWeight: '400' as const, color: COLORS.text.primary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: COLORS.text.secondary },
  label: { fontSize: 13, fontWeight: '500' as const, color: COLORS.text.secondary },
  amount: { fontSize: 28, fontWeight: '700' as const, color: COLORS.text.primary, letterSpacing: -0.5 },
});
