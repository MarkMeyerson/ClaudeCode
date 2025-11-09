/**
 * Finance Tracker Agent Prompts for Claude API
 */

export const SYSTEM_PROMPT = `You are the Finance Tracker Agent for SherpaTech.AI.

Your role is to:
- Monitor financial health daily
- Track revenue from Stripe
- Analyze profitability trends
- Forecast cash flow
- Provide actionable financial insights
- Alert on financial risks like low cash or delayed payments
- Recommend pricing optimizations

You are data-driven, precise, and proactive. You surface problems before they become critical.

Your outputs must be:
- ACCURATE: Verified against real Stripe data
- ACTIONABLE: Specific recommendations, not vague advice
- TIMELY: Daily updates and weekly deep dives
- CLEAR: Financial insights for a non-CFO audience

Always structure your responses as JSON when requested.`;

/**
 * Prompt for financial analysis
 */
export function getFinancialAnalysisPrompt(data: Record<string, any>): string {
  return `Analyze the following financial data and provide insights:

${JSON.stringify(data, null, 2)}

Provide a comprehensive financial analysis with:

1. Key Insights: What are the most important findings from this data?
2. Trends: What patterns do you observe in revenue, expenses, and profitability?
3. Risks: What financial risks or concerns should be addressed?
4. Recommendations: What specific actions should be taken?

Format your response as JSON with this structure:
{
  "insights": ["insight 1", "insight 2", ...],
  "trends": ["trend 1", "trend 2", ...],
  "risks": ["risk 1", "risk 2", ...],
  "recommendations": [
    {
      "action": "specific action to take",
      "rationale": "why this action is recommended",
      "priority": "high|medium|low",
      "expected_impact": "description of expected impact"
    }
  ]
}`;
}

/**
 * Prompt for cash flow forecasting
 */
export function getCashFlowForecastPrompt(
  historicalData: Record<string, any>,
  currentBalance: number
): string {
  return `Generate a cash flow forecast based on this historical financial data:

Current Balance: $${currentBalance.toLocaleString()}

Historical Data:
${JSON.stringify(historicalData, null, 2)}

Provide a 30/60/90-day cash flow forecast.

Consider:
- Historical revenue trends
- Seasonal patterns
- Known upcoming expenses
- Growth trajectory
- Conservative vs optimistic scenarios

Format your response as JSON:
{
  "forecast_30d": number,
  "forecast_60d": number,
  "forecast_90d": number,
  "confidence_level": "high|medium|low",
  "assumptions": ["assumption 1", "assumption 2", ...],
  "scenarios": {
    "conservative": { "30d": number, "60d": number, "90d": number },
    "expected": { "30d": number, "60d": number, "90d": number },
    "optimistic": { "30d": number, "60d": number, "90d": number }
  },
  "risks": ["risk 1", "risk 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;
}

/**
 * Prompt for pricing recommendations
 */
export function getPricingRecommendationPrompt(
  revenueData: Record<string, any>,
  customerData: Record<string, any>
): string {
  return `Analyze pricing strategy based on this data:

Revenue Data:
${JSON.stringify(revenueData, null, 2)}

Customer Data:
${JSON.stringify(customerData, null, 2)}

Provide pricing recommendations considering:
- Current pricing effectiveness
- Customer willingness to pay (inferred from retention/churn)
- Revenue optimization opportunities
- Competitive positioning
- Value-based pricing strategies

Format your response as JSON:
{
  "recommendations": [
    {
      "product_or_tier": "name",
      "current_price": number,
      "recommended_price": number,
      "potential_revenue_impact": number,
      "rationale": "explanation",
      "confidence": "high|medium|low",
      "implementation_notes": "how to implement"
    }
  ],
  "overall_strategy": "description of recommended pricing strategy",
  "risks": ["risk 1", "risk 2", ...],
  "expected_outcomes": ["outcome 1", "outcome 2", ...]
}`;
}

/**
 * Prompt for customer profitability analysis
 */
export function getCustomerProfitabilityPrompt(customers: Record<string, any>[]): string {
  return `Analyze customer profitability based on this data:

${JSON.stringify(customers, null, 2)}

For each customer segment, provide:
- Lifetime value analysis
- Profitability scoring
- Revenue contribution
- Retention likelihood
- Growth potential

Also identify:
- High-value customers to nurture
- At-risk customers to save
- Low-value customers to optimize or sunset

Format your response as JSON:
{
  "segments": {
    "high_value": {
      "count": number,
      "total_revenue": number,
      "avg_ltv": number,
      "characteristics": ["characteristic 1", ...]
    },
    "medium_value": { ... },
    "low_value": { ... }
  },
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": [
    {
      "segment": "high_value|medium_value|low_value",
      "action": "specific action",
      "expected_impact": "description"
    }
  ]
}`;
}

/**
 * Prompt for tax obligation calculation
 */
export function getTaxObligationPrompt(
  quarterlyRevenue: number,
  quarterlyExpenses: number,
  taxRates: { federal: number; state: number }
): string {
  return `Calculate quarterly tax obligation:

Quarterly Revenue: $${quarterlyRevenue.toLocaleString()}
Quarterly Expenses: $${quarterlyExpenses.toLocaleString()}
Federal Tax Rate: ${(taxRates.federal * 100).toFixed(1)}%
State Tax Rate: ${(taxRates.state * 100).toFixed(1)}%

Calculate:
1. Taxable income (revenue - expenses)
2. Federal tax obligation
3. State tax obligation
4. Total estimated tax due
5. Recommended quarterly payment amount (considering safe harbor rules)

Format your response as JSON:
{
  "taxable_income": number,
  "federal_tax": number,
  "state_tax": number,
  "total_tax_due": number,
  "recommended_payment": number,
  "payment_notes": "explanation of calculation and recommendations"
}`;
}
