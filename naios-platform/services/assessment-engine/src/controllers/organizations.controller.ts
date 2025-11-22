/**
 * Organization controllers for Assessment Engine service
 */

import { Request, Response } from 'express';
import { query, queryOne, queryPaginated } from '@naios/shared/utils/database';
import { NotFoundError, ValidationError } from '@naios/shared/middleware/error.middleware';
import { Organization, ApiResponse, PaginatedResponse } from '@naios/shared/types';
import Joi from 'joi';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createOrganizationSchema = Joi.object({
  ein: Joi.string().required().pattern(/^\d{2}-?\d{7}$/),
  name: Joi.string().required().min(1).max(255),
  legal_name: Joi.string().optional().max(255),
  legal_structure: Joi.string().optional().valid(
    '501c3', '501c4', '501c6', 'LLC', 'B-Corp', 'Cooperative', 'Other'
  ),
  tax_status: Joi.string().optional().valid(
    'Tax-Exempt', 'Taxable', 'Pending', 'Revoked'
  ),
  founding_date: Joi.date().optional(),
  mission_statement: Joi.string().optional(),
  vision_statement: Joi.string().optional(),
  budget_size: Joi.number().optional().min(0),
  employee_count: Joi.number().optional().min(0).integer(),
  volunteer_count: Joi.number().optional().min(0).integer(),
  board_size: Joi.number().optional().min(0).integer(),
  location_address: Joi.string().optional().max(255),
  location_city: Joi.string().optional().max(100),
  location_state: Joi.string().optional().length(2),
  location_zip: Joi.string().optional().max(10),
  website: Joi.string().optional().uri().max(500),
  primary_contact_name: Joi.string().optional().max(255),
  primary_contact_email: Joi.string().optional().email(),
  primary_contact_phone: Joi.string().optional().max(20),
  sector_primary: Joi.string().optional().max(100),
  custom_fields: Joi.object().optional(),
  notes: Joi.string().optional()
});

const updateOrganizationSchema = createOrganizationSchema.fork(
  ['ein', 'name'],
  (schema) => schema.optional()
);

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * List all organizations with filtering and pagination
 *
 * @route GET /api/organizations
 */
