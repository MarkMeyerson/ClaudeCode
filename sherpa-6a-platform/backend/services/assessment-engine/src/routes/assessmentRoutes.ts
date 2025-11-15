import { Router } from 'express';
import { AssessmentController } from '../controllers/AssessmentController';
import { validateRequest } from '../middleware/validation';
import {
  createAssessmentSchema,
  updateAssessmentSchema,
  submitResponseSchema
} from '../validation/schemas';

const router = Router();
const controller = new AssessmentController();

/**
 * Assessment Routes
 */

// GET /api/v1/assessments/client/:clientId - Get all assessments for a client
router.get(
  '/client/:clientId',
  controller.getAssessments.bind(controller)
);

// GET /api/v1/assessments/:assessmentId - Get specific assessment
router.get(
  '/:assessmentId',
  controller.getAssessmentById.bind(controller)
);

// POST /api/v1/assessments - Create new assessment
router.post(
  '/',
  validateRequest(createAssessmentSchema),
  controller.createAssessment.bind(controller)
);

// PUT /api/v1/assessments/:assessmentId - Update assessment
router.put(
  '/:assessmentId',
  validateRequest(updateAssessmentSchema),
  controller.updateAssessment.bind(controller)
);

// POST /api/v1/assessments/:assessmentId/responses - Submit response
router.post(
  '/:assessmentId/responses',
  validateRequest(submitResponseSchema),
  controller.submitResponse.bind(controller)
);

// POST /api/v1/assessments/:assessmentId/submit - Submit assessment for scoring
router.post(
  '/:assessmentId/submit',
  controller.submitAssessment.bind(controller)
);

// GET /api/v1/assessments/:assessmentId/progress - Get assessment progress
router.get(
  '/:assessmentId/progress',
  controller.getAssessmentProgress.bind(controller)
);

// GET /api/v1/assessments/:assessmentId/insights - Get AI insights
router.get(
  '/:assessmentId/insights',
  controller.getAssessmentInsights.bind(controller)
);

// GET /api/v1/assessments/:assessmentId/benchmarks - Compare with benchmarks
router.get(
  '/:assessmentId/benchmarks',
  controller.compareWithBenchmarks.bind(controller)
);

// GET /api/v1/assessments/:assessmentId/export - Export assessment
router.get(
  '/:assessmentId/export',
  controller.exportAssessment.bind(controller)
);

// POST /api/v1/assessments/:assessmentId/clone - Clone assessment
router.post(
  '/:assessmentId/clone',
  controller.cloneAssessment.bind(controller)
);

// DELETE /api/v1/assessments/:assessmentId - Delete assessment
router.delete(
  '/:assessmentId',
  controller.deleteAssessment.bind(controller)
);

export default router;
