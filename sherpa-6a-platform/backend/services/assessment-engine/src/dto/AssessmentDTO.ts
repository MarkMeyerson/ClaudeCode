/**
 * Data Transfer Objects for Assessment Engine
 */

export interface CreateAssessmentDTO {
  clientId: string;
  templateId?: string;
  assessmentName: string;
  assessmentType: 'comprehensive' | 'quick' | 'focused' | 'custom';
  dueDate?: Date;
  industry?: string;
  companySize?: string;
  description?: string;
}

export interface UpdateAssessmentDTO {
  assessmentName?: string;
  status?: 'draft' | 'in_progress' | 'under_review' | 'completed' | 'archived';
  dueDate?: Date;
  notes?: string;
  consultantNotes?: string;
}

export interface SubmitResponseDTO {
  questionId: string;
  dimension: string;
  responseValue?: string;
  responseNumeric?: number;
  responseBoolean?: boolean;
  responseJson?: any;
  evidenceProvided?: any[];
  justification?: string;
  confidenceLevel?: number;
}

export interface AssessmentFilters {
  clientId: string;
  status?: string;
  type?: string;
  page: number;
  limit: number;
}

export interface AssessmentResponse {
  assessmentId: string;
  clientId: string;
  assessmentName: string;
  assessmentType: string;
  status: string;
  overallScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  maturityLevel: string;
  interpretation: string;
}

export interface AssessmentScores {
  overall: number;
  digitalMaturity: number;
  aiReadiness: number;
  dataCapabilities: number;
  organizationalCulture: number;
  technicalInfrastructure: number;
  processAutomation: number;
  skillsGaps: number;
  competitiveLandscape: number;
  regulatoryCompliance: number;
  financialReadiness: number;
  changeManagement: number;
  vendorEcosystem: number;
}

export interface AssessmentAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
  priorityAreas: string[];
  quickWins: any[];
  riskAssessment: {
    overallRiskLevel: string;
    riskFactors: string[];
    mitigationStrategies: string[];
  };
}

export interface BenchmarkComparison {
  assessmentId: string;
  industry: string;
  companySize: string;
  overallScore: number;
  industryAverage: number;
  percentileRanking: number;
  dimensionComparisons: DimensionComparison[];
  competitivePosition: string;
  insights: string[];
}

export interface DimensionComparison {
  dimension: string;
  clientScore: number;
  industryAverage: number;
  percentile: number;
  gap: number;
  status: 'above_average' | 'average' | 'below_average';
}

export interface AssessmentProgress {
  assessmentId: string;
  totalQuestions: number;
  answeredQuestions: number;
  completionPercentage: number;
  dimensionProgress: Record<string, {
    total: number;
    answered: number;
    percentage: number;
  }>;
  estimatedTimeRemaining: number;
  lastUpdated: Date;
}
