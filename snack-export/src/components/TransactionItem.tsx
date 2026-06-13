import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Transaction } from '../types';
import { colors, categoryColors, radius, spacing } from '../constants/theme';
import { formatTime, formatVnd } from '../utils/format';

type Props = {
  transaction: Transaction;
};

export default function TransactionItem({ transaction }: Props) {
  const { icon, bg } = categoryColors[transaction.category];
  const isAuto = transaction.source !== 'manual';

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.merchant} numberOfLines={1}>
          {transaction.merchant}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.time}>{formatTime(transaction.datetime)}</Text>
          <View style={[styles.badge, isAuto ? styles.autoBadge : styles.manualBadge]}>
            <Text style={[styles.badgeText, isAuto ? styles.autoBadgeText : styles.manualBadgeText]}>
              {isAuto ? 'Auto' : 'Manual'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.amount}>-{formatVnd(transaction.amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  middle: {
    flex: 1,
  },
  merchant: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: spacing.xs,
  },
  time: {
    fontSize: 12,
    color: colors.muted,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  autoBadge: {
    backgroundColor: colors.autoBadgeBg,
  },
  manualBadge: {
    backgroundColor: colors.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  autoBadgeText: {
    color: colors.autoBadgeText,
  },
  manualBadgeText: {
    color: colors.muted,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.debit,
    marginLeft: spacing.sm,
  },
});
