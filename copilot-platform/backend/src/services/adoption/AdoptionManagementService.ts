// ============================================================================
// ADOPTION MANAGEMENT SERVICE
// Microsoft Copilot Onboarding & ROI Platform
// ============================================================================

import { Pool } from 'pg';
import { User, UserAdoption, FeatureUsage, AdoptionAnalytics } from '../../types';

export class AdoptionManagementService {
  private db: Pool;

  constructor(database: Pool) {
    this.db = database;
  }

  /**
   * Track user adoption progress
   */
  async trackUserAdoption(user_id: string): Promise<UserAdoption> {
    // Get current adoption record
    const query = 'SELECT * FROM user_adoption WHERE user_id = $1';
    const result = await this.db.query(query, [user_id]);

    if (result.rows.length === 0) {
      throw new Error('User adoption record not found');
    }

    const adoption = result.rows[0];

    // Calculate updated metrics
    const updatedMetrics = await this.calculateUserMetrics(user_id);

    // Determine proficiency level
    const proficiency_level = this.determineProficiencyLevel(updatedMetrics);

    // Calculate engagement score
    const engagement_score = this.calculateEngagementScore(updatedMetrics);

    // Determine champion status
    const champion_status = this.determineChampionStatus(updatedMetrics);

    // Check if user is at risk
    const at_risk = this.isUserAtRisk(updatedMetrics);

    // Update adoption record
    const updateQuery = `
      UPDATE user_adoption SET
        days_active_last_30 = $1,
        total_interactions = $2,
        average_daily_interactions = $3,
        proficiency_level = $4,
        engagement_score = $5,
        champion_status = $6,
        at_risk = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $8
      RETURNING *
    `;

    const updateResult = await this.db.query(updateQuery, [
      updatedMetrics.days_active_last_30,
      updatedMetrics.total_interactions,
      updatedMetrics.average_daily_interactions,
      proficiency_level,
      engagement_score,
      champion_status,
      at_risk,
      user_id
    ]);

    return updateResult.rows[0];
  }

  /**
   * Identify champion users
   */
  async identifyChampions(organization_id: string): Promise<User[]> {
    const query = `
      SELECT u.*
      FROM users u
      JOIN user_adoption ua ON u.user_id = ua.user_id
      WHERE u.organization_id = $1
        AND ua.champion_status IN ('champion', 'super_champion')
        AND u.status = 'active'
      ORDER BY ua.champion_score DESC
    `;

    const result = await this.db.query(query, [organization_id]);
    return result.rows;
  }

  /**
   * Identify at-risk users who need intervention
   */
  async identifyAtRiskUsers(organization_id: string): Promise<User[]> {
    const query = `
      SELECT u.*, ua.at_risk_reason, ua.engagement_score
      FROM users u
      JOIN user_adoption ua ON u.user_id = ua.user_id
      WHERE u.organization_id = $1
        AND ua.at_risk = true
        AND u.status = 'active'
      ORDER BY ua.engagement_score ASC, ua.days_active_last_30 ASC
    `;

    const result = await this.db.query(query, [organization_id]);
    return result.rows;
  }

