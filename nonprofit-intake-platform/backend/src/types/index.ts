/**
 * Core TypeScript Types for Non-Profit Intake Platform
 * Complete type definitions for all organization types and platform features
 */

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export type OrganizationType = 'mission_driven' | 'association' | 'pac' | 'hybrid';

export type OrganizationSubType =
  | 'charity'
  | 'foundation'
  | 'trade_association'
  | 'professional_association'
  | 'super_pac'
  | 'leadership_pac'
  | 'connected_pac'
  | 'hybrid_pac';

export type TaxStatus = '501c3' | '501c4' | '501c5' | '501c6' | '501c7' | '527' | 'other';

export type GeographicScope = 'local' | 'regional' | 'state' | 'national' | 'international';

export type IntakeStage = 'initial' | 'in_progress' | 'review' | 'approved' | 'onboarding' | 'completed';

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ContactInfo {
  name: string;
  title?: string;
  email: string;
  phone?: string;
}

export interface Person extends ContactInfo {
  firstName: string;
  lastName: string;
  bio?: string;
  linkedIn?: string;
}

// ============================================================================
// ORGANIZATION INTERFACES
// ============================================================================

export interface Organization {
  orgId: string;
  organizationName: string;
  legalName?: string;
  dbaNames: string[];
  organizationType: OrganizationType;
  subType?: OrganizationSubType;

  // IRS Classification
  taxStatus?: TaxStatus;
  ein?: string;
  irsDeterminationLetterDate?: Date;
  groupExemptionNumber?: string;
  irsSubsectionCode?: string;

  // Basic Information
  foundingDate?: Date;
  fiscalYearEnd?: string;
  incorporationState?: string;
  incorporationDate?: Date;
  headquartersAddress?: Address;
  mailingAddress?: Address;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: SocialMediaLinks;

  // Leadership
  ceoExecutiveDirector?: Person;
  boardChair?: Person;
  boardSize?: number;
  boardMembers: Person[];
  keyStaff: Person[];

  // Financial Overview
  annualBudget?: number;
  totalRevenue?: number;
  totalExpenses?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  netAssets?: number;
  programExpenseRatio?: number;
  fundraisingExpenseRatio?: number;
  adminExpenseRatio?: number;

  // Mission & Programs
  missionStatement?: string;
  visionStatement?: string;
  valuesStatement?: string;
  primaryPrograms: Program[];
  geographicScope?: GeographicScope;
  serviceStates: string[];
  targetDemographics: Demographic[];

  // Staffing
  fullTimeStaff?: number;
  partTimeStaff?: number;
  contractors?: number;
  volunteers?: number;

  // Compliance Status
  irsStatus?: string;
  stateRegistrationStatus: Record<string, string>;
  charityNavigatorRating?: number;
  guidestarSeal?: string;
  bbbAccreditation?: boolean;
  lastAuditDate?: Date;
  auditOpinion?: string;

  // Intake Metadata
  intakeDate: Date;
  intakeMethod?: string;
  intakeSource?: string;
  intakeCompleted: boolean;
  intakeCompletionDate?: Date;
  intakeScore?: number;
  intakeStage: IntakeStage;

  // System Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
}

export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

export interface Program {
  programId?: string;
  name: string;
  description: string;
  programArea: string;
  budget?: number;
  staffCount?: number;
  beneficiariesServed?: number;
}

export interface Demographic {
  category: string;
  description: string;
  percentage?: number;
}

// ============================================================================
// MISSION-DRIVEN ORGANIZATION
// ============================================================================

export interface MissionDrivenProfile {
  profileId: string;
  orgId: string;

  // Program Details
  programAreas: string[];
  serviceDeliveryModel?: ServiceDeliveryModel;
  beneficiariesServedAnnually?: number;
  beneficiaryDemographics?: Record<string, any>;
  volunteerCount?: number;
  volunteerHoursAnnual?: number;

  // Impact Metrics
  theoryOfChange?: string;
  logicModel?: LogicModel;
  keyOutcomes: Outcome[];
  impactMeasurementApproach?: string;
  evidenceBase?: EvidenceBase;
  evaluationFrequency?: string;
  externalEvaluation?: boolean;
  lastExternalEvaluationDate?: Date;

