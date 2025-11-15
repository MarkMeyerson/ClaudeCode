import { logger } from '../utils/logger';

/**
 * Scoring Service
 * Calculates scores for assessment responses and overall assessments
 */
export class ScoringService {
  /**
   * Calculate score for a single response
   */
  async calculateResponseScore(response: any): Promise<number> {
    const { questionId, responseValue, responseNumeric, questionType } = response;

    // Fetch question scoring rubric (in production, from database)
    const scoringRubric = await this.getScoringRubric(questionId);

    if (!scoringRubric) {
      logger.warn(`No scoring rubric found for question: ${questionId}`);
      return 0;
    }

    let score = 0;

    switch (questionType) {
      case 'multiple_choice':
        score = scoringRubric[responseValue] || 0;
        break;

      case 'scale':
        // Linear scaling for numeric responses
        const { min, max, weight = 1.0 } = scoringRubric;
        score = ((responseNumeric - min) / (max - min)) * 100 * weight;
        break;

      case 'boolean':
        score = response.responseBoolean ? scoringRubric.true_score : scoringRubric.false_score;
        break;

      case 'matrix':
        // Average scores across matrix responses
        const matrixScores = Object.values(response.responseJson || {}) as number[];
        score = matrixScores.reduce((sum, val) => sum + val, 0) / matrixScores.length;
        break;

      default:
        score = 50; // Default mid-range score
    }

    // Apply confidence level adjustment
    if (response.confidenceLevel) {
      score *= response.confidenceLevel;
    }

    return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
  }

  /**
   * Calculate scores for entire assessment
   */
  async calculateAssessmentScores(assessmentId: string) {
    logger.info(`Calculating scores for assessment: ${assessmentId}`);

    // Fetch all responses (in production, from database)
    const responses = await this.getAssessmentResponses(assessmentId);

    // Group responses by dimension
    const dimensionResponses = this.groupResponsesByDimension(responses);

    // Calculate dimension scores
    const dimensionScores = await this.calculateDimensionScores(dimensionResponses);

    // Calculate overall weighted score
    const overallScore = this.calculateOverallScore(dimensionScores);

    logger.info(`Assessment scores calculated: ${assessmentId}`, {
      overall: overallScore,
      dimensions: Object.keys(dimensionScores).length
    });

    return {
      overall: overallScore,
      digitalMaturity: dimensionScores.digital_maturity || 0,
      aiReadiness: dimensionScores.ai_readiness || 0,
      dataCapabilities: dimensionScores.data_capabilities || 0,
      organizationalCulture: dimensionScores.organizational_culture || 0,
      technicalInfrastructure: dimensionScores.technical_infrastructure || 0,
      processAutomation: dimensionScores.process_automation || 0,
      skillsGaps: dimensionScores.skills_gaps || 0,
      competitiveLandscape: dimensionScores.competitive_landscape || 0,
      regulatoryCompliance: dimensionScores.regulatory_compliance || 0,
      financialReadiness: dimensionScores.financial_readiness || 0,
      changeManagement: dimensionScores.change_management || 0,
      vendorEcosystem: dimensionScores.vendor_ecosystem || 0,
      byDimension: dimensionScores
    };
  }

  /**
   * Group responses by dimension
   */
  private groupResponsesByDimension(responses: any[]): Record<string, any[]> {
    return responses.reduce((acc, response) => {
      const dimension = response.dimension;
      if (!acc[dimension]) {
        acc[dimension] = [];
      }
      acc[dimension].push(response);
      return acc;
    }, {});
  }

