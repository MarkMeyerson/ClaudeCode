/**
 * Donor Intelligence Service
 * 360-degree donor view, giving capacity analysis, engagement scoring,
 * predictive analytics, and relationship management
 */

export interface Donor {
  donorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  donorType: 'individual' | 'corporation' | 'foundation' | 'family_office';
  donorSegment: 'major' | 'mid_level' | 'annual' | 'lapsed' | 'prospect';
  tags: string[];
  customFields: {[key: string]: any};
  createdAt: Date;
  lastUpdated: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface DonationHistory {
  donations: Donation[];
  totalLifetimeValue: number;
  firstGiftDate: Date;
  lastGiftDate: Date;
  largestGift: number;
  averageGiftSize: number;
  donationCount: number;
  yearlyGiving: {[year: number]: number};
  givingFrequency: 'monthly' | 'quarterly' | 'annual' | 'sporadic';
  givingTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface Donation {
  donationId: string;
  amount: number;
  date: Date;
  campaign?: string;
  appeal?: string;
  method: 'check' | 'credit_card' | 'ach' | 'wire' | 'stock' | 'crypto' | 'other';
  recurring: boolean;
  designation?: string;
  acknowledgmentSent: boolean;
  taxReceiptSent: boolean;
}

export interface EngagementProfile {
  engagementScore: number; // 0-100
  engagementLevel: 'highly_engaged' | 'engaged' | 'moderately_engaged' | 'minimally_engaged' | 'inactive';
  activities: EngagementActivity[];
  preferences: DonorPreferences;
  touchpoints: Touchpoint[];
  nextBestAction: string;
  retentionRisk: 'low' | 'medium' | 'high';
}

export interface EngagementActivity {
  activityId: string;
  type: 'donation' | 'event_attendance' | 'volunteer' | 'email_open' | 'email_click' | 'website_visit' | 'meeting' | 'phone_call';
  date: Date;
  description: string;
  points: number; // Engagement points earned
}

export interface DonorPreferences {
  communicationChannel: 'email' | 'phone' | 'mail' | 'text' | 'in_person';
  communicationFrequency: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  interests: string[];
  programAffinity: string[];
  volunteerInterest: boolean;
  eventInterest: boolean;
  anonymousGiving: boolean;
}

export interface Touchpoint {
  touchpointId: string;
  date: Date;
  type: 'call' | 'email' | 'meeting' | 'event' | 'mail';
  staffMember: string;
  notes: string;
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

export interface GivingCapacity {
  estimatedCapacity: number;
  capacityRating: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  currentGiving: number;
  potentialGiving: number;
  gapAnalysis: number; // Difference between capacity and current giving
  capacityIndicators: CapacityIndicator[];
  wealthScreening?: WealthScreeningData;
  askAmount: {
    minimum: number;
    target: number;
    stretch: number;
  };
}

export interface CapacityIndicator {
  indicator: string;
  value: any;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface WealthScreeningData {
  estimatedNetWorth: number;
  realEstateHoldings: number;
  businessAffiliations: string[];
  boardMemberships: string[];
  politicalDonations: number;
  foundationGrants: number;
  stockHoldings?: number;
  charitableGivingEstimate: number;
}

export interface DonorIntelligence {
  donor: Donor;
  donationHistory: DonationHistory;
  engagement: EngagementProfile;
  givingCapacity: GivingCapacity;
  relationships: DonorRelationship[];
  predictiveInsights: PredictiveInsights;
  actionItems: ActionItem[];
}

export interface DonorRelationship {
  relationshipType: 'spouse' | 'family' | 'business_partner' | 'board_member' | 'staff' | 'volunteer';
  relatedDonorId?: string;
  relatedEntityId?: string;
  name: string;
  description: string;
}

export interface PredictiveInsights {
  retentionProbability: number; // 0-100
  upgradeProbability: number; // 0-100
  nextGiftPrediction: {
    amount: number;
    timeframe: string;
    confidence: number;
  };
  churnRisk: number; // 0-100
  lifetimeValueProjection: number;
  recommendedActions: string[];
}

export interface ActionItem {
  actionId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'follow_up' | 'stewardship' | 'cultivation' | 'solicitation' | 'thank_you';
  description: string;
  dueDate: Date;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export class DonorIntelligenceService {
  /**
   * Get comprehensive 360-degree donor view
   */
  async getDonorIntelligence(donorId: string): Promise<DonorIntelligence> {
    // In production, fetch from database
    const donor = await this.getDonor(donorId);
    const donationHistory = await this.getDonationHistory(donorId);
    const engagement = await this.calculateEngagementProfile(donorId);
    const givingCapacity = await this.analyzeGivingCapacity(donorId, donationHistory);
    const relationships = await this.getDonorRelationships(donorId);
    const predictiveInsights = await this.generatePredictiveInsights(
      donor,
      donationHistory,
      engagement
    );
    const actionItems = await this.generateActionItems(
      donor,
      engagement,
      predictiveInsights
    );

    return {
      donor,
      donationHistory,
      engagement,
      givingCapacity,
      relationships,
      predictiveInsights,
      actionItems,
    };
  }

  /**
   * Analyze giving capacity using multiple data sources
   */
  async analyzeGivingCapacity(
    donorId: string,
    history: DonationHistory
  ): Promise<GivingCapacity> {
    // In production, integrate with wealth screening services
    // For now, use heuristics based on giving history

    const currentGiving = history.totalLifetimeValue / this.getYearsOfGiving(history);
    const largestGift = history.largestGift;

    // Heuristic: Capacity is typically 5-10x largest gift
    const estimatedCapacity = largestGift * 7.5;

    const potentialGiving = Math.max(currentGiving * 2, largestGift * 1.5);
    const gapAnalysis = potentialGiving - currentGiving;

    const capacityRating = this.calculateCapacityRating(estimatedCapacity);

    const capacityIndicators: CapacityIndicator[] = [
      {
        indicator: 'Largest Single Gift',
        value: `$${largestGift.toLocaleString()}`,
        source: 'Donation History',
        confidence: 'high',
      },
      {
        indicator: 'Average Annual Giving',
        value: `$${Math.round(currentGiving).toLocaleString()}`,
        source: 'Donation History',
        confidence: 'high',
      },
      {
        indicator: 'Giving Trend',
        value: history.givingTrend,
        source: 'Historical Analysis',
        confidence: 'medium',
      },
    ];

    return {
      estimatedCapacity,
      capacityRating,
      currentGiving,
      potentialGiving,
      gapAnalysis,
      capacityIndicators,
      askAmount: {
        minimum: largestGift,
        target: largestGift * 1.5,
        stretch: largestGift * 2,
      },
    };
  }

  /**
   * Calculate engagement score (0-100)
   */
  async calculateEngagementProfile(donorId: string): Promise<EngagementProfile> {
    // In production, fetch activities from database
    const activities = await this.getEngagementActivities(donorId);
    const touchpoints = await this.getTouchpoints(donorId);
    const preferences = await this.getDonorPreferences(donorId);

    // Calculate engagement score based on recent activities
    let score = 0;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Recent donations (30 points)
    const recentDonations = activities.filter(
      a => a.type === 'donation' && a.date >= threeMonthsAgo
    );
    score += Math.min(30, recentDonations.length * 15);

    // Event attendance (20 points)
    const eventAttendance = activities.filter(
      a => a.type === 'event_attendance' && a.date >= threeMonthsAgo
    );
    score += Math.min(20, eventAttendance.length * 10);

    // Email engagement (15 points)
    const emailEngagement = activities.filter(
      a => (a.type === 'email_open' || a.type === 'email_click') && a.date >= threeMonthsAgo
    );
    score += Math.min(15, emailEngagement.length * 2);

    // Volunteer activity (20 points)
    const volunteerActivity = activities.filter(
      a => a.type === 'volunteer' && a.date >= threeMonthsAgo
    );
    score += Math.min(20, volunteerActivity.length * 10);

    // Personal interactions (15 points)
    const personalInteractions = touchpoints.filter(
      t => (t.type === 'meeting' || t.type === 'call') && t.date >= threeMonthsAgo
    );
    score += Math.min(15, personalInteractions.length * 7);

    const engagementLevel = this.getEngagementLevel(score);
    const retentionRisk = this.calculateRetentionRisk(score, activities);
    const nextBestAction = this.determineNextBestAction(score, activities, preferences);

    return {
      engagementScore: Math.min(100, score),
      engagementLevel,
      activities,
      preferences,
      touchpoints,
      nextBestAction,
      retentionRisk,
    };
  }

  /**
   * Generate predictive insights using ML models
   */
  async generatePredictiveInsights(
    donor: Donor,
    history: DonationHistory,
    engagement: EngagementProfile
  ): Promise<PredictiveInsights> {
    // In production, use trained ML models
    // For now, use rule-based heuristics

    // Retention probability based on engagement and recency
    const daysSinceLastGift = this.getDaysSince(history.lastGiftDate);
    let retentionProbability = engagement.engagementScore;

    if (daysSinceLastGift > 365) {
      retentionProbability *= 0.5;
    } else if (daysSinceLastGift > 180) {
      retentionProbability *= 0.75;
    }

    // Upgrade probability based on giving trend and capacity
    let upgradeProbability = 50;
    if (history.givingTrend === 'increasing') {
      upgradeProbability = 75;
    } else if (history.givingTrend === 'decreasing') {
      upgradeProbability = 25;
    }

    // Next gift prediction
    const avgGiftInterval = this.calculateAverageGiftInterval(history);
    const nextGiftDays = Math.round(avgGiftInterval);
    const nextGiftAmount = history.averageGiftSize * (history.givingTrend === 'increasing' ? 1.2 : 1.0);

    // Churn risk (inverse of retention)
    const churnRisk = 100 - retentionProbability;

    // Lifetime value projection (5 years)
    const projectedYears = 5;
    const annualGiving = history.totalLifetimeValue / this.getYearsOfGiving(history);
    const lifetimeValueProjection = annualGiving * projectedYears * (retentionProbability / 100);

    const recommendedActions = this.generateRecommendedActions(
      retentionProbability,
      upgradeProbability,
      churnRisk,
      engagement
    );

    return {
      retentionProbability: Math.round(retentionProbability),
      upgradeProbability: Math.round(upgradeProbability),
      nextGiftPrediction: {
        amount: Math.round(nextGiftAmount),
        timeframe: `${nextGiftDays} days`,
        confidence: retentionProbability > 70 ? 85 : 60,
      },
      churnRisk: Math.round(churnRisk),
      lifetimeValueProjection: Math.round(lifetimeValueProjection),
      recommendedActions,
    };
  }

  /**
   * Generate actionable items for donor cultivation
   */
  async generateActionItems(
    donor: Donor,
    engagement: EngagementProfile,
    insights: PredictiveInsights
  ): Promise<ActionItem[]> {
    const actions: ActionItem[] = [];

    // High churn risk - immediate action
    if (insights.churnRisk > 60) {
      actions.push({
        actionId: this.generateId(),
        priority: 'critical',
        type: 'follow_up',
        description: `Personal outreach to re-engage ${donor.firstName} - high churn risk`,
        dueDate: this.addDays(new Date(), 3),
        status: 'pending',
      });
    }

    // Recent donation - thank you call
    const recentDonation = engagement.activities.find(
      a => a.type === 'donation' && this.getDaysSince(a.date) <= 7
    );
    if (recentDonation) {
      actions.push({
        actionId: this.generateId(),
        priority: 'high',
        type: 'thank_you',
        description: `Thank you call for recent ${recentDonation.description}`,
        dueDate: this.addDays(new Date(), 2),
        status: 'pending',
      });
    }

    // High upgrade probability - solicitation
    if (insights.upgradeProbability > 70) {
      actions.push({
        actionId: this.generateId(),
        priority: 'high',
        type: 'solicitation',
        description: `Schedule upgrade conversation - high upgrade probability`,
        dueDate: this.addDays(new Date(), 14),
        status: 'pending',
      });
    }

    // Follow-up required from last touchpoint
    const lastTouchpoint = engagement.touchpoints
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (lastTouchpoint?.followUpRequired) {
      actions.push({
        actionId: this.generateId(),
        priority: 'medium',
        type: 'follow_up',
        description: `Follow up from ${lastTouchpoint.type} on ${lastTouchpoint.date.toLocaleDateString()}`,
        dueDate: lastTouchpoint.followUpDate || this.addDays(new Date(), 7),
        status: 'pending',
      });
    }

    // Regular stewardship
    const daysSinceLastContact = engagement.touchpoints.length > 0
      ? this.getDaysSince(engagement.touchpoints[0].date)
      : 999;

    if (daysSinceLastContact > 90) {
      actions.push({
        actionId: this.generateId(),
        priority: 'medium',
        type: 'stewardship',
        description: `Regular check-in - no contact in ${daysSinceLastContact} days`,
        dueDate: this.addDays(new Date(), 7),
        status: 'pending',
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Helper methods
  private async getDonor(donorId: string): Promise<Donor> {
    // Mock implementation
    return {
      donorId,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      donorType: 'individual',
      donorSegment: 'major',
      tags: ['board_member', 'event_sponsor'],
      customFields: {},
      createdAt: new Date('2020-01-15'),
      lastUpdated: new Date(),
    };
  }

  private async getDonationHistory(donorId: string): Promise<DonationHistory> {
    // Mock implementation
    const donations: Donation[] = [
      {
        donationId: 'd1',
        amount: 5000,
        date: new Date('2024-12-15'),
        method: 'credit_card',
        recurring: false,
        acknowledgmentSent: true,
        taxReceiptSent: true,
      },
      {
        donationId: 'd2',
        amount: 10000,
        date: new Date('2024-06-01'),
        method: 'check',
        recurring: false,
        acknowledgmentSent: true,
        taxReceiptSent: true,
      },
    ];

    return {
      donations,
      totalLifetimeValue: 45000,
      firstGiftDate: new Date('2020-03-15'),
      lastGiftDate: new Date('2024-12-15'),
      largestGift: 15000,
      averageGiftSize: 7500,
      donationCount: 6,
      yearlyGiving: { 2024: 15000, 2023: 12000, 2022: 10000, 2021: 5000, 2020: 3000 },
      givingFrequency: 'annual',
      givingTrend: 'increasing',
    };
  }

  private async getEngagementActivities(donorId: string): Promise<EngagementActivity[]> {
    return [];
  }

  private async getTouchpoints(donorId: string): Promise<Touchpoint[]> {
    return [];
  }

  private async getDonorPreferences(donorId: string): Promise<DonorPreferences> {
    return {
      communicationChannel: 'email',
      communicationFrequency: 'monthly',
      interests: ['education', 'youth_development'],
      programAffinity: ['scholarship_fund'],
      volunteerInterest: true,
      eventInterest: true,
      anonymousGiving: false,
    };
  }

  private async getDonorRelationships(donorId: string): Promise<DonorRelationship[]> {
    return [];
  }

  private getYearsOfGiving(history: DonationHistory): number {
    const years = (new Date().getTime() - history.firstGiftDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.max(1, years);
  }

  private calculateCapacityRating(capacity: number): 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' {
    if (capacity >= 1000000) return 'A+';
    if (capacity >= 500000) return 'A';
    if (capacity >= 100000) return 'B+';
    if (capacity >= 50000) return 'B';
    if (capacity >= 10000) return 'C';
    return 'D';
  }

  private getEngagementLevel(score: number): EngagementProfile['engagementLevel'] {
    if (score >= 80) return 'highly_engaged';
    if (score >= 60) return 'engaged';
    if (score >= 40) return 'moderately_engaged';
    if (score >= 20) return 'minimally_engaged';
    return 'inactive';
  }

  private calculateRetentionRisk(score: number, activities: EngagementActivity[]): 'low' | 'medium' | 'high' {
    if (score >= 70) return 'low';
    if (score >= 40) return 'medium';
    return 'high';
  }

  private determineNextBestAction(
    score: number,
    activities: EngagementActivity[],
    preferences: DonorPreferences
  ): string {
    if (score < 30) return 'Re-engagement campaign via preferred channel';
    if (score >= 70) return 'Schedule upgrade conversation';
    return 'Regular stewardship outreach';
  }

  private getDaysSince(date: Date): number {
    const diff = new Date().getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private calculateAverageGiftInterval(history: DonationHistory): number {
    if (history.donationCount <= 1) return 365;

    const daysBetweenFirstAndLast =
      (history.lastGiftDate.getTime() - history.firstGiftDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysBetweenFirstAndLast / (history.donationCount - 1);
  }

  private generateRecommendedActions(
    retention: number,
    upgrade: number,
    churn: number,
    engagement: EngagementProfile
  ): string[] {
    const actions: string[] = [];

    if (churn > 60) {
      actions.push('Immediate personal outreach to prevent lapse');
    }

    if (upgrade > 70) {
      actions.push('Schedule face-to-face meeting to discuss increased support');
    }

    if (engagement.engagementScore < 40) {
      actions.push('Invite to upcoming event to re-engage');
    }

    if (retention > 80 && upgrade > 60) {
      actions.push('Consider for major gift solicitation');
    }

    return actions;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
