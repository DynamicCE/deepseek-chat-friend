import '@testing-library/jest-dom';

// Mock CryptoJS
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn((_text: string, _key: string) => ({
      toString: () => `encrypted-test-key`
    })),
    decrypt: jest.fn((_text: string, _key: string) => ({
      toString: () => 'test-decrypted-value'
    }))
  },
  enc: {
    Utf8: 'utf8'
  }
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_ENCRYPTION_KEY = 'test-encryption-key';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ choices: [{ message: { content: 'Test response' } }] })
  })
) as jest.Mock;

// Mock console.error to keep test output clean
console.error = jest.fn();

// Cookie mock with proper implementation
const cookieStore: { [key: string]: string } = {};

Object.defineProperty(document, 'cookie', {
  get: jest.fn(() => {
    return Object.entries(cookieStore)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }),
  set: jest.fn((value: string) => {
    const [cookie] = value.split(';');
    if (!cookie) return;
    const [key, val] = cookie.split('=');
    if (val === '') {
      delete cookieStore[key];
    } else {
      cookieStore[key] = val;
    }
  }),
});

// Reset all mocks and cookie store before each test
beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(cookieStore).forEach(key => delete cookieStore[key]);
}); 