  // Funding Sources
  governmentFundingPct?: number;
  foundationFundingPct?: number;
  corporateFundingPct?: number;
  individualGivingPct?: number;
  earnedRevenuePct?: number;
  otherRevenuePct?: number;

  // Top Funders
  topGovernmentFunders: Funder[];
  topFoundationFunders: Funder[];
  topCorporateFunders: Funder[];

  // Capacity Assessment
  strategicPlanCurrent?: boolean;
  strategicPlanStartDate?: Date;
  strategicPlanEndDate?: Date;
  evaluationCapacity?: MaturityLevel;
  dataSystemsMaturity?: MaturityLevel;
  fundraisingCapacity?: MaturityLevel;
  marketingCapacity?: MaturityLevel;
  technologyCapacity?: MaturityLevel;

  // Partnerships
  keyPartners: Partner[];
  coalitionMemberships: string[];
  funderRelationships: FunderRelationship[];
  fiscalSponsor?: boolean;
  fiscalSponsorName?: string;
  fiscalSponsorees: string[];

  // Program Specific
  directServiceLocations: Location[];
  licensingCertifications: Certification[];
  accreditations: Accreditation[];

  // Donor Management
  donorCount?: number;
  majorDonorCount?: number;
  recurringDonorCount?: number;
  donorRetentionRate?: number;
  averageGiftSize?: number;

  createdAt: Date;
  updatedAt: Date;
}

export type ServiceDeliveryModel =
  | 'direct_service'
  | 'advocacy'
  | 'research'
  | 'grantmaking'
  | 'hybrid';

export type EvidenceBase = 'evidence_based' | 'evidence_informed' | 'promising' | 'emerging';

export type MaturityLevel = 'none' | 'basic' | 'intermediate' | 'advanced';

export interface LogicModel {
  inputs: string[];
  activities: string[];
  outputs: string[];
  shortTermOutcomes: string[];
  longTermOutcomes: string[];
  impact: string;
}

export interface Outcome {
  outcomeId?: string;
  description: string;
  indicator: string;
  baseline?: number;
  target?: number;
  actual?: number;
  measurementMethod?: string;
}

export interface Funder {
  name: string;
  amount?: number;
  yearStarted?: number;
  programsSupported?: string[];
}

export interface Partner {
  name: string;
  partnershipType: string;
  description?: string;
  yearsActive?: number;
}

export interface FunderRelationship {
  funderName: string;
  relationshipStrength: 'new' | 'developing' | 'established' | 'strategic';
  yearsOfSupport?: number;
  totalFundingReceived?: number;
}

export interface Location {
  locationId?: string;
  name: string;
  address: Address;
  servicesOffered: string[];
}

export interface Certification {
  certificationName: string;
  issuingOrganization: string;
  dateIssued?: Date;
  expirationDate?: Date;
}

export interface Accreditation {
  accreditingBody: string;
  accreditationType: string;
  dateAccredited?: Date;
  nextReviewDate?: Date;
}

// ============================================================================
// ASSOCIATION PROFILE
// ============================================================================

export interface AssociationProfile {
  profileId: string;
  orgId: string;

  // Membership
  memberCount?: number;
  organizationalMembers?: number;
  individualMembers?: number;
  memberCategories: MemberCategory[];
  membershipModel?: MembershipModel;
  membershipTiers: MembershipTier[];
  averageMemberTenureYears?: number;
  memberRetentionRate?: number;
  newMemberGrowthRate?: number;

  // Association Type
  associationType?: AssociationType;
  industrySector?: string;
  professionalField?: string;
  naicsCodes: string[];

  // Services
  memberServices: string[];
  certificationPrograms: CertificationProgram[];
  trainingPrograms: TrainingProgram[];
  continuingEducation?: boolean;
  jobBoard?: boolean;
  networkingEvents?: boolean;

  // Advocacy
  advocacyActivities: string[];
  lobbyingExpenditures?: number;
  pacAffiliated?: boolean;
  pacId?: string;
  grassrootsAdvocacy?: boolean;
  policyPositions: PolicyPosition[];

  // Research & Publications
  researchPublications: Publication[];
  journalPublication?: boolean;
  journalName?: string;
  newsletterPublication?: boolean;
  whitePapersAnnual?: number;
  industryReportsAnnual?: number;

  // Events
  annualConference?: boolean;
  conferenceAttendance?: number;
  eventsPerYear?: number;
  virtualEventsCapability?: boolean;
  webinarsPerYear?: number;
  regionalEvents?: boolean;

