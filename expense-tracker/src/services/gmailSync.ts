import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Transaction } from '../types';
import { categorizeMerchant } from '../constants/categories';
import { addTransactionsIfNew, setLastSyncTime } from './storage';
import { notifyNewTransactions } from './notifications';

dayjs.extend(customParseFormat);

WebBrowser.maybeCompleteAuthSession();

export const BACKGROUND_SYNC_TASK = 'BIDV_GMAIL_SYNC';

const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'gmail_access_token',
  REFRESH_TOKEN: 'gmail_refresh_token',
  EXPIRES_AT: 'gmail_expires_at',
  EMAIL: 'gmail_email',
};

// Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env / app config.
const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export const GMAIL_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

export function getGmailRedirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: 'expensetracker' });
}

export function getGmailAuthRequestConfig(): AuthSession.AuthRequestConfig {
  return {
    clientId: CLIENT_ID,
    scopes: GMAIL_SCOPES,
    redirectUri: getGmailRedirectUri(),
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  };
}

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
};

async function storeTokens(tokens: StoredTokens, email?: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.EXPIRES_AT, String(tokens.expiresAt));
  if (email) {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.EMAIL, email);
  }
}

export async function getStoredTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken, expiresAt] = await Promise.all([
    SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN),
    SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
    SecureStore.getItemAsync(SECURE_STORE_KEYS.EXPIRES_AT),
  ]);

  if (!accessToken || !refreshToken || !expiresAt) return null;

  return { accessToken, refreshToken, expiresAt: Number(expiresAt) };
}

export async function getConnectedEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_KEYS.EMAIL);
}

export async function disconnectGmail(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.EXPIRES_AT),
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.EMAIL),
  ]);

  if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK)) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }
}

export async function isGmailConnected(): Promise<boolean> {
  return (await getStoredTokens()) !== null;
}

// Exchanges the OAuth code for tokens and persists them, along with the
// connected account's email address.
export async function completeGmailAuth(
  code: string,
  codeVerifier: string
): Promise<void> {
  const result = await AuthSession.exchangeCodeAsync(
    {
      clientId: CLIENT_ID,
      code,
      redirectUri: getGmailRedirectUri(),
      extraParams: { code_verifier: codeVerifier },
    },
    GMAIL_DISCOVERY
  );

  if (!result.refreshToken) {
    throw new Error('Google did not return a refresh token. Try disconnecting and reconnecting with consent prompt.');
  }

  const expiresAt = Date.now() + (result.expiresIn ?? 3600) * 1000;

  await storeTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt,
  });

  const email = await fetchConnectedEmail(result.accessToken);
  if (email) {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.EMAIL, email);
  }
}

async function fetchConnectedEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json.email ?? null;
  } catch {
    return null;
  }
}

// Returns a valid access token, refreshing it first if it has expired.
async function getValidAccessToken(): Promise<string> {
  const tokens = await getStoredTokens();
  if (!tokens) {
    throw new Error('Gmail is not connected');
  }

  // Refresh if the token is already expired or about to expire.
  if (Date.now() < tokens.expiresAt - 60_000) {
    return tokens.accessToken;
  }

  const result = await AuthSession.refreshAsync(
    {
      clientId: CLIENT_ID,
      refreshToken: tokens.refreshToken,
    },
    GMAIL_DISCOVERY
  );

  const expiresAt = Date.now() + (result.expiresIn ?? 3600) * 1000;
  const newTokens: StoredTokens = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken ?? tokens.refreshToken,
    expiresAt,
  };

  await storeTokens(newTokens);
  return newTokens.accessToken;
}

const GMAIL_QUERY = 'from:notification@bidv.com.vn newer_than:7d';

type GmailMessageRef = { id: string };

async function gmailFetch(path: string, accessToken: string): Promise<any> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Gmail API error ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

  if (typeof atob === 'function') {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  return Buffer.from(padded, 'base64').toString('utf-8');
}

