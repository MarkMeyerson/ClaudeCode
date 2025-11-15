/**
 * Intelligent Intake Engine
 * Handles multi-path organization classification, data collection,
 * validation, and routing to appropriate assessment tracks
 */

import {
  Organization,
  OrganizationType,
  OrganizationSubType,
  IntakeStage,
  MissionDrivenProfile,
  AssociationProfile,
  PACProfile,
} from '../../types';

export interface IntakeEngineConfig {
  enableAIClassification: boolean;
  enableDuplicateDetection: boolean;
  enableFraudDetection: boolean;
  enablePublicDataEnrichment: boolean;
  autoAdvanceStages: boolean;
}

export interface ClassificationResult {
  organizationType: OrganizationType;
  subType?: OrganizationSubType;
  confidence: number;
  reasoning: string[];
  suggestedTrack: string;
  alternativeTypes?: Array<{
    type: OrganizationType;
    subType?: OrganizationSubType;
    confidence: number;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface DuplicateCheck {
  isDuplicate: boolean;
  confidence: number;
  matches: DuplicateMatch[];
}

export interface DuplicateMatch {
  orgId: string;
  organizationName: string;
  ein?: string;
  matchScore: number;
  matchReasons: string[];
}

export interface EnrichmentResult {
  dataFound: boolean;
  sources: string[];
  enrichedData: Partial<Organization>;
  confidence: number;
}

export class IntakeEngine {
  private config: IntakeEngineConfig;

  constructor(config: IntakeEngineConfig) {
    this.config = config;
  }

  /**
   * Classify organization type based on multiple signals
   */
  async classifyOrganization(
    organizationData: Partial<Organization>
  ): Promise<ClassificationResult> {
    const signals = this.extractClassificationSignals(organizationData);

    if (this.config.enableAIClassification) {
      return await this.aiClassification(signals);
    } else {
      return this.ruleBasedClassification(signals);
    }
  }

  /**
   * Extract signals for organization classification
   */
  private extractClassificationSignals(data: Partial<Organization>) {
    return {
      taxStatus: data.taxStatus,
      ein: data.ein,
      missionStatement: data.missionStatement,
      primaryPrograms: data.primaryPrograms || [],
      organizationName: data.organizationName,
      website: data.website,
      annualBudget: data.annualBudget,
      totalRevenue: data.totalRevenue,
    };
  }

  /**
   * Rule-based classification using tax status and organizational characteristics
   */
  private ruleBasedClassification(signals: any): ClassificationResult {
    const { taxStatus, missionStatement, organizationName } = signals;

    // 501(c)(3) - Mission-Driven Organizations
    if (taxStatus === '501c3') {
      const isFoundation = this.detectFoundation(organizationName, missionStatement);
      return {
        organizationType: 'mission_driven',
        subType: isFoundation ? 'foundation' : 'charity',
        confidence: 0.95,
        reasoning: [
          '501(c)(3) tax status indicates mission-driven charitable organization',
          isFoundation
            ? 'Name and mission suggest grantmaking foundation'
            : 'Direct service or advocacy charity',
        ],
        suggestedTrack: 'mission_driven',
      };
    }

    // 501(c)(6) - Trade Associations and Professional Organizations
    if (taxStatus === '501c6') {
      const isProfessional = this.detectProfessionalAssociation(organizationName);
      return {
        organizationType: 'association',
        subType: isProfessional ? 'professional_association' : 'trade_association',
        confidence: 0.95,
        reasoning: [
          '501(c)(6) tax status indicates trade or professional association',
          isProfessional
            ? 'Professional association based on name and structure'
            : 'Trade association serving industry sector',
        ],
        suggestedTrack: 'association',
      };
    }

    // 527 - Political Action Committees
    if (taxStatus === '527') {
      return {
        organizationType: 'pac',
        subType: this.detectPACSubType(organizationName),
        confidence: 0.95,
        reasoning: [
          '527 tax status indicates political organization',
          'PAC focused on political contributions and advocacy',
        ],
        suggestedTrack: 'pac',
      };
    }

    // 501(c)(4) - Social Welfare Organizations (could be mission-driven or PAC-like)
    if (taxStatus === '501c4') {
      const isPolitical = this.detectPoliticalActivity(missionStatement, organizationName);
      if (isPolitical) {
        return {
          organizationType: 'pac',
          subType: 'non_connected',
          confidence: 0.75,
          reasoning: [
            '501(c)(4) with significant political activity',
            'Social welfare organization with advocacy focus',
          ],
          suggestedTrack: 'pac',
          alternativeTypes: [
            {
              type: 'mission_driven',
              subType: 'charity',
              confidence: 0.65,
            },
          ],
        };
      }
    }

    // Default fallback with lower confidence
    return this.defaultClassification(signals);
  }

  /**
   * AI-powered classification using natural language processing
   * In production, this would call ML model API
   */
  private async aiClassification(signals: any): Promise<ClassificationResult> {
    // Simulate AI classification
    // In production, this would call TensorFlow/PyTorch model or external AI service

    const features = this.extractMLFeatures(signals);

    // Mock AI classification result
    // Real implementation would call trained classifier
    const prediction = await this.mockAIClassifier(features);

    return {
      organizationType: prediction.type,
      subType: prediction.subType,
      confidence: prediction.confidence,
      reasoning: prediction.reasoning,
      suggestedTrack: prediction.type,
      alternativeTypes: prediction.alternatives,
    };
  }

  /**
   * Extract features for ML classification
   */
  private extractMLFeatures(signals: any) {
    return {
      // Text features
      missionTextLength: signals.missionStatement?.length || 0,
      missionKeywords: this.extractKeywords(signals.missionStatement),
      nameKeywords: this.extractKeywords(signals.organizationName),

      // Numerical features
      budgetSize: this.categorizeBudget(signals.annualBudget),
      hasEIN: !!signals.ein,
      taxStatusCode: this.encodeTaxStatus(signals.taxStatus),

      // Program features
      programCount: signals.primaryPrograms.length,
      programDiversity: this.calculateProgramDiversity(signals.primaryPrograms),
    };
  }

  /**
   * Mock AI classifier (replace with actual ML model in production)
   */
  private async mockAIClassifier(features: any): Promise<any> {
    // This is a placeholder - in production, this would call actual ML model
    const { taxStatusCode, missionKeywords } = features;

    // Simple heuristic-based prediction (replace with actual ML)
    if (missionKeywords.includes('education') || missionKeywords.includes('health')) {
      return {
        type: 'mission_driven' as OrganizationType,
        subType: 'charity' as OrganizationSubType,
        confidence: 0.88,
        reasoning: [
          'Mission statement focuses on charitable purposes',
          'Keyword analysis indicates direct service delivery',
        ],
        alternatives: [],
      };
    }

    return {
      type: 'mission_driven' as OrganizationType,
      confidence: 0.75,
      reasoning: ['Default classification based on available data'],
      alternatives: [],
    };
  }

  /**
   * Comprehensive validation of intake data
   */
  async validateIntakeData(
    organizationData: Partial<Organization>
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Required field validation
    if (!organizationData.organizationName) {
      errors.push({
        field: 'organizationName',
        code: 'REQUIRED_FIELD',
        message: 'Organization name is required',
        severity: 'error',
      });
    }

    if (!organizationData.organizationType) {
      errors.push({
        field: 'organizationType',
        code: 'REQUIRED_FIELD',
        message: 'Organization type must be specified',
        severity: 'error',
      });
    }

    // EIN validation
    if (organizationData.ein) {
      const einValid = this.validateEIN(organizationData.ein);
      if (!einValid) {
        errors.push({
          field: 'ein',
          code: 'INVALID_EIN',
          message: 'EIN format is invalid. Should be XX-XXXXXXX',
          severity: 'error',
        });
      }
    } else {
      warnings.push({
        field: 'ein',
        message: 'EIN not provided. This will limit verification capabilities.',
        suggestion: 'Provide EIN for IRS verification and data enrichment',
      });
    }

    // Email validation
    if (organizationData.email && !this.validateEmail(organizationData.email)) {
      errors.push({
        field: 'email',
        code: 'INVALID_EMAIL',
        message: 'Email address format is invalid',
        severity: 'error',
      });
    }

    // Website validation
    if (organizationData.website && !this.validateURL(organizationData.website)) {
      warnings.push({
        field: 'website',
        message: 'Website URL format may be invalid',
        suggestion: 'Ensure URL includes protocol (http:// or https://)',
      });
    }

    // Financial data validation
    if (organizationData.totalRevenue && organizationData.totalExpenses) {
      if (organizationData.totalRevenue < organizationData.totalExpenses) {
        warnings.push({
          field: 'financials',
          message: 'Expenses exceed revenue',
          suggestion: 'Verify financial data - organization running at a deficit',
        });
      }
    }

    // Mission statement quality check
    if (organizationData.missionStatement) {
      const missionQuality = this.assessMissionQuality(organizationData.missionStatement);
      if (!missionQuality.acceptable) {
        suggestions.push(
          'Mission statement could be more detailed. Consider expanding to include target population and intended impact.'
        );
      }
    }

    // Geographic scope validation
    if (organizationData.geographicScope && organizationData.serviceStates) {
      if (
        organizationData.geographicScope === 'local' &&
        organizationData.serviceStates.length > 1
      ) {
        warnings.push({
          field: 'geographicScope',
          message: 'Geographic scope conflicts with service states',
          suggestion: 'Local scope but multiple states listed',
        });
      }
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Check for duplicate organizations
   */
  async checkDuplicates(organizationData: Partial<Organization>): Promise<DuplicateCheck> {
    if (!this.config.enableDuplicateDetection) {
      return {
        isDuplicate: false,
        confidence: 0,
        matches: [],
      };
    }

    const matches: DuplicateMatch[] = [];

    // In production, this would query the database
    // For now, return mock result
    const mockMatches = await this.searchPotentialDuplicates(organizationData);

    for (const match of mockMatches) {
      const matchScore = this.calculateMatchScore(organizationData, match);

      if (matchScore > 0.7) {
        matches.push({
          orgId: match.orgId,
          organizationName: match.organizationName,
          ein: match.ein,
          matchScore,
          matchReasons: this.identifyMatchReasons(organizationData, match),
        });
      }
    }

    return {
      isDuplicate: matches.length > 0 && matches[0].matchScore > 0.85,
      confidence: matches[0]?.matchScore || 0,
      matches,
    };
  }

  /**
   * Enrich organization data from public sources
   */
  async enrichFromPublicData(
    organizationData: Partial<Organization>
  ): Promise<EnrichmentResult> {
    if (!this.config.enablePublicDataEnrichment) {
      return {
        dataFound: false,
        sources: [],
        enrichedData: {},
        confidence: 0,
      };
    }

    const enrichedData: Partial<Organization> = {};
    const sources: string[] = [];

    // IRS Data Enrichment
    if (organizationData.ein) {
      const irsData = await this.fetchIRSData(organizationData.ein);
      if (irsData) {
        Object.assign(enrichedData, irsData);
        sources.push('IRS Exempt Organizations Database');
      }
    }

    // Guidestar Data Enrichment
    if (organizationData.ein || organizationData.organizationName) {
      const guidestarData = await this.fetchGuidestarData(organizationData);
      if (guidestarData) {
        Object.assign(enrichedData, guidestarData);
        sources.push('GuideStar/Candid');
      }
    }

    // Charity Navigator Data
    if (organizationData.ein) {
      const charityNavData = await this.fetchCharityNavigatorData(organizationData.ein);
      if (charityNavData) {
        enrichedData.charityNavigatorRating = charityNavData.rating;
        sources.push('Charity Navigator');
      }
    }

    // FEC Data for PACs
    if (organizationData.organizationType === 'pac') {
      const fecData = await this.fetchFECData(organizationData);
      if (fecData) {
        Object.assign(enrichedData, fecData);
        sources.push('FEC Political Committee Database');
      }
    }

    return {
      dataFound: sources.length > 0,
      sources,
      enrichedData,
      confidence: this.calculateEnrichmentConfidence(sources.length),
    };
  }

  /**
   * Determine appropriate intake path based on organization type
   */
  determineIntakePath(organizationType: OrganizationType): string {
    const paths = {
      mission_driven: 'mission-driven-intake',
      association: 'association-intake',
      pac: 'pac-intake',
      hybrid: 'hybrid-intake',
    };

    return paths[organizationType] || 'general-intake';
  }

  /**
   * Calculate intake completion score
   */
  calculateIntakeScore(organizationData: Partial<Organization>): number {
    const weights = {
      basicInfo: 0.25,
      financialInfo: 0.20,
      programInfo: 0.15,
      leadershipInfo: 0.15,
      complianceInfo: 0.15,
      contactInfo: 0.10,
    };

    let totalScore = 0;

    // Basic Info Score
    const basicFields = [
      'organizationName',
      'legalName',
      'ein',
      'taxStatus',
      'foundingDate',
    ];
    const basicScore =
      basicFields.filter((f) => organizationData[f as keyof Organization]).length /
      basicFields.length;
    totalScore += basicScore * weights.basicInfo;

    // Financial Info Score
    const financialFields = [
      'annualBudget',
      'totalRevenue',
      'totalExpenses',
      'totalAssets',
    ];
    const financialScore =
      financialFields.filter((f) => organizationData[f as keyof Organization]).length /
      financialFields.length;
    totalScore += financialScore * weights.financialInfo;

    // Program Info Score
    const hasMission = organizationData.missionStatement ? 1 : 0;
    const hasPrograms = organizationData.primaryPrograms?.length ? 1 : 0;
    const programScore = (hasMission + hasPrograms) / 2;
    totalScore += programScore * weights.programInfo;

    // Leadership Info Score
    const hasCEO = organizationData.ceoExecutiveDirector ? 1 : 0;
    const hasBoard = organizationData.boardSize ? 1 : 0;
    const leadershipScore = (hasCEO + hasBoard) / 2;
    totalScore += leadershipScore * weights.leadershipInfo;

    // Compliance Info Score
    const hasIRSStatus = organizationData.irsStatus ? 1 : 0;
    const hasAudit = organizationData.lastAuditDate ? 1 : 0;
    const complianceScore = (hasIRSStatus + hasAudit) / 2;
    totalScore += complianceScore * weights.complianceInfo;

    // Contact Info Score
    const contactFields = ['email', 'phone', 'website', 'headquartersAddress'];
    const contactScore =
      contactFields.filter((f) => organizationData[f as keyof Organization]).length /
      contactFields.length;
    totalScore += contactScore * weights.contactInfo;

    return Math.round(totalScore * 100);
  }

  /**
   * Advance intake stage based on completion
   */
  advanceIntakeStage(
    currentStage: IntakeStage,
    intakeScore: number,
    validationResult: ValidationResult
  ): IntakeStage {
    if (!this.config.autoAdvanceStages) {
      return currentStage;
    }

    if (currentStage === 'initial' && intakeScore >= 30) {
      return 'in_progress';
    }

    if (
      currentStage === 'in_progress' &&
      intakeScore >= 75 &&
      validationResult.valid
    ) {
      return 'review';
    }

    if (currentStage === 'review' && intakeScore >= 90) {
      return 'approved';
    }

    if (currentStage === 'approved') {
      return 'onboarding';
    }

    return currentStage;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private detectFoundation(name: string, mission?: string): boolean {
    const foundationKeywords = [
      'foundation',
      'fund',
      'trust',
      'endowment',
      'grantmaking',
    ];
    const nameLower = name.toLowerCase();
    return foundationKeywords.some((kw) => nameLower.includes(kw));
  }

  private detectProfessionalAssociation(name: string): boolean {
    const professionalKeywords = [
      'professional',
      'institute',
      'academy',
      'college',
      'society',
      'board',
    ];
    const nameLower = name.toLowerCase();
    return professionalKeywords.some((kw) => nameLower.includes(kw));
  }

  private detectPACSubType(name: string): OrganizationSubType {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('super pac') || nameLower.includes('super-pac')) {
      return 'super_pac';
    }
    if (nameLower.includes('leadership')) {
      return 'leadership_pac';
    }
    return 'connected_pac';
  }

  private detectPoliticalActivity(mission?: string, name?: string): boolean {
    const politicalKeywords = [
      'political',
      'candidate',
      'election',
      'campaign',
      'pac',
      'advocacy',
      'lobby',
    ];
    const text = `${mission} ${name}`.toLowerCase();
    return politicalKeywords.some((kw) => text.includes(kw));
  }

  private defaultClassification(signals: any): ClassificationResult {
    return {
      organizationType: 'mission_driven',
      subType: 'charity',
      confidence: 0.5,
      reasoning: [
        'Insufficient data for confident classification',
        'Defaulting to mission-driven charity',
        'Please provide additional information for accurate classification',
      ],
      suggestedTrack: 'mission_driven',
      alternativeTypes: [
        { type: 'association', confidence: 0.3 },
        { type: 'pac', confidence: 0.2 },
      ],
    };
  }

  private extractKeywords(text?: string): string[] {
    if (!text) return [];

    const stopWords = new Set([
      'the',
      'and',
      'or',
      'of',
      'to',
      'in',
      'for',
      'a',
      'an',
    ]);
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));

    return [...new Set(words)];
  }

  private categorizeBudget(budget?: number): string {
    if (!budget) return 'unknown';
    if (budget < 100000) return 'micro';
    if (budget < 1000000) return 'small';
    if (budget < 10000000) return 'medium';
    return 'large';
  }

  private encodeTaxStatus(taxStatus?: string): number {
    const encodings: Record<string, number> = {
      '501c3': 1,
      '501c4': 2,
      '501c5': 3,
      '501c6': 4,
      '527': 5,
    };
    return encodings[taxStatus || ''] || 0;
  }

  private calculateProgramDiversity(programs: any[]): number {
    if (!programs || programs.length === 0) return 0;

    const uniqueAreas = new Set(programs.map((p) => p.programArea));
    return uniqueAreas.size / Math.max(programs.length, 1);
  }

  private validateEIN(ein: string): boolean {
    // EIN format: XX-XXXXXXX
    const einPattern = /^\d{2}-\d{7}$/;
    return einPattern.test(ein);
  }

  private validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  private validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private assessMissionQuality(mission: string): { acceptable: boolean; score: number } {
    const wordCount = mission.split(/\s+/).length;
    const hasTarget = /serve|support|help|provide|benefit/i.test(mission);
    const hasImpact = /improve|increase|reduce|enhance|transform/i.test(mission);

    const score =
      (wordCount >= 10 ? 0.4 : 0) + (hasTarget ? 0.3 : 0) + (hasImpact ? 0.3 : 0);

    return {
      acceptable: score >= 0.6,
      score,
    };
  }

  private async searchPotentialDuplicates(
    data: Partial<Organization>
  ): Promise<Partial<Organization>[]> {
    // Mock implementation - in production, query database
    return [];
  }

  private calculateMatchScore(org1: Partial<Organization>, org2: Partial<Organization>): number {
    let score = 0;
    let factors = 0;

    if (org1.ein && org2.ein && org1.ein === org2.ein) {
      return 1.0; // Perfect match on EIN
    }

    if (org1.organizationName && org2.organizationName) {
      const similarity = this.stringSimilarity(org1.organizationName, org2.organizationName);
      score += similarity;
      factors++;
    }

    if (org1.website && org2.website && org1.website === org2.website) {
      score += 1.0;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  private stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    // Simple Levenshtein-based similarity
    const maxLength = Math.max(s1.length, s2.length);
    const distance = this.levenshteinDistance(s1, s2);
    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private identifyMatchReasons(
    org1: Partial<Organization>,
    org2: Partial<Organization>
  ): string[] {
    const reasons: string[] = [];

    if (org1.ein === org2.ein) {
      reasons.push('Identical EIN');
    }

    if (org1.organizationName && org2.organizationName) {
      const similarity = this.stringSimilarity(org1.organizationName, org2.organizationName);
      if (similarity > 0.8) {
        reasons.push('Very similar organization name');
      }
    }

    if (org1.website === org2.website) {
      reasons.push('Same website');
    }

    return reasons;
  }

  private async fetchIRSData(ein: string): Promise<Partial<Organization> | null> {
    // Mock implementation - in production, call IRS API
    // https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads
    return null;
  }

  private async fetchGuidestarData(
    data: Partial<Organization>
  ): Promise<Partial<Organization> | null> {
    // Mock implementation - in production, call GuideStar API
    return null;
  }

  private async fetchCharityNavigatorData(
    ein: string
  ): Promise<{ rating: number } | null> {
    // Mock implementation - in production, call Charity Navigator API
    return null;
  }

  private async fetchFECData(
    data: Partial<Organization>
  ): Promise<Partial<PACProfile> | null> {
    // Mock implementation - in production, call FEC API
    // https://api.open.fec.gov/developers/
    return null;
  }

  private calculateEnrichmentConfidence(sourceCount: number): number {
    if (sourceCount === 0) return 0;
    if (sourceCount === 1) return 0.6;
    if (sourceCount === 2) return 0.8;
    return 0.95;
  }
}

export default IntakeEngine;
