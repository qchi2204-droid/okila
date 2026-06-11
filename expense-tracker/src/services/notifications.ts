import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Transaction } from '../types';
import { getNotificationsEnabled } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return finalStatus === 'granted';
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

export async function notifyNewTransaction(transaction: Transaction): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${transaction.merchant} − ${formatAmount(transaction.amount)}₫`,
      body: 'Vừa được ghi nhận tự động từ BIDV',
      data: { transactionId: transaction.id },
    },
    trigger: null,
  });
}

export async function notifyNewTransactions(transactions: Transaction[]): Promise<void> {
  for (const transaction of transactions) {
    await notifyNewTransaction(transaction);
  }
}
