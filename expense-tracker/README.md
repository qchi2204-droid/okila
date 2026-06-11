# Expense Tracker

React Native + Expo SDK 51 app that tracks expenses manually or via automatic
parsing of BIDV transaction notification emails from Gmail.

## Setup

```bash
npm install
cp .env.example .env
# fill in EXPO_PUBLIC_GOOGLE_CLIENT_ID
npx expo start
```

## Project structure

- `src/screens` — Home, Add, Stats, Settings screens
- `src/components` — TransactionItem, CategoryGrid, MiniBarChart
- `src/services` — Gmail OAuth + sync, AsyncStorage helpers, local notifications
- `src/constants` — theme tokens and merchant → category keyword mapping
- `src/types` — shared `Transaction` / `Category` types

## Gmail sync

Connect a Gmail account from the Settings screen. The app reads recent BIDV
notification emails (`from:notification@bidv.com.vn newer_than:7d`), parses
the amount/merchant/datetime, categorizes by merchant keyword, and stores new
transactions locally. A background task (`BIDV_GMAIL_SYNC`, every 15 minutes)
keeps this in sync and sends a local notification for each new transaction.
