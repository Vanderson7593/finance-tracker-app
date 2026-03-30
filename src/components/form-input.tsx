import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { ThemedText } from './themed-text';
import { COLORS } from '../../constants/colors';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  prefix?: string;
}

export function FormInput({ label, error, prefix, style, ...props }: FormInputProps) {
  return (
    <View style={styles.wrapper}>
      <ThemedText variant="label" style={styles.label}>{label}</ThemedText>
      <View style={[styles.inputContainer, error ? styles.inputError : undefined]}>
        {prefix && <ThemedText style={styles.prefix}>{prefix}</ThemedText>}
        <TextInput
          style={[styles.input, prefix ? styles.inputWithPrefix : undefined, style]}
          placeholderTextColor={COLORS.text.tertiary}
          {...props}
        />
      </View>
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { marginBottom: 6, fontSize: 13, fontWeight: '500' as const, color: COLORS.text.secondary },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  inputError: { borderColor: COLORS.expense },
  prefix: { color: COLORS.text.secondary, marginRight: 4, fontSize: 16 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  inputWithPrefix: { paddingLeft: 0 },
  error: { fontSize: 12, color: COLORS.expense, marginTop: 4 },
});
