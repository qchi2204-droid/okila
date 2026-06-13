import { Category } from '../types';

// Keyword -> category mapping. Matching is case-insensitive substring match.
export const categoryKeywords: { keywords: string[]; category: Category }[] = [
  {
    category: 'groceries',
    keywords: ['winmart', 'circle k', "co.op", 'coop', 'bach hoa xanh', 'mega market'],
  },
  {
    category: 'transport',
    keywords: ['grab', 'be ', 'gojek', 'xanh sm', 'mai linh'],
  },
  {
    category: 'coffee',
    keywords: ['the coffee house', 'highlands', 'phuc long', 'phúc long', 'starbucks', 'cong', 'cộng'],
  },
  {
    category: 'health',
    keywords: ['pharmacity', 'long chau', 'long châu', 'an khang'],
  },
];

// BIDV transactions are mostly F&B if nothing matches, so default to 'food'.
export function categorizeMerchant(merchant: string): Category {
  const normalized = merchant.toLowerCase();

  for (const { keywords, category } of categoryKeywords) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return 'food';
}
