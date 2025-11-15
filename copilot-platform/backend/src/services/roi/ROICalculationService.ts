// ============================================================================
// ROI CALCULATION SERVICE
// Microsoft Copilot Onboarding & ROI Platform
// ============================================================================

import { Pool } from 'pg';
import {
  ROITracking,
  ROIScenario,
  ROICalculationRequest,
  ROICalculationResponse,
  ProductivityMetrics
} from '../../types';

export class ROICalculationService {
  private db: Pool;

  constructor(database: Pool) {
    this.db = database;
  }

  /**
   * Calculate ROI for a given period
   */
  async calculateROI(request: ROICalculationRequest): Promise<ROICalculationResponse> {
    const {
      organization_id,
      period_start,
      period_end,
      cost_data,
      productivity_data
    } = request;

    // Calculate total costs
    const total_costs =
      cost_data.license_costs +
      cost_data.implementation_costs +
      cost_data.training_costs +
      cost_data.support_costs +
      cost_data.infrastructure_costs;

    // Calculate benefits
    const time_savings_value =
      productivity_data.hours_saved * productivity_data.average_hourly_rate;

    const quality_value = productivity_data.quality_improvements || 0;
    const innovation_value = productivity_data.innovation_value || 0;

    const total_benefits =
      time_savings_value + quality_value + innovation_value;

    // Calculate ROI
    const net_benefit = total_benefits - total_costs;
    const roi_percentage =
      total_costs > 0 ? (net_benefit / total_costs) * 100 : 0;

    // Calculate payback period
    const monthly_benefit = total_benefits / this.getMonthsBetween(period_start, period_end);
    const payback_period_months =
      monthly_benefit > 0 ? total_costs / monthly_benefit : Infinity;

    // Calculate break-even date
    const break_even_date = this.calculateBreakEvenDate(
      period_start,
      payback_period_months
    );

    // Calculate confidence score based on data quality
    const confidence_score = this.calculateConfidenceScore({
      has_actual_cost_data: true,
      has_actual_productivity_data: productivity_data.hours_saved > 0,
      sample_size: 100, // This should come from actual data
      measurement_period_months: this.getMonthsBetween(period_start, period_end)
    });

    return {
      roi_percentage: Number(roi_percentage.toFixed(2)),
      total_costs: Number(total_costs.toFixed(2)),
      total_benefits: Number(total_benefits.toFixed(2)),
      net_benefit: Number(net_benefit.toFixed(2)),
      payback_period_months: Number(payback_period_months.toFixed(1)),
      break_even_date,
      confidence_score: Number(confidence_score.toFixed(2))
    };
  }

