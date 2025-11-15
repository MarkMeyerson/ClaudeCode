/**
 * Assessment Orchestrator
 * Manages comprehensive multi-dimensional assessments across all organization types
 * Handles question delivery, response collection, scoring, and recommendation generation
 */

import {
  Assessment,
  AssessmentQuestion,
  AssessmentResponse,
  AssessmentType,
  OrganizationType,
  Recommendation,
  Gap,
  QuickWin,
} from '../../types';

export interface AssessmentConfig {
  assessmentType: AssessmentType;
  organizationType: OrganizationType;
  includeOptionalSections: boolean;
  enableBenchmarking: boolean;
  enableAIRecommendations: boolean;
}

export interface AssessmentProgress {
  assessmentId: string;
  totalQuestions: number;
  answeredQuestions: number;
  requiredQuestions: number;
  answeredRequired: number;
  completionPercentage: number;
  estimatedTimeRemaining: number;
  currentSection: string;
}

export interface ScoringResult {
  overallScore: number;
  dimensionScores: Record<string, number>;
  maturityLevels: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  criticalGaps: Gap[];
  quickWins: QuickWin[];
}

export interface BenchmarkComparison {
  organizationType: OrganizationType;
  overallPercentile: number;
  dimensionPercentiles: Record<string, number>;
  peerAverage: number;
  topQuartile: number;
  gap: number;
}

export class AssessmentOrchestrator {
  private config: AssessmentConfig;

  constructor(config: AssessmentConfig) {
    this.config = config;
  }

