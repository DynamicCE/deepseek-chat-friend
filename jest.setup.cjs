require('@testing-library/jest-dom');

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = MockIntersectionObserver;

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env = {
  ...process.env,
  OPENAI_API_KEY: 'test-openai-key',
  ANTHROPIC_API_KEY: 'test-anthropic-key',
  DEEPSEEK_API_KEY: 'test-deepseek-key',
}; 