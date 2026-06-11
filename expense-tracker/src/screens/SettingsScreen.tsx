import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as AuthSession from 'expo-auth-session';
import dayjs from 'dayjs';
import {
  GMAIL_DISCOVERY,
  completeGmailAuth,
  disconnectGmail,
  getConnectedEmail,
  getGmailAuthRequestConfig,
  isGmailConnected,
  registerBackgroundSync,
  syncGmailTransactions,
  unregisterBackgroundSync,
} from '../services/gmailSync';
import {
  clearAllData,
  getLastSyncTime,
  getNotificationsEnabled,
  setLastSyncTime,
  setNotificationsEnabled,
} from '../services/storage';
import { requestNotificationPermissions } from '../services/notifications';
import { colors, radius, spacing } from '../constants/theme';

export default function SettingsScreen() {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    getGmailAuthRequestConfig(),
    GMAIL_DISCOVERY
  );

  const load = useCallback(async () => {
    const [isConnected, connectedEmail, lastSyncTime, notifEnabled] = await Promise.all([
      isGmailConnected(),
      getConnectedEmail(),
      getLastSyncTime(),
      getNotificationsEnabled(),
    ]);

    setConnected(isConnected);
    setEmail(connectedEmail);
    setLastSync(lastSyncTime);
    setNotificationsEnabledState(notifEnabled);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleConnect = async () => {
    if (!request) return;

    const result = await promptAsync();

    if (result.type === 'success' && result.params.code && request.codeVerifier) {
      try {
        await completeGmailAuth(result.params.code, request.codeVerifier);
        await registerBackgroundSync();
        await load();
        Alert.alert('Thành công', 'Đã kết nối Gmail');
      } catch (error: any) {
        Alert.alert('Lỗi', error.message ?? 'Không thể kết nối Gmail');
      }
    }
  };

  const handleDisconnect = () => {
    Alert.alert('Ngắt kết nối Gmail', 'Bạn có chắc muốn ngắt kết nối tài khoản Gmail?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Ngắt kết nối',
        style: 'destructive',
        onPress: async () => {
          await disconnectGmail();
          await unregisterBackgroundSync();
          await load();
        },
      },
    ]);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const added = await syncGmailTransactions();
      await load();
      Alert.alert('Đồng bộ xong', `Đã thêm ${added.length} giao dịch mới`);
    } catch (error: any) {
      Alert.alert('Lỗi đồng bộ', error.message ?? 'Không thể đồng bộ Gmail');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Thông báo bị từ chối', 'Vui lòng cấp quyền thông báo trong cài đặt hệ thống');
        return;
      }
    }

    await setNotificationsEnabled(value);
    setNotificationsEnabledState(value);
  };

  const handleClearData = () => {
    Alert.alert(
      'Xoá toàn bộ dữ liệu',
      'Hành động này sẽ xoá tất cả giao dịch và không thể hoàn tác. Bạn có chắc chắn?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá tất cả',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await disconnectGmail();
            await unregisterBackgroundSync();
            await load();
            Alert.alert('Đã xoá', 'Toàn bộ dữ liệu đã được xoá');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Cài đặt</Text>

        {!connected && (
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingEmoji}>📧</Text>
            <Text style={styles.onboardingTitle}>Tự động ghi nhận chi tiêu</Text>
            <Text style={styles.onboardingSubtitle}>
              Kết nối Gmail để tự động đọc thông báo giao dịch từ BIDV và ghi nhận chi tiêu của bạn.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Tài khoản Gmail</Text>
        <View style={styles.card}>
          {connected ? (
            <>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{email ?? '—'}</Text>
              </View>
              <Pressable style={styles.dangerButton} onPress={handleDisconnect}>
                <Text style={styles.dangerButtonText}>Ngắt kết nối</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.primaryButton, !request && styles.disabledButton]}
              onPress={handleConnect}
              disabled={!request}
            >
              <Text style={styles.primaryButtonText}>Kết nối Gmail</Text>
            </Pressable>
          )}
        </View>

        {connected && (
          <>
            <Text style={styles.sectionTitle}>Đồng bộ</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Lần đồng bộ gần nhất</Text>
                <Text style={styles.rowValue}>
                  {lastSync ? dayjs(lastSync).format('DD/MM/YYYY HH:mm') : 'Chưa đồng bộ'}
                </Text>
              </View>
              <Pressable
                style={[styles.primaryButton, syncing && styles.disabledButton]}
                onPress={handleSyncNow}
                disabled={syncing}
              >
                <Text style={styles.primaryButtonText}>{syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</Text>
              </Pressable>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Thông báo</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Thông báo giao dịch tự động</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dữ liệu</Text>
        <View style={styles.card}>
          <Pressable style={styles.dangerButton} onPress={handleClearData}>
            <Text style={styles.dangerButtonText}>Xoá toàn bộ dữ liệu</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  onboardingCard: {
    backgroundColor: colors.autoBadgeBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  onboardingEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  onboardingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  onboardingSubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    fontSize: 14,
    color: colors.primary,
  },
  rowValue: {
    fontSize: 14,
    color: colors.muted,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: colors.debit,
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
