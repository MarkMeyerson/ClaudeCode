/**
 * AI-Powered Question Router
 * Intelligently routes assessment questions based on organization context,
 * previous answers, and relevance scoring to skip irrelevant questions
 */

import { Organization, AssessmentQuestion, AssessmentResponse } from '../../types';

export interface RoutingDecision {
  shouldAsk: boolean;
  reason: string;
  relevanceScore: number;
  skipCount?: number;
}

export interface QuestionContext {
  organization: Organization;
  previousResponses: AssessmentResponse[];
  currentSection: string;
  completionPercentage: number;
}

export interface RoutingRules {
  organizationType: string[];
  budgetRange?: { min: number; max: number };
  requiredPreviousAnswers?: {
    questionId: string;
    expectedValue: any;
  }[];
  excludeIfAnswered?: {
    questionId: string;
    value: any;
  }[];
}

export class QuestionRouter {
  /**
   * Determine if a question should be asked based on AI-powered relevance analysis
   */
  async shouldAskQuestion(
    question: AssessmentQuestion,
    context: QuestionContext
  ): Promise<RoutingDecision> {
    // Calculate base relevance score
    let relevanceScore = 1.0;
    const reasons: string[] = [];

    // 1. Organization Type Relevance (30%)
    const typeRelevance = this.calculateTypeRelevance(question, context.organization);
    relevanceScore *= typeRelevance.score;
    if (!typeRelevance.relevant) {
      return {
        shouldAsk: false,
        reason: typeRelevance.reason,
        relevanceScore: relevanceScore,
      };
    }

    // 2. Budget Size Relevance (20%)
    const budgetRelevance = this.calculateBudgetRelevance(question, context.organization);
    relevanceScore *= budgetRelevance.score;
    if (budgetRelevance.reason) reasons.push(budgetRelevance.reason);

    // 3. Previous Answer Dependencies (25%)
    const dependencyCheck = await this.checkDependencies(question, context.previousResponses);
    if (!dependencyCheck.satisfied) {
      return {
        shouldAsk: false,
        reason: dependencyCheck.reason,
        relevanceScore: 0,
      };
    }
    relevanceScore *= dependencyCheck.relevanceMultiplier;

    // 4. Context-Based Relevance (15%)
    const contextRelevance = this.calculateContextRelevance(question, context);
    relevanceScore *= contextRelevance.score;
    if (contextRelevance.reason) reasons.push(contextRelevance.reason);

    // 5. Skip Logic Based on Previous Answers (10%)
    const skipLogic = this.evaluateSkipLogic(question, context.previousResponses);
    if (skipLogic.shouldSkip) {
      return {
        shouldAsk: false,
        reason: skipLogic.reason,
        relevanceScore: 0,
        skipCount: skipLogic.questionsToSkip,
      };
    }

    // Threshold for asking: relevance score must be > 0.4
    const shouldAsk = relevanceScore > 0.4;

    return {
      shouldAsk,
      reason: shouldAsk
        ? reasons.join('; ') || 'Highly relevant to your organization'
        : 'Low relevance based on your organization profile',
      relevanceScore,
    };
  }

  /**
   * Get the next optimal question based on intelligent routing
   */
  async getNextQuestion(
    allQuestions: AssessmentQuestion[],
    context: QuestionContext
  ): Promise<AssessmentQuestion | null> {
    // Get answered question IDs
    const answeredIds = new Set(context.previousResponses.map(r => r.questionId));

    // Find unanswered questions
    const unansweredQuestions = allQuestions.filter(q => !answeredIds.has(q.questionId));

    if (unansweredQuestions.length === 0) {
      return null; // Assessment complete
    }

    // Score all unanswered questions
    const scoredQuestions = await Promise.all(
      unansweredQuestions.map(async (question) => {
        const decision = await this.shouldAskQuestion(question, context);
        return {
          question,
          decision,
        };
      })
    );

    // Filter questions that should be asked
    const relevantQuestions = scoredQuestions.filter(sq => sq.decision.shouldAsk);

    if (relevantQuestions.length === 0) {
      // No relevant questions left, return first unanswered (fallback)
      return unansweredQuestions[0];
    }

    // Sort by relevance score (highest first) and priority
    relevantQuestions.sort((a, b) => {
      // First sort by section priority
      const sectionPriorityDiff = (a.question.sectionPriority || 999) - (b.question.sectionPriority || 999);
      if (sectionPriorityDiff !== 0) return sectionPriorityDiff;

      // Then by relevance score
      return b.decision.relevanceScore - a.decision.relevanceScore;
    });

    return relevantQuestions[0].question;
  }

