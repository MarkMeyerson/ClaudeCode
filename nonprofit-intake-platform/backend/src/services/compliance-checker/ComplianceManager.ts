/**
 * Compliance Manager
 * Tracks and manages compliance requirements across federal, state, and local jurisdictions
 * Handles IRS, FEC, state charity registrations, and other regulatory obligations
 */

import {
  ComplianceRequirement,
  ComplianceStatus,
  ComplianceFrequency,
  OrganizationType,
  TaxStatus,
} from '../../types';

export interface ComplianceAlert {
  requirementId: string;
  requirementName: string;
  dueDate: Date;
  daysUntilDue: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionRequired: string;
}

export interface ComplianceReport {
  orgId: string;
  reportDate: Date;
  totalRequirements: number;
  compliant: number;
  pending: number;
  overdue: number;
  complianceRate: number;
  upcomingDeadlines: ComplianceAlert[];
  criticalIssues: string[];
}

export class ComplianceManager {
  /**
   * Initialize compliance requirements for a new organization
   */
  async initializeCompliance(
    orgId: string,
    organizationType: OrganizationType,
    taxStatus?: TaxStatus,
    incorporationState?: string
  ): Promise<ComplianceRequirement[]> {
    const requirements: ComplianceRequirement[] = [];

    // Federal Requirements
    requirements.push(...this.getFederalRequirements(organizationType, taxStatus));

    // State Requirements
    if (incorporationState) {
      requirements.push(
        ...this.getStateRequirements(organizationType, incorporationState)
      );
    }

    // Organization type-specific requirements
    if (organizationType === 'mission_driven') {
      requirements.push(...this.getMissionDrivenRequirements(taxStatus));
    } else if (organizationType === 'association') {
      requirements.push(...this.getAssociationRequirements());
    } else if (organizationType === 'pac') {
      requirements.push(...this.getPACRequirements());
    }

    return requirements;
  }

  /**
   * Check compliance status for an organization
   */
  async checkComplianceStatus(orgId: string): Promise<ComplianceReport> {
    const requirements = await this.getOrganizationRequirements(orgId);

    const compliant = requirements.filter((r) => r.status === 'compliant').length;
    const pending = requirements.filter((r) => r.status === 'pending').length;
    const overdue = requirements.filter((r) => r.status === 'overdue').length;
    const complianceRate = (compliant / requirements.length) * 100;

    const upcomingDeadlines = this.identifyUpcomingDeadlines(requirements);
    const criticalIssues = this.identifyCriticalIssues(requirements);

    return {
      orgId,
      reportDate: new Date(),
      totalRequirements: requirements.length,
      compliant,
      pending,
      overdue,
      complianceRate,
      upcomingDeadlines,
      criticalIssues,
    };
  }

  /**
   * Generate compliance alerts for upcoming deadlines
   */
  generateAlerts(requirements: ComplianceRequirement[]): ComplianceAlert[] {
    const alerts: ComplianceAlert[] = [];
    const today = new Date();

    for (const req of requirements) {
      if (req.status !== 'compliant' && req.nextFilingDate) {
        const daysUntilDue = this.daysBetween(today, req.nextFilingDate);

        if (daysUntilDue <= 60) {
          // Alert for deadlines within 60 days
          alerts.push({
            requirementId: req.requirementId,
            requirementName: req.requirementName,
            dueDate: req.nextFilingDate,
            daysUntilDue,
            priority: this.determinePriority(daysUntilDue, req.penaltyForLate),
            actionRequired: this.determineAction(req),
          });
        }
      }
    }

    return alerts.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }

