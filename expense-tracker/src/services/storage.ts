import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types';

const KEYS = {
  TRANSACTIONS: '@expense_tracker/transactions',
  LAST_SYNC: '@expense_tracker/last_sync',
  NOTIFICATIONS_ENABLED: '@expense_tracker/notifications_enabled',
};

export async function getTransactions(): Promise<Transaction[]> {
  const raw = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
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
  await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  const existing = await getTransactions();
  await saveTransactions([transaction, ...existing]);
}

// Adds new transactions, skipping any whose id already exists.
// Returns the list of transactions that were actually added.
export async function addTransactionsIfNew(
  newTransactions: Transaction[]
): Promise<Transaction[]> {
  const existing = await getTransactions();
  const existingIds = new Set(existing.map((t) => t.id));
  const toAdd = newTransactions.filter((t) => !existingIds.has(t.id));

  if (toAdd.length > 0) {
    await saveTransactions([...toAdd, ...existing]);
  }

  return toAdd;
}

export async function deleteTransaction(id: string): Promise<void> {
  const existing = await getTransactions();
  await saveTransactions(existing.filter((t) => t.id !== id));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.TRANSACTIONS,
    KEYS.LAST_SYNC,
    KEYS.NOTIFICATIONS_ENABLED,
  ]);
}

export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.LAST_SYNC);
}

export async function setLastSyncTime(isoDate: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_SYNC, isoDate);
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.NOTIFICATIONS_ENABLED);
  return raw === null ? true : raw === 'true';
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIFICATIONS_ENABLED, enabled ? 'true' : 'false');
}
