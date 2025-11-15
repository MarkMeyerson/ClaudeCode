/**
 * API Routes - Main Router
 * Implements the OpenAPI 3.0 specification
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// Import services (these would be implemented in their respective service files)
import { IntakeEngine } from '../../services/intake-engine/IntakeEngine';
import { AssessmentOrchestrator } from '../../services/assessment-orchestrator/AssessmentOrchestrator';
import { ComplianceManager } from '../../services/compliance-checker/ComplianceManager';
import { DonorIntelligenceService } from '../../services/donor/DonorIntelligenceService';
import { GrantDiscoveryEngine } from '../../services/grant-discovery/GrantDiscoveryEngine';
import { FinancialHealthMonitor } from '../../services/financial-health/FinancialHealthMonitor';

const router = Router();

// ==================== MIDDLEWARE ====================

/**
 * Authentication middleware
 */
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // In production, verify JWT token
  const token = authHeader.substring(7);
  // TODO: Verify token and attach user to req

  next();
};

/**
 * Validation error handler
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Validation failed',
      validation: errors.array(),
    });
  }
  next();
};

/**
 * Rate limiting middleware
 */
const rateLimit = (limit: number, windowMs: number) => {
  // In production, use redis-based rate limiting
  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: Implement rate limiting
    next();
  };
};

// ==================== ORGANIZATIONS ====================