// Recursively extracts the plain-text (or HTML) body from a Gmail message payload.
function extractBody(payload: any): string {
  if (!payload) return '';

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (Array.isArray(payload.parts)) {
    const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
    const part = textPart ?? htmlPart ?? payload.parts[0];
    return extractBody(part);
  }

  return '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|td|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function parseAmount(raw: string): number {
  return Number(raw.replace(/[.,]/g, ''));
}

function detectSource(body: string): Transaction['source'] {
  const normalized = body.toLowerCase();
  if (normalized.includes('visa') || normalized.includes('the quoc te')) {
    return 'visa';
  }
  if (
    normalized.includes('vietqr') ||
    normalized.includes('qr') ||
    normalized.includes('chuyen khoan')
  ) {
    return 'qr';
  }
  return 'visa';
}

// Parses a BIDV notification email body into a Transaction.
// Returns null if the body doesn't match either known pattern.
export function parseBidvEmail(
  messageId: string,
  subject: string,
  body: string
): Transaction | null {
  const text = stripHtml(body);
  const source = detectSource(text + ' ' + subject);

  const isVisaPattern = /thong bao bien dong so du/i.test(subject);

  if (isVisaPattern) {
    const amountMatch = text.match(/So tien GD[:\s]+([\d,.]+)\s*(VND|d)/i);
    const merchantMatch = text.match(/Noi GD[:\s]+(.+?)(\n|$)/i);
    const datetimeMatch = text.match(/Thoi gian[:\s]+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i);

    if (!amountMatch || !merchantMatch) return null;

    const amount = parseAmount(amountMatch[1]);
    const merchant = merchantMatch[1].trim();
    const datetime = datetimeMatch
      ? dayjs(datetimeMatch[1], 'DD/MM/YYYY HH:mm').toISOString()
      : new Date().toISOString();

    return {
      id: messageId,
      amount,
      merchant,
      category: categorizeMerchant(merchant),
      datetime,
      source: source === 'qr' ? 'visa' : source,
    };
  }

  // Pattern 2 - SmartBanking QR / transfer
  const amountMatch = text.match(/So tien[:\s]+([\d,.]+)\s*(VND|d)/i);
  const merchantMatch = text.match(/(Den TK|Nguoi nhan)[:\s]+(.+?)(\n|$)/i);
  const datetimeMatch = text.match(/Ngay GD[:\s]+(\d{2}\/\d{2}\/\d{4})/i);

  if (!amountMatch || !merchantMatch) return null;

  const amount = parseAmount(amountMatch[1]);
  const merchant = merchantMatch[2].trim();
  const datetime = datetimeMatch
    ? dayjs(datetimeMatch[1], 'DD/MM/YYYY').toISOString()
    : new Date().toISOString();

  return {
    id: messageId,
    amount,
    merchant,
    category: categorizeMerchant(merchant),
    datetime,
    source: source === 'visa' ? 'qr' : source,
  };
}

function getHeader(headers: any[], name: string): string {
  return headers?.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

// Fetches recent BIDV notification emails, parses them into transactions,
// saves any new ones, and notifies the user. Returns the newly added transactions.
export async function syncGmailTransactions(): Promise<Transaction[]> {
  const accessToken = await getValidAccessToken();

  const listResult = await gmailFetch(
    `/messages?q=${encodeURIComponent(GMAIL_QUERY)}`,
    accessToken
  );

  const refs: GmailMessageRef[] = listResult.messages ?? [];
  const transactions: Transaction[] = [];

  for (const ref of refs) {
    const message = await gmailFetch(`/messages/${ref.id}?format=full`, accessToken);
    const subject = getHeader(message.payload?.headers ?? [], 'Subject');
    const body = extractBody(message.payload);

    const transaction = parseBidvEmail(ref.id, subject, body);
    if (transaction) {
      transactions.push({ ...transaction, raw_email: body });
    }
  }

  const added = await addTransactionsIfNew(transactions);
  await setLastSyncTime(new Date().toISOString());

  if (added.length > 0) {
    await notifyNewTransactions(added);
  }

  return added;
}

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    if (!(await isGmailConnected())) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const added = await syncGmailTransactions();
    return added.length > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('BIDV_GMAIL_SYNC failed', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterBackgroundSync(): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK)) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }
}
