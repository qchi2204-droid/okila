import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Category } from '../types';
import { colors, categoryColors, categoryLabels, radius, spacing } from '../constants/theme';
import { formatVnd } from '../utils/format';

type Props = {
  totals: Partial<Record<Category, number>>;
};

const ALL_CATEGORIES: Category[] = ['food', 'transport', 'coffee', 'groceries', 'health', 'other'];

export default function CategoryGrid({ totals }: Props) {
  return (
    <View style={styles.grid}>
      {ALL_CATEGORIES.map((category) => {
        const { icon, bg } = categoryColors[category];
        const amount = totals[category] ?? 0;

        return (
          <View key={category} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: bg }]}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={styles.label}>{categoryLabels[category]}</Text>
            <Text style={styles.amount}>{formatVnd(amount)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
