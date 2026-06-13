import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { Transaction, Source, Category } from '../types';
import { getTransactions } from '../services/storage';
import { mockTransactions } from '../services/mockData';
import { colors, radius, spacing } from '../constants/theme';
import { formatVnd } from '../utils/format';
import MiniBarChart from '../components/MiniBarChart';
import TransactionItem from '../components/TransactionItem';
import CategoryGrid from '../components/CategoryGrid';

type Filter = 'all' | 'visa' | 'qr';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'visa', label: 'Visa' },
  { key: 'qr', label: 'QR' },
];

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    const all = await getTransactions();
    // In development, fall back to mock data so the UI is never empty.
    setTransactions(__DEV__ && all.length === 0 ? mockTransactions : all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const now = dayjs();
  const filtered = transactions.filter((t) => {
    if (filter === 'all') return true;
    return t.source === filter;
  });

  const thisMonth = filtered.filter((t) => dayjs(t.datetime).isSame(now, 'month'));
  const lastMonth = filtered.filter((t) =>
    dayjs(t.datetime).isSame(now.subtract(1, 'month'), 'month')
  );

  const totalThisMonth = thisMonth.reduce((sum, t) => sum + t.amount, 0);
  const totalLastMonth = lastMonth.reduce((sum, t) => sum + t.amount, 0);

  let percentChange: number | null = null;
  if (totalLastMonth > 0) {
    percentChange = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;
  }

  const recent = filtered.slice(0, showAll ? filtered.length : 5);

  const categoryTotals = thisMonth.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {} as Partial<Record<Category, number>>);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerLabel}>CHI TIÊU</Text>
            <View style={styles.monthRow}>
              <Text style={styles.monthText}>Tháng {now.month() + 1}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </View>
          <Pressable hitSlop={12}>
            <Text style={styles.bellIcon}>🔔</Text>
          </Pressable>
        </View>

        <Text style={styles.totalAmount}>{formatVnd(totalThisMonth)}</Text>

        {percentChange !== null && (
          <Text style={styles.compareText}>
            {percentChange >= 0 ? '+' : ''}
            {percentChange.toFixed(1)}% so với tháng trước
          </Text>
        )}

        <View style={styles.pillsRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
              >
                <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <MiniBarChart transactions={thisMonth} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gần đây</Text>
          {filtered.length > 5 && (
            <Pressable onPress={() => setShowAll((v) => !v)}>
              <Text style={styles.linkText}>{showAll ? 'Thu gọn' : 'Xem tất cả'}</Text>
            </Pressable>
          )}
        </View>

        {recent.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyTitle}>Chưa có giao dịch nào</Text>
            <Text style={styles.emptySubtitle}>
              Kết nối Gmail trong Cài đặt hoặc thêm giao dịch thủ công.
            </Text>
          </View>
        ) : (
          recent.map((t) => <TransactionItem key={t.id} transaction={t} />)
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
        </View>

        <CategoryGrid totals={categoryTotals} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  headerLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  monthText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    color: colors.white,
    fontSize: 18,
    marginLeft: 4,
  },
  bellIcon: {
    fontSize: 22,
  },
  totalAmount: {
    color: colors.white,
    fontSize: 40,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  compareText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  pillActive: {
    backgroundColor: colors.white,
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.primary,
  },
  pillTextInactive: {
    color: colors.white,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  linkText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