  // Governance
  memberVotingRights?: boolean;
  delegateAssembly?: boolean;
  chaptersCount?: number;
  sectionsCount?: number;
  committees: Committee[];
  specialInterestGroups: SpecialInterestGroup[];

  // Revenue Model
  membershipDuesPct?: number;
  conferenceRevenuePct?: number;
  sponsorshipRevenuePct?: number;
  publicationRevenuePct?: number;
  certificationRevenuePct?: number;
  advertisingRevenuePct?: number;
  otherRevenuePct?: number;

  // Engagement
  memberSatisfactionScore?: number;
  memberEngagementRate?: number;
  committeeParticipationRate?: number;
  eventAttendanceRate?: number;

  // Technology
  memberPortal?: boolean;
  mobileApp?: boolean;
  communityPlatform?: boolean;
  learningManagementSystem?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type AssociationType = 'trade' | 'professional' | 'industry' | 'chamber' | 'specialty';

export type MembershipModel = 'individual' | 'organizational' | 'tiered' | 'hybrid';

export interface MemberCategory {
  categoryName: string;
  memberCount?: number;
  duesAmount?: number;
  benefits: string[];
}

export interface MembershipTier {
  tierName: string;
  annualDues: number;
  benefits: string[];
  memberCount?: number;
}

export interface CertificationProgram {
  programName: string;
  description?: string;
  certificantsActive?: number;
  annualRevenue?: number;
  requiresCE?: boolean;
}

export interface TrainingProgram {
  programName: string;
  format: 'in_person' | 'virtual' | 'hybrid';
  participantsAnnual?: number;
  revenue?: number;
}

export interface PolicyPosition {
  issueName: string;
  position: string;
  priority: 'high' | 'medium' | 'low';
  lastUpdated?: Date;
}

export interface Publication {
  title: string;
  publicationType: 'journal' | 'magazine' | 'newsletter' | 'whitepaper' | 'report';
  frequency?: string;
  circulation?: number;
}

export interface Committee {
  committeeName: string;
  purpose: string;
  memberCount?: number;
  chairPerson?: string;
}

export interface SpecialInterestGroup {
  groupName: string;
  focus: string;
  memberCount?: number;
}

// ============================================================================
// PAC PROFILE
// ============================================================================

export interface PACProfile {
  profileId: string;
  orgId: string;

  // PAC Classification
  pacType?: PACType;
  fecId?: string;
  statePacIds: Record<string, string>;
  affiliatedOrganization?: string;
  affiliatedOrgId?: string;
  sponsorOrganization?: string;

  // Political Activity
  partyAffiliation?: PartyAffiliation;
  candidateSupportCriteria?: string;
  issuePositions: IssuePosition[];
  lobbyingActivities?: boolean;
  independentExpenditureOnly?: boolean;

  // Federal Activity
  federalCandidatesSupported?: number;
  federalContributionsMade?: number;
  federalIndependentExpenditures?: number;

  // State/Local Activity
  stateCandidatesSupported?: number;
  stateContributionsMade?: number;
  localCandidatesSupported?: number;
  localContributionsMade?: number;

  // Financial Activity
  contributionsReceived?: number;
  totalDisbursements?: number;
  cashOnHand?: number;
  debtsOwed?: number;

  // Contribution Limits
  individualContributionLimit?: number;
  pacContributionLimit?: number;
  corporateContributionsAllowed?: boolean;
  unionContributionsAllowed?: boolean;

  // Compliance
  fecFilingFrequency?: FilingFrequency;
  stateFilingRequirements: Record<string, any>;
  treasurerName?: string;
  treasurerEmail?: string;
  treasurerPhone?: string;
  complianceVendor?: string;
  complianceSoftware?: string;

  // Donor Management
  totalDonors?: number;
  majorDonorCount?: number;
  smallDonorCount?: number;
  averageContribution?: number;
  recurringDonorPct?: number;

  // Fundraising
  fundraisingEventsAnnual?: number;
  onlineFundraising?: boolean;
  recurringProgram?: boolean;
  bundlingProgram?: boolean;

