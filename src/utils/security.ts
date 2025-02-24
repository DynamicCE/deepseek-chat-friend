// Web Crypto API kullanarak güvenlik işlemleri
const encoder = new TextEncoder();
const decoder = new TextDecoder();

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

export const generateSecretKey = async (): Promise<string> => {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
};

export const encryptMessage = async (message: string, secretKeyBase64: string): Promise<string> => {
  try {
    const secretKey = await crypto.subtle.importKey(
      'raw',
      Uint8Array.from(atob(secretKeyBase64), c => c.charCodeAt(0)),
      'AES-GCM',
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedMessage = encoder.encode(message);

    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      secretKey,
      encodedMessage
    );

    const encryptedArray = new Uint8Array(encryptedContent);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

export const decryptMessage = async (encryptedData: string, secretKeyBase64: string): Promise<string> => {
  try {
    const secretKey = await crypto.subtle.importKey(
      'raw',
      Uint8Array.from(atob(secretKeyBase64), c => c.charCodeAt(0)),
      'AES-GCM',
      false,
      ['decrypt']
    );

    const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = encryptedArray.slice(0, 12);
    const encryptedContent = encryptedArray.slice(12);

    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      secretKey,
      encryptedContent
    );

    return decoder.decode(decryptedContent);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

// API key doğrulama artık test isteği ile yapılacak
export const validateApiKeyFormat = (provider: string, apiKey: string): boolean => {
  return apiKey.length > 0; // Sadece boş olup olmadığını kontrol et
};

// Brute force koruması
const failedAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 dakika

export const checkFailedAttempts = (provider: string): boolean => {
  const attempts = failedAttempts.get(provider);
  if (!attempts) return true;

  const now = Date.now();
  if (now - attempts.timestamp > LOCKOUT_DURATION) {
    failedAttempts.delete(provider);
    return true;
  }

  return attempts.count < MAX_FAILED_ATTEMPTS;
};

export const recordFailedAttempt = (provider: string): void => {
  const attempts = failedAttempts.get(provider) || { count: 0, timestamp: Date.now() };
  attempts.count++;
  attempts.timestamp = Date.now();
  failedAttempts.set(provider, attempts);
};

// Güvenli API key yönetimi için ek kontroller
export const setSecureApiKey = async (provider: string, apiKey: string): Promise<void> => {
  try {
    if (!validateApiKeyFormat(provider, apiKey)) {
      throw new Error('Geçersiz API anahtarı formatı');
    }

    if (!checkFailedAttempts(provider)) {
      throw new Error('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.');
    }

    const secretKey = await generateSecretKey();
    const encryptedKey = await encryptMessage(apiKey, secretKey);
    sessionStorage.setItem(`${provider}_api_key`, encryptedKey);
    sessionStorage.setItem(`${provider}_secret_key`, secretKey);
    sessionStorage.setItem(`${provider}_expiry`, (Date.now() + SESSION_TIMEOUT).toString());
  } catch (error) {
    recordFailedAttempt(provider);
    console.error('API key kaydetme hatası:', error);
    throw error;
  }
};

export const getSecureApiKey = async (provider: string): Promise<string | null> => {
  try {
    const encryptedKey = sessionStorage.getItem(`${provider}_api_key`);
    const secretKey = sessionStorage.getItem(`${provider}_secret_key`);
    const expiry = sessionStorage.getItem(`${provider}_expiry`);

    if (!encryptedKey || !secretKey || !expiry) {
      return null;
    }

    // Süre kontrolü
    if (Date.now() > parseInt(expiry)) {
      removeSecureApiKey(provider);
      return null;
    }

    return await decryptMessage(encryptedKey, secretKey);
  } catch (error) {
    console.error('API key alma hatası:', error);
    return null;
  }
};

export const removeSecureApiKey = (provider: string): void => {
  sessionStorage.removeItem(`${provider}_api_key`);
  sessionStorage.removeItem(`${provider}_secret_key`);
  sessionStorage.removeItem(`${provider}_expiry`);
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