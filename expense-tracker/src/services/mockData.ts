import dayjs from 'dayjs';
import { Transaction } from '../types';

const now = dayjs();

function daysAgo(days: number, hour: number, minute: number): string {
  return now.subtract(days, 'day').hour(hour).minute(minute).second(0).millisecond(0).toISOString();
}

export const mockTransactions: Transaction[] = [
  {
    id: 'mock-1',
    amount: 45000,
    merchant: 'Highlands Coffee',
    category: 'coffee',
    datetime: daysAgo(0, 8, 15),
    source: 'visa',
  },
  {
    id: 'mock-2',
    amount: 32000,
    merchant: 'Grab',
    category: 'transport',
    datetime: daysAgo(0, 12, 40),
    source: 'qr',
  },
  {
    id: 'mock-3',
    amount: 125000,
    merchant: 'Pho 24',
    category: 'food',
    datetime: daysAgo(1, 19, 30),
    source: 'visa',
  },
  {
    id: 'mock-4',
    amount: 540000,
    merchant: 'WinMart',
    category: 'groceries',
    datetime: daysAgo(2, 17, 5),
    source: 'qr',
  },
  {
    id: 'mock-5',
    amount: 78000,
    merchant: 'The Coffee House',
    category: 'coffee',
    datetime: daysAgo(3, 9, 0),
    source: 'visa',
  },
  {
    id: 'mock-6',
    amount: 210000,
    merchant: 'Pharmacity',
    category: 'health',
    datetime: daysAgo(5, 14, 20),
    source: 'manual',
  },
  {
    id: 'mock-7',
    amount: 65000,
    merchant: 'Be',
    category: 'transport',
    datetime: daysAgo(7, 8, 50),
    source: 'qr',
  },
  {
    id: 'mock-8',
    amount: 350000,
    merchant: 'Circle K',
    category: 'groceries',
    datetime: daysAgo(10, 20, 10),
    source: 'visa',
  },
  {
    id: 'mock-9',
    amount: 95000,
    merchant: 'Phuc Long',
    category: 'coffee',
    datetime: daysAgo(15, 16, 45),
    source: 'manual',
  },
  {
    id: 'mock-10',
    amount: 480000,
    merchant: 'Mega Market',
    category: 'groceries',
    datetime: daysAgo(25, 11, 0),
    source: 'qr',
  },
];