  // Communication
  emailListSize?: number;
  socialMediaFollowers?: number;
  grassrootsMobilization?: boolean;
  voterEducation?: boolean;
  issueAdvocacy?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type PACType =
  | 'connected'
  | 'non_connected'
  | 'super_pac'
  | 'hybrid_pac'
  | 'leadership_pac';

export type PartyAffiliation = 'democratic' | 'republican' | 'bipartisan' | 'nonpartisan';

export type FilingFrequency = 'monthly' | 'quarterly' | 'annually';

export interface IssuePosition {
  issueName: string;
  position: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// ASSESSMENT TYPES
// ============================================================================

export interface Assessment {
  assessmentId: string;
  orgId: string;
  assessmentType: AssessmentType;
  assessmentVersion: string;
  organizationType: OrganizationType;

  // Scores (0-100)
  overallScore?: number;
  organizationalCapacityScore?: number;
  financialHealthScore?: number;
  governanceScore?: number;
  programEffectivenessScore?: number;
  complianceScore?: number;
  technologyScore?: number;
  fundraisingScore?: number;
  hrScore?: number;
  riskScore?: number;
  impactScore?: number;

  // Track-specific scores
  memberEngagementScore?: number;
  advocacyEffectivenessScore?: number;
  donorEngagementScore?: number;
  politicalStrategyScore?: number;

  // SWOT Analysis
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  criticalGaps: Gap[];
  quickWins: QuickWin[];

  // Recommendations
  priorityRecommendations: Recommendation[];
  capacityBuildingNeeds: CapacityNeed[];
  resourceRequirements: Record<string, any>;
  timelineRecommendations: Record<string, any>;

  // Benchmarking
  peerComparison: Record<string, any>;
  industryBenchmarks: Record<string, any>;
  bestPracticeGaps: string[];
  percentileRanking?: number;

  // Maturity Levels (1-5)
  strategicPlanningMaturity?: number;
  financialManagementMaturity?: number;
  programDeliveryMaturity?: number;
  technologyMaturity?: number;
  fundraisingMaturity?: number;
  dataAnalyticsMaturity?: number;

  // Metadata
  assessmentDate: Date;
  assessorId?: string;
  assessmentMethod?: AssessmentMethod;
  completionTimeHours?: number;
  confidenceLevel?: number;
  questionsCompleted?: number;
  questionsTotal?: number;
  completionPercentage?: number;

  // Status
  status: AssessmentStatus;
  reviewedBy?: string;
  reviewDate?: Date;
  reviewNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type AssessmentType =
  | 'comprehensive'
  | 'financial'
  | 'governance'
  | 'program'
  | 'compliance'
  | 'technology'
  | 'fundraising';

export type AssessmentMethod = 'self' | 'guided' | 'consultant' | 'hybrid';

export type AssessmentStatus = 'in_progress' | 'completed' | 'reviewed' | 'approved';

export interface Gap {
  gapId?: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffortToClose?: string;
}

export interface QuickWin {
  quickWinId?: string;
  description: string;
  estimatedImpact: 'low' | 'medium' | 'high';
  estimatedEffort: 'low' | 'medium' | 'high';
  timeframe?: string;
}

export interface Recommendation {
  recommendationId?: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale?: string;
  implementationSteps: string[];
  estimatedCost?: number;
  estimatedTimeframe?: string;
  expectedOutcome?: string;
  resources?: string[];
}

export interface CapacityNeed {
  needId?: string;
  area: string;
  currentLevel: MaturityLevel;
  targetLevel: MaturityLevel;
  gap: string;
  interventions: string[];
}

// ============================================================================
// ASSESSMENT QUESTIONS
// ============================================================================

export interface AssessmentQuestion {
  questionId: string;
  assessmentType: AssessmentType;
  organizationType: OrganizationType | 'all';

  // Question Details
  section: string;
  subsection?: string;
  questionNumber: string;
  questionText: string;
  questionType: QuestionType;

  // Options
  options?: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: Record<number, string>;

  // Scoring
  weight?: number;
  scoringRubric?: ScoringRubric;
  benchmarkValues?: Record<string, any>;
  pointsPossible?: number;

  // Logic
  required?: boolean;
  conditionalLogic?: ConditionalLogic;
  parentQuestionId?: string;
  validationRules?: ValidationRule[];

  // Help
  helpText?: string;
  examples?: string[];
  bestPracticeGuidance?: string;
  resources?: Resource[];