  /**
   * Calculate scores for each dimension
   */
  private async calculateDimensionScores(
    dimensionResponses: Record<string, any[]>
  ): Promise<Record<string, number>> {
    const scores: Record<string, number> = {};

    for (const [dimension, responses] of Object.entries(dimensionResponses)) {
      const responseScores = await Promise.all(
        responses.map(r => this.calculateResponseScore(r))
      );

      // Get dimension weights (in production, from configuration)
      const weights = await this.getQuestionWeights(responses);

      // Calculate weighted average
      let weightedSum = 0;
      let totalWeight = 0;

      responseScores.forEach((score, index) => {
        const weight = weights[index] || 1.0;
        weightedSum += score * weight;
        totalWeight += weight;
      });

      scores[dimension] = totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    return scores;
  }

  /**
   * Calculate overall score from dimension scores
   */
  private calculateOverallScore(dimensionScores: Record<string, number>): number {
    // Dimension weights (can be customized per industry/company size)
    const dimensionWeights = {
      digital_maturity: 1.0,
      ai_readiness: 1.2,
      data_capabilities: 1.1,
      organizational_culture: 0.9,
      technical_infrastructure: 1.0,
      process_automation: 0.8,
      skills_gaps: 1.1,
      competitive_landscape: 0.7,
      regulatory_compliance: 0.8,
      financial_readiness: 0.9,
      change_management: 0.8,
      vendor_ecosystem: 0.6
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [dimension, score] of Object.entries(dimensionScores)) {
      const weight = dimensionWeights[dimension as keyof typeof dimensionWeights] || 1.0;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
  }

  /**
   * Get scoring rubric for a question
   */
  private async getScoringRubric(questionId: string): Promise<any> {
    // In production: Query from database
    // Mock scoring rubrics for different question types
    return {
      // For multiple choice
      'option_a': 25,
      'option_b': 50,
      'option_c': 75,
      'option_d': 100,

      // For scale questions
      min: 1,
      max: 5,
      weight: 1.0,

      // For boolean
      true_score: 100,
      false_score: 0
    };
  }

  /**
   * Get question weights
   */
  private async getQuestionWeights(responses: any[]): Promise<number[]> {
    // In production: Query from database
    // All questions equally weighted by default
    return responses.map(() => 1.0);
  }

  /**
   * Get assessment responses (mock for now)
   */
  private async getAssessmentResponses(assessmentId: string): Promise<any[]> {
    // In production: Query from database
    // Return mock responses for demonstration
    return [
      {
        responseId: 'resp-1',
        questionId: 'q-1',
        dimension: 'digital_maturity',
        questionType: 'scale',
        responseNumeric: 4,
        confidenceLevel: 0.9
      },
      {
        responseId: 'resp-2',
        questionId: 'q-2',
        dimension: 'ai_readiness',
        questionType: 'multiple_choice',
        responseValue: 'option_c',
        confidenceLevel: 1.0
      }
      // ... many more responses
    ];
  }

  /**
   * Calculate maturity level from score
   */
  getMaturityLevel(score: number): string {
    if (score >= 85) return 'Advanced';
    if (score >= 70) return 'Developing';
    if (score >= 50) return 'Emerging';
    if (score >= 30) return 'Beginning';
    return 'Initial';
  }

  /**
   * Get score interpretation
   */
  getScoreInterpretation(score: number, dimension: string): string {
    const level = this.getMaturityLevel(score);

    const interpretations = {
      Advanced: `Excellent ${dimension} capabilities. Well-positioned for AI transformation.`,
      Developing: `Good ${dimension} foundation. Some improvements needed for optimal AI readiness.`,
      Emerging: `Basic ${dimension} capabilities present. Significant development required.`,
      Beginning: `Limited ${dimension} capabilities. Substantial investment needed.`,
      Initial: `Minimal ${dimension} capabilities. Major transformation required.`
    };

    return interpretations[level as keyof typeof interpretations] || '';
  }

  /**
   * Calculate trend from historical scores
   */
  async calculateScoreTrend(
    assessmentId: string,
    previousAssessmentId?: string
  ): Promise<any> {
    if (!previousAssessmentId) {
      return { trend: 'no_comparison', change: 0 };
    }

    const currentScores = await this.calculateAssessmentScores(assessmentId);
    const previousScores = await this.calculateAssessmentScores(previousAssessmentId);

    const overallChange = currentScores.overall - previousScores.overall;
    const trend = overallChange > 2 ? 'improving' : overallChange < -2 ? 'declining' : 'stable';

    return {
      trend,
      change: overallChange,
      currentScore: currentScores.overall,
      previousScore: previousScores.overall,
      dimensionChanges: this.calculateDimensionChanges(currentScores, previousScores)
    };
  }

  /**
   * Calculate dimension-level changes
   */
  private calculateDimensionChanges(current: any, previous: any): Record<string, number> {
    const dimensions = [
      'digitalMaturity',
      'aiReadiness',
      'dataCapabilities',
      'organizationalCulture',
      'technicalInfrastructure',
      'processAutomation',
      'skillsGaps',
      'competitiveLandscape',
      'regulatoryCompliance',
      'financialReadiness',
      'changeManagement',
      'vendorEcosystem'
    ];

    const changes: Record<string, number> = {};

    dimensions.forEach(dim => {
      changes[dim] = (current[dim] || 0) - (previous[dim] || 0);
    });

    return changes;
  }
}
