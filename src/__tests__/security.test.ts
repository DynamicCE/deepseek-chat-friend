import {
  encryptApiKey,
  decryptApiKey,
  setSecureApiKey,
  getSecureApiKey,
  removeSecureApiKey,
  checkRateLimit
} from '../utils/security';

describe('API Key Security Utils', () => {
  const testApiKey = 'sk-test-api-key';
  const testProvider = 'openai';

  describe('Encryption/Decryption', () => {
    it('should encrypt API key', () => {
      const encrypted = encryptApiKey(testApiKey);
      expect(encrypted).toBe('encrypted-test-key');
      expect(encrypted).not.toBe(testApiKey);
    });

    it('should decrypt encrypted API key', () => {
      const encrypted = encryptApiKey(testApiKey);
      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toBe('test-decrypted-value');
    });
  });

  describe('Cookie Management', () => {
    it('should set secure cookie with encrypted API key', () => {
      setSecureApiKey(testProvider, testApiKey);
      expect(document.cookie).toContain(`${testProvider}-api-key`);
      expect(document.cookie).toContain('encrypted-test-key');
    });

    it('should get API key from cookie', () => {
      setSecureApiKey(testProvider, testApiKey);
      const retrieved = getSecureApiKey(testProvider);
      expect(retrieved).toBe('test-decrypted-value');
    });

    it('should return null when cookie not found', () => {
      const retrieved = getSecureApiKey('nonexistent');
      expect(retrieved).toBeNull();
    });

    it('should remove API key cookie', () => {
      setSecureApiKey(testProvider, testApiKey);
      removeSecureApiKey(testProvider);
      const retrieved = getSecureApiKey(testProvider);
      expect(retrieved).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should allow requests within rate limit', () => {
      for (let i = 0; i < 60; i++) {
        expect(checkRateLimit(testProvider)).toBe(true);
      }
    });

    it('should block requests when rate limit exceeded', () => {
      // Make 60 requests (limit)
      for (let i = 0; i < 60; i++) {
        checkRateLimit(testProvider);
      }
      
      // 61st request should be blocked
      expect(checkRateLimit(testProvider)).toBe(false);
    });

    it('should reset rate limit after window expires', () => {
      // Fill up the rate limit
      for (let i = 0; i < 60; i++) {
        checkRateLimit(testProvider);
      }
      
      // Advance time by 1 minute (rate limit window)
      jest.advanceTimersByTime(60 * 1000);
      
      // Should allow new requests
      expect(checkRateLimit(testProvider)).toBe(true);
    });
  });
}); 