  // Version
  version: string;
  active: boolean;
  deprecated?: boolean;
  replacementQuestionId?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type QuestionType =
  | 'scale'
  | 'multiple_choice'
  | 'matrix'
  | 'text'
  | 'file_upload'
  | 'yes_no';

export interface QuestionOption {
  value: string | number;
  label: string;
  score?: number;
}

export interface ScoringRubric {
  criteria: RubricCriterion[];
}

export interface RubricCriterion {
  scoreRange: [number, number];
  description: string;
  indicators: string[];
}

export interface ConditionalLogic {
  showIf?: LogicCondition[];
  requireIf?: LogicCondition[];
}

export interface LogicCondition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'regex' | 'custom';
  value?: any;
  message: string;
}

export interface Resource {
  title: string;
  type: 'article' | 'video' | 'template' | 'tool' | 'guide';
  url?: string;
  description?: string;
}

export interface AssessmentResponse {
  responseId: string;
  assessmentId: string;
  questionId: string;

  // Response
  responseValue?: string;
  responseNumeric?: number;
  responseBoolean?: boolean;
  responseJson?: any;
  responseScore?: number;
  responseFiles?: FileReference[];

  // Evidence
  evidenceProvided?: Evidence[];
  documentationLinks?: string[];
  notes?: string;

  // Validation
  validated?: boolean;
  validatorId?: string;
  validationNotes?: string;
  validationDate?: Date;

  // Metadata
  timeSpentSeconds?: number;
  revisionCount?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface Evidence {
  evidenceType: string;
  description: string;
  fileUrl?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
}

export interface FileReference {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
}

// ============================================================================
// COMPLIANCE & RISK
// ============================================================================

export interface ComplianceRequirement {
  requirementId: string;
  orgId: string;

  // Details
  requirementType: string;
  jurisdiction: string;
  agency: string;
  requirementName: string;
  description?: string;
  formNumber?: string;

  // Timing
  frequency: ComplianceFrequency;
  dueDate: Date;
  filingPeriodStart?: Date;
  filingPeriodEnd?: Date;
  gracePeriodDays?: number;
  penaltyForLate?: boolean;

  // Status
  status: ComplianceStatus;
  lastFiledDate?: Date;
  nextFilingDate?: Date;
  confirmationNumber?: string;

  // Documentation
  requiredDocuments: string[];
  submittedDocuments: FileReference[];
  filingUrl?: string;

  // Responsibility
  responsibleParty?: string;
  responsibleEmail?: string;
  backupResponsible?: string;
  vendorManaged?: boolean;
  vendorName?: string;
  vendorContact?: string;

  // Alerts
  alertDaysBefore?: number;
  alertSent?: boolean;
  alertSentDate?: Date;
  escalationDaysBefore?: number;
  escalationSent?: boolean;

  // Financial
  filingFee?: number;
  latePenalty?: number;

  createdAt: Date;
  updatedAt: Date;
}

export type ComplianceFrequency = 'annual' | 'semi_annual' | 'quarterly' | 'monthly' | 'as_needed';

export type ComplianceStatus = 'compliant' | 'pending' | 'overdue' | 'not_applicable' | 'waived';

export interface RiskAssessment {
  riskId: string;
  orgId: string;

  // Identification
  riskCategory: RiskCategory;
  riskSubcategory?: string;
  riskTitle: string;
  riskDescription: string;
  riskSource?: string;

  // Analysis (1-5 scale)
  likelihoodScore: number;
  impactScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  riskVelocity?: RiskVelocity;

  // Response
  responseStrategy: RiskResponseStrategy;
  mitigationActions: MitigationAction[];
  controlMeasures: ControlMeasure[];
  contingencyPlan?: string;
  residualRiskScore?: number;

  // Monitoring
  keyRiskIndicators: RiskIndicator[];
  monitoringFrequency?: string;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  triggerEvents?: string[];

  // Ownership
  riskOwner?: string;
  riskOwnerId?: string;
  reviewCommittee?: string;
  escalationPath?: string[];

  // Financial Impact
  potentialFinancialImpactMin?: number;
  potentialFinancialImpactMax?: number;
  mitigationCost?: number;

  // Status
  status: RiskStatus;
  riskTrend?: RiskTrend;