  /**
   * Track ROI for a specific organization and period
   */
  async trackROI(
    organization_id: string,
    measurement_period: 'monthly' | 'quarterly' | 'annual',
    period_start: Date,
    period_end: Date
  ): Promise<ROITracking> {
    // Fetch cost data
    const costData = await this.getCostData(organization_id, period_start, period_end);

    // Fetch productivity data
    const productivityData = await this.getProductivityData(
      organization_id,
      period_start,
      period_end
    );

    // Fetch adoption metrics
    const adoptionData = await this.getAdoptionMetrics(organization_id);

    // Calculate values
    const productivity_value = productivityData.total_hours_saved * 150; // Avg hourly rate
    const time_savings_value = productivity_value;
    const quality_improvement_value = productivityData.quality_improvements * 1000;
    const innovation_value = productivityData.innovation_count * 5000;

    const total_value_generated =
      productivity_value +
      time_savings_value +
      quality_improvement_value +
      innovation_value;

    const total_cost = costData.total_cost;

    // Calculate ROI
    const net_roi = total_value_generated - total_cost;
    const roi_percentage = total_cost > 0 ? (net_roi / total_cost) * 100 : 0;

    // Check if payback achieved
    const payback_achieved = net_roi > 0;

    // Get benchmarks for comparison
    const benchmarks = await this.getBenchmarkData(organization_id);

    // Insert or update ROI tracking record
    const query = `
      INSERT INTO roi_tracking (
        organization_id,
        measurement_period,
        period_start,
        period_end,
        total_license_cost,
        implementation_cost,
        training_cost,
        support_cost,
        infrastructure_cost,
        hours_saved,
        tasks_automated,
        documents_created,
        meetings_summarized,
        emails_drafted,
        code_generated_lines,
        presentations_created,
        data_analyses_performed,
        productivity_value,
        time_savings_value,
        quality_improvement_value,
        innovation_value,
        net_roi,
        roi_percentage,
        payback_achieved,
        active_users,
        total_licensed_users,
        adoption_rate,
        utilization_rate,
        vs_baseline_improvement,
        vs_industry_benchmark
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29
      )
      ON CONFLICT (organization_id, period_start, period_end)
      DO UPDATE SET
        total_license_cost = EXCLUDED.total_license_cost,
        implementation_cost = EXCLUDED.implementation_cost,
        training_cost = EXCLUDED.training_cost,
        support_cost = EXCLUDED.support_cost,
        infrastructure_cost = EXCLUDED.infrastructure_cost,
        hours_saved = EXCLUDED.hours_saved,
        productivity_value = EXCLUDED.productivity_value,
        time_savings_value = EXCLUDED.time_savings_value,
        quality_improvement_value = EXCLUDED.quality_improvement_value,
        innovation_value = EXCLUDED.innovation_value,
        net_roi = EXCLUDED.net_roi,
        roi_percentage = EXCLUDED.roi_percentage,
        payback_achieved = EXCLUDED.payback_achieved,
        adoption_rate = EXCLUDED.adoption_rate,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      organization_id,
      measurement_period,
      period_start,
      period_end,
      costData.license_cost,
      costData.implementation_cost,
      costData.training_cost,
      costData.support_cost,
      costData.infrastructure_cost,
      productivityData.total_hours_saved,
      productivityData.tasks_automated,
      productivityData.documents_created,
      productivityData.meetings_summarized,
      productivityData.emails_drafted,
      productivityData.code_lines_generated,
      productivityData.presentations_created,
      productivityData.data_analyses,
      productivity_value,
      time_savings_value,
      quality_improvement_value,
      innovation_value,
      net_roi,
      roi_percentage,
      payback_achieved,
      adoptionData.active_users,
      adoptionData.total_licensed_users,
      adoptionData.adoption_rate,
      adoptionData.utilization_rate,
      benchmarks.vs_baseline,
      benchmarks.vs_industry
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Generate ROI scenario projection
   */
  async generateScenario(
    organization_id: string,
    scenario_type: 'conservative' | 'moderate' | 'optimistic',
    custom_assumptions?: any
  ): Promise<ROIScenario> {
    // Get organization details
    const orgQuery = 'SELECT * FROM organizations WHERE organization_id = $1';
    const orgResult = await this.db.query(orgQuery, [organization_id]);
    const org = orgResult.rows[0];

    // Define scenario assumptions
    const assumptions = this.getScenarioAssumptions(scenario_type, org, custom_assumptions);

    // Calculate 3-year projections
    const projections = this.calculateThreeYearProjections(org, assumptions);

    // Insert scenario
    const query = `
      INSERT INTO roi_scenarios (
        organization_id,
        scenario_name,
        scenario_type,
        scenario_description,
        adoption_rate_assumption,
        productivity_gain_assumption,
        time_to_proficiency_weeks,
        average_hourly_rate,
        discount_rate,
        year1_costs,
        year1_benefits,
        year1_net_benefit,
        year1_roi,
        year2_costs,
        year2_benefits,
        year2_net_benefit,
        year2_roi,
        year3_costs,
        year3_benefits,
        year3_net_benefit,
        year3_roi,
        breakeven_month,
        total_3year_costs,
        total_3year_benefits,
        total_3year_net_benefit,
        total_3year_roi,
        npv,
        irr
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28
      )
      RETURNING *
    `;

    const values = [
      organization_id,
      `${scenario_type.charAt(0).toUpperCase() + scenario_type.slice(1)} Scenario`,
      scenario_type,
      this.getScenarioDescription(scenario_type),
      assumptions.adoption_rate,
      assumptions.productivity_gain,
      assumptions.time_to_proficiency_weeks,
      assumptions.average_hourly_rate,
      assumptions.discount_rate,
      projections.year1.costs,
      projections.year1.benefits,
      projections.year1.net_benefit,
      projections.year1.roi,
      projections.year2.costs,
      projections.year2.benefits,
      projections.year2.net_benefit,
      projections.year2.roi,
      projections.year3.costs,
      projections.year3.benefits,
      projections.year3.net_benefit,
      projections.year3.roi,
      projections.breakeven_month,
      projections.total_costs,
      projections.total_benefits,
      projections.total_net_benefit,
      projections.total_roi,
      projections.npv,
      projections.irr
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  /**
   * Compare multiple ROI scenarios
   */
  async compareScenarios(scenario_ids: string[]): Promise<any> {
    const query = `
      SELECT * FROM roi_scenarios
      WHERE scenario_id = ANY($1)
      ORDER BY total_3year_roi DESC
    `;

    const result = await this.db.query(query, [scenario_ids]);
    const scenarios = result.rows;

    return {
      scenarios,
      comparison: {
        best_case: scenarios[0],
        worst_case: scenarios[scenarios.length - 1],
        roi_range: {
          min: scenarios[scenarios.length - 1].total_3year_roi,
          max: scenarios[0].total_3year_roi,
          spread: scenarios[0].total_3year_roi - scenarios[scenarios.length - 1].total_3year_roi
        },
        breakeven_range: {
          fastest: Math.min(...scenarios.map(s => s.breakeven_month)),
          slowest: Math.max(...scenarios.map(s => s.breakeven_month))
        },
        npv_range: {
          min: Math.min(...scenarios.map(s => s.npv)),
          max: Math.max(...scenarios.map(s => s.npv))
        }
      }
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getCostData(
    organization_id: string,
    period_start: Date,
    period_end: Date
  ): Promise<any> {
    const query = `
      SELECT
        SUM(CASE WHEN cost_category = 'license' THEN cost_amount ELSE 0 END) as license_cost,
        SUM(CASE WHEN cost_category = 'implementation' THEN cost_amount ELSE 0 END) as implementation_cost,
        SUM(CASE WHEN cost_category = 'training' THEN cost_amount ELSE 0 END) as training_cost,
        SUM(CASE WHEN cost_category = 'support' THEN cost_amount ELSE 0 END) as support_cost,
        SUM(CASE WHEN cost_category = 'infrastructure' THEN cost_amount ELSE 0 END) as infrastructure_cost,
        SUM(cost_amount) as total_cost
      FROM cost_tracking
      WHERE organization_id = $1
        AND cost_date BETWEEN $2 AND $3
    `;

    const result = await this.db.query(query, [organization_id, period_start, period_end]);
    return result.rows[0] || {
      license_cost: 0,
      implementation_cost: 0,
      training_cost: 0,
      support_cost: 0,
      infrastructure_cost: 0,
      total_cost: 0
    };
  }

  private async getProductivityData(
    organization_id: string,
    period_start: Date,
    period_end: Date
  ): Promise<any> {
    const query = `
      SELECT
        SUM(hours_saved) as total_hours_saved,
        SUM(tasks_completed) as tasks_automated,
        SUM(word_documents_enhanced + excel_analyses_accelerated +
            powerpoint_presentations_created) as documents_created,
        SUM(teams_meetings_summarized) as meetings_summarized,
        SUM(outlook_emails_drafted) as emails_drafted,
        SUM(github_code_lines_generated) as code_lines_generated,
        SUM(powerpoint_presentations_created) as presentations_created,
        SUM(excel_analyses_accelerated) as data_analyses,
        AVG(error_reduction_rate) as quality_improvements,
        SUM(new_insights_generated + process_improvements_identified +
            innovative_solutions_created) as innovation_count
      FROM productivity_metrics
      WHERE organization_id = $1
        AND date BETWEEN $2 AND $3
    `;

    const result = await this.db.query(query, [organization_id, period_start, period_end]);
    return result.rows[0] || {
      total_hours_saved: 0,
      tasks_automated: 0,
      documents_created: 0,
      meetings_summarized: 0,
      emails_drafted: 0,
      code_lines_generated: 0,
      presentations_created: 0,
      data_analyses: 0,
      quality_improvements: 0,
      innovation_count: 0
    };
  }

  private async getAdoptionMetrics(organization_id: string): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_licensed_users,
        COUNT(CASE WHEN days_active_last_30 > 0 THEN 1 END) as active_users,
        ROUND(AVG(engagement_score)::numeric, 2) as avg_engagement,
        ROUND(
          (COUNT(CASE WHEN days_active_last_30 > 0 THEN 1 END)::numeric / COUNT(*) * 100)::numeric,
          2
        ) as adoption_rate,
        ROUND(AVG(average_daily_interactions)::numeric, 2) as utilization_rate
      FROM user_adoption
      WHERE organization_id = $1
    `;

    const result = await this.db.query(query, [organization_id]);
    return result.rows[0] || {
      total_licensed_users: 0,
      active_users: 0,
      avg_engagement: 0,
      adoption_rate: 0,
      utilization_rate: 0
    };
  }

