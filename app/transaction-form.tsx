import React, { useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { TransactionForm } from '../src/features/transactions/transaction-form';
import { useTransactionStore } from '../src/store/use-transaction-store';
import { Transaction } from '../src/types';
import { generateId } from '../src/lib/uuid';

export default function TransactionFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const transactions = useTransactionStore((s) => s.transactions);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);

  const existingTx = id ? transactions.find((t) => t.id === id) : undefined;

  const handleSubmit = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (existingTx) {
      await updateTransaction(existingTx.id, data);
    } else {
      await addTransaction({ ...data, id: generateId(), createdAt: new Date().toISOString() });
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <TransactionForm
        initialData={existingTx}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