  createdAt: Date;
  updatedAt: Date;
}

export type RiskCategory =
  | 'financial'
  | 'operational'
  | 'compliance'
  | 'reputational'
  | 'strategic'
  | 'cyber';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RiskVelocity = 'slow' | 'moderate' | 'fast';

export type RiskResponseStrategy = 'avoid' | 'mitigate' | 'transfer' | 'accept';

export type RiskStatus = 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'closed';

export type RiskTrend = 'increasing' | 'stable' | 'decreasing';

export interface MitigationAction {
  actionId?: string;
  description: string;
  owner?: string;
  dueDate?: Date;
  status?: 'planned' | 'in_progress' | 'completed';
}

export interface ControlMeasure {
  controlId?: string;
  controlType: 'preventive' | 'detective' | 'corrective';
  description: string;
  effectiveness: 'low' | 'medium' | 'high';
}

export interface RiskIndicator {
  indicatorName: string;
  currentValue?: number;
  thresholdValue?: number;
  trend?: 'improving' | 'stable' | 'worsening';
}

// ============================================================================
// CAPACITY BUILDING
// ============================================================================

export interface CapacityBuildingPlan {
  planId: string;
  orgId: string;
  assessmentId?: string;

  // Overview
  planName: string;
  planDescription?: string;
  planDurationMonths?: number;
  totalInvestment?: number;
  expectedRoi?: number;
  expectedRoiDescription?: string;

  // Priorities
  priorityAreas: string[];
  quickWins: QuickWin[];
  foundationalImprovements: string[];
  transformationalInitiatives: string[];

  // Resources
  internalResourcesRequired: string[];
  externalResourcesRequired: string[];
  fundingRequired?: number;
  fundingSources: FundingSource[];
  fundingSecured?: number;

  // Timeline & Phases
  phase1Name?: string;
  phase1DurationMonths?: number;
  phase1Initiatives: string[];
  phase2Name?: string;
  phase2DurationMonths?: number;
  phase2Initiatives: string[];
  phase3Name?: string;
  phase3DurationMonths?: number;
  phase3Initiatives: string[];

  // Success Metrics
  successIndicators: SuccessIndicator[];
  baselineMetrics: Record<string, number>;
  targetMetrics: Record<string, number>;
  measurementPlan: Record<string, any>;

  // Status
  approvalStatus: PlanApprovalStatus;
  approvedBy?: string;
  approverId?: string;
  approvalDate?: Date;
  implementationStart?: Date;
  expectedCompletion?: Date;
  actualCompletion?: Date;

  // Progress
  overallProgressPct?: number;
  initiativesCompleted?: number;
  initiativesTotal?: number;
  onTrack?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type PlanApprovalStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed';

export interface FundingSource {
  sourceName: string;
  amount?: number;
  secured?: boolean;
  applicationDeadline?: Date;
}

export interface SuccessIndicator {
  indicatorName: string;
  baseline?: number;
  target?: number;
  measurementMethod?: string;
  frequency?: string;
}

export interface CapacityInitiative {
  initiativeId: string;
  planId: string;

  // Details
  initiativeName: string;
  category: InitiativeCategory;
  description: string;
  expectedOutcome?: string;
  successCriteria?: string;

  // Priority & Timeline
  priorityLevel: Priority;
  phase?: number;
  sequenceOrder?: number;
  startDate?: Date;
  endDate?: Date;
  durationWeeks?: number;

  // Resources
  budgetRequired?: number;
  budgetAllocated?: number;
  staffHoursRequired?: number;
  consultantNeeded?: boolean;
  externalSupportNeeded: string[];
  toolsNeeded: string[];
  trainingNeeded: string[];

  // Implementation
  implementationSteps: ImplementationStep[];
  responsibleParty?: string;
  responsiblePartyId?: string;
  teamMembers: string[];
  stakeholders: string[];
  dependencies: string[];

  // Progress
  status: InitiativeStatus;
  progressPercentage?: number;
  milestones: Milestone[];
  blockers: Blocker[];
  risks: string[];

  // Outcomes
  actualOutcome?: string;
  lessonsLearned?: string;
  successMetrics?: Record<string, any>;
  actualCost?: number;
  roiAchieved?: number;

