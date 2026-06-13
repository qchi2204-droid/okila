import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import dayjs from 'dayjs';
import { Transaction } from '../types';
import { colors } from '../constants/theme';

type Props = {
  transactions: Transaction[];
};

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function MiniBarChart({ transactions }: Props) {
  const today = dayjs();

  const days = Array.from({ length: 7 }, (_, i) => today.subtract(6 - i, 'day'));

  const data = days.map((day) => {
    const total = transactions
      .filter((t) => dayjs(t.datetime).isSame(day, 'day'))
      .reduce((sum, t) => sum + t.amount, 0);

    const isToday = day.isSame(today, 'day');

    return {
      value: total,
      label: DAY_LABELS[day.day()],
      frontColor: isToday ? colors.primary : colors.border,
    };
  });

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      <BarChart
        data={data}
        height={120}
        barWidth={22}
        spacing={18}
        roundedTop
        roundedBottom
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
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  axisLabel: {
    color: colors.muted,
    fontSize: 11,
  },
});
