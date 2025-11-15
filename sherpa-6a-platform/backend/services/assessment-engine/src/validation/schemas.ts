import Joi from 'joi';

/**
 * Validation schemas for Assessment Engine
 */

export const createAssessmentSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  templateId: Joi.string().uuid().optional(),
  assessmentName: Joi.string().min(3).max(255).required(),
  assessmentType: Joi.string()
    .valid('comprehensive', 'quick', 'focused', 'custom')
    .default('comprehensive'),
  dueDate: Joi.date().optional(),
  industry: Joi.string().max(100).optional(),
  companySize: Joi.string()
    .valid('startup', 'small', 'medium', 'large', 'enterprise')
    .optional(),
  description: Joi.string().max(1000).optional()
});

export const updateAssessmentSchema = Joi.object({
  assessmentName: Joi.string().min(3).max(255).optional(),
  status: Joi.string()
    .valid('draft', 'in_progress', 'under_review', 'completed', 'archived')
    .optional(),
  dueDate: Joi.date().optional(),
  notes: Joi.string().optional(),
  consultantNotes: Joi.string().optional()
});

export const submitResponseSchema = Joi.object({
  questionId: Joi.string().uuid().required(),
  dimension: Joi.string().required(),
  responseValue: Joi.string().optional(),
  responseNumeric: Joi.number().optional(),
  responseBoolean: Joi.boolean().optional(),
  responseJson: Joi.object().optional(),
  evidenceProvided: Joi.array().items(
    Joi.object({
      type: Joi.string(),
      url: Joi.string(),
      description: Joi.string()
    })
  ).optional(),
  justification: Joi.string().max(2000).optional(),
  confidenceLevel: Joi.number().min(0).max(1).default(1.0)
});

export const questionSchema = Joi.object({
  templateId: Joi.string().uuid().optional(),
  dimension: Joi.string().required(),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  questionNumber: Joi.number().optional(),
  questionText: Joi.string().required(),
  helpText: Joi.string().optional(),
  questionType: Joi.string()
    .valid('multiple_choice', 'scale', 'text', 'matrix', 'boolean', 'file_upload')
    .required(),
  options: Joi.alternatives().conditional('questionType', {
    is: 'multiple_choice',
    then: Joi.array().items(Joi.string()).required(),
    otherwise: Joi.optional()
  }),
  scaleMin: Joi.alternatives().conditional('questionType', {
    is: 'scale',
    then: Joi.number().required(),
    otherwise: Joi.optional()
  }),
  scaleMax: Joi.alternatives().conditional('questionType', {
    is: 'scale',
    then: Joi.number().required(),
    otherwise: Joi.optional()
  }),
  weight: Joi.number().min(0).max(10).default(1.0),
  scoringRubric: Joi.object().optional(),
  isRequired: Joi.boolean().default(true),
  evidenceRequired: Joi.boolean().default(false),
  dependencies: Joi.object().optional()
});

export const reportSchema = Joi.object({
  assessmentId: Joi.string().uuid().required(),
  reportType: Joi.string()
    .valid('executive_summary', 'detailed', 'gap_analysis', 'roadmap')
    .required(),
  reportName: Joi.string().min(3).max(255).required(),
  includeCharts: Joi.boolean().default(true),
  includeRecommendations: Joi.boolean().default(true),
  format: Joi.string().valid('pdf', 'pptx', 'json').default('pdf')
});
