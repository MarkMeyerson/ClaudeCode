/**
 * NAIOS Platform - Authentication Utilities
 *
 * This module provides comprehensive authentication and authorization utilities
 * including JWT token management, password hashing, API key validation, and
 * permission checking.
 *
 * @module shared/utils/auth
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { JWTPayload, User, UserRole } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'development-refresh-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const API_KEY_SECRET = process.env.API_KEY_SECRET || 'development-api-key-secret';
const BCRYPT_ROUNDS = 12;

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password
 * @returns Promise resolving to hashed password
 *
 * @example
 * ```typescript
 * const hashed = await hashPassword('mySecurePassword123');
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise resolving to true if password matches
 *
 * @example
 * ```typescript
 * const isValid = await verifyPassword('myPassword', hashedPassword);
 * ```
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random password
 *
 * @param length - Length of password to generate (default: 16)
 * @returns Secure random password
 *
 * @example
 * ```typescript
 * const tempPassword = generateSecurePassword(20);
 * ```
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one of each type
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[crypto.randomInt(0, charset.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// ============================================================================
// JWT TOKEN UTILITIES
// ============================================================================

/**
 * Generate a JWT access token
 *
 * @param payload - JWT payload containing user information
 * @param expiresIn - Token expiration time (default from env)
 * @returns Signed JWT token
 *
 * @example
 * ```typescript
 * const token = generateAccessToken({
 *   user_id: '123',
 *   email: 'user@example.com',
 *   role: UserRole.STAFF,
 *   permissions: ['read:donors', 'write:donations']
 * });
 * ```
 */
export function generateAccessToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresIn: string = JWT_EXPIRY
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    issuer: 'naios-platform',
    audience: 'naios-api'
  });
}

/**
 * Generate a JWT refresh token
 *
 * @param payload - JWT payload (typically just user_id)
 * @param expiresIn - Token expiration time (default from env)
 * @returns Signed JWT refresh token
 *
 * @example
 * ```typescript
 * const refreshToken = generateRefreshToken({ user_id: '123' });
 * ```
 */
export function generateRefreshToken(
  payload: { user_id: string },
  expiresIn: string = JWT_REFRESH_EXPIRY
): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn,
    issuer: 'naios-platform',
    audience: 'naios-refresh'
  });
}

/**
 * Verify and decode a JWT access token
 *
 * @param token - JWT token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * ```typescript
 * try {
 *   const payload = verifyAccessToken(token);
 *   console.log('User ID:', payload.user_id);
 * } catch (error) {
 *   console.error('Invalid token');
 * }
 * ```
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'naios-platform',
      audience: 'naios-api'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Verify and decode a JWT refresh token
 *
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * ```typescript
 * const payload = verifyRefreshToken(refreshToken);
 * ```
 */
export function verifyRefreshToken(token: string): { user_id: string } {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'naios-platform',
      audience: 'naios-refresh'
    }) as { user_id: string };

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Decode a JWT token without verification (use with caution)
 *
 * @param token - JWT token to decode
 * @returns Decoded token payload or null
 *
 * @example
 * ```typescript
 * const payload = decodeToken(token);
 * if (payload) {
 *   console.log('Token expires at:', new Date(payload.exp * 1000));
 * }
 * ```
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// API KEY UTILITIES
// ============================================================================

/**
 * Generate a secure API key
 *
 * @param prefix - Optional prefix for the API key (e.g., 'naios_live_')
 * @returns Secure API key
 *
 * @example
 * ```typescript
 * const apiKey = generateApiKey('naios_live_');
 * // Returns: naios_live_abc123def456...
 * ```
 */
