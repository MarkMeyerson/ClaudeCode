import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Attach user info to request
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      userType: decoded.userType,
      organizationId: decoded.organizationId,
      roles: decoded.roles || []
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }

    logger.error('Authentication error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Authorization middleware - checks if user has required role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Not authenticated'
      });
    }

    const hasRole = allowedRoles.some(role =>
      user.roles.includes(role) || user.userType === role
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Check if user has permission to access resource
 */
export const checkResourceAccess = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const resourceId = req.params.id || req.params.clientId || req.params.assessmentId;

    // Super admins have access to everything
    if (user.userType === 'super_admin') {
      return next();
    }

    // Check resource ownership/access
    // In production: Query database to verify access
    const hasAccess = await checkUserHasAccessToResource(
      user.userId,
      user.organizationId,
      resourceType,
      resourceId
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have access to this resource'
      });
    }

    next();
  };
};

/**
 * Helper function to check resource access
 */
async function checkUserHasAccessToResource(
  userId: string,
  organizationId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // In production: Implement actual access control logic
  // For now, return true for development
  return true;
}
