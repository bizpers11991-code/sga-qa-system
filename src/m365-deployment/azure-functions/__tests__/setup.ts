// Test setup file
import 'openai/shims/node';
import { jest, beforeAll, afterEach } from '@jest/globals';

// Mock Azure Functions context
jest.mock('@azure/functions', () => ({
  app: {
    http: jest.fn()
  }
}));

// Mock Azure OpenAI
jest.mock('@azure/openai', () => ({
  OpenAIClient: jest.fn(),
  AzureKeyCredential: jest.fn()
}), { virtual: true });

// Mock Azure Key Vault
jest.mock('@azure/keyvault-secrets', () => ({
  SecretClient: jest.fn()
}), { virtual: true });

// Mock Azure Identity
jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn()
}), { virtual: true });

// Don't mock Joi - let it work normally for validation tests

// Mock localStorage for tests
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null),
};
global.localStorage = localStorageMock as any;

// Global test setup
beforeAll(() => {
  // Set up test environment variables
  process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com';
  process.env.AZURE_OPENAI_KEY = 'test-key';
  process.env.KEY_VAULT_NAME = 'test-kv';
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
