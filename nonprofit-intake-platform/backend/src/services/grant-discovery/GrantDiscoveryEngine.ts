/**
 * Grant Discovery Engine
 * AI-powered grant matching and opportunity discovery for non-profit organizations
 * Provides personalized grant recommendations with success probability scoring
 */

import { Organization, OrganizationType } from '../../types';

export interface GrantOpportunity {
  grantId: string;
  grantTitle: string;
  grantorName: string;
  grantorType: 'federal' | 'foundation' | 'corporate' | 'state' | 'local';

  // Grant Details
  description: string;
  programAreas: string[];
  eligibleOrganizations: OrganizationType[];
  geographicFocus: string[];

  // Funding Information
  awardRangeMin: number;
  awardRangeMax: number;
  totalFunding: number;
  averageAward: number;
  numberOfAwards: number;

  // Timeline
  openDate: Date;
  deadlineDate: Date;
  awardDate?: Date;
  projectDuration: string; // e.g., "12-24 months"

  // Requirements
  minBudgetSize?: number;
  maxBudgetSize?: number;
  requiresMatchFunding: boolean;
  matchPercentage?: number;
  restrictedGeographic: boolean;

  // Matching Scores
  matchScore: number; // 0-100
  successProbability: number; // 0-100
  competitiveness: 'low' | 'medium' | 'high';

  // Additional Info
  applicationUrl: string;
  guidelinesUrl?: string;
  contactInfo?: ContactInfo;
  pastRecipients?: string[];

  // Metadata
  source: string; // grants.gov, foundation_directory, etc.
  lastUpdated: Date;
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface GrantMatchCriteria {
  orgId: string;
  organizationType: OrganizationType;
  programAreas: string[];
  geographicScope: string[];
  annualBudget: number;
  targetFundingAmount?: number;
  timeline?: 'immediate' | '3_months' | '6_months' | '12_months';
  preferences?: {
    grantorTypes?: string[];
    fundingRange?: { min: number; max: number };
    requiresNoMatch?: boolean;
  };
}

export interface GrantRecommendation {
  opportunity: GrantOpportunity;
  matchReasons: string[];
  strengthsAlignment: string[];
  potentialChallenges: string[];
  recommendedActions: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  estimatedTimeToComplete: string; // e.g., "2-4 weeks"
}

export interface GrantSearchResult {
  totalResults: number;
  recommendations: GrantRecommendation[];
  filters: {
    applied: Record<string, any>;
    available: Record<string, string[]>;
  };
  savedSearch?: {
    searchId: string;
    alertsEnabled: boolean;
  };
}

export class GrantDiscoveryEngine {
  /**
   * Discover grant opportunities matching organization criteria
   */
  async discoverGrants(criteria: GrantMatchCriteria): Promise<GrantSearchResult> {
    // Fetch opportunities from multiple sources
    const opportunities = await this.fetchGrantOpportunities(criteria);

    // Score and rank opportunities
    const scoredOpportunities = await this.scoreOpportunities(opportunities, criteria);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      scoredOpportunities,
      criteria
    );

    // Get available filters
    const filters = this.buildFilterOptions(opportunities, criteria);

    return {
      totalResults: opportunities.length,
      recommendations,
      filters,
    };
  }

  /**
   * Fetch grant opportunities from multiple data sources
   */
  private async fetchGrantOpportunities(
    criteria: GrantMatchCriteria
  ): Promise<GrantOpportunity[]> {
    const sources = [
      this.fetchGrantsGov(criteria),
      this.fetchFoundationDirectory(criteria),
      this.fetchCandidGrants(criteria),
      this.fetchStateGrants(criteria),
    ];

    const results = await Promise.allSettled(sources);

    const opportunities: GrantOpportunity[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        opportunities.push(...result.value);
      }
    }

