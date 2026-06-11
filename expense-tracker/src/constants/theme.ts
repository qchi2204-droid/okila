export const colors = {
  primary: '#111111',
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  debit: '#E53935',
  muted: '#999999',
  border: 'rgba(0,0,0,0.07)',
  autoBadgeBg: '#E8F4FD',
  autoBadgeText: '#1A6FA8',
  white: '#FFFFFF',
  black: '#000000',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const categoryColors: Record<string, { bg: string; icon: string }> = {
  food: { bg: '#FFF3E0', icon: '🍜' },
  transport: { bg: '#E8F5E9', icon: '🛵' },
  coffee: { bg: '#F3E5F5', icon: '☕' },
  groceries: { bg: '#FFF9C4', icon: '🛒' },
  health: { bg: '#E3F2FD', icon: '🏥' },
  other: { bg: '#F5F5F5', icon: '📦' },
};

export const categoryLabels: Record<string, string> = {
  food: 'Ăn uống',
  transport: 'Di chuyển',
  coffee: 'Cà phê',
  groceries: 'Đi chợ',
  health: 'Sức khoẻ',
  other: 'Khác',
};