  /**
   * Recommend interventions for improving adoption
   */
  async recommendInterventions(organization_id: string): Promise<any[]> {
    const recommendations = [];

    // Check for low overall adoption
    const adoptionRate = await this.getOrganizationAdoptionRate(organization_id);
    if (adoptionRate < 60) {
      recommendations.push({
        type: 'communication',
        priority: 'high',
        target: 'all_users',
        recommendation: 'Launch organization-wide awareness campaign',
        expected_impact: 'Increase adoption by 15-20%',
        resources_needed: ['Communication templates', 'Executive sponsor'],
        estimated_effort: 'medium'
      });
    }

    // Check for lagging departments
    const laggingDepts = await this.identifyLaggingDepartments(organization_id);
    if (laggingDepts.length > 0) {
      recommendations.push({
        type: 'training',
        priority: 'high',
        target: laggingDepts.map(d => d.department),
        recommendation: 'Conduct targeted training sessions for underperforming departments',
        expected_impact: 'Increase departmental adoption by 20-30%',
        resources_needed: ['Training materials', 'Department champions'],
        estimated_effort: 'high'
      });
    }

    // Check for at-risk users
    const atRiskCount = await this.getAtRiskUserCount(organization_id);
    if (atRiskCount > 10) {
      recommendations.push({
        type: 'coaching',
        priority: 'medium',
        target: 'at_risk_users',
        recommendation: 'Implement 1-on-1 coaching program for at-risk users',
        expected_impact: 'Re-engage 50-60% of at-risk users',
        resources_needed: ['Champions for coaching', 'Support resources'],
        estimated_effort: 'medium'
      });
    }

    // Check for feature adoption gaps
    const underutilizedFeatures = await this.identifyUnderutilizedFeatures(organization_id);
    if (underutilizedFeatures.length > 0) {
      recommendations.push({
        type: 'training',
        priority: 'low',
        target: 'all_users',
        recommendation: 'Create feature spotlight series for underutilized features',
        expected_impact: 'Increase feature adoption by 10-15%',
        resources_needed: ['Tutorial videos', 'Use case examples'],
        estimated_effort: 'low'
      });
    }

    // Check for champion program opportunity
    const potentialChampions = await this.identifyPotentialChampions(organization_id);
    if (potentialChampions.length > 5) {
      recommendations.push({
        type: 'incentive',
        priority: 'medium',
        target: 'potential_champions',
        recommendation: 'Launch formal champion program with recognition and incentives',
        expected_impact: 'Accelerate peer-to-peer learning and adoption',
        resources_needed: ['Recognition program', 'Champion toolkit'],
        estimated_effort: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Get adoption analytics for organization
   */
  async getAdoptionAnalytics(
    organization_id: string,
    period: string
  ): Promise<AdoptionAnalytics> {
    // Get overall metrics
    const overallQuery = `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN ua.days_active_last_30 > 0 THEN 1 END) as active_users,
        ROUND(
          (COUNT(CASE WHEN ua.days_active_last_30 > 0 THEN 1 END)::numeric / COUNT(*) * 100)::numeric,
          2
        ) as adoption_rate
      FROM users u
      JOIN user_adoption ua ON u.user_id = ua.user_id
      WHERE u.organization_id = $1 AND u.status = 'active'
    `;

    const overallResult = await this.db.query(overallQuery, [organization_id]);
    const overall = overallResult.rows[0];

    // Get proficiency distribution
    const proficiencyQuery = `
      SELECT
        COUNT(CASE WHEN proficiency_level = 'beginner' THEN 1 END) as beginner,
        COUNT(CASE WHEN proficiency_level = 'intermediate' THEN 1 END) as intermediate,
        COUNT(CASE WHEN proficiency_level = 'advanced' THEN 1 END) as advanced,
        COUNT(CASE WHEN proficiency_level = 'expert' THEN 1 END) as expert
      FROM user_adoption
      WHERE organization_id = $1
    `;

    const proficiencyResult = await this.db.query(proficiencyQuery, [organization_id]);
    const proficiency = proficiencyResult.rows[0];

    // Get champion count and at-risk users
    const statusQuery = `
      SELECT
        COUNT(CASE WHEN champion_status IN ('champion', 'super_champion') THEN 1 END) as champion_count,
        COUNT(CASE WHEN at_risk = true THEN 1 END) as at_risk_users
      FROM user_adoption
      WHERE organization_id = $1
    `;

    const statusResult = await this.db.query(statusQuery, [organization_id]);
    const status = statusResult.rows[0];

    // Get engagement metrics
    const engagementQuery = `
      SELECT
        ROUND(AVG(engagement_score)::numeric, 2) as average_engagement_score,
        ROUND(AVG(satisfaction_score)::numeric, 2) as average_satisfaction_score,
        ROUND(AVG(likelihood_to_recommend)::numeric, 2) as nps_score
      FROM user_adoption
      WHERE organization_id = $1
    `;

    const engagementResult = await this.db.query(engagementQuery, [organization_id]);
    const engagement = engagementResult.rows[0];

    // Get top features
    const topFeaturesQuery = `
      SELECT
        fc.feature_name,
        SUM(fu.total_uses) as usage_count,
        ROUND(AVG(fu.adoption_rate)::numeric, 2) as adoption_rate
      FROM feature_usage fu
      JOIN feature_catalog fc ON fu.feature_id = fc.feature_id
      WHERE fu.organization_id = $1
      GROUP BY fc.feature_id, fc.feature_name
      ORDER BY usage_count DESC
      LIMIT 10
    `;

    const topFeaturesResult = await this.db.query(topFeaturesQuery, [organization_id]);

    // Get department performance
    const deptQuery = `
      SELECT
        department,
        adoption_rate,
        average_engagement_score as engagement_score
      FROM department_adoption
      WHERE organization_id = $1
      ORDER BY adoption_rate DESC
    `;

    const deptResult = await this.db.query(deptQuery, [organization_id]);

    return {
      organization_id,
      period,
      total_users: parseInt(overall.total_users),
      active_users: parseInt(overall.active_users),
      adoption_rate: parseFloat(overall.adoption_rate),
      proficiency_distribution: {
        beginner: parseInt(proficiency.beginner),
        intermediate: parseInt(proficiency.intermediate),
        advanced: parseInt(proficiency.advanced),
        expert: parseInt(proficiency.expert)
      },
      champion_count: parseInt(status.champion_count),
      at_risk_users: parseInt(status.at_risk_users),
      engagement_metrics: {
        average_engagement_score: parseFloat(engagement.average_engagement_score) || 0,
        average_satisfaction_score: parseFloat(engagement.average_satisfaction_score) || 0,
        nps_score: parseFloat(engagement.nps_score) || 0
      },
      top_features: topFeaturesResult.rows.map(row => ({
        feature_name: row.feature_name,
        usage_count: parseInt(row.usage_count),
        adoption_rate: parseFloat(row.adoption_rate)
      })),
      department_performance: deptResult.rows.map(row => ({
        department: row.department,
        adoption_rate: parseFloat(row.adoption_rate),
        engagement_score: parseFloat(row.engagement_score)
      }))
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async calculateUserMetrics(user_id: string): Promise<any> {
    // Get activity data from last 30 days
    const query = `
      SELECT
        COUNT(DISTINCT date) as days_active_last_30,
        SUM(copilot_interactions) as total_interactions,
        ROUND(AVG(copilot_interactions)::numeric, 2) as average_daily_interactions,
        SUM(suggestions_accepted) as total_accepted,
        SUM(suggestions_rejected) as total_rejected,
        COUNT(DISTINCT feature_id) as features_used_count,
        SUM(peer_help_instances) as peer_help,
        SUM(best_practices_shared) as best_practices
      FROM productivity_metrics
      WHERE user_id = $1
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const result = await this.db.query(query, [user_id]);
    return result.rows[0] || {
      days_active_last_30: 0,
      total_interactions: 0,
      average_daily_interactions: 0,
      total_accepted: 0,
      total_rejected: 0,
      features_used_count: 0,
      peer_help: 0,
      best_practices: 0
    };
  }

  private determineProficiencyLevel(metrics: any): string {
    const score = this.calculateProficiencyScore(metrics);

    if (score >= 80) return 'expert';
    if (score >= 60) return 'advanced';
    if (score >= 40) return 'intermediate';
    return 'beginner';
  }

  private calculateProficiencyScore(metrics: any): number {
    let score = 0;

    // Activity score (0-30 points)
    if (metrics.days_active_last_30 >= 25) score += 30;
    else if (metrics.days_active_last_30 >= 20) score += 25;
    else if (metrics.days_active_last_30 >= 15) score += 20;
    else if (metrics.days_active_last_30 >= 10) score += 15;
    else score += metrics.days_active_last_30;

    // Usage intensity (0-30 points)
    if (metrics.total_interactions >= 500) score += 30;
    else if (metrics.total_interactions >= 300) score += 25;
    else if (metrics.total_interactions >= 150) score += 20;
    else score += Math.min(30, metrics.total_interactions / 5);

    // Feature diversity (0-20 points)
    score += Math.min(20, metrics.features_used_count * 2);

    // Acceptance rate (0-20 points)
    const total_suggestions = metrics.total_accepted + metrics.total_rejected;
    if (total_suggestions > 0) {
      const acceptance_rate = (metrics.total_accepted / total_suggestions) * 100;
      score += Math.min(20, acceptance_rate / 5);
    }

    return Math.min(100, score);
  }

  private calculateEngagementScore(metrics: any): number {
    let score = 0;

    // Daily usage (0-40 points)
    const usage_score = Math.min(40, (metrics.days_active_last_30 / 30) * 40);
    score += usage_score;

    // Interaction intensity (0-30 points)
    const interaction_score = Math.min(30, metrics.average_daily_interactions * 2);
    score += interaction_score;

    // Feature exploration (0-20 points)
    const feature_score = Math.min(20, metrics.features_used_count * 2);
    score += feature_score;

    // Community contribution (0-10 points)
    const community_score = Math.min(10, (metrics.peer_help + metrics.best_practices) * 2);
    score += community_score;

    return Math.min(100, score);
  }

  private determineChampionStatus(metrics: any): string {
    const champion_score = this.calculateChampionScore(metrics);

    if (champion_score >= 80) return 'super_champion';
    if (champion_score >= 60) return 'champion';
    if (champion_score >= 40) return 'advocate';
    return 'user';
  }

  private calculateChampionScore(metrics: any): number {
    let score = 0;

    // Proficiency (0-40 points)
    const proficiency_score = this.calculateProficiencyScore(metrics);
    score += (proficiency_score / 100) * 40;

    // Peer help (0-30 points)
    score += Math.min(30, metrics.peer_help * 3);

    // Best practices shared (0-30 points)
    score += Math.min(30, metrics.best_practices * 5);

    return Math.min(100, score);
  }

  private isUserAtRisk(metrics: any): boolean {
    // User is at risk if:
    // - Less than 5 days active in last 30 days
    // - Very low interactions
    // - Low acceptance rate

    if (metrics.days_active_last_30 < 5) return true;
    if (metrics.total_interactions < 20) return true;

    const total_suggestions = metrics.total_accepted + metrics.total_rejected;
    if (total_suggestions > 10) {
      const acceptance_rate = (metrics.total_accepted / total_suggestions) * 100;
      if (acceptance_rate < 30) return true;
    }

    return false;
  }

  private async getOrganizationAdoptionRate(organization_id: string): Promise<number> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN days_active_last_30 > 0 THEN 1 END) as active
      FROM user_adoption
      WHERE organization_id = $1
    `;

    const result = await this.db.query(query, [organization_id]);
    const { total, active } = result.rows[0];

    return total > 0 ? (active / total) * 100 : 0;
  }

  private async identifyLaggingDepartments(organization_id: string): Promise<any[]> {
    const query = `
      SELECT department, adoption_rate
      FROM department_adoption
      WHERE organization_id = $1
        AND adoption_rate < 60
      ORDER BY adoption_rate ASC
    `;

    const result = await this.db.query(query, [organization_id]);
    return result.rows;
  }

  private async getAtRiskUserCount(organization_id: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM user_adoption
      WHERE organization_id = $1 AND at_risk = true
    `;

    const result = await this.db.query(query, [organization_id]);
    return parseInt(result.rows[0].count);
  }

  private async identifyUnderutilizedFeatures(organization_id: string): Promise<any[]> {
    const query = `
      SELECT fc.feature_name, AVG(fu.adoption_rate) as avg_adoption_rate
      FROM feature_catalog fc
      LEFT JOIN feature_usage fu ON fc.feature_id = fu.feature_id
        AND fu.organization_id = $1
      GROUP BY fc.feature_id, fc.feature_name
      HAVING AVG(fu.adoption_rate) < 30 OR AVG(fu.adoption_rate) IS NULL
      ORDER BY avg_adoption_rate ASC NULLS FIRST
      LIMIT 5
    `;

    const result = await this.db.query(query, [organization_id]);
    return result.rows;
  }

  private async identifyPotentialChampions(organization_id: string): Promise<any[]> {
    const query = `
      SELECT user_id, champion_score
      FROM user_adoption
      WHERE organization_id = $1
        AND champion_status = 'advocate'
        AND champion_score >= 50
      ORDER BY champion_score DESC
      LIMIT 10
    `;

    const result = await this.db.query(query, [organization_id]);
    return result.rows;
  }
}
