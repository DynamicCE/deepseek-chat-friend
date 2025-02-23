import crypto from 'crypto';

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
const IV_LENGTH = 16;

export const encryptMessage = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decryptMessage = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const setSecureApiKey = (provider: string, apiKey: string): void => {
  try {
    const encryptedKey = encryptMessage(apiKey);
    sessionStorage.setItem(`${provider}_api_key`, encryptedKey);
  } catch (error) {
    console.error('API key kaydetme hatası:', error);
  }
};

export const getSecureApiKey = (provider: string): string | null => {
  try {
    const encryptedKey = sessionStorage.getItem(`${provider}_api_key`);
    return encryptedKey ? decryptMessage(encryptedKey) : null;
  } catch (error) {
    console.error('API key okuma hatası:', error);
    return null;
  }
};

export const removeSecureApiKey = (provider: string): void => {
  try {
    sessionStorage.removeItem(`${provider}_api_key`);
  } catch (error) {
    console.error('API key silme hatası:', error);
  }
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