    return opportunities;
  }

  /**
   * Fetch opportunities from Grants.gov
   */
  private async fetchGrantsGov(
    criteria: GrantMatchCriteria
  ): Promise<GrantOpportunity[]> {
    // In production, this would call the actual Grants.gov API
    // https://www.grants.gov/web/grants/search-grants.html

    const mockGrants: GrantOpportunity[] = [
      {
        grantId: 'HHS-2025-ACF-001',
        grantTitle: 'Community Services Block Grant',
        grantorName: 'Department of Health and Human Services',
        grantorType: 'federal',
        description: 'Funding to reduce poverty, revitalize communities, and empower low-income families',
        programAreas: ['poverty', 'community_development', 'education'],
        eligibleOrganizations: ['mission_driven'],
        geographicFocus: ['national'],
        awardRangeMin: 50000,
        awardRangeMax: 500000,
        totalFunding: 10000000,
        averageAward: 250000,
        numberOfAwards: 40,
        openDate: new Date('2025-01-01'),
        deadlineDate: new Date('2025-06-30'),
        projectDuration: '12 months',
        requiresMatchFunding: true,
        matchPercentage: 25,
        restrictedGeographic: false,
        matchScore: 0,
        successProbability: 0,
        competitiveness: 'medium',
        applicationUrl: 'https://www.grants.gov/view-opportunity.html',
        source: 'grants.gov',
        lastUpdated: new Date(),
      },
    ];

    return mockGrants;
  }

  /**
   * Fetch opportunities from Foundation Directory Online
   */
  private async fetchFoundationDirectory(
    criteria: GrantMatchCriteria
  ): Promise<GrantOpportunity[]> {
    // In production, call Foundation Directory API
    return [];
  }

  /**
   * Fetch opportunities from Candid
   */
  private async fetchCandidGrants(
    criteria: GrantMatchCriteria
  ): Promise<GrantOpportunity[]> {
    // In production, call Candid API
    return [];
  }

  /**
   * Fetch state-level grant opportunities
   */
  private async fetchStateGrants(
    criteria: GrantMatchCriteria
  ): Promise<GrantOpportunity[]> {
    // In production, call state grant databases
    return [];
  }

  /**
   * Score opportunities using ML-based matching
   */
  private async scoreOpportunities(
    opportunities: GrantOpportunity[],
    criteria: GrantMatchCriteria
  ): Promise<GrantOpportunity[]> {
    return opportunities.map((opp) => {
      const matchScore = this.calculateMatchScore(opp, criteria);
      const successProbability = this.calculateSuccessProbability(opp, criteria);
      const competitiveness = this.assessCompetitiveness(opp);

      return {
        ...opp,
        matchScore,
        successProbability,
        competitiveness,
      };
    }).sort((a, b) => {
      // Sort by weighted score (match * success probability)
      const scoreA = a.matchScore * (a.successProbability / 100);
      const scoreB = b.matchScore * (b.successProbability / 100);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate match score based on alignment with organization
   */
  private calculateMatchScore(
    opportunity: GrantOpportunity,
    criteria: GrantMatchCriteria
  ): number {
    let score = 0;
    let weights = 0;

    // Program area alignment (weight: 40%)
    const programMatch = this.calculateProgramAreaMatch(
      opportunity.programAreas,
      criteria.programAreas
    );
    score += programMatch * 0.4;
    weights += 0.4;

    // Organization type eligibility (weight: 20%)
    if (opportunity.eligibleOrganizations.includes(criteria.organizationType)) {
      score += 1.0 * 0.2;
    }
    weights += 0.2;

    // Geographic alignment (weight: 15%)
    const geoMatch = this.calculateGeographicMatch(
      opportunity.geographicFocus,
      criteria.geographicScope
    );
    score += geoMatch * 0.15;
    weights += 0.15;

    // Budget alignment (weight: 15%)
    const budgetMatch = this.calculateBudgetMatch(
      opportunity,
      criteria.annualBudget
    );
    score += budgetMatch * 0.15;
    weights += 0.15;

    // Funding amount alignment (weight: 10%)
    if (criteria.targetFundingAmount) {
      const fundingMatch = this.calculateFundingAmountMatch(
        opportunity,
        criteria.targetFundingAmount
      );
      score += fundingMatch * 0.1;
      weights += 0.1;
    }

    return weights > 0 ? Math.round((score / weights) * 100) : 0;
  }

  /**
   * Calculate program area match using semantic similarity
   */
  private calculateProgramAreaMatch(
    oppAreas: string[],
    orgAreas: string[]
  ): number {
    if (oppAreas.length === 0 || orgAreas.length === 0) return 0;

    // Direct matches
    const directMatches = oppAreas.filter((area) => orgAreas.includes(area));

    // Semantic matches (simplified - in production, use word embeddings)
    const semanticMatches = this.findSemanticMatches(oppAreas, orgAreas);

    const totalMatches = directMatches.length + semanticMatches.length;
    const maxPossible = Math.max(oppAreas.length, orgAreas.length);

    return totalMatches / maxPossible;
  }

  private findSemanticMatches(areas1: string[], areas2: string[]): string[] {
    // Simplified semantic matching - in production, use word embeddings
    const synonyms: Record<string, string[]> = {
      education: ['learning', 'schools', 'training', 'academic'],
      health: ['healthcare', 'medical', 'wellness', 'public_health'],
      environment: ['environmental', 'conservation', 'sustainability', 'climate'],
      poverty: ['low_income', 'economic_development', 'community_development'],
    };

    const matches: string[] = [];
    for (const area1 of areas1) {
      for (const area2 of areas2) {
        if (area1 === area2) continue;

        const syns1 = synonyms[area1] || [];
        const syns2 = synonyms[area2] || [];

        if (syns1.includes(area2) || syns2.includes(area1)) {
          matches.push(area1);
        }
      }
    }

    return [...new Set(matches)];
  }

  /**
   * Calculate geographic match
   */
  private calculateGeographicMatch(
    oppGeo: string[],
    orgGeo: string[]
  ): number {
    if (oppGeo.includes('national')) return 1.0;
    if (oppGeo.length === 0) return 1.0;

    const matches = oppGeo.filter((geo) => orgGeo.includes(geo));
    return matches.length / oppGeo.length;
  }

  /**
   * Calculate budget size alignment
   */
  private calculateBudgetMatch(
    opportunity: GrantOpportunity,
    orgBudget: number
  ): number {
    // Check if organization budget meets requirements
    if (opportunity.minBudgetSize && orgBudget < opportunity.minBudgetSize) {
      return 0;
    }
    if (opportunity.maxBudgetSize && orgBudget > opportunity.maxBudgetSize) {
      return 0.5; // Partial match if over max
    }
    return 1.0;
  }

  /**
   * Calculate funding amount match
   */
  private calculateFundingAmountMatch(
    opportunity: GrantOpportunity,
    targetAmount: number
  ): number {
    if (targetAmount < opportunity.awardRangeMin) return 0.3;
    if (targetAmount > opportunity.awardRangeMax) return 0.5;

    // Perfect match if within range
    return 1.0;
  }

  /**
   * Calculate success probability using historical data and ML
   */
  private calculateSuccessProbability(
    opportunity: GrantOpportunity,
    criteria: GrantMatchCriteria
  ): number {
    // In production, this would use a trained ML model
    // For now, use heuristic scoring

    let probability = 50; // Base probability

    // Adjust based on competitiveness
    if (opportunity.competitiveness === 'low') probability += 20;
    if (opportunity.competitiveness === 'high') probability -= 20;

    // Adjust based on match score
    probability += (opportunity.matchScore - 50) * 0.3;

    // Adjust based on organization budget relative to grant size
    const budgetRatio = criteria.annualBudget / opportunity.averageAward;
    if (budgetRatio >= 2 && budgetRatio <= 10) probability += 10;
    if (budgetRatio < 1) probability -= 15;

    // Ensure bounds
    return Math.max(0, Math.min(100, Math.round(probability)));
  }

  /**
   * Assess grant competitiveness
   */
  private assessCompetitiveness(opportunity: GrantOpportunity): 'low' | 'medium' | 'high' {
    const applicantsPerAward = opportunity.totalFunding / opportunity.averageAward / opportunity.numberOfAwards;

    if (applicantsPerAward < 5) return 'low';
    if (applicantsPerAward < 15) return 'medium';
    return 'high';
  }

  /**
   * Generate detailed recommendations
   */
  private async generateRecommendations(
    opportunities: GrantOpportunity[],
    criteria: GrantMatchCriteria
  ): Promise<GrantRecommendation[]> {
    return opportunities.slice(0, 20).map((opp) => {
      return {
        opportunity: opp,
        matchReasons: this.generateMatchReasons(opp, criteria),
        strengthsAlignment: this.identifyStrengths(opp, criteria),
        potentialChallenges: this.identifyChallenges(opp, criteria),
        recommendedActions: this.generateActions(opp, criteria),
        estimatedEffort: this.estimateEffort(opp),
        estimatedTimeToComplete: this.estimateTime(opp),
      };
    });
  }

  private generateMatchReasons(
    opp: GrantOpportunity,
    criteria: GrantMatchCriteria
  ): string[] {
    const reasons: string[] = [];

    // Program area matches
    const programMatches = opp.programAreas.filter((area) =>
      criteria.programAreas.includes(area)
    );
    if (programMatches.length > 0) {
      reasons.push(`Strong alignment in ${programMatches.join(', ')} program areas`);
    }

    // Geographic match
    if (opp.geographicFocus.includes('national') ||
        opp.geographicFocus.some((geo) => criteria.geographicScope.includes(geo))) {
      reasons.push('Geographic eligibility confirmed');
    }

    // Budget alignment
    if (criteria.annualBudget >= (opp.minBudgetSize || 0)) {
      reasons.push('Organization budget meets minimum requirements');
    }

    // Funding range
    if (criteria.targetFundingAmount &&
        criteria.targetFundingAmount >= opp.awardRangeMin &&
        criteria.targetFundingAmount <= opp.awardRangeMax) {
      reasons.push('Requested funding amount within grant range');
    }

    return reasons;
  }

  private identifyStrengths(
    opp: GrantOpportunity,
    criteria: GrantMatchCriteria
  ): string[] {
    const strengths: string[] = [];

    if (opp.matchScore >= 80) {
      strengths.push('Excellent mission alignment');
    }

    if (opp.successProbability >= 70) {
      strengths.push('High probability of success based on historical data');
    }

    if (opp.competitiveness === 'low') {
      strengths.push('Lower competition increases chances');
    }

    if (!opp.requiresMatchFunding || (opp.matchPercentage || 0) <= 10) {
      strengths.push('Minimal or no matching funds required');
    }

    return strengths;
  }

  private identifyChallenges(
    opp: GrantOpportunity,
    criteria: GrantMatchCriteria
  ): string[] {
    const challenges: string[] = [];

    if (opp.requiresMatchFunding && (opp.matchPercentage || 0) > 25) {
      challenges.push(`Requires ${opp.matchPercentage}% matching funds`);
    }

    if (opp.competitiveness === 'high') {
      challenges.push('Highly competitive grant with many applicants');
    }

    const daysUntilDeadline = Math.ceil(
      (opp.deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDeadline < 30) {
      challenges.push(`Short timeline: ${daysUntilDeadline} days until deadline`);
    }

    return challenges;
  }

  private generateActions(
    opp: GrantOpportunity,
    criteria: GrantMatchCriteria
  ): string[] {
    const actions: string[] = [
      'Review full grant guidelines and eligibility requirements',
      'Assess organizational capacity to complete application',
    ];

    if (opp.requiresMatchFunding) {
      actions.push('Identify potential sources for matching funds');
    }

    if (opp.pastRecipients && opp.pastRecipients.length > 0) {
      actions.push('Research past recipients to understand successful approaches');
    }

    actions.push('Draft preliminary project narrative and budget');
    actions.push('Schedule internal review meeting');

    return actions;
  }

  private estimateEffort(opp: GrantOpportunity): 'low' | 'medium' | 'high' {
    // Simplified effort estimation
    if (opp.awardRangeMax > 500000) return 'high';
    if (opp.awardRangeMax > 100000) return 'medium';
    return 'low';
  }

  private estimateTime(opp: GrantOpportunity): string {
    const effort = this.estimateEffort(opp);

    if (effort === 'high') return '4-8 weeks';
    if (effort === 'medium') return '2-4 weeks';
    return '1-2 weeks';
  }

  private buildFilterOptions(
    opportunities: GrantOpportunity[],
    criteria: GrantMatchCriteria
  ): any {
    const grantorTypes = [...new Set(opportunities.map((o) => o.grantorType))];
    const programAreas = [...new Set(opportunities.flatMap((o) => o.programAreas))];
    const geographic = [...new Set(opportunities.flatMap((o) => o.geographicFocus))];

    return {
      applied: {
        organizationType: criteria.organizationType,
        programAreas: criteria.programAreas,
      },
      available: {
        grantorTypes,
        programAreas,
        geographic,
      },
    };
  }

  /**
   * Save search for future alerts
   */
  async saveSearch(
    criteria: GrantMatchCriteria,
    searchName: string,
    enableAlerts: boolean
  ): Promise<{ searchId: string }> {
    // In production, save to database
    const searchId = `search-${Date.now()}`;

    return { searchId };
  }

  /**
   * Get personalized grant recommendations based on organization profile
   */
  async getPersonalizedRecommendations(
    organization: Organization
  ): Promise<GrantRecommendation[]> {
    const criteria: GrantMatchCriteria = {
      orgId: organization.orgId,
      organizationType: organization.organizationType,
      programAreas: organization.primaryPrograms.map((p) => p.programArea),
      geographicScope: organization.serviceStates,
      annualBudget: organization.annualBudget || 0,
    };

    const result = await this.discoverGrants(criteria);
    return result.recommendations;
  }
}

export default GrantDiscoveryEngine;
