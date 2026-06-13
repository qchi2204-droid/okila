import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types';

const TRANSACTIONS_KEY = '@expense_tracker/transactions';

export async function getTransactions(): Promise<Transaction[]> {
  const raw = await AsyncStorage.getItem(TRANSACTIONS_KEY);
  if (!raw) return [];
  try {
    const parsed: Transaction[] = JSON.parse(raw);
    return parsed.sort(
      (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );
  } catch {
    return [];
  }
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  const existing = await getTransactions();
  await saveTransactions([transaction, ...existing]);
}

export async function deleteTransaction(id: string): Promise<void> {
  const existing = await getTransactions();
  await saveTransactions(existing.filter((t) => t.id !== id));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(TRANSACTIONS_KEY);
}
