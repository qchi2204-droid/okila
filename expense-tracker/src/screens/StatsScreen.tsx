import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-gifted-charts';
import dayjs from 'dayjs';
import { Category, Transaction } from '../types';
import { getTransactions } from '../services/storage';
import { colors, categoryColors, categoryLabels, radius, spacing } from '../constants/theme';
import { formatVnd } from '../utils/format';

const ALL_CATEGORIES: Category[] = ['food', 'transport', 'coffee', 'groceries', 'health', 'other'];

export default function StatsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(dayjs().startOf('month'));

  useFocusEffect(
    useCallback(() => {
      getTransactions().then(setTransactions);
    }, [])
  );

  const monthTransactions = transactions.filter((t) => dayjs(t.datetime).isSame(month, 'month'));
  const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  const daysInMonth = month.daysInMonth();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const value = monthTransactions
      .filter((t) => dayjs(t.datetime).date() === day)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      value,
      label: day % 5 === 0 || day === 1 ? String(day) : '',
      frontColor: colors.primary,
    };
  });

  const maxValue = Math.max(...dailyData.map((d) => d.value), 1);

  const categoryTotals = monthTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {} as Partial<Record<Category, number>>);

  const sortedCategories = ALL_CATEGORIES
    .map((category) => ({ category, amount: categoryTotals[category] ?? 0 }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Thống kê</Text>

        <View style={styles.monthSelector}>
          <Pressable onPress={() => setMonth((m) => m.subtract(1, 'month'))} hitSlop={12}>
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>Tháng {month.month() + 1}</Text>
          <Pressable onPress={() => setMonth((m) => m.add(1, 'month'))} hitSlop={12}>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        <Text style={styles.totalLabel}>Tổng chi tiêu</Text>
        <Text style={styles.total}>{formatVnd(total)}</Text>

        {monthTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>Chưa có dữ liệu tháng này</Text>
          </View>
        ) : (
          <>
            <View style={styles.chartWrap}>
              <BarChart
                data={dailyData}
                height={160}
                barWidth={8}
                spacing={4}
                roundedTop
                hideRules
                hideYAxisText
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={styles.axisLabel}
                maxValue={maxValue * 1.2}
                noOfSections={3}
                disablePress
              />
            </View>

            <Text style={styles.sectionTitle}>Theo danh mục</Text>
            {sortedCategories.map(({ category, amount }) => {
              const percent = total > 0 ? (amount / total) * 100 : 0;
              const { icon, bg } = categoryColors[category];

              return (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.iconWrap, { backgroundColor: bg }]}>
                      <Text style={styles.icon}>{icon}</Text>
                    </View>
                    <Text style={styles.categoryLabel}>{categoryLabels[category]}</Text>
                    <Text style={styles.categoryAmount}>{formatVnd(amount)}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${percent}%` }]} />
                  </View>
                  <Text style={styles.percentText}>{percent.toFixed(1)}%</Text>
                </View>
              );
            })}
          </>
        )}
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  arrow: {
    fontSize: 24,
    color: colors.primary,
    paddingHorizontal: spacing.md,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    minWidth: 90,
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  total: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  chartWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  axisLabel: {
    color: colors.muted,
    fontSize: 9,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  categoryRow: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 14,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  percentText: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