router.get(
  '/organizations',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['mission_driven', 'association', 'pac']),
    query('search').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const search = req.query.search as string;

      // In production, query database with filters
      const organizations = [];
      const total = 0;

      res.json({
        organizations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.post(
  '/organizations',
  authenticate,
  [
    body('organizationName').notEmpty(),
    body('email').isEmail(),
    body('ein').optional().matches(/^\d{2}-\d{7}$/),
    body('annualBudget').optional().isNumeric(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const intakeEngine = new IntakeEngine();

      // Validate and classify organization
      const validationResult = await intakeEngine.validateIntakeData(req.body);
      if (!validationResult.isValid) {
        return res.status(400).json({
          error: 'Validation Failed',
          errors: validationResult.errors,
        });
      }

      // Check for duplicates
      const duplicateCheck = await intakeEngine.checkDuplicates(req.body);

      // Classify organization type
      const classification = await intakeEngine.classifyOrganization(req.body);

      // Enrich from public data
      const enrichment = await intakeEngine.enrichFromPublicData(req.body);

      // In production, save to database
      const organization = {
        orgId: generateUUID(),
        ...req.body,
        ...enrichment.enrichedData,
        organizationType: classification.organizationType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.status(201).json({
        organization,
        classification,
        duplicateCheck,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.get(
  '/organizations/:orgId',
  authenticate,
  [param('orgId').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // In production, fetch from database
      const organization = null;

      if (!organization) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Organization not found',
        });
      }

      res.json(organization);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// ==================== ASSESSMENTS ====================

router.post(
  '/assessments',
  authenticate,
  [
    body('orgId').isUUID(),
    body('trackType').optional().isIn(['mission_driven', 'association', 'pac']),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const orchestrator = new AssessmentOrchestrator();
      const assessment = await orchestrator.initializeAssessment(req.body.orgId);

      res.status(201).json(assessment);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.get(
  '/assessments/:assessmentId/questions/next',
  authenticate,
  [param('assessmentId').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // In production, use QuestionRouter service
      const question = {
        questionId: 'q_1',
        section: 'Organizational Capacity',
        text: 'Sample question',
        type: 'scale',
        required: true,
      };

      res.json({
        question,
        routingDecision: {
          shouldAsk: true,
          reason: 'Highly relevant',
          relevanceScore: 0.95,
        },
        progress: {
          completionPercentage: 25,
          questionsAnswered: 50,
          estimatedRemaining: 150,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.post(
  '/assessments/:assessmentId/responses',
  authenticate,
  [
    param('assessmentId').isUUID(),
    body('questionId').notEmpty(),
    body('value').exists(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // In production, save response and check for section completion
      const response = {
        responseId: generateUUID(),
        questionId: req.body.questionId,
        value: req.body.value,
        submittedAt: new Date(),
      };

      res.status(201).json({
        response,
        sectionComplete: false,
        recommendations: [],
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.get(
  '/assessments/:assessmentId/score',
  authenticate,
  [param('assessmentId').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // In production, calculate comprehensive score
      res.json({
        overallScore: 75,
        dimensionScores: {
          organizationalCapacity: 80,
          financialHealth: 70,
          governance: 75,
        },
        maturityLevel: 3,
        strengths: ['Strong governance', 'Diverse funding'],
        weaknesses: ['Limited technology', 'Small board'],
        recommendations: [],
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// ==================== COMPLIANCE ====================

router.get(
  '/compliance/requirements',
  authenticate,
  [
    query('orgId').isUUID(),
    query('status').optional().isIn(['compliant', 'upcoming', 'overdue', 'pending']),
    query('type').optional().isIn(['federal', 'state', 'local']),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const complianceManager = new ComplianceManager();
      const report = await complianceManager.checkComplianceStatus(req.query.orgId as string);

      res.json({
        requirements: report.requirements,
        summary: {
          compliantCount: report.compliantCount,
          upcomingCount: report.upcomingCount,
          overdueCount: report.overdueCount,
          totalPenalties: report.estimatedPenalties,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.get(
  '/compliance/calendar',
  authenticate,
  [
    query('orgId').isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // In production, generate calendar data
      res.json({
        days: [],
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// ==================== DONORS ====================

router.get(
  '/donors',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('segment').optional().isIn(['major', 'mid_level', 'annual', 'lapsed', 'prospect']),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // In production, query database
      res.json({
        donors: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.post(
  '/donors',
  authenticate,
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // In production, save to database
      const donor = {
        donorId: generateUUID(),
        ...req.body,
        createdAt: new Date(),
      };

      res.status(201).json(donor);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.get(
  '/donors/:donorId/intelligence',
  authenticate,
  [param('donorId').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const donorService = new DonorIntelligenceService();
      const intelligence = await donorService.getDonorIntelligence(req.params.donorId);

      res.json(intelligence);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.get(
  '/donors/:donorId/capacity',
  authenticate,
  [param('donorId').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const donorService = new DonorIntelligenceService();
      const intelligence = await donorService.getDonorIntelligence(req.params.donorId);

      res.json(intelligence.givingCapacity);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// ==================== GRANTS ====================

router.post(
  '/grants/discover',
  authenticate,
  [body('orgId').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const grantEngine = new GrantDiscoveryEngine();
      const results = await grantEngine.discoverGrants(req.body);

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// ==================== FINANCIAL ====================

router.get(
  '/financial/health',
  authenticate,
  [query('orgId').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const financialMonitor = new FinancialHealthMonitor();

      // In production, fetch organization data from database
      const org: any = {};

      const metrics = await financialMonitor.calculateHealthMetrics(org);

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.post(
  '/financial/forecast',
  authenticate,
  [
    body('orgId').isUUID(),
    body('months').optional().isInt({ min: 3, max: 36 }),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const financialMonitor = new FinancialHealthMonitor();

      // In production, fetch organization data
      const org: any = {};

      const forecast = await financialMonitor.generateCashFlowForecast(
        org,
        req.body.months || 12
      );

      res.json(forecast);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// ==================== AUTHENTICATION ====================

router.post(
  '/auth/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // In production, verify credentials and generate JWT
      const token = 'mock_jwt_token';
      const user = {
        userId: generateUUID(),
        email: req.body.email,
        name: 'Test User',
        role: 'admin',
      };

      res.json({
        token,
        user,
        expiresIn: 3600,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.post(
  '/auth/refresh',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      // In production, verify refresh token and issue new access token
      res.json({
        token: 'new_mock_jwt_token',
        expiresIn: 3600,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// ==================== UTILITY FUNCTIONS ====================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ==================== ERROR HANDLING ====================

router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', error);
  res.status(error.status || 500).json({
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
  });
});

export default router;