  private async getBenchmarkData(organization_id: string): Promise<any> {
    const orgQuery = 'SELECT industry, company_size FROM organizations WHERE organization_id = $1';
    const orgResult = await this.db.query(orgQuery, [organization_id]);
    const org = orgResult.rows[0];

    const benchmarkQuery = `
      SELECT
        average_roi,
        average_productivity_gain_pct
      FROM roi_benchmarks
      WHERE industry = $1 AND company_size = $2
      LIMIT 1
    `;

    const result = await this.db.query(benchmarkQuery, [org.industry, org.company_size]);
    const benchmark = result.rows[0];

    return {
      vs_baseline: 0, // Would calculate from baseline tracking
      vs_industry: benchmark ? benchmark.average_roi : 0
    };
  }

  private getScenarioAssumptions(
    scenario_type: string,
    org: any,
    custom?: any
  ): any {
    const baseAssumptions = {
      conservative: {
        adoption_rate: 60,
        productivity_gain: 10,
        time_to_proficiency_weeks: 12,
        average_hourly_rate: 150,
        discount_rate: 8
      },
      moderate: {
        adoption_rate: 80,
        productivity_gain: 20,
        time_to_proficiency_weeks: 8,
        average_hourly_rate: 150,
        discount_rate: 8
      },
      optimistic: {
        adoption_rate: 95,
        productivity_gain: 30,
        time_to_proficiency_weeks: 6,
        average_hourly_rate: 150,
        discount_rate: 8
      }
    };

    return custom || baseAssumptions[scenario_type as keyof typeof baseAssumptions];
  }