  // Dates
  actualStartDate?: Date;
  actualCompletionDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type InitiativeCategory =
  | 'governance'
  | 'financial'
  | 'program'
  | 'fundraising'
  | 'technology'
  | 'hr'
  | 'marketing';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type InitiativeStatus = 'planned' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

export interface ImplementationStep {
  stepNumber: number;
  description: string;
  owner?: string;
  dueDate?: Date;
  completed?: boolean;
}

export interface Milestone {
  milestoneName: string;
  targetDate: Date;
  achieved?: boolean;
  achievedDate?: Date;
}

export interface Blocker {
  blockerDescription: string;
  impact: 'low' | 'medium' | 'high';
  resolutionPlan?: string;
  owner?: string;
}

// ============================================================================
// ONBOARDING
// ============================================================================

export interface OnboardingWorkflow {
  workflowId: string;
  orgId: string;
  organizationType: OrganizationType;

  // Configuration
  workflowTemplate: string;
  workflowName: string;
  customizations: Record<string, any>;
  totalSteps?: number;
  mandatorySteps?: number;
  optionalSteps?: number;

  // Progress
  currentStep?: number;
  completedSteps?: number;
  skippedSteps?: number;
  progressPercentage?: number;

  // Timeline
  startedAt?: Date;
  targetCompletion?: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  daysToComplete?: number;

  // Status
  status: OnboardingStatus;
  blockers: string[];
  notes?: string;

  // Assignment
  assignedTo?: string;
  onboardingSpecialist?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type OnboardingStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'abandoned';

export interface OnboardingStep {
  stepId: string;
  workflowId: string;

  // Details
  stepNumber: number;
  stepName: string;
  stepType: StepType;
  description?: string;
  instructions?: string;

  // Requirements
  required?: boolean;
  prerequisites: string[];
  requiredDocuments: string[];
  requiredData: Record<string, any>;

  // Assignment
  assignedTo?: string;
  assignedToId?: string;
  assignedRole?: UserRole;

  // Timing
  estimatedDurationHours?: number;
  targetStartDate?: Date;
  dueDate?: Date;

  // Completion
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
  completedById?: string;

  // Validation
  requiresValidation?: boolean;
  validated?: boolean;
  validatedBy?: string;
  validatorId?: string;
  validationDate?: Date;
  validationNotes?: string;

  // Output
  outputDocuments: FileReference[];
  systemActions: SystemAction[];
  completionData: Record<string, any>;

  // Help
  helpResources: Resource[];
  supportContact?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type StepType =
  | 'document_upload'
  | 'form_completion'
  | 'training'
  | 'verification'
  | 'approval'
  | 'system_setup';

export type UserRole = 'org_admin' | 'staff' | 'consultant' | 'platform_admin' | 'viewer';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';

export interface SystemAction {
  actionType: string;
  description: string;
  executed?: boolean;
  executedAt?: Date;
  result?: any;
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export interface User {
  userId: string;
  email: string;
  passwordHash?: string;

  // Profile
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;

  // Organization
  primaryOrgId?: string;

  // Role & Permissions
  userRole: UserRole;
  permissions: string[];

  // Authentication
  emailVerified?: boolean;
  emailVerificationToken?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;

  // Password Reset
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Login Tracking
  lastLogin?: Date;
  loginCount?: number;
  failedLoginAttempts?: number;
  accountLocked?: boolean;

  // Status
  isActive: boolean;
  deactivatedAt?: Date;
  deactivatedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export interface Document {
  documentId: string;
  orgId: string;

  // Details
  documentName: string;
  documentType: string;
  documentCategory: string;
  description?: string;

  // File Information
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  storagePath: string;
  storageBucket: string;

  // Metadata
  fiscalYear?: number;
  documentDate?: Date;
  expirationDate?: Date;
  version?: string;

  // Processing
  processed?: boolean;
  processingStatus?: ProcessingStatus;
  extractedData?: any;
  ocrConfidence?: number;

  // Verification
  verified?: boolean;
  verifiedBy?: string;
  verificationDate?: Date;
  verificationNotes?: string;

  // Access
  accessLevel: AccessLevel;
  encryptionStatus?: string;

  // Upload
  uploadedBy?: string;
  uploadedAt: Date;

  // References
  relatedAssessmentId?: string;
  relatedComplianceId?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type AccessLevel = 'public' | 'internal' | 'restricted' | 'private';

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiMetadata {
  timestamp: Date;
  requestId: string;
  version: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  organizationType?: OrganizationType;
  intakeStage?: IntakeStage;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
