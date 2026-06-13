import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { clearAllData, getTransactions, saveTransactions } from '../services/storage';
import { mockTransactions } from '../services/mockData';
import { colors, radius, spacing } from '../constants/theme';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [transactionCount, setTransactionCount] = useState(0);

  const load = useCallback(async () => {
    const all = await getTransactions();
    setTransactionCount(all.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleLoadMockData = async () => {
    await saveTransactions(mockTransactions);
    await load();
    Alert.alert('Đã tải dữ liệu mẫu', `${mockTransactions.length} giao dịch mẫu đã được thêm`);
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

        <View style={styles.onboardingCard}>
          <Text style={styles.onboardingEmoji}>📧</Text>
          <Text style={styles.onboardingTitle}>Tự động ghi nhận chi tiêu</Text>
          <Text style={styles.onboardingSubtitle}>
            Kết nối Gmail để tự động đọc thông báo giao dịch từ BIDV. (Tính năng này tạm thời bị tắt
            trong bản Snack demo này.)
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Thông báo</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Thông báo giao dịch tự động</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dữ liệu</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Số giao dịch hiện có</Text>
            <Text style={styles.rowValue}>{transactionCount}</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={handleLoadMockData}>
            <Text style={styles.primaryButtonText}>Tải dữ liệu mẫu</Text>
          </Pressable>
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
    marginTop: spacing.sm,
  },
  dangerButtonText: {
    color: colors.debit,
    fontSize: 14,
    fontWeight: '600',
  },
});
