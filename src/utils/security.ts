import CryptoJS from 'crypto-js';

// Test ortamında process.env kullanıyoruz, üretimde import.meta.env
const getEncryptionKey = () => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return process.env.VITE_ENCRYPTION_KEY || 'test-encryption-key';
  }
  
  if (typeof window !== 'undefined') {
    // @ts-ignore
    return window.env?.VITE_ENCRYPTION_KEY || 'default-key-replace-in-production';
  }
  
  return 'default-key-replace-in-production';
};

const ENCRYPTION_KEY = getEncryptionKey();
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 saat

export const encryptApiKey = (apiKey: string): string => {
  return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
};

export const decryptApiKey = (encryptedApiKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedApiKey, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const setSecureApiKey = (provider: string, apiKey: string): void => {
  const encryptedKey = encryptApiKey(apiKey);
  const expirationDate = new Date(Date.now() + SESSION_TIMEOUT);
  
  document.cookie = `${provider}-api-key=${encryptedKey}; expires=${expirationDate.toUTCString()}; path=/; secure; samesite=strict; httponly`;
};

export const getSecureApiKey = (provider: string): string | null => {
  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith(`${provider}-api-key=`));
  
  if (!cookie) return null;
  
  const encryptedKey = cookie.split('=')[1];
  return decryptApiKey(encryptedKey);
};

export const removeSecureApiKey = (provider: string): void => {
  document.cookie = `${provider}-api-key=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict; httponly`;
};

// Rate limiting için basit bir implementasyon
const rateLimits = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 dakika
const MAX_REQUESTS = 60; // dakikada maksimum istek sayısı

export const checkRateLimit = (provider: string): boolean => {
  const now = Date.now();
  const requests = rateLimits.get(provider) || [];
  
  // Son 1 dakika içindeki istekleri filtrele
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimits.set(provider, recentRequests);
  return true;
}; 