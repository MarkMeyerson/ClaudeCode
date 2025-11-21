/**
 * NAIOS Platform - Authentication Middleware
 *
 * Express middleware for authentication and authorization
 *
 * @module shared/middleware/auth
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, hasPermission, hasRole, hasAnyRole } from '../utils/auth';
import { JWTPayload, UserRole } from '../types';
import { logger } from '../utils/logger';

// ============================================================================
// EXTEND EXPRESS REQUEST TYPE
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      organization_id?: string;
    }
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to authenticate requests using JWT
 *
 * Extracts and verifies JWT token from Authorization header
 *
 * @example
 * ```typescript
 * router.get('/protected', authenticate, (req, res) => {
 *   res.json({ user: req.user });
 * });
 * ```
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization header provided'
        }
      });
      return;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_AUTH_SCHEME',
          message: 'Invalid authorization scheme. Use Bearer token'
        }
      });
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    req.organization_id = payload.organization_id;

    logger.debug('User authenticated', {
      user_id: payload.user_id,
      role: payload.role
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', { error });

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: error instanceof Error ? error.message : 'Authentication failed'
      }
    });
  }
}

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token provided
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const [scheme, token] = authHeader.split(' ');

      if (scheme === 'Bearer' && token) {
        const payload = verifyAccessToken(token);
        req.user = payload;
        req.organization_id = payload.organization_id;
      }
    }

    next();
  } catch (error) {
    // Log but don't fail
    logger.debug('Optional authentication failed', { error });
    next();
  }
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to check if user has required permission
 *
 * @param permission - Required permission (e.g., 'read:donors')
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.get('/donors', authenticate, requirePermission('read:donors'), getDonors);
 * ```
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!hasPermission(req.user.permissions, permission)) {
      logger.warn('Permission denied', {
        user_id: req.user.user_id,
        required_permission: permission,
        user_permissions: req.user.permissions
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permission '${permission}' required`
        }
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user has any of the required permissions
 *
 * @param permissions - Array of permissions (user needs at least one)
 * @returns Express middleware function
 */
export function requireAnyPermission(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const hasAny = permissions.some(permission =>
      hasPermission(req.user!.permissions, permission)
    );

    if (!hasAny) {
      logger.warn('Permission denied', {
        user_id: req.user.user_id,
        required_permissions: permissions,
        user_permissions: req.user.permissions
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `One of the following permissions required: ${permissions.join(', ')}`
        }
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user has required role
 *
 * @param role - Required role
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.post('/users', authenticate, requireRole(UserRole.ORG_ADMIN), createUser);
 * ```
 */
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!hasRole(req.user.role, role)) {
      logger.warn('Role check failed', {
        user_id: req.user.user_id,
        required_role: role,
        user_role: req.user.role
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role '${role}' required`
        }
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user has any of the required roles
 *
 * @param roles - Array of roles (user needs at least one)
 * @returns Express middleware function
 */
export function requireAnyRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!hasAnyRole(req.user.role, roles)) {
      logger.warn('Role check failed', {
        user_id: req.user.user_id,
        required_roles: roles,
        user_role: req.user.role
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `One of the following roles required: ${roles.join(', ')}`
        }
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user belongs to the organization
 *
 * @param orgIdParam - Name of route parameter containing org ID (default: 'org_id')
 * @returns Express middleware function
 */
export function requireOrgMembership(orgIdParam: string = 'org_id') {
  return (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const orgId = req.params[orgIdParam] || req.body?.organization_id;

    // Super admin can access any organization
    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    if (req.user.organization_id !== orgId) {
      logger.warn('Organization access denied', {
        user_id: req.user.user_id,
        user_org_id: req.user.organization_id,
        requested_org_id: orgId
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access to this organization is not allowed'
        }
      });
      return;
    }

    next();
  };
}

// ============================================================================
// API KEY MIDDLEWARE
// ============================================================================

/**
 * Middleware to authenticate requests using API key
 *
 * @example
 * ```typescript
 * router.post('/webhooks', authenticateApiKey, handleWebhook);
 * ```
 */
export function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
  // Implementation would check API key from headers or query params
  // and validate against stored API keys in database
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'API key required'
      }
    });
    return;
  }

  // TODO: Implement API key validation logic
  // For now, accept any key in development
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  res.status(401).json({
    success: false,
    error: {
      code: 'INVALID_API_KEY',
      message: 'Invalid API key'
    }
  });
}

// ============================================================================
// EXPORT ALL MIDDLEWARE
// ============================================================================

export default {
  authenticate,
  optionalAuthenticate,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireAnyRole,
  requireOrgMembership,
  authenticateApiKey
};