  private calculateThreeYearProjections(org: any, assumptions: any): any {
    const employee_count = org.employee_count || 100;
    const copilot_cost_per_user_annual = 360; // $30/month

    const results = {
      year1: this.calculateYearProjection(1, employee_count, assumptions, copilot_cost_per_user_annual),
      year2: this.calculateYearProjection(2, employee_count, assumptions, copilot_cost_per_user_annual),
      year3: this.calculateYearProjection(3, employee_count, assumptions, copilot_cost_per_user_annual),
      breakeven_month: 0,
      total_costs: 0,
      total_benefits: 0,
      total_net_benefit: 0,
      total_roi: 0,
      npv: 0,
      irr: 0
    };

    // Calculate totals
    results.total_costs = results.year1.costs + results.year2.costs + results.year3.costs;
    results.total_benefits = results.year1.benefits + results.year2.benefits + results.year3.benefits;
    results.total_net_benefit = results.total_benefits - results.total_costs;
    results.total_roi = (results.total_net_benefit / results.total_costs) * 100;

    // Calculate breakeven month
    let cumulative_benefit = 0;
    let cumulative_cost = 0;
    const monthly_benefit = results.total_benefits / 36;
    const monthly_cost = results.total_costs / 36;

    for (let month = 1; month <= 36; month++) {
      cumulative_benefit += monthly_benefit;
      cumulative_cost += monthly_cost;
      if (cumulative_benefit >= cumulative_cost) {
        results.breakeven_month = month;
        break;
      }
    }

    // Calculate NPV
    const discount_rate = assumptions.discount_rate / 100;
    results.npv =
      results.year1.net_benefit / Math.pow(1 + discount_rate, 1) +
      results.year2.net_benefit / Math.pow(1 + discount_rate, 2) +
      results.year3.net_benefit / Math.pow(1 + discount_rate, 3);

    // Simplified IRR calculation
    results.irr = ((results.total_net_benefit / results.total_costs) / 3) * 100;

    return results;
  }

