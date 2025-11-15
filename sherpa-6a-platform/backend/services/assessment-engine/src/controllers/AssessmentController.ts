import { Request, Response, NextFunction } from 'express';
import { AssessmentService } from '../services/AssessmentService';
import { ScoringService } from '../services/ScoringService';
import { AIAnalysisService } from '../services/AIAnalysisService';
import { logger } from '../utils/logger';
import {
  CreateAssessmentDTO,
  UpdateAssessmentDTO,
  SubmitResponseDTO
} from '../dto/AssessmentDTO';

export class AssessmentController {
  private assessmentService: AssessmentService;
  private scoringService: ScoringService;
  private aiAnalysisService: AIAnalysisService;

  constructor() {
    this.assessmentService = new AssessmentService();
    this.scoringService = new ScoringService();
    this.aiAnalysisService = new AIAnalysisService();
  }

  /**
   * Get all assessments for a client
   */
  async getAssessments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { status, type, page = 1, limit = 20 } = req.query;

      const filters = {
        clientId,
        status: status as string,
        type: type as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await this.assessmentService.getAssessments(filters);

      res.json({
        success: true,
        data: result.assessments,
        pagination: {
          total: result.total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(result.total / filters.limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific assessment by ID
   */
  async getAssessmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const includeResponses = req.query.includeResponses === 'true';

      const assessment = await this.assessmentService.getAssessmentById(
        assessmentId,
        includeResponses
      );

      if (!assessment) {
        res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
        return;
      }

      res.json({
        success: true,
        data: assessment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new assessment
   */
  async createAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessmentData: CreateAssessmentDTO = req.body;
      const userId = (req as any).user.userId;

      const assessment = await this.assessmentService.createAssessment(
        assessmentData,
        userId
      );

      logger.info(`Assessment created: ${assessment.assessmentId}`, {
        clientId: assessment.clientId,
        consultantId: userId
      });

      res.status(201).json({
        success: true,
        data: assessment,
        message: 'Assessment created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing assessment
   */
  async updateAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const updateData: UpdateAssessmentDTO = req.body;
      const userId = (req as any).user.userId;

      const assessment = await this.assessmentService.updateAssessment(
        assessmentId,
        updateData,
        userId
      );

      res.json({
        success: true,
        data: assessment,
        message: 'Assessment updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit a response to an assessment question
   */
  async submitResponse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const responseData: SubmitResponseDTO = req.body;
      const userId = (req as any).user.userId;

      const response = await this.assessmentService.submitResponse(
        assessmentId,
        responseData,
        userId
      );

      // Calculate score for this response
      const score = await this.scoringService.calculateResponseScore(response);

      res.json({
        success: true,
        data: {
          response,
          score
        },
        message: 'Response submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete and submit assessment for scoring
   */
  async submitAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const userId = (req as any).user.userId;

      // Mark as submitted
      await this.assessmentService.submitAssessment(assessmentId, userId);

      // Calculate all scores
      const scores = await this.scoringService.calculateAssessmentScores(assessmentId);

      // Perform AI analysis
      const analysis = await this.aiAnalysisService.analyzeAssessment(assessmentId);

      // Update assessment with scores and analysis
      const assessment = await this.assessmentService.updateAssessmentScoresAndAnalysis(
        assessmentId,
        scores,
        analysis
      );

      logger.info(`Assessment submitted and scored: ${assessmentId}`, {
        overallScore: scores.overall,
        userId
      });

      res.json({
        success: true,
        data: {
          assessment,
          scores,
          analysis
        },
        message: 'Assessment submitted and analyzed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get assessment progress
   */
  async getAssessmentProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assessmentId } = req.params;

      const progress = await this.assessmentService.getAssessmentProgress(assessmentId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an assessment
   */
  async deleteAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const userId = (req as any).user.userId;

      await this.assessmentService.deleteAssessment(assessmentId, userId);

      logger.info(`Assessment deleted: ${assessmentId}`, { userId });

      res.json({
        success: true,
        message: 'Assessment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get assessment insights and recommendations
   */
  async getAssessmentInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assessmentId } = req.params;

      const insights = await this.aiAnalysisService.generateInsights(assessmentId);

      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Compare assessment with industry benchmarks
   */
  async compareWithBenchmarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assessmentId } = req.params;

      const comparison = await this.assessmentService.compareWithBenchmarks(assessmentId);

      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export assessment results
   */
  async exportAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const { format = 'json' } = req.query;

      const exportData = await this.assessmentService.exportAssessment(
        assessmentId,
        format as string
      );

      if (format === 'pdf' || format === 'xlsx') {
        res.setHeader('Content-Type', `application/${format}`);
        res.setHeader('Content-Disposition', `attachment; filename=assessment-${assessmentId}.${format}`);
        res.send(exportData);
      } else {
        res.json({
          success: true,
          data: exportData
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clone an assessment
   */
  async cloneAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const userId = (req as any).user.userId;

      const clonedAssessment = await this.assessmentService.cloneAssessment(
        assessmentId,
        userId
      );

      res.status(201).json({
        success: true,
        data: clonedAssessment,
        message: 'Assessment cloned successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