  /**
   * Initialize a new assessment with appropriate question set
   */
  async initializeAssessment(orgId: string): Promise<Assessment> {
    const questions = await this.loadAssessmentQuestions();

    const assessment: Assessment = {
      assessmentId: this.generateId(),
      orgId,
      assessmentType: this.config.assessmentType,
      assessmentVersion: '1.0',
      organizationType: this.config.organizationType,

      // Initial scores
      overallScore: 0,
      organizationalCapacityScore: 0,
      financialHealthScore: 0,
      governanceScore: 0,
      programEffectivenessScore: 0,
      complianceScore: 0,
      technologyScore: 0,
      fundraisingScore: 0,
      hrScore: 0,
      riskScore: 0,
      impactScore: 0,

      // Empty arrays
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      criticalGaps: [],
      quickWins: [],
      priorityRecommendations: [],
      capacityBuildingNeeds: [],
      resourceRequirements: {},
      timelineRecommendations: {},
      peerComparison: {},
      industryBenchmarks: {},
      bestPracticeGaps: [],

      // Metadata
      assessmentDate: new Date(),
      assessmentMethod: 'self',
      questionsTotal: questions.length,
      questionsCompleted: 0,
      completionPercentage: 0,
      status: 'in_progress',

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return assessment;
  }

  /**
   * Load appropriate questions based on assessment configuration
   */
  private async loadAssessmentQuestions(): Promise<AssessmentQuestion[]> {
    // In production, this would query the database
    // For now, return a comprehensive question set

    const questions: AssessmentQuestion[] = [];

    // Core dimensions applicable to all organizations
    questions.push(...this.getOrganizationalCapacityQuestions());
    questions.push(...this.getFinancialHealthQuestions());
    questions.push(...this.getGovernanceQuestions());
    questions.push(...this.getComplianceQuestions());
    questions.push(...this.getTechnologyQuestions());
    questions.push(...this.getFundraisingQuestions());
    questions.push(...this.getHRQuestions());
    questions.push(...this.getRiskManagementQuestions());

    // Organization type-specific questions
    if (this.config.organizationType === 'mission_driven') {
      questions.push(...this.getProgramEffectivenessQuestions());
      questions.push(...this.getImpactMeasurementQuestions());
    } else if (this.config.organizationType === 'association') {
      questions.push(...this.getMemberEngagementQuestions());
      questions.push(...this.getAdvocacyEffectivenessQuestions());
    } else if (this.config.organizationType === 'pac') {
      questions.push(...this.getDonorEngagementQuestions());
      questions.push(...this.getPoliticalStrategyQuestions());
    }

    return questions;
  }

  /**
   * Calculate assessment progress
   */
  calculateProgress(
    assessment: Assessment,
    responses: AssessmentResponse[]
  ): AssessmentProgress {
    const totalQuestions = assessment.questionsTotal || 0;
    const answeredQuestions = responses.length;
    const requiredQuestions = Math.floor(totalQuestions * 0.7); // 70% are required
    const answeredRequired = Math.min(answeredQuestions, requiredQuestions);

    const completionPercentage = totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;

    const avgTimePerQuestion = 3; // minutes
    const questionsRemaining = totalQuestions - answeredQuestions;
    const estimatedTimeRemaining = questionsRemaining * avgTimePerQuestion;

    return {
      assessmentId: assessment.assessmentId,
      totalQuestions,
      answeredQuestions,
      requiredQuestions,
      answeredRequired,
      completionPercentage,
      estimatedTimeRemaining,
      currentSection: this.determineCurrentSection(answeredQuestions, totalQuestions),
    };
  }

  /**
   * Score the assessment based on responses
   */
  async scoreAssessment(
    assessment: Assessment,
    responses: AssessmentResponse[],
    questions: AssessmentQuestion[]
  ): Promise<ScoringResult> {
    const dimensionScores: Record<string, number> = {};
    const maturityLevels: Record<string, number> = {};

    // Score each dimension
    dimensionScores.organizational_capacity = this.scoreDimension(
      responses,
      questions,
      'organizational_capacity'
    );
    dimensionScores.financial_health = this.scoreDimension(
      responses,
      questions,
      'financial_health'
    );
    dimensionScores.governance = this.scoreDimension(responses, questions, 'governance');
    dimensionScores.compliance = this.scoreDimension(responses, questions, 'compliance');
    dimensionScores.technology = this.scoreDimension(responses, questions, 'technology');
    dimensionScores.fundraising = this.scoreDimension(responses, questions, 'fundraising');
    dimensionScores.hr = this.scoreDimension(responses, questions, 'human_resources');
    dimensionScores.risk = this.scoreDimension(responses, questions, 'risk_management');

    if (this.config.organizationType === 'mission_driven') {
      dimensionScores.program_effectiveness = this.scoreDimension(
        responses,
        questions,
        'program_effectiveness'
      );
      dimensionScores.impact = this.scoreDimension(responses, questions, 'impact');
    }

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore(dimensionScores);

    // Determine maturity levels
    maturityLevels.strategic_planning = this.assessMaturityLevel(
      responses,
      questions,
      'strategic_planning'
    );
    maturityLevels.financial_management = this.assessMaturityLevel(
      responses,
      questions,
      'financial_management'
    );
    maturityLevels.technology = this.assessMaturityLevel(
      responses,
      questions,
      'technology'
    );

    // Identify strengths and weaknesses
    const strengths = this.identifyStrengths(dimensionScores);
    const weaknesses = this.identifyWeaknesses(dimensionScores);

    // Identify critical gaps
    const criticalGaps = this.identifyCriticalGaps(responses, questions, dimensionScores);

    // Identify quick wins
    const quickWins = this.identifyQuickWins(responses, questions);

    return {
      overallScore,
      dimensionScores,
      maturityLevels,
      strengths,
      weaknesses,
      criticalGaps,
      quickWins,
    };
  }

  /**
   * Generate recommendations based on assessment results
   */
  async generateRecommendations(
    scoringResult: ScoringResult,
    organizationType: OrganizationType
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Critical gaps drive high-priority recommendations
    for (const gap of scoringResult.criticalGaps) {
      if (gap.severity === 'critical' || gap.severity === 'high') {
        recommendations.push(this.createRecommendationFromGap(gap));
      }
    }

    // Dimension-specific recommendations
    for (const [dimension, score] of Object.entries(scoringResult.dimensionScores)) {
      if (score < 60) {
        recommendations.push(...this.getDimensionRecommendations(dimension, score));
      }
    }

    // Maturity-based recommendations
    for (const [area, level] of Object.entries(scoringResult.maturityLevels)) {
      if (level < 3) {
        recommendations.push(...this.getMaturityRecommendations(area, level));
      }
    }

    // Organization type-specific recommendations
    if (organizationType === 'mission_driven') {
      recommendations.push(...this.getMissionDrivenRecommendations(scoringResult));
    } else if (organizationType === 'association') {
      recommendations.push(...this.getAssociationRecommendations(scoringResult));
    } else if (organizationType === 'pac') {
      recommendations.push(...this.getPACRecommendations(scoringResult));
    }

    // Sort by priority and limit to top 20
    return this.prioritizeRecommendations(recommendations).slice(0, 20);
  }

  /**
   * Compare against peer benchmarks
   */
  async benchmarkAgainstPeers(
    assessment: Assessment,
    scoringResult: ScoringResult
  ): Promise<BenchmarkComparison> {
    if (!this.config.enableBenchmarking) {
      return {
        organizationType: this.config.organizationType,
        overallPercentile: 50,
        dimensionPercentiles: {},
        peerAverage: 65,
        topQuartile: 80,
        gap: 0,
      };
    }

    // In production, this would query actual benchmark data
    const benchmarks = await this.fetchBenchmarkData(this.config.organizationType);

    const dimensionPercentiles: Record<string, number> = {};
    for (const [dimension, score] of Object.entries(scoringResult.dimensionScores)) {
      dimensionPercentiles[dimension] = this.calculatePercentile(
        score,
        benchmarks[dimension] || []
      );
    }

    const overallPercentile = this.calculatePercentile(
      scoringResult.overallScore,
      benchmarks.overall || []
    );

    return {
      organizationType: this.config.organizationType,
      overallPercentile,
      dimensionPercentiles,
      peerAverage: benchmarks.average || 65,
      topQuartile: benchmarks.topQuartile || 80,
      gap: benchmarks.topQuartile - scoringResult.overallScore,
    };
  }

  // ============================================================================
  // QUESTION GENERATION METHODS
  // ============================================================================

  private getOrganizationalCapacityQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'all',
        section: 'Organizational Capacity',
        subsection: 'Strategic Planning',
        questionNumber: 'OC-1',
        questionText: 'Does your organization have a current strategic plan?',
        questionType: 'yes_no',
        weight: 1.0,
        scoringRubric: {
          criteria: [
            {
              scoreRange: [0, 0],
              description: 'No strategic plan',
              indicators: ['Operating without strategic direction'],
            },
            {
              scoreRange: [5, 5],
              description: 'Current strategic plan in place',
              indicators: ['Plan guides organizational decisions'],
            },
          ],
        },
        required: true,
        helpText: 'A strategic plan provides direction and priorities for your organization',
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'all',
        section: 'Organizational Capacity',
        subsection: 'Strategic Planning',
        questionNumber: 'OC-2',
        questionText:
          'How often does your organization review and update its strategic plan?',
        questionType: 'multiple_choice',
        options: [
          { value: 'annually', label: 'Annually', score: 5 },
          { value: 'every_2_3_years', label: 'Every 2-3 years', score: 4 },
          { value: 'every_4_5_years', label: 'Every 4-5 years', score: 3 },
          { value: 'rarely', label: 'Rarely or never', score: 1 },
        ],
        weight: 0.8,
        required: true,
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more organizational capacity questions...
    ];
  }

  private getFinancialHealthQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'all',
        section: 'Financial Health',
        subsection: 'Financial Management',
        questionNumber: 'FH-1',
        questionText: 'What is your organization\'s current months of operating reserves?',
        questionType: 'scale',
        scaleMin: 0,
        scaleMax: 12,
        scaleLabels: {
          0: 'No reserves',
          3: '3 months',
          6: '6 months',
          12: '12+ months',
        },
        weight: 1.2,
        benchmarkValues: {
          minimum: 3,
          target: 6,
          best_practice: 12,
        },
        required: true,
        helpText:
          'Operating reserves provide financial stability. Best practice is 6-12 months.',
        bestPracticeGuidance:
          'Aim for at least 3-6 months of operating expenses in reserves',
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'all',
        section: 'Financial Health',
        subsection: 'Revenue Diversification',
        questionNumber: 'FH-2',
        questionText: 'How many different revenue sources does your organization have?',
        questionType: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        weight: 1.0,
        required: true,
        helpText: 'Revenue diversification reduces financial risk',
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more financial health questions...
    ];
  }

  private getGovernanceQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'all',
        section: 'Governance',
        subsection: 'Board Composition',
        questionNumber: 'GOV-1',
        questionText: 'How many members serve on your board of directors?',
        questionType: 'scale',
        scaleMin: 3,
        scaleMax: 25,
        weight: 0.8,
        benchmarkValues: {
          minimum: 5,
          target: 12,
          maximum: 21,
        },
        required: true,
        helpText: 'Typical boards have 9-15 members',
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more governance questions...
    ];
  }

  private getComplianceQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'all',
        section: 'Compliance',
        subsection: 'Tax Compliance',
        questionNumber: 'COMP-1',
        questionText: 'Has your organization filed its Form 990 on time for the past 3 years?',
        questionType: 'yes_no',
        weight: 1.5,
        required: true,
        helpText: 'Timely Form 990 filing is critical for maintaining tax-exempt status',
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more compliance questions...
    ];
  }

  private getTechnologyQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'all',
        section: 'Technology',
        subsection: 'Technology Infrastructure',
        questionNumber: 'TECH-1',
        questionText:
          'What type of database or CRM system does your organization use?',
        questionType: 'multiple_choice',
        options: [
          { value: 'none', label: 'No database/spreadsheets only', score: 1 },
          { value: 'basic', label: 'Basic database system', score: 3 },
          { value: 'crm', label: 'CRM system (Salesforce, etc.)', score: 5 },
        ],
        weight: 1.0,
        required: true,
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more technology questions...
    ];
  }

  private getFundraisingQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'all',
        section: 'Fundraising',
        subsection: 'Fundraising Strategy',
        questionNumber: 'FR-1',
        questionText: 'Does your organization have a written fundraising plan?',
        questionType: 'yes_no',
        weight: 1.0,
        required: true,
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more fundraising questions...
    ];
  }

  private getHRQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'all',
        section: 'Human Resources',
        subsection: 'Staff Development',
        questionNumber: 'HR-1',
        questionText: 'What is your organization\'s annual staff turnover rate?',
        questionType: 'scale',
        scaleMin: 0,
        scaleMax: 50,
        scaleLabels: {
          0: '0%',
          10: '10%',
          25: '25%',
          50: '50%+',
        },
        weight: 1.0,
        required: true,
        helpText: 'Lower turnover indicates better staff satisfaction and retention',
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more HR questions...
    ];
  }

  private getRiskManagementQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'all',
        section: 'Risk Management',
        subsection: 'Risk Assessment',
        questionNumber: 'RISK-1',
        questionText:
          'Does your organization conduct regular risk assessments?',
        questionType: 'yes_no',
        weight: 1.0,
        required: true,
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more risk management questions...
    ];
  }

  private getProgramEffectivenessQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'mission_driven',
        section: 'Program Effectiveness',
        subsection: 'Program Evaluation',
        questionNumber: 'PROG-1',
        questionText: 'How does your organization evaluate program effectiveness?',
        questionType: 'multiple_choice',
        options: [
          { value: 'none', label: 'No formal evaluation', score: 1 },
          { value: 'informal', label: 'Informal feedback', score: 2 },
          { value: 'internal', label: 'Internal evaluation', score: 3 },
          { value: 'external', label: 'External evaluation', score: 5 },
        ],
        weight: 1.2,
        required: true,
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more program effectiveness questions...
    ];
  }

  private getImpactMeasurementQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'mission_driven',
        section: 'Impact Measurement',
        subsection: 'Impact Tracking',
        questionNumber: 'IMP-1',
        questionText: 'Does your organization track outcomes (not just outputs)?',
        questionType: 'yes_no',
        weight: 1.3,
        required: true,
        helpText: 'Outcomes measure change; outputs measure activities',
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more impact measurement questions...
    ];
  }

  private getMemberEngagementQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'association',
        section: 'Member Engagement',
        subsection: 'Member Satisfaction',
        questionNumber: 'MEM-1',
        questionText: 'What is your member retention rate?',
        questionType: 'scale',
        scaleMin: 0,
        scaleMax: 100,
        weight: 1.5,
        required: true,
        helpText: 'Higher retention indicates member satisfaction',
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more member engagement questions...
    ];
  }

  private getAdvocacyEffectivenessQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'association',
        section: 'Advocacy Effectiveness',
        subsection: 'Policy Impact',
        questionNumber: 'ADV-1',
        questionText:
          'How many policy wins has your organization achieved in the past year?',
        questionType: 'scale',
        scaleMin: 0,
        scaleMax: 20,
        weight: 1.0,
        required: true,
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more advocacy effectiveness questions...
    ];
  }

  private getDonorEngagementQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'pac',
        section: 'Donor Engagement',
        subsection: 'Donor Retention',
        questionNumber: 'DON-1',
        questionText: 'What percentage of your donors give more than once?',
        questionType: 'scale',
        scaleMin: 0,
        scaleMax: 100,
        weight: 1.5,
        required: true,
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more donor engagement questions...
    ];
  }

  private getPoliticalStrategyQuestions(): AssessmentQuestion[] {
    return [
      {
        questionId: this.generateId(),
        assessmentType: 'comprehensive',
        organizationType: 'pac',
        section: 'Political Strategy',
        subsection: 'Campaign Support',
        questionNumber: 'POL-1',
        questionText:
          'What percentage of your supported candidates won their elections?',
        questionType: 'scale',
        scaleMin: 0,
        scaleMax: 100,
        weight: 1.0,
        required: true,
        version: '1.0',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more political strategy questions...
    ];
  }

  // ============================================================================
  // SCORING HELPER METHODS
  // ============================================================================

  private scoreDimension(
    responses: AssessmentResponse[],
    questions: AssessmentQuestion[],
    dimension: string
  ): number {
    const dimensionQuestions = questions.filter((q) =>
      q.section.toLowerCase().replace(/\s/g, '_').includes(dimension.toLowerCase())
    );

    if (dimensionQuestions.length === 0) return 0;

    const dimensionResponses = responses.filter((r) =>
      dimensionQuestions.some((q) => q.questionId === r.questionId)
    );

    let totalScore = 0;
    let totalWeight = 0;

    for (const response of dimensionResponses) {
      const question = dimensionQuestions.find((q) => q.questionId === response.questionId);
      if (question && response.responseScore !== undefined) {
        totalScore += response.responseScore * (question.weight || 1.0);
        totalWeight += question.weight || 1.0;
      }
    }

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 20) : 0;
  }

  private calculateOverallScore(dimensionScores: Record<string, number>): number {
    const weights: Record<string, number> = {
      organizational_capacity: 0.15,
      financial_health: 0.15,
      governance: 0.15,
      program_effectiveness: 0.15,
      compliance: 0.10,
      technology: 0.10,
      fundraising: 0.10,
      hr: 0.05,
      impact: 0.05,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [dimension, score] of Object.entries(dimensionScores)) {
      const weight = weights[dimension] || 0.1;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  private assessMaturityLevel(
    responses: AssessmentResponse[],
    questions: AssessmentQuestion[],
    area: string
  ): number {
    // Maturity levels: 1 (none) to 5 (advanced)
    const score = this.scoreDimension(responses, questions, area);

    if (score < 40) return 1; // None/Ad hoc
    if (score < 55) return 2; // Basic
    if (score < 70) return 3; // Intermediate
    if (score < 85) return 4; // Advanced
    return 5; // Expert
  }

  private identifyStrengths(dimensionScores: Record<string, number>): string[] {
    const strengths: string[] = [];

    for (const [dimension, score] of Object.entries(dimensionScores)) {
      if (score >= 80) {
        strengths.push(this.getDimensionStrengthMessage(dimension, score));
      }
    }

    return strengths;
  }

  private identifyWeaknesses(dimensionScores: Record<string, number>): string[] {
    const weaknesses: string[] = [];

    for (const [dimension, score] of Object.entries(dimensionScores)) {
      if (score < 60) {
        weaknesses.push(this.getDimensionWeaknessMessage(dimension, score));
      }
    }

    return weaknesses;
  }

  private identifyCriticalGaps(
    responses: AssessmentResponse[],
    questions: AssessmentQuestion[],
    dimensionScores: Record<string, number>
  ): Gap[] {
    const gaps: Gap[] = [];

    // Low scores in critical dimensions
    if (dimensionScores.financial_health < 50) {
      gaps.push({
        category: 'Financial Health',
        description: 'Organization has limited financial reserves and revenue diversification',
        severity: 'critical',
        estimatedEffortToClose: '6-12 months',
      });
    }

    if (dimensionScores.governance < 50) {
      gaps.push({
        category: 'Governance',
        description: 'Board lacks active engagement and strategic oversight',
        severity: 'high',
        estimatedEffortToClose: '3-6 months',
      });
    }

    if (dimensionScores.compliance < 60) {
      gaps.push({
        category: 'Compliance',
        description: 'Compliance monitoring and reporting processes need strengthening',
        severity: 'high',
        estimatedEffortToClose: '2-4 months',
      });
    }

    return gaps;
  }

  private identifyQuickWins(
    responses: AssessmentResponse[],
    questions: AssessmentQuestion[]
  ): QuickWin[] {
    const quickWins: QuickWin[] = [
      {
        description: 'Establish monthly financial review process with board',
        estimatedImpact: 'high',
        estimatedEffort: 'low',
        timeframe: '1-2 months',
      },
      {
        description: 'Create donor acknowledgment system for timely thank-you letters',
        estimatedImpact: 'medium',
        estimatedEffort: 'low',
        timeframe: '2-4 weeks',
      },
      {
        description: 'Implement cloud-based file storage and sharing system',
        estimatedImpact: 'medium',
        estimatedEffort: 'low',
        timeframe: '1-2 weeks',
      },
    ];

    return quickWins;
  }

  // ... (Additional helper methods for recommendations, benchmarking, etc.)

  private createRecommendationFromGap(gap: Gap): Recommendation {
    return {
      category: gap.category,
      priority: gap.severity === 'critical' ? 'critical' : 'high',
      title: `Address ${gap.category} Gap`,
      description: gap.description,
      implementationSteps: ['Step 1', 'Step 2', 'Step 3'], // Would be more specific in production
      estimatedTimeframe: gap.estimatedEffortToClose,
    };
  }

  private getDimensionRecommendations(dimension: string, score: number): Recommendation[] {
    // Return dimension-specific recommendations
    return [];
  }

  private getMaturityRecommendations(area: string, level: number): Recommendation[] {
    // Return maturity-based recommendations
    return [];
  }

  private getMissionDrivenRecommendations(scoringResult: ScoringResult): Recommendation[] {
    return [];
  }

  private getAssociationRecommendations(scoringResult: ScoringResult): Recommendation[] {
    return [];
  }

  private getPACRecommendations(scoringResult: ScoringResult): Recommendation[] {
    return [];
  }

  private prioritizeRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
    return recommendations.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  private async fetchBenchmarkData(
    organizationType: OrganizationType
  ): Promise<Record<string, any>> {
    // Mock benchmark data - in production, query from database
    return {
      overall: [45, 55, 60, 65, 70, 75, 80, 85],
      average: 65,
      topQuartile: 80,
    };
  }

  private calculatePercentile(score: number, distribution: number[]): number {
    if (distribution.length === 0) return 50;

    const sorted = [...distribution].sort((a, b) => a - b);
    const belowScore = sorted.filter((s) => s < score).length;
    return Math.round((belowScore / sorted.length) * 100);
  }

  private determineCurrentSection(answered: number, total: number): string {
    const percentage = (answered / total) * 100;

    if (percentage < 15) return 'Organizational Capacity';
    if (percentage < 30) return 'Financial Health';
    if (percentage < 45) return 'Governance';
    if (percentage < 60) return 'Program Effectiveness';
    if (percentage < 75) return 'Compliance';
    if (percentage < 90) return 'Technology';
    return 'Final Review';
  }

  private getDimensionStrengthMessage(dimension: string, score: number): string {
    const messages: Record<string, string> = {
      organizational_capacity:
        'Strong organizational capacity with effective strategic planning and execution',
      financial_health:
        'Excellent financial health with adequate reserves and diversified revenue',
      governance: 'Highly effective governance with engaged and strategic board',
      compliance: 'Exemplary compliance practices across all requirements',
    };

    return messages[dimension] || `Excellent performance in ${dimension}`;
  }

  private getDimensionWeaknessMessage(dimension: string, score: number): string {
    const messages: Record<string, string> = {
      organizational_capacity: 'Organizational capacity needs strengthening in key areas',
      financial_health: 'Financial sustainability requires immediate attention',
      governance: 'Governance structures and practices need improvement',
      compliance: 'Compliance monitoring and processes require enhancement',
    };

    return messages[dimension] || `${dimension} needs improvement`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default AssessmentOrchestrator;
