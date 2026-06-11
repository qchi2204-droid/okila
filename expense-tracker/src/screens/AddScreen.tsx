import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import * as Crypto from 'expo-crypto';
import { Category, Source, Transaction } from '../types';
import { addTransaction } from '../services/storage';
import { colors, categoryColors, categoryLabels, radius, spacing } from '../constants/theme';

const ALL_CATEGORIES: Category[] = ['food', 'transport', 'coffee', 'groceries', 'health', 'other'];

const SOURCES: { key: Source; label: string }[] = [
  { key: 'visa', label: 'Visa' },
  { key: 'qr', label: 'QR' },
  { key: 'manual', label: 'Manual' },
];

export default function AddScreen() {
  const navigation = useNavigation();

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [datetime, setDatetime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [source, setSource] = useState<Source>('manual');
  const [saving, setSaving] = useState(false);

  const numericAmount = Number(amount.replace(/[^\d]/g, ''));

  const handleSave = async () => {
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (!merchant.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên cửa hàng / người nhận');
      return;
    }

    setSaving(true);
    try {
      const transaction: Transaction = {
        id: Crypto.randomUUID(),
        amount: numericAmount,
        merchant: merchant.trim(),
        category,
        datetime: datetime.toISOString(),
        source,
      };

      await addTransaction(transaction);

      setAmount('');
      setMerchant('');
      setCategory('food');
      setDatetime(new Date());
      setSource('manual');

      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Thêm giao dịch</Text>

          <View style={styles.amountWrap}>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={amount}
              onChangeText={(text) => setAmount(text.replace(/[^\d]/g, ''))}
            />
            <Text style={styles.amountSuffix}>₫</Text>
          </View>

          <Text style={styles.label}>Cửa hàng / Người nhận</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Highlands Coffee"
            placeholderTextColor={colors.muted}
            value={merchant}
            onChangeText={setMerchant}
          />

          <Text style={styles.label}>Danh mục</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
            {ALL_CATEGORIES.map((cat) => {
              const active = category === cat;
              const { icon } = categoryColors[cat];
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                >
                  <Text style={styles.categoryIcon}>{icon}</Text>
                  <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                    {categoryLabels[cat]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Thời gian</Text>
          <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
            <Text style={styles.dateText}>{dayjs(datetime).format('DD/MM/YYYY HH:mm')}</Text>
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={datetime}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selected) => {
                setShowPicker(Platform.OS === 'ios');
                if (selected) setDatetime(selected);
              }}
            />
          )}

          <Text style={styles.label}>Nguồn</Text>
          <View style={styles.sourceRow}>
            {SOURCES.map((s) => {
              const active = source === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setSource(s.key)}
                  style={[styles.sourcePill, active && styles.sourcePillActive]}
                >
                  <Text style={[styles.sourcePillText, active && styles.sourcePillTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Đang lưu...' : 'Lưu giao dịch'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    minWidth: 120,
  },
  amountSuffix: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.muted,
    marginLeft: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.primary,
  },
  dateText: {
    fontSize: 15,
    color: colors.primary,
  },
  pillsScroll: {
    flexGrow: 0,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  categoryPillTextActive: {
    color: colors.white,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sourcePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sourcePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sourcePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  sourcePillTextActive: {
    color: colors.white,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
