/**
 * NAIOS Platform - Jest Setup
 *
 * Global test setup and teardown
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.API_KEY_SECRET = 'test-api-key-secret';

// Global test timeout
jest.setTimeout(10000);

// Console silence (optional - remove for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global setup
beforeAll(async () => {
  // Initialize test database connections, etc.
});

// Global teardown
afterAll(async () => {
  // Close database connections, etc.
});
