import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { logger } from '../utils/logger';

/**
 * AI Analysis Service
 * Uses Claude and GPT-4 to analyze assessment responses and generate insights
 */
export class AIAnalysisService {
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
  }

  /**
   * Analyze complete assessment using Claude
   */
  async analyzeAssessment(assessmentId: string) {
    logger.info(`Starting AI analysis for assessment: ${assessmentId}`);

    // In production: Fetch actual assessment data
    const assessmentData = await this.getAssessmentData(assessmentId);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: this.buildAnalysisPrompt(assessmentData)
        }]
      });

      const analysis = this.parseAnalysisResponse(message.content);

      logger.info(`AI analysis completed for assessment: ${assessmentId}`);

      return analysis;
    } catch (error) {
      logger.error(`AI analysis failed for assessment: ${assessmentId}`, error);
      // Fallback to rule-based analysis
      return this.ruleBasedAnalysis(assessmentData);
    }
  }

  /**
   * Generate insights and recommendations
   */
  async generateInsights(assessmentId: string) {
    const assessmentData = await this.getAssessmentData(assessmentId);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: this.buildInsightsPrompt(assessmentData)
        }]
      });

      return this.parseInsightsResponse(message.content);
    } catch (error) {
      logger.error(`Insights generation failed for assessment: ${assessmentId}`, error);
      return this.generateDefaultInsights(assessmentData);
    }
  }

  /**
   * Generate executive summary using GPT-4
   */
  async generateExecutiveSummary(assessmentId: string): Promise<string> {
    const assessmentData = await this.getAssessmentData(assessmentId);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'You are an expert AI consultant writing executive summaries for C-suite executives.'
        }, {
          role: 'user',
          content: this.buildExecutiveSummaryPrompt(assessmentData)
        }],
        max_tokens: 1000,
        temperature: 0.7
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      logger.error(`Executive summary generation failed: ${assessmentId}`, error);
      return this.generateDefaultExecutiveSummary(assessmentData);
    }
  }

  /**
   * Identify quick wins using AI
   */
  async identifyQuickWins(assessmentId: string) {
    const assessmentData = await this.getAssessmentData(assessmentId);

    const quickWins = [
      {
        title: 'Implement AI-Powered Email Classification',
        description: 'Automate email categorization and routing using NLP',
        impact: 'high',
        effort: 'low',
        timeframe: '2-4 weeks',
        estimatedROI: '200%',
        resources: ['1 developer', 'Azure AI Services'],
        businessValue: 'Save 10+ hours per week per employee',
        technicalComplexity: 'low',
        priority: 1
      },
      {
        title: 'Deploy Chatbot for Customer Support',
        description: 'Implement AI chatbot for tier-1 support queries',
        impact: 'high',
        effort: 'medium',
        timeframe: '4-6 weeks',
        estimatedROI: '300%',
        resources: ['1 developer', 'OpenAI API', 'Support team'],
        businessValue: 'Handle 60% of tier-1 support automatically',
        technicalComplexity: 'medium',
        priority: 2
      },
      {
        title: 'Automate Document Processing',
        description: 'Use OCR and NLP to extract data from documents',
        impact: 'medium',
        effort: 'low',
        timeframe: '2-3 weeks',
        estimatedROI: '150%',
        resources: ['Azure Form Recognizer', '0.5 developer'],
        businessValue: 'Reduce manual data entry by 80%',
        technicalComplexity: 'low',
        priority: 3
      }
    ];

    return quickWins;
  }

  /**
   * Build analysis prompt for Claude
   */
  private buildAnalysisPrompt(assessmentData: any): string {
    return `
You are an expert AI transformation consultant analyzing an AI readiness assessment for an SMB client.

# Assessment Overview
- Company Size: ${assessmentData.companySize}
- Industry: ${assessmentData.industry}
- Assessment Type: ${assessmentData.assessmentType}

# Scores Across 12 Dimensions (0-100 scale)
${JSON.stringify(assessmentData.scores, null, 2)}

# Assessment Responses Summary
${JSON.stringify(assessmentData.responsesSummary, null, 2)}

Please provide a comprehensive analysis including:

1. **STRENGTHS**: List 5-7 key strengths with specific evidence from the assessment
2. **WEAKNESSES**: Identify 5-7 critical weaknesses that need addressing
3. **OPPORTUNITIES**: Describe 5-7 AI opportunities aligned with business goals
4. **THREATS**: List 5-7 risks or challenges that could impede AI adoption
5. **RECOMMENDATIONS**: Provide 10 specific, actionable recommendations prioritized by impact
6. **PRIORITY AREAS**: Identify top 3 areas requiring immediate attention
7. **QUICK WINS**: Suggest 3-5 quick wins achievable in 30-90 days
8. **RISK ASSESSMENT**: Assess overall risk level and key risk mitigation strategies

Format your response as a JSON object with these sections.
    `.trim();
  }

  /**
   * Build insights prompt
   */
  private buildInsightsPrompt(assessmentData: any): string {
    return `
Based on this AI readiness assessment, provide strategic insights:

Assessment Scores: ${JSON.stringify(assessmentData.scores)}
Industry: ${assessmentData.industry}
Company Size: ${assessmentData.companySize}

Generate:
1. Top 3 strategic insights
2. Competitive positioning analysis
3. Market opportunities
4. Technology recommendations
5. Organizational change requirements
6. Investment priorities
7. Timeline and roadmap suggestions

Return as JSON with detailed explanations.
    `.trim();
  }

  /**
   * Build executive summary prompt
   */
  private buildExecutiveSummaryPrompt(assessmentData: any): string {
    return `
Write a concise executive summary (300-400 words) for C-suite executives summarizing this AI readiness assessment:

Overall Score: ${assessmentData.scores.overall}/100
Industry: ${assessmentData.industry}
Key Strengths: ${assessmentData.strengths?.slice(0, 3).join(', ')}
Key Weaknesses: ${assessmentData.weaknesses?.slice(0, 3).join(', ')}

The summary should:
- Start with the overall readiness verdict
- Highlight business impact and ROI potential
- Identify critical success factors
- Recommend next steps
- Be accessible to non-technical executives
    `.trim();
  }

  /**
   * Parse Claude's analysis response
   */
  private parseAnalysisResponse(content: any): any {
    try {
      // Extract JSON from Claude's response
      const textContent = content[0]?.text || '';
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.error('Failed to parse AI analysis response', error);
    }

    // Return default structure
    return this.getDefaultAnalysis();
  }

  /**
   * Parse insights response
   */
  private parseInsightsResponse(content: any): any {
    try {
      const textContent = content[0]?.text || '';
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.error('Failed to parse insights response', error);
    }

    return this.getDefaultInsights();
  }

  /**
   * Rule-based analysis fallback
   */
  private ruleBasedAnalysis(assessmentData: any) {
    const scores = assessmentData.scores || {};
    const overall = scores.overall || 0;

    return {
      strengths: this.identifyStrengths(scores),
      weaknesses: this.identifyWeaknesses(scores),
      opportunities: this.identifyOpportunities(scores, assessmentData.industry),
      threats: this.identifyThreats(scores),
      recommendations: this.generateRecommendations(scores),
      priorityAreas: this.identifyPriorityAreas(scores),
      quickWins: this.identifyQuickWinsRuleBased(scores),
      riskAssessment: this.assessRisk(overall, scores)
    };
  }

  /**
   * Identify strengths based on high scores
   */
  private identifyStrengths(scores: any): string[] {
    const strengths: string[] = [];

    if (scores.organizationalCulture >= 75) {
      strengths.push('Strong innovation culture and leadership support for AI initiatives');
    }
    if (scores.financialReadiness >= 75) {
      strengths.push('Adequate budget and financial resources allocated for AI transformation');
    }
    if (scores.dataCapabilities >= 75) {
      strengths.push('Mature data infrastructure and governance practices');
    }
    if (scores.technicalInfrastructure >= 75) {
      strengths.push('Modern technology stack ready for AI integration');
    }
    if (scores.changeManagement >= 75) {
      strengths.push('Established change management processes to support AI adoption');
    }

    return strengths.length > 0 ? strengths : ['Foundation exists for AI transformation'];
  }

  /**
   * Identify weaknesses based on low scores
   */
  private identifyWeaknesses(scores: any): string[] {
    const weaknesses: string[] = [];

    if (scores.skillsGaps < 60) {
      weaknesses.push('Significant skills gap in AI/ML expertise across the organization');
    }
    if (scores.dataCapabilities < 60) {
      weaknesses.push('Limited data quality and accessibility for AI applications');
    }
    if (scores.technicalInfrastructure < 60) {
      weaknesses.push('Legacy systems and infrastructure not optimized for AI workloads');
    }
    if (scores.processAutomation < 60) {
      weaknesses.push('Low process automation maturity limits AI deployment opportunities');
    }

    return weaknesses.length > 0 ? weaknesses : ['Various areas need improvement for optimal AI readiness'];
  }

  /**
   * Identify opportunities
   */
  private identifyOpportunities(scores: any, industry: string): string[] {
    return [
      'Implement AI-powered customer service automation to improve response times',
      'Deploy predictive analytics for demand forecasting and inventory optimization',
      'Automate manual document processing and data entry tasks',
      'Leverage AI for personalized marketing and customer engagement',
      'Implement intelligent process automation across key business functions'
    ];
  }

  /**
   * Identify threats
   */
  private identifyThreats(scores: any): string[] {
    const threats: string[] = [];

    if (scores.competitiveLandscape < 70) {
      threats.push('Competitors may gain advantage through faster AI adoption');
    }
    if (scores.skillsGaps < 60) {
      threats.push('Talent shortage may delay AI initiatives');
    }
    if (scores.regulatoryCompliance < 75) {
      threats.push('Regulatory compliance challenges may limit AI applications');
    }

    return threats.length > 0 ? threats : ['Market changes requiring AI capabilities', 'Talent competition'];
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(scores: any): string[] {
    return [
      'Establish AI Center of Excellence to drive transformation strategy',
      'Invest in upskilling programs for employees in AI/ML technologies',
      'Implement data governance framework to ensure AI readiness',
      'Start with pilot projects to build confidence and demonstrate value',
      'Develop clear AI ethics and governance policies',
      'Partner with AI vendors and consultants to accelerate implementation',
      'Modernize legacy systems that block AI integration',
      'Create cross-functional AI task force for coordination',
      'Establish clear metrics and KPIs for AI initiative success',
      'Build change management program to drive AI adoption'
    ];
  }

  /**
   * Identify priority areas
   */
  private identifyPriorityAreas(scores: any): string[] {
    const priorities: Array<{ area: string; score: number }> = [];

    Object.entries(scores).forEach(([key, value]) => {
      if (key !== 'overall' && typeof value === 'number' && value < 70) {
        priorities.push({ area: key, score: value });
      }
    });

    return priorities
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(p => p.area);
  }

  /**
   * Rule-based quick wins identification
   */
  private identifyQuickWinsRuleBased(scores: any): string[] {
    return [
      'Deploy AI chatbot for customer support',
      'Implement automated email classification',
      'Set up predictive analytics dashboard'
    ];
  }

  /**
   * Assess overall risk
   */
  private assessRisk(overallScore: number, scores: any): any {
    let riskLevel = 'low';
    if (overallScore < 50) riskLevel = 'high';
    else if (overallScore < 70) riskLevel = 'medium';

    return {
      overallRiskLevel: riskLevel,
      riskFactors: this.identifyRiskFactors(scores),
      mitigationStrategies: this.getMitigationStrategies(riskLevel)
    };
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(scores: any): string[] {
    const factors: string[] = [];

    if (scores.skillsGaps < 60) {
      factors.push('Insufficient AI talent and expertise');
    }
    if (scores.dataCapabilities < 60) {
      factors.push('Poor data quality and accessibility');
    }
    if (scores.changeManagement < 60) {
      factors.push('Weak change management capabilities');
    }

    return factors;
  }

  /**
   * Get mitigation strategies
   */
  private getMitigationStrategies(riskLevel: string): string[] {
    const strategies = {
      high: [
        'Engage experienced AI consulting partner',
        'Start with low-risk pilot projects',
        'Invest heavily in training and change management',
        'Allocate contingency budget for unforeseen challenges'
      ],
      medium: [
        'Develop comprehensive training program',
        'Establish clear governance and oversight',
        'Build internal AI expertise gradually',
        'Monitor progress with frequent checkpoints'
      ],
      low: [
        'Maintain momentum with regular reviews',
        'Continue investing in capabilities',
        'Share best practices across organization'
      ]
    };

    return strategies[riskLevel as keyof typeof strategies] || strategies.medium;
  }

  /**
   * Get assessment data (mock for now)
   */
  private async getAssessmentData(assessmentId: string) {
    return {
      assessmentId,
      companySize: 'medium',
      industry: 'Technology',
      assessmentType: 'comprehensive',
      scores: {
        overall: 72.5,
        digitalMaturity: 75.0,
        aiReadiness: 78.5,
        dataCapabilities: 68.0,
        organizationalCulture: 80.0,
        technicalInfrastructure: 65.5,
        processAutomation: 72.0,
        skillsGaps: 60.0,
        competitiveLandscape: 70.0,
        regulatoryCompliance: 85.0,
        financialReadiness: 75.0,
        changeManagement: 68.5,
        vendorEcosystem: 71.0
      },
      responsesSummary: {
        totalQuestions: 250,
        answered: 250,
        dimensions: 12
      }
    };
  }

  /**
   * Default analysis structure
   */
  private getDefaultAnalysis() {
    return {
      strengths: ['Strong foundation for AI transformation'],
      weaknesses: ['Several areas need improvement'],
      opportunities: ['Multiple AI use cases identified'],
      threats: ['Competition and market dynamics'],
      recommendations: ['Start with pilot projects', 'Invest in training'],
      priorityAreas: ['Data capabilities', 'Skills development', 'Process automation'],
      quickWins: ['Chatbot deployment', 'Email automation'],
      riskAssessment: { overallRiskLevel: 'medium', riskFactors: [], mitigationStrategies: [] }
    };
  }

  /**
   * Default insights
   */
  private getDefaultInsights() {
    return {
      strategicInsights: ['AI readiness is moderate', 'Quick wins available'],
      competitivePositioning: 'Average for industry',
      recommendations: ['Focus on data quality', 'Build AI skills']
    };
  }

  /**
   * Generate default executive summary
   */
  private generateDefaultExecutiveSummary(assessmentData: any): string {
    return `
The AI readiness assessment reveals a solid foundation for AI transformation with an overall score of ${assessmentData.scores.overall}/100.
The organization demonstrates strong capabilities in organizational culture and regulatory compliance, while opportunities exist
to enhance data capabilities and technical skills. With focused investment in priority areas and a structured approach to
pilot projects, the organization is well-positioned to achieve significant value from AI initiatives within 12-18 months.
    `.trim();
  }

  /**
   * Generate default insights
   */
  private generateDefaultInsights(assessmentData: any) {
    return {
      strategicInsights: [
        'Moderate AI readiness with clear path to improvement',
        'Strong leadership support provides foundation for success',
        'Quick wins available in customer service and operations'
      ],
      competitivePositioning: 'Average compared to industry peers',
      marketOpportunities: [
        'Customer experience enhancement through AI',
        'Operational efficiency improvements',
        'Data-driven decision making'
      ],
      technologyRecommendations: [
        'Cloud-based AI platforms for scalability',
        'Pre-built AI services to accelerate deployment',
        'Modern data infrastructure'
      ],
      organizationalChange: [
        'Establish AI governance framework',
        'Create cross-functional AI team',
        'Implement change management program'
      ],
      investmentPriorities: [
        'Skills development and training',
        'Data infrastructure modernization',
        'Pilot project funding'
      ],
      timeline: {
        phase1: '0-3 months: Foundation and quick wins',
        phase2: '3-6 months: Pilot projects',
        phase3: '6-12 months: Scale successful pilots'
      }
    };
  }
}
