export type Category =
  | 'food'
  | 'transport'
  | 'coffee'
  | 'groceries'
  | 'health'
  | 'other';

export type Source = 'visa' | 'qr' | 'manual';

export type Transaction = {
  id: string;
  amount: number; // absolute value, always positive
  merchant: string;
  category: Category;
  datetime: string; // ISO 8601
  source: Source;
  raw_email?: string;
};