  /**
   * Calculate organization type relevance
   */
  private calculateTypeRelevance(
    question: AssessmentQuestion,
    org: Organization
  ): { relevant: boolean; score: number; reason: string } {
    // If question has no type restrictions, it's relevant to all
    if (!question.applicableOrgTypes || question.applicableOrgTypes.length === 0) {
      return { relevant: true, score: 1.0, reason: '' };
    }

    // Check if organization type matches
    const isApplicable = question.applicableOrgTypes.includes(org.organizationType);

    if (!isApplicable) {
      return {
        relevant: false,
        score: 0,
        reason: `Not applicable to ${org.organizationType} organizations`,
      };
    }

    return { relevant: true, score: 1.0, reason: '' };
  }

  /**
   * Calculate budget size relevance
   */
  private calculateBudgetRelevance(
    question: AssessmentQuestion,
    org: Organization
  ): { score: number; reason?: string } {
    const budget = org.annualBudget || 0;

    // Questions tagged for specific budget ranges
    if (question.budgetRange) {
      const { min, max } = question.budgetRange;

      if (budget < min) {
        return {
          score: 0.5,
          reason: 'More relevant for larger organizations',
        };
      }

      if (max && budget > max) {
        return {
          score: 0.6,
          reason: 'More relevant for smaller organizations',
        };
      }

      return { score: 1.0 };
    }

    // Default: all budget sizes are equally relevant
    return { score: 1.0 };
  }

  /**
   * Check if question dependencies are satisfied
   */
  private async checkDependencies(
    question: AssessmentQuestion,
    previousResponses: AssessmentResponse[]
  ): Promise<{ satisfied: boolean; reason: string; relevanceMultiplier: number }> {
    // No dependencies = always satisfied
    if (!question.dependencies || question.dependencies.length === 0) {
      return { satisfied: true, reason: '', relevanceMultiplier: 1.0 };
    }

    const responseMap = new Map(previousResponses.map(r => [r.questionId, r]));

    for (const dep of question.dependencies) {
      const dependentResponse = responseMap.get(dep.questionId);

      // Dependency not yet answered
      if (!dependentResponse) {
        return {
          satisfied: false,
          reason: 'Waiting for prerequisite question to be answered',
          relevanceMultiplier: 0,
        };
      }

      // Check if the answer matches expected value
      if (dep.expectedValue !== undefined) {
        const matches = this.compareValues(dependentResponse.value, dep.expectedValue);

        if (!matches) {
          return {
            satisfied: false,
            reason: `Skipped based on previous answer to "${dep.questionId}"`,
            relevanceMultiplier: 0,
          };
        }
      }
    }

    return { satisfied: true, reason: '', relevanceMultiplier: 1.0 };
  }

  /**
   * Calculate context-based relevance
   */
  private calculateContextRelevance(
    question: AssessmentQuestion,
    context: QuestionContext
  ): { score: number; reason?: string } {
    let score = 1.0;
    const reasons: string[] = [];

    // Organization maturity level
    if (question.maturityLevel) {
      const orgMaturity = this.estimateMaturityLevel(context.organization);

      if (Math.abs(question.maturityLevel - orgMaturity) > 2) {
        score *= 0.6;
        reasons.push('Different maturity level');
      }
    }

    // Staff size relevance
    if (question.staffSizeRange && context.organization.staffSize) {
      const { min, max } = question.staffSizeRange;
      const staffSize = context.organization.staffSize;

      if (staffSize < min || (max && staffSize > max)) {
        score *= 0.7;
        reasons.push('Different staff size');
      }
    }

    // Program area specificity
    if (question.programAreas && context.organization.programAreas) {
      const hasOverlap = question.programAreas.some(pa =>
        context.organization.programAreas?.includes(pa)
      );

      if (!hasOverlap) {
        score *= 0.5;
        reasons.push('Different program focus');
      }
    }

    return { score, reason: reasons.join('; ') };
  }