  /**
   * Get federal compliance requirements
   */
  private getFederalRequirements(
    organizationType: OrganizationType,
    taxStatus?: TaxStatus
  ): ComplianceRequirement[] {
    const requirements: ComplianceRequirement[] = [];

    // Form 990 Filing
    if (taxStatus && taxStatus.startsWith('501c')) {
      requirements.push({
        requirementId: this.generateId(),
        orgId: '', // Will be set when created
        requirementType: 'tax_filing',
        jurisdiction: 'federal',
        agency: 'IRS',
        requirementName: 'Form 990 Annual Filing',
        description: 'Annual information return for tax-exempt organizations',
        formNumber: '990',
        frequency: 'annual',
        dueDate: this.calculateForm990DueDate(),
        gracePeriodDays: 0,
        penaltyForLate: true,
        status: 'pending',
        requiredDocuments: ['Form 990', 'Schedule A', 'Financial Statements'],
        submittedDocuments: [],
        responsibleParty: 'Executive Director/CFO',
        alertDaysBefore: 60,
        escalationDaysBefore: 30,
        filingFee: 0,
        latePenalty: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ComplianceRequirement);
    }

    return requirements;
  }

  /**
   * Get state-specific compliance requirements
   */
  private getStateRequirements(
    organizationType: OrganizationType,
    state: string
  ): ComplianceRequirement[] {
    const requirements: ComplianceRequirement[] = [];

    // State Charity Registration (for mission-driven orgs)
    if (organizationType === 'mission_driven') {
      requirements.push({
        requirementId: this.generateId(),
        orgId: '',
        requirementType: 'charity_registration',
        jurisdiction: `state_${state}`,
        agency: `${state} Attorney General`,
        requirementName: `${state} Charity Registration`,
        description: 'Annual registration for charitable organizations',
        frequency: 'annual',
        dueDate: new Date(),
        status: 'pending',
        requiredDocuments: ['Registration Form', 'Financial Statements', 'Form 990'],
        submittedDocuments: [],
        alertDaysBefore: 45,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ComplianceRequirement);
    }

    return requirements;
  }

  /**
   * Mission-driven specific requirements
   */
  private getMissionDrivenRequirements(taxStatus?: TaxStatus): ComplianceRequirement[] {
    const requirements: ComplianceRequirement[] = [];

    // Annual Audit (if required)
    requirements.push({
      requirementId: this.generateId(),
      orgId: '',
      requirementType: 'audit',
      jurisdiction: 'federal',
      agency: 'Independent Auditor',
      requirementName: 'Annual Financial Audit',
      description: 'Independent audit of financial statements',
      frequency: 'annual',
      dueDate: new Date(),
      status: 'pending',
      requiredDocuments: ['Audited Financial Statements', 'Management Letter'],
      submittedDocuments: [],
      alertDaysBefore: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ComplianceRequirement);

    return requirements;
  }

  /**
   * Association-specific requirements
   */
  private getAssociationRequirements(): ComplianceRequirement[] {
    const requirements: ComplianceRequirement[] = [];

    // Lobbying Disclosure (if applicable)
    requirements.push({
      requirementId: this.generateId(),
      orgId: '',
      requirementType: 'lobbying_disclosure',
      jurisdiction: 'federal',
      agency: 'Clerk of the House/Secretary of the Senate',
      requirementName: 'Lobbying Disclosure Act Reporting',
      description: 'Quarterly lobbying activity disclosure',
      frequency: 'quarterly',
      dueDate: new Date(),
      status: 'not_applicable',
      requiredDocuments: ['LD-2 Form'],
      submittedDocuments: [],
      alertDaysBefore: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ComplianceRequirement);

    return requirements;
  }

  /**
   * PAC-specific requirements
   */
  private getPACRequirements(): ComplianceRequirement[] {
    const requirements: ComplianceRequirement[] = [];

    // FEC Registration
    requirements.push({
      requirementId: this.generateId(),
      orgId: '',
      requirementType: 'pac_filing',
      jurisdiction: 'federal',
      agency: 'Federal Election Commission',
      requirementName: 'FEC Statement of Organization (Form 1)',
      description: 'Register PAC with Federal Election Commission',
      formNumber: 'FEC Form 1',
      frequency: 'as_needed',
      dueDate: new Date(),
      status: 'pending',
      requiredDocuments: ['Form 1', 'Treasurer Designation'],
      submittedDocuments: [],
      filingUrl: 'https://www.fec.gov/help-candidates-and-committees/filing-reports/',
      alertDaysBefore: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ComplianceRequirement);

    // FEC Quarterly Reports
    requirements.push({
      requirementId: this.generateId(),
      orgId: '',
      requirementType: 'pac_filing',
      jurisdiction: 'federal',
      agency: 'Federal Election Commission',
      requirementName: 'FEC Quarterly Report',
      description: 'Quarterly disclosure of receipts and disbursements',
      formNumber: 'FEC Form 3X',
      frequency: 'quarterly',
      dueDate: this.calculateNextQuarterlyDeadline(),
      status: 'pending',
      requiredDocuments: ['Form 3X', 'Itemized Receipts', 'Itemized Disbursements'],
      submittedDocuments: [],
      penaltyForLate: true,
      filingUrl: 'https://www.fec.gov/help-candidates-and-committees/filing-reports/',
      alertDaysBefore: 15,
      escalationDaysBefore: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ComplianceRequirement);

    return requirements;
  }

  /**
   * Update compliance status based on filing
   */
  async updateComplianceStatus(
    requirementId: string,
    status: ComplianceStatus,
    filingData?: {
      confirmationNumber?: string;
      filedDate?: Date;
      documents?: string[];
    }
  ): Promise<void> {
    // In production, update database
    // For now, just validate the status change
    this.validateStatusChange(status);
  }

  /**
   * Calculate next due date for recurring requirements
   */
  calculateNextDueDate(
    requirement: ComplianceRequirement
  ): Date {
    const { frequency, lastFiledDate, filingPeriodEnd } = requirement;

    if (!lastFiledDate) return new Date();

    const nextDate = new Date(lastFiledDate);

    switch (frequency) {
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'semi_annual':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        return nextDate;
    }

    return nextDate;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getOrganizationRequirements(
    orgId: string
  ): Promise<ComplianceRequirement[]> {
    // Mock implementation - in production, query database
    return [];
  }

  private identifyUpcomingDeadlines(
    requirements: ComplianceRequirement[]
  ): ComplianceAlert[] {
    return this.generateAlerts(requirements);
  }

  private identifyCriticalIssues(requirements: ComplianceRequirement[]): string[] {
    const issues: string[] = [];

    const overdue = requirements.filter((r) => r.status === 'overdue');
    if (overdue.length > 0) {
      issues.push(`${overdue.length} compliance requirements are overdue`);
    }

    const criticalDeadlines = requirements.filter((r) => {
      if (!r.nextFilingDate) return false;
      const daysUntil = this.daysBetween(new Date(), r.nextFilingDate);
      return daysUntil <= 7 && r.status !== 'compliant';
    });

    if (criticalDeadlines.length > 0) {
      issues.push(`${criticalDeadlines.length} critical deadlines within 7 days`);
    }

    return issues;
  }

  private determinePriority(
    daysUntilDue: number,
    penaltyForLate?: boolean
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (daysUntilDue <= 0) return 'critical';
    if (daysUntilDue <= 7) return 'critical';
    if (daysUntilDue <= 14 && penaltyForLate) return 'high';
    if (daysUntilDue <= 30) return 'high';
    if (daysUntilDue <= 45) return 'medium';
    return 'low';
  }

  private determineAction(req: ComplianceRequirement): string {
    const actions: Record<string, string> = {
      tax_filing: 'Prepare and file tax return',
      charity_registration: 'Complete registration renewal',
      pac_filing: 'Submit FEC report',
      audit: 'Schedule audit with qualified firm',
    };

    return actions[req.requirementType] || 'Complete required filing';
  }

  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2.getTime() - date1.getTime()) / oneDay);
  }

  private calculateForm990DueDate(): Date {
    // Form 990 is due 4.5 months after fiscal year end
    // For calendar year orgs, this is May 15
    const today = new Date();
    const year = today.getFullYear();
    return new Date(year, 4, 15); // May 15
  }

  private calculateNextQuarterlyDeadline(): Date {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // FEC quarterly deadlines: April 15, July 15, October 15, January 31
    const deadlines = [
      new Date(year, 0, 31), // Jan 31
      new Date(year, 3, 15), // Apr 15
      new Date(year, 6, 15), // Jul 15
      new Date(year, 9, 15), // Oct 15
    ];

    for (const deadline of deadlines) {
      if (deadline > today) {
        return deadline;
      }
    }

    return new Date(year + 1, 0, 31); // Next Jan 31
  }

  private validateStatusChange(status: ComplianceStatus): void {
    const validStatuses: ComplianceStatus[] = [
      'compliant',
      'pending',
      'overdue',
      'not_applicable',
      'waived',
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid compliance status: ${status}`);
    }
  }

  private generateId(): string {
    return `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ComplianceManager;