export async function listOrganizations(req: Request, res: Response): Promise<void> {
  const {
    page = 1,
    per_page = 20,
    sort_by = 'created_at',
    sort_order = 'desc',
    search,
    state,
    sector,
    is_active = 'true'
  } = req.query;

  // Build WHERE clause
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Active filter
  if (is_active) {
    conditions.push(`is_active = $${paramIndex++}`);
    params.push(is_active === 'true');
  }

  // State filter
  if (state) {
    conditions.push(`location_state = $${paramIndex++}`);
    params.push(state);
  }

  // Sector filter
  if (sector) {
    conditions.push(`sector_primary = $${paramIndex++}`);
    params.push(sector);
  }

  // Search filter
  if (search) {
    conditions.push(`(
      name ILIKE $${paramIndex} OR
      ein ILIKE $${paramIndex} OR
      mission_statement ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build base query
  const baseQuery = `
    SELECT
      org_id,
      ein,
      name,
      legal_structure,
      tax_status,
      founding_date,
      mission_statement,
      budget_size,
      employee_count,
      volunteer_count,
      board_size,
      location_city,
      location_state,
      website,
      sector_primary,
      is_active,
      created_at,
      updated_at
    FROM organizations
    ${whereClause}
    ORDER BY ${sort_by} ${sort_order === 'asc' ? 'ASC' : 'DESC'}
  `;

  // Execute paginated query
  const result = await queryPaginated<Organization>(
    baseQuery,
    params,
    { page: Number(page), per_page: Number(per_page) }
  );

  const response: ApiResponse<PaginatedResponse<Organization>> = {
    success: true,
    data: result,
    metadata: {
      request_id: (req as any).id,
      execution_time_ms: 0 // TODO: Calculate actual time
    }
  };

  res.json(response);
}

/**
 * Create a new organization
 *
 * @route POST /api/organizations
 */
export async function createOrganization(req: Request, res: Response): Promise<void> {
  // Validate request body
  const { error, value } = createOrganizationSchema.validate(req.body);

  if (error) {
    throw new ValidationError('Invalid organization data', error.details);
  }

  const organization = value;

  // Check if EIN already exists
  const existing = await queryOne(
    'SELECT org_id FROM organizations WHERE ein = $1',
    [organization.ein]
  );

  if (existing) {
    throw new ValidationError('Organization with this EIN already exists');
  }

  // Insert organization
  const insertQuery = `
    INSERT INTO organizations (
      ein, name, legal_name, legal_structure, tax_status,
      founding_date, mission_statement, vision_statement,
      budget_size, employee_count, volunteer_count, board_size,
      location_address, location_city, location_state, location_zip,
      website, primary_contact_name, primary_contact_email, primary_contact_phone,
      sector_primary, custom_fields, notes,
      created_by, updated_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $24
    )
    RETURNING *
  `;

  const result = await queryOne<Organization>(insertQuery, [
    organization.ein,
    organization.name,
    organization.legal_name,
    organization.legal_structure,
    organization.tax_status,
    organization.founding_date,
    organization.mission_statement,
    organization.vision_statement,
    organization.budget_size,
    organization.employee_count,
    organization.volunteer_count,
    organization.board_size,
    organization.location_address,
    organization.location_city,
    organization.location_state,
    organization.location_zip,
    organization.website,
    organization.primary_contact_name,
    organization.primary_contact_email,
    organization.primary_contact_phone,
    organization.sector_primary,
    organization.custom_fields ? JSON.stringify(organization.custom_fields) : null,
    organization.notes,
    req.user?.user_id
  ]);

  const response: ApiResponse<Organization> = {
    success: true,
    data: result!
  };

  res.status(201).json(response);
}

/**
 * Get organization by ID
 *
 * @route GET /api/organizations/:id
 */
export async function getOrganization(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const organization = await queryOne<Organization>(
    'SELECT * FROM organizations WHERE org_id = $1',
    [id]
  );

  if (!organization) {
    throw new NotFoundError('Organization');
  }

  const response: ApiResponse<Organization> = {
    success: true,
    data: organization
  };

  res.json(response);
}

/**
 * Update organization
 *
 * @route PUT /api/organizations/:id
 */
export async function updateOrganization(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Validate request body
  const { error, value } = updateOrganizationSchema.validate(req.body);

  if (error) {
    throw new ValidationError('Invalid organization data', error.details);
  }

  // Check if organization exists
  const existing = await queryOne(
    'SELECT org_id FROM organizations WHERE org_id = $1',
    [id]
  );

  if (!existing) {
    throw new NotFoundError('Organization');
  }

  const updates = value;

  // Build update query dynamically
  const setClause: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined) {
      setClause.push(`${key} = $${paramIndex++}`);
      params.push(val);
    }
  }

  if (setClause.length === 0) {
    throw new ValidationError('No fields to update');
  }

  setClause.push(`updated_by = $${paramIndex++}`);
  params.push(req.user?.user_id);

  setClause.push(`updated_at = CURRENT_TIMESTAMP`);

  params.push(id); // For WHERE clause

  const updateQuery = `
    UPDATE organizations
    SET ${setClause.join(', ')}
    WHERE org_id = $${paramIndex}
    RETURNING *
  `;

  const result = await queryOne<Organization>(updateQuery, params);

  const response: ApiResponse<Organization> = {
    success: true,
    data: result!
  };

  res.json(response);
}

/**
 * Delete organization (soft delete)
 *
 * @route DELETE /api/organizations/:id
 */
export async function deleteOrganization(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Check if organization exists
  const existing = await queryOne(
    'SELECT org_id FROM organizations WHERE org_id = $1',
    [id]
  );

  if (!existing) {
    throw not NotFoundError('Organization');
  }

  // Soft delete
  await query(
    `UPDATE organizations
     SET is_active = false,
         archived_at = CURRENT_TIMESTAMP,
         updated_by = $1
     WHERE org_id = $2`,
    [req.user?.user_id, id]
  );

  const response: ApiResponse<void> = {
    success: true
  };

  res.json(response);
}

/**
 * Get all assessments for an organization
 *
 * @route GET /api/organizations/:id/assessments
 */
export async function getOrganizationAssessments(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Check if organization exists
  const existing = await queryOne(
    'SELECT org_id FROM organizations WHERE org_id = $1',
    [id]
  );

  if (!existing) {
    throw new NotFoundError('Organization');
  }

  const assessments = await query(
    `SELECT * FROM assessments
     WHERE org_id = $1
     ORDER BY assessment_date DESC`,
    [id]
  );

  const response: ApiResponse<any[]> = {
    success: true,
    data: assessments.rows
  };

  res.json(response);
}

/**
 * Get organization statistics
 *
 * @route GET /api/organizations/:id/stats
 */
export async function getOrganizationStats(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Check if organization exists
  const org = await queryOne(
    'SELECT * FROM organizations WHERE org_id = $1',
    [id]
  );

  if (!org) {
    throw new NotFoundError('Organization');
  }

  // Get assessment count
  const assessmentCount = await queryOne(
    'SELECT COUNT(*) as count FROM assessments WHERE org_id = $1',
    [id]
  );

  // Get latest assessment score
  const latestAssessment = await queryOne(
    `SELECT overall_score, assessment_date
     FROM assessments
     WHERE org_id = $1
     ORDER BY assessment_date DESC
     LIMIT 1`,
    [id]
  );

  const stats = {
    organization: org,
    total_assessments: parseInt(assessmentCount?.count || '0'),
    latest_assessment_score: latestAssessment?.overall_score,
    latest_assessment_date: latestAssessment?.assessment_date
  };

  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats
  };

  res.json(response);
}