  /**
   * Evaluate skip logic based on previous answers
   */
  private evaluateSkipLogic(
    question: AssessmentQuestion,
    previousResponses: AssessmentResponse[]
  ): { shouldSkip: boolean; reason: string; questionsToSkip?: number } {
    if (!question.skipLogic) {
      return { shouldSkip: false, reason: '' };
    }

    const responseMap = new Map(previousResponses.map(r => [r.questionId, r]));

    for (const skipRule of question.skipLogic) {
      const response = responseMap.get(skipRule.ifQuestionId);

      if (response && this.compareValues(response.value, skipRule.hasValue)) {
        return {
          shouldSkip: true,
          reason: skipRule.reason || 'Not applicable based on previous answer',
          questionsToSkip: skipRule.skipQuestions || 1,
        };
      }
    }

    return { shouldSkip: false, reason: '' };
  }

  /**
   * Estimate organization maturity level (1-5)
   */
  private estimateMaturityLevel(org: Organization): number {
    let score = 0;

    // Budget size
    const budget = org.annualBudget || 0;
    if (budget > 10000000) score += 1.5;
    else if (budget > 1000000) score += 1.0;
    else if (budget > 100000) score += 0.5;

    // Staff size
    const staff = org.staffSize || 0;
    if (staff > 50) score += 1.5;
    else if (staff > 10) score += 1.0;
    else if (staff > 2) score += 0.5;

    // Years in operation
    if (org.yearFounded) {
      const yearsActive = new Date().getFullYear() - org.yearFounded;
      if (yearsActive > 20) score += 1.0;
      else if (yearsActive > 5) score += 0.5;
    }

    // Technology adoption (website, online donations, etc.)
    if (org.website) score += 0.5;

    return Math.min(5, Math.max(1, Math.round(score)));
  }

  /**
   * Compare values for dependency checking
   */
  private compareValues(actual: any, expected: any): boolean {
    if (Array.isArray(expected)) {
      return expected.includes(actual);
    }

    if (typeof expected === 'object' && expected !== null) {
      if (expected.operator === 'gt') return actual > expected.value;
      if (expected.operator === 'lt') return actual < expected.value;
      if (expected.operator === 'gte') return actual >= expected.value;
      if (expected.operator === 'lte') return actual <= expected.value;
      if (expected.operator === 'contains') return String(actual).includes(expected.value);
    }

    return actual === expected;
  }

  /**
   * Generate assessment roadmap showing question flow
   */
  async generateAssessmentRoadmap(
    allQuestions: AssessmentQuestion[],
    context: QuestionContext
  ): Promise<{
    totalQuestions: number;
    relevantQuestions: number;
    estimatedQuestions: number;
    sections: {
      name: string;
      totalQuestions: number;
      estimatedRelevant: number;
    }[];
  }> {
    const sections = new Map<string, { total: number; relevant: number }>();

    // Analyze all questions
    for (const question of allQuestions) {
      const section = question.section || 'General';

      if (!sections.has(section)) {
        sections.set(section, { total: 0, relevant: 0 });
      }

      const sectionData = sections.get(section)!;
      sectionData.total++;

      // Check if question is relevant
      const decision = await this.shouldAskQuestion(question, context);
      if (decision.shouldAsk) {
        sectionData.relevant++;
      }
    }

    const sectionArray = Array.from(sections.entries()).map(([name, data]) => ({
      name,
      totalQuestions: data.total,
      estimatedRelevant: data.relevant,
    }));

    const relevantQuestions = sectionArray.reduce((sum, s) => sum + s.estimatedRelevant, 0);

    return {
      totalQuestions: allQuestions.length,
      relevantQuestions,
      estimatedQuestions: relevantQuestions,
      sections: sectionArray,
    };
  }
}