  private calculateYearProjection(
    year: number,
    employee_count: number,
    assumptions: any,
    cost_per_user: number
  ): any {
    const adoption_rate = assumptions.adoption_rate / 100;
    const users_adopted = Math.floor(employee_count * adoption_rate);

    // Costs
    const license_costs = users_adopted * cost_per_user;
    const implementation_costs = year === 1 ? employee_count * 50 : 0;
    const training_costs = year === 1 ? users_adopted * 100 : users_adopted * 20;
    const support_costs = users_adopted * 50;

    const total_costs = license_costs + implementation_costs + training_costs + support_costs;

    // Benefits
    const productivity_gain_rate = assumptions.productivity_gain / 100;
    const hours_saved_per_user = 520 * productivity_gain_rate; // ~2 hours/week * 52 weeks * gain rate
    const total_hours_saved = users_adopted * hours_saved_per_user;
    const productivity_value = total_hours_saved * assumptions.average_hourly_rate;

    const quality_value = users_adopted * 1000 * productivity_gain_rate;
    const innovation_value = users_adopted * 500 * productivity_gain_rate;

    const total_benefits = productivity_value + quality_value + innovation_value;

    return {
      costs: total_costs,
      benefits: total_benefits,
      net_benefit: total_benefits - total_costs,
      roi: ((total_benefits - total_costs) / total_costs) * 100
    };
  }

  private getScenarioDescription(scenario_type: string): string {
    const descriptions = {
      conservative: 'Conservative scenario with cautious adoption and productivity assumptions',
      moderate: 'Moderate scenario with realistic adoption and productivity expectations',
      optimistic: 'Optimistic scenario with aggressive adoption and high productivity gains'
    };

    return descriptions[scenario_type as keyof typeof descriptions] || '';
  }

  private getMonthsBetween(start: Date, end: Date): number {
    const monthDiff =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return Math.max(1, monthDiff);
  }

  private calculateBreakEvenDate(start_date: Date, payback_months: number): Date {
    const break_even = new Date(start_date);
    break_even.setMonth(break_even.getMonth() + Math.ceil(payback_months));
    return break_even;
  }

  private calculateConfidenceScore(factors: any): number {
    let score = 0.5; // Base confidence

    if (factors.has_actual_cost_data) score += 0.2;
    if (factors.has_actual_productivity_data) score += 0.2;
    if (factors.sample_size > 50) score += 0.1;
    if (factors.measurement_period_months >= 3) score += 0.1;

    return Math.min(1.0, score);
  }
}
