/**
 * NAIOS Platform - Authentication Utilities Tests
 *
 * Comprehensive test suite for authentication utilities
 *
 * @version 1.0.0
 */

import {
  hashPassword,
  verifyPassword,
  generateSecurePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRole,
  hasAnyRole,
  generateTOTP,
  generateSessionId,
  generateCSRFToken,
  verifyCSRFToken,
  encryptData,
  decryptData
} from '../../utils/auth';
import { UserRole } from '../../types';

describe('Authentication Utilities', () => {
  // ========================================================================
  // PASSWORD UTILITIES
  // ========================================================================

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for short passwords', async () => {
      const shortPassword = 'short';

      await expect(hashPassword(shortPassword)).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow();
    });
  });

  describe('Password Verification', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword('TestPassword123!');

      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isValid = await verifyPassword('TestPassword123!', '');

      expect(isValid).toBe(false);
    });
  });

  describe('Secure Password Generation', () => {
    it('should generate password with default length', () => {
      const password = generateSecurePassword();

      expect(password).toHaveLength(16);
    });

    it('should generate password with custom length', () => {
      const length = 24;
      const password = generateSecurePassword(length);

      expect(password).toHaveLength(length);
    });

    it('should include different character types', () => {
      const password = generateSecurePassword(20);

      expect(password).toMatch(/[a-z]/); // lowercase
      expect(password).toMatch(/[A-Z]/); // uppercase
      expect(password).toMatch(/[0-9]/); // numbers
      expect(password).toMatch(/[!@#$%^&*]/); // special chars
    });

    it('should generate unique passwords', () => {
      const passwords = Array.from({ length: 100 }, () => generateSecurePassword());
      const uniquePasswords = new Set(passwords);

      expect(uniquePasswords.size).toBe(100);
    });
  });

  // ========================================================================
  // JWT UTILITIES
  // ========================================================================

  describe('JWT Token Generation', () => {
    const payload = {
      user_id: 'test-user-123',
      email: 'test@example.com',
      role: UserRole.STAFF,
      permissions: ['read:donors', 'write:donations']
    };

    it('should generate access token', () => {
      const token = generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should generate refresh token', () => {
      const token = generateRefreshToken({ user_id: payload.user_id });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include payload in token', () => {
      const token = generateAccessToken(payload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.user_id).toBe(payload.user_id);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
    });

    it('should set expiration time', () => {
      const token = generateAccessToken(payload, '1h');
      const decoded = decodeToken(token);

      expect(decoded?.exp).toBeDefined();
      expect(decoded?.iat).toBeDefined();
      expect(decoded!.exp! - decoded!.iat!).toBeLessThanOrEqual(3600);
    });
  });

  describe('JWT Token Verification', () => {
    const payload = {
      user_id: 'test-user-123',
      email: 'test@example.com',
      role: UserRole.STAFF,
      permissions: ['read:donors']
    };

    it('should verify valid access token', () => {
      const token = generateAccessToken(payload);
      const verified = verifyAccessToken(token);

      expect(verified).toBeDefined();
      expect(verified.user_id).toBe(payload.user_id);
    });

    it('should verify valid refresh token', () => {
      const token = generateRefreshToken({ user_id: payload.user_id });
      const verified = verifyRefreshToken(token);

      expect(verified).toBeDefined();
      expect(verified.user_id).toBe(payload.user_id);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyAccessToken(invalidToken)).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      const token = generateAccessToken(payload, '0s');

      // Wait for token to expire
      return new Promise(resolve => {
        setTimeout(() => {
          expect(() => verifyAccessToken(token)).toThrow('Token has expired');
          resolve(undefined);
        }, 1000);
      });
    }, 10000);
  });

  // ========================================================================
  // API KEY UTILITIES
  // ========================================================================

  describe('API Key Management', () => {
    it('should generate API key with default prefix', () => {
      const apiKey = generateApiKey();

      expect(apiKey).toMatch(/^naios_[a-f0-9]{64}$/);
    });

    it('should generate API key with custom prefix', () => {
      const prefix = 'custom_';
      const apiKey = generateApiKey(prefix);

      expect(apiKey).toMatch(new RegExp(`^${prefix}[a-f0-9]{64}$`));
    });

    it('should hash API key consistently', () => {
      const apiKey = generateApiKey();
      const hash1 = hashApiKey(apiKey);
      const hash2 = hashApiKey(apiKey);

      expect(hash1).toBe(hash2);
    });

    it('should verify correct API key', () => {
      const apiKey = generateApiKey();
      const hash = hashApiKey(apiKey);

      const isValid = verifyApiKey(apiKey, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect API key', () => {
      const apiKey = generateApiKey();
      const wrongKey = generateApiKey();
      const hash = hashApiKey(apiKey);

      const isValid = verifyApiKey(wrongKey, hash);

      expect(isValid).toBe(false);
    });
  });

  // ========================================================================
  // PERMISSION UTILITIES
  // ========================================================================

  describe('Permission Checking', () => {
    const userPermissions = ['read:donors', 'write:donations', 'read:assessments'];

    it('should grant exact permission match', () => {
      const result = hasPermission(userPermissions, 'read:donors');

      expect(result).toBe(true);
    });

    it('should deny missing permission', () => {
      const result = hasPermission(userPermissions, 'delete:donors');

      expect(result).toBe(false);
    });

    it('should grant admin:all wildcard', () => {
      const adminPermissions = ['admin:all'];

      const result = hasPermission(adminPermissions, 'delete:anything');

      expect(result).toBe(true);
    });

    it('should grant resource wildcard', () => {
      const permissions = ['*:donors'];

      expect(hasPermission(permissions, 'read:donors')).toBe(true);
      expect(hasPermission(permissions, 'write:donors')).toBe(true);
      expect(hasPermission(permissions, 'delete:donors')).toBe(true);
    });

    it('should grant action wildcard', () => {
      const permissions = ['read:*'];

      expect(hasPermission(permissions, 'read:donors')).toBe(true);
      expect(hasPermission(permissions, 'read:assessments')).toBe(true);
      expect(hasPermission(permissions, 'write:donors')).toBe(false);
    });

    it('should check all permissions', () => {
      const required = ['read:donors', 'write:donations'];

      expect(hasAllPermissions(userPermissions, required)).toBe(true);
    });

    it('should fail if missing one permission', () => {
      const required = ['read:donors', 'delete:donors'];

      expect(hasAllPermissions(userPermissions, required)).toBe(false);
    });

    it('should check any permission', () => {
      const required = ['read:donors', 'delete:donors'];

      expect(hasAnyPermission(userPermissions, required)).toBe(true);
    });

    it('should fail if no permissions match', () => {
      const required = ['delete:donors', 'admin:all'];

      expect(hasAnyPermission(userPermissions, required)).toBe(false);
    });
  });

  describe('Role Checking', () => {
    it('should grant exact role match', () => {
      expect(hasRole(UserRole.ORG_ADMIN, UserRole.ORG_ADMIN)).toBe(true);
    });

    it('should deny different role', () => {
      expect(hasRole(UserRole.STAFF, UserRole.ORG_ADMIN)).toBe(false);
    });

    it('should always grant super admin', () => {
      expect(hasRole(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)).toBe(true);
      expect(hasRole(UserRole.SUPER_ADMIN, UserRole.STAFF)).toBe(true);
    });

    it('should check any role', () => {
      const roles = [UserRole.ORG_ADMIN, UserRole.PROGRAM_MANAGER];

      expect(hasAnyRole(UserRole.ORG_ADMIN, roles)).toBe(true);
    });

    it('should grant super admin for any role check', () => {
      const roles = [UserRole.STAFF, UserRole.VOLUNTEER];

      expect(hasAnyRole(UserRole.SUPER_ADMIN, roles)).toBe(true);
    });
  });

  // ========================================================================
  // 2FA UTILITIES
  // ========================================================================

  describe('Two-Factor Authentication', () => {
    it('should generate 6-digit TOTP', () => {
      const totp = generateTOTP();

      expect(totp).toMatch(/^\d{6}$/);
    });

    it('should generate different codes', () => {
      const codes = Array.from({ length: 10 }, () => generateTOTP());
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBeGreaterThan(1);
    });
  });

  // ========================================================================
  // SESSION UTILITIES
  // ========================================================================

  describe('Session Management', () => {
    it('should generate session ID', () => {
      const sessionId = generateSessionId();

      expect(sessionId).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique session IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateSessionId());
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(100);
    });

    it('should generate CSRF token', () => {
      const token = generateCSRFToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify matching CSRF tokens', () => {
      const token = generateCSRFToken();

      const isValid = verifyCSRFToken(token, token);

      expect(isValid).toBe(true);
    });

    it('should reject mismatched CSRF tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      const isValid = verifyCSRFToken(token1, token2);

      expect(isValid).toBe(false);
    });
  });

  // ========================================================================
  // ENCRYPTION UTILITIES
  // ========================================================================

  describe('Data Encryption', () => {
    it('should encrypt data', () => {
      const plaintext = 'Sensitive information';
      const encrypted = encryptData(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.data).not.toBe(plaintext);
    });

    it('should decrypt data correctly', () => {
      const plaintext = 'Sensitive information';
      const encrypted = encryptData(plaintext);

      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'Special chars: !@#$%^&*(){}[]|\\:";\'<>?,./~`';
      const encrypted = encryptData(plaintext);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode', () => {
      const plaintext = 'Unicode: 你好世界 🌍 العربية';
      const encrypted = encryptData(plaintext);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same input', () => {
      const plaintext = 'Same plaintext';
      const encrypted1 = encryptData(plaintext);
      const encrypted2 = encryptData(plaintext);

      expect(encrypted1.data).not.toBe(encrypted2.data);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });
});
