/**
 * Organization routes for Assessment Engine service
 */

import { Router } from 'express';
import { authenticate, requirePermission } from '@naios/shared/middleware/auth.middleware';
import { asyncHandler } from '@naios/shared/middleware/error.middleware';
import * as organizationController from '../controllers/organizations.controller';

const router = Router();

/**
 * @route   GET /api/organizations
 * @desc    List all organizations
 * @access  Private - Requires read:organizations permission
 */
router.get(
  '/',
  authenticate,
  requirePermission('read:organizations'),
  asyncHandler(organizationController.listOrganizations)
);

/**
 * @route   POST /api/organizations
 * @desc    Create a new organization
 * @access  Private - Requires write:organizations permission
 */
router.post(
  '/',
  authenticate,
  requirePermission('write:organizations'),
  asyncHandler(organizationController.createOrganization)
);

/**
 * @route   GET /api/organizations/:id
 * @desc    Get organization by ID
 * @access  Private - Requires read:organizations permission
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('read:organizations'),
  asyncHandler(organizationController.getOrganization)
);

/**
 * @route   PUT /api/organizations/:id
 * @desc    Update organization
 * @access  Private - Requires write:organizations permission
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('write:organizations'),
  asyncHandler(organizationController.updateOrganization)
);

/**
 * @route   DELETE /api/organizations/:id
 * @desc    Delete organization (soft delete)
 * @access  Private - Requires delete:organizations permission
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('delete:organizations'),
  asyncHandler(organizationController.deleteOrganization)
);

/**
 * @route   GET /api/organizations/:id/assessments
 * @desc    Get all assessments for an organization
 * @access  Private - Requires read:assessments permission
 */
router.get(
  '/:id/assessments',
  authenticate,
  requirePermission('read:assessments'),
  asyncHandler(organizationController.getOrganizationAssessments)
);

/**
 * @route   GET /api/organizations/:id/stats
 * @desc    Get organization statistics
 * @access  Private - Requires read:organizations permission
 */
router.get(
  '/:id/stats',
  authenticate,
  requirePermission('read:organizations'),
  asyncHandler(organizationController.getOrganizationStats)
);

export default router;