export function generateApiKey(prefix: string = 'naios_'): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}${randomBytes}`;
}

/**
 * Hash an API key for secure storage
 *
 * @param apiKey - API key to hash
 * @returns Hashed API key
 *
 * @example
 * ```typescript
 * const hashed = hashApiKey(apiKey);
 * // Store hashed value in database
 * ```
 */
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHmac('sha256', API_KEY_SECRET)
    .update(apiKey)
    .digest('hex');
}

/**
 * Verify an API key against a hash
 *
 * @param apiKey - API key to verify
 * @param hash - Hashed API key to compare against
 * @returns True if API key matches hash
 *
 * @example
 * ```typescript
 * if (verifyApiKey(providedKey, storedHash)) {
 *   // API key is valid
 * }
 * ```
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  );
}

// ============================================================================
// PERMISSION UTILITIES
// ============================================================================

/**
 * Permission structure: action:resource
 * Examples: read:donors, write:donations, admin:all
 */

/**
 * Check if a user has a specific permission
 *
 * @param userPermissions - Array of user's permissions
 * @param requiredPermission - Permission to check for
 * @returns True if user has the permission
 *
 * @example
 * ```typescript
 * const canRead = hasPermission(user.permissions, 'read:donors');
 * ```
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Check for exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard permissions
  if (userPermissions.includes('admin:all') || userPermissions.includes('*:*')) {
    return true;
  }

  // Check for resource wildcard (e.g., *:donors matches read:donors)
  const [action, resource] = requiredPermission.split(':');
  if (userPermissions.includes(`*:${resource}`)) {
    return true;
  }

  // Check for action wildcard (e.g., read:* matches read:donors)
  if (userPermissions.includes(`${action}:*`)) {
    return true;
  }

  return false;
}

/**
 * Check if user has all of the specified permissions
 *
 * @param userPermissions - Array of user's permissions
 * @param requiredPermissions - Array of required permissions
 * @returns True if user has all permissions
 *
 * @example
 * ```typescript
 * const canManageDonors = hasAllPermissions(
 *   user.permissions,
 *   ['read:donors', 'write:donors', 'delete:donors']
 * );
 * ```
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every(permission =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Check if user has any of the specified permissions
 *
 * @param userPermissions - Array of user's permissions
 * @param requiredPermissions - Array of required permissions
 * @returns True if user has at least one permission
 *
 * @example
 * ```typescript
 * const canViewFinancials = hasAnyPermission(
 *   user.permissions,
 *   ['read:transactions', 'read:accounts', 'admin:financial']
 * );
 * ```
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some(permission =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Check if user has a specific role
 *
 * @param userRole - User's role
 * @param requiredRole - Required role
 * @returns True if user has the role
 *
 * @example
 * ```typescript
 * if (hasRole(user.role, UserRole.ORG_ADMIN)) {
 *   // User is an org admin
 * }
 * ```
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return userRole === requiredRole || userRole === UserRole.SUPER_ADMIN;
}

/**
 * Check if user has any of the specified roles
 *
 * @param userRole - User's role
 * @param requiredRoles - Array of required roles
 * @returns True if user has any of the roles
 *
 * @example
 * ```typescript
 * const canManagePrograms = hasAnyRole(user.role, [
 *   UserRole.ORG_ADMIN,
 *   UserRole.PROGRAM_MANAGER
 * ]);
 * ```
 */
export function hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }
  return requiredRoles.includes(userRole);
}

// ============================================================================
// TWO-FACTOR AUTHENTICATION UTILITIES
// ============================================================================

/**
 * Generate a 6-digit TOTP code
 *
 * @returns 6-digit verification code
 *
 * @example
 * ```typescript
 * const code = generateTOTP();
 * // Send code via SMS or email
 * ```
 */
export function generateTOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate a time-based hash for TOTP verification
 *
 * @param secret - User's 2FA secret
 * @param window - Time window in seconds (default: 30)
 * @returns Time-based hash
 */
export function generateTOTPHash(secret: string, window: number = 30): string {
  const time = Math.floor(Date.now() / 1000 / window);
  return crypto
    .createHmac('sha256', secret)
    .update(time.toString())
    .digest('hex');
}

/**
 * Verify a TOTP code
 *
 * @param code - Code to verify
 * @param secret - User's 2FA secret
 * @param window - Time window in seconds (default: 30)
 * @returns True if code is valid
 */
export function verifyTOTP(
  code: string,
  secret: string,
  window: number = 30
): boolean {
  const currentHash = generateTOTPHash(secret, window);
  const previousHash = generateTOTPHash(secret, window);

  return code === currentHash || code === previousHash;
}

// ============================================================================
// SESSION UTILITIES
// ============================================================================

/**
 * Generate a session ID
 *
 * @returns Unique session ID
 *
 * @example
 * ```typescript
 * const sessionId = generateSessionId();
 * ```
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a CSRF token
 *
 * @returns CSRF token
 *
 * @example
 * ```typescript
 * const csrfToken = generateCSRFToken();
 * ```
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Verify a CSRF token
 *
 * @param token - Token to verify
 * @param expected - Expected token value
 * @returns True if token is valid
 */
export function verifyCSRFToken(token: string, expected: string): boolean {
  if (!token || !expected || token.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expected)
  );
}

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt sensitive data
 *
 * @param data - Data to encrypt
 * @returns Encrypted data object with IV and auth tag
 *
 * @example
 * ```typescript
 * const encrypted = encryptData('sensitive information');
 * // Store encrypted.data, encrypted.iv, and encrypted.authTag
 * ```
 */
export function encryptData(data: string): {
  data: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    data: encrypted,
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex')
  };
}

/**
 * Decrypt encrypted data
 *
 * @param encrypted - Encrypted data object
 * @returns Decrypted data
 *
 * @example
 * ```typescript
 * const decrypted = decryptData({
 *   data: encrypted.data,
 *   iv: encrypted.iv,
 *   authTag: encrypted.authTag
 * });
 * ```
 */
export function decryptData(encrypted: {
  data: string;
  iv: string;
  authTag: string;
}): string {
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encrypted.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

  let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export default {
  // Password utilities
  hashPassword,
  verifyPassword,
  generateSecurePassword,

  // JWT utilities
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,

  // API key utilities
  generateApiKey,
  hashApiKey,
  verifyApiKey,

  // Permission utilities
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRole,
  hasAnyRole,

  // 2FA utilities
  generateTOTP,
  generateTOTPHash,
  verifyTOTP,

  // Session utilities
  generateSessionId,
  generateCSRFToken,
  verifyCSRFToken,

  // Encryption utilities
  encryptData,
  decryptData
};
