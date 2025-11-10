/**
 * CEO Agent - Multi-Agent Orchestration System
 * Main orchestrator that coordinates all business agents
 * @module CEOAgent
 */

import {
  AgentResponse,
  AgentResults,
  AggregatedMetrics,
  Briefing,
  OrchestrationOptions,
  Task,
  PriorityContext,
  DetectedRisk,
  SystemHealth,
  AgentHealthCheck,
  HealthStatus,
} from './types';
import { getConfig, defaultStrategicGoals } from './config';
import { selectTopPriorities } from './algorithms/priority-calculator';
import { detectRisks } from './lib/risk-detector';
import { generateBriefing } from './lib/briefing-generator';
import { createNotionIntegration } from './integrations/notion';

/**
 * CEO Agent Class
 *
 * Orchestrates all business agents and generates daily briefings
 *
 * @example
 * ```typescript
 * const ceo = new CEOAgent();
 * const briefing = await ceo.getDailyBriefing();
 * console.log(briefing.markdown);
 * ```
 */
export class CEOAgent {
  private config = getConfig();
  private notion;

  constructor() {
    // Initialize Notion integration if credentials provided
    if (this.config.notionApiKey && this.config.notionBusinessTrackerDbId) {
      this.notion = createNotionIntegration(
        this.config.notionApiKey,
        this.config.notionBusinessTrackerDbId
      );
    }
  }

  /**
   * Generate complete daily briefing
   *
   * This is the main entry point for the CEO Agent.
   * Orchestrates all agents, calculates priorities, detects risks,
   * and generates comprehensive executive briefing.
   *
   * @param options - Orchestration options
   * @returns Complete briefing with top priorities and insights
   *
   * @example
   * ```typescript
   * const ceo = new CEOAgent();
   *
   * // Generate today's briefing
   * const briefing = await ceo.getDailyBriefing();
   *
   * // Save to Notion
   * if (briefing.markdown) {
   *   console.log(briefing.markdown);
   * }
   * ```
   */
  async getDailyBriefing(options?: OrchestrationOptions): Promise<Briefing> {
    const startTime = Date.now();

    console.log('🤖 CEO Agent starting daily briefing generation...\n');

    try {
      // Step 1: Pre-flight checks
      console.log('1️⃣  Running pre-flight checks...');
      await this.preFlightChecks();

      // Step 2: Get founder status from Notion
      console.log('2️⃣  Fetching founder status from Notion...');
      const founderStatus = await this.getFounderStatus();
      console.log(`   Energy: ${founderStatus.energy}/10, Mood: ${founderStatus.mood}`);

      // Step 3: Orchestrate all agents
      console.log('3️⃣  Orchestrating agents...');
      const agentResults = await this.orchestrateAgents(options);
      console.log(`   Successful: ${agentResults.successfulAgents}/${agentResults.successfulAgents + agentResults.failedAgents}`);

      // Step 4: Aggregate metrics
      console.log('4️⃣  Aggregating metrics...');
      const metrics = await this.aggregateMetrics(agentResults);

      // Step 5: Calculate priorities
      console.log('5️⃣  Calculating priorities...');
      const allTasks = this.extractTasksFromResults(agentResults);
      const priorityContext: PriorityContext = {
        founderEnergy: founderStatus.energy,
        goals: defaultStrategicGoals,
        metrics,
        availableFocusTime: founderStatus.focusTimeAvailable,
      };
      const topPriorities = selectTopPriorities(allTasks, priorityContext, this.config);
      console.log(`   Top 3 priorities selected from ${allTasks.length} tasks`);

      // Step 6: Detect risks
      console.log('6️⃣  Detecting risks...');
      const risks = detectRisks(metrics, this.config);
      console.log(`   ${risks.length} risks detected`);

      // Step 7: Generate briefing
      console.log('7️⃣  Generating briefing...');
      const executionTime = Date.now() - startTime;
      const agentSuccessRate =
        agentResults.successfulAgents /
        (agentResults.successfulAgents + agentResults.failedAgents);

      const allRecommendations = this.aggregateRecommendations(agentResults);

      const briefing = await generateBriefing({
        topPriorities,
        metrics,
        risks,
        allRecommendations,
        founderEnergy: founderStatus.energy,
        founderMood: founderStatus.mood,
        founderBlockers: founderStatus.blockers,
        availableFocusTime: founderStatus.focusTimeAvailable,
        executionTime,
        agentSuccessRate,
      });

      console.log('✅ Briefing generated successfully!');
      console.log(`⏱️  Total time: ${executionTime}ms\n`);

      return briefing;
    } catch (error) {
      console.error('❌ Error generating daily briefing:', error);
      throw error;
    }
  }

  /**
   * Orchestrate all enabled agents
   *
   * Calls each enabled agent in sequence (or parallel if configured),
   * handles timeouts and errors gracefully.
   *
   * @param options - Orchestration options
   * @returns Aggregated results from all agents
   */
  async orchestrateAgents(options?: OrchestrationOptions): Promise<AgentResults> {
    const enabledAgents = this.config.agents.filter(a => a.enabled);
    const results: Partial<AgentResults> = {};

    let successCount = 0;
    let failureCount = 0;

    const orchestrationStart = Date.now();

    // For now, use sequential execution
    // TODO: Implement parallel execution for better performance
    for (const agentConfig of enabledAgents) {
      try {
        console.log(`   Calling ${agentConfig.name} agent...`);
        const agentStart = Date.now();

        const result = await this.callAgent(
          agentConfig.name,
          options?.agentTimeout || agentConfig.timeout
        );

        const agentDuration = Date.now() - agentStart;

        if (result) {
          results[agentConfig.name as keyof AgentResults] = result;
          successCount++;
          console.log(`   ✓ ${agentConfig.name} completed in ${agentDuration}ms`);
        } else {
          failureCount++;
          console.warn(`   ✗ ${agentConfig.name} returned no data`);
        }
      } catch (error) {
        failureCount++;
        console.error(`   ✗ ${agentConfig.name} failed:`, error);

        // Set null result for failed agent
        results[agentConfig.name as keyof AgentResults] = null;
      }
    }

    const totalTime = Date.now() - orchestrationStart;

    return {
      ...results,
      aggregatedAt: new Date(),
      totalExecutionTime: totalTime,
      successfulAgents: successCount,
      failedAgents: failureCount,
    } as AgentResults;
  }

  /**
   * Call a specific agent
   *
   * @param agentName - Name of the agent to call
   * @param timeout - Timeout in milliseconds
   * @returns Agent response or null if failed
   */
  async callAgent(agentName: string, timeout: number): Promise<AgentResponse | null> {
    // For now, only Finance Agent is implemented
    // Others will be stubs

    try {
      const promise = this.executeAgent(agentName);
      const result = await this.withTimeout(promise, timeout);
      return result;
    } catch (error) {
      console.error(`Agent ${agentName} execution failed:`, error);
      return null;
    }
  }

  /**
   * Execute a specific agent (actual implementation)
   *
   * @private
   */
  private async executeAgent(agentName: string): Promise<AgentResponse> {
    const startTime = Date.now();

    switch (agentName) {
      case 'finance':
        return await this.callFinanceAgent();

      case 'sales':
        return this.getStubAgent('sales');

      case 'operations':
        return this.getStubAgent('operations');

      case 'marketing':
        return this.getStubAgent('marketing');

      case 'hr':
        return this.getStubAgent('hr');

      case 'customerSuccess':
        return this.getStubAgent('customerSuccess');

      default:
        throw new Error(`Unknown agent: ${agentName}`);
    }
  }

  /**
   * Call Finance Agent (placeholder - integrate actual implementation)
   *
   * @private
   */
  private async callFinanceAgent(): Promise<AgentResponse> {
    // TODO: Import and call actual Finance Agent
    // For now, return stub data

    return {
      agent: 'finance',
      timestamp: new Date().toISOString(),
      success: true,
      metrics: {
        mrr: 15000,
        arr: 180000,
        burnRate: 8000,
        runway: 18.75,
        cashBalance: 150000,
        revenueGrowth: 12,
        newMRR: 2000,
        churnMRR: 500,
      },
      alerts: [],
      recommendations: [
        {
          id: 'fin-1',
          priority: 8,
          action: 'Accelerate revenue growth to extend runway',
          reason: 'Current burn rate high relative to revenue',
          estimatedTime: 4,
          source: 'finance',
          tags: ['revenue', 'growth'],
        },
      ],
      executionTime: 1500,
    };
  }

  /**
   * Get stub agent response (for agents not yet implemented)
   *
   * @private
   */
  private getStubAgent(agentName: string): AgentResponse {
    const stubData: Record<string, any> = {
      sales: {
        metrics: {
          pipelineValue: 250000,
          activeDeals: 12,
          closedThisMonth: 5,
          conversionRate: 18.5,
          avgDealSize: 15000,
          stalledDeals: 3,
          winRate: 28,
        },
        recommendations: [
          {
            id: 'sales-1',
            priority: 9,
            action: 'Follow up with 3 stalled deals',
            reason: 'Deals inactive for 14+ days',
            estimatedTime: 3,
            source: 'sales',
            tags: ['sales', 'pipeline'],
          },
        ],
      },
      operations: {
        metrics: {
          activeProjects: 4,
          onTrackProjects: 3,
          atRiskProjects: 1,
          teamUtilization: 85,
          sprintVelocity: 42,
          blockers: 2,
        },
        recommendations: [
          {
            id: 'ops-1',
            priority: 7,
            action: 'Reallocate resources to Project Alpha',
            reason: 'Project at risk due to resource constraints',
            estimatedTime: 2,
            source: 'operations',
            tags: ['operations', 'projects'],
          },
        ],
      },
      marketing: {
        metrics: {
          websiteVisitors: 5200,
          leads: 85,
          cac: 450,
          socialFollowers: 3200,
          contentEngagement: 12.5,
          topChannel: 'LinkedIn',
        },
        recommendations: [],
      },
      hr: {
        metrics: {
          teamSize: 12,
          openRoles: 3,
          candidatesInPipeline: 8,
          avgTenure: 2.3,
          satisfactionScore: 8.2,
          attritionRisk: 5,
        },
        recommendations: [],
      },
      customerSuccess: {
        metrics: {
          activeCustomers: 45,
          nps: 62,
          churnRate: 3.2,
          atRiskCustomers: 5,
          avgResponseTime: 2.5,
          csat: 4.3,
        },
        recommendations: [
          {
            id: 'cs-1',
            priority: 10,
            action: 'Reach out to 2 inactive customers',
            reason: 'Customers inactive for 30+ days, high churn risk',
            estimatedTime: 2,
            source: 'customerSuccess',
            tags: ['retention', 'customer'],
            blockers: [],
          },
        ],
      },
    };

    const data = stubData[agentName] || { metrics: {}, recommendations: [] };

    return {
      agent: agentName,
      timestamp: new Date().toISOString(),
      success: true,
      metrics: data.metrics,
      alerts: [],
      recommendations: data.recommendations,
      executionTime: 500,
    };
  }

  /**
   * Aggregate metrics from all agent responses
   *
   * @param results - Agent results
   * @returns Aggregated metrics
   */
  async aggregateMetrics(results: AgentResults): Promise<AggregatedMetrics> {
    // Calculate overall health score
    const overallHealthScore = 78; // Simplified - could be more complex

    return {
      finance: results.finance?.metrics || this.getDefaultFinanceMetrics(),
      sales: results.sales?.metrics || this.getDefaultSalesMetrics(),
      operations: results.operations?.metrics || this.getDefaultOperationsMetrics(),
      marketing: results.marketing?.metrics || this.getDefaultMarketingMetrics(),
      hr: results.hr?.metrics || this.getDefaultHRMetrics(),
      customerSuccess: results.customerSuccess?.metrics || this.getDefaultCustomerSuccessMetrics(),
      overallHealthScore,
      timestamp: new Date(),
    };
  }

  /**
   * Extract all tasks from agent results
   *
   * @private
   */
  private extractTasksFromResults(results: AgentResults): Task[] {
    const tasks: Task[] = [];

    // Extract from recommendations
    const agents = ['finance', 'sales', 'operations', 'marketing', 'hr', 'customerSuccess'] as const;

    for (const agentName of agents) {
      const agent = results[agentName];
      if (!agent?.recommendations) continue;

      for (const rec of agent.recommendations) {
        tasks.push({
          id: rec.id,
          source: rec.source,
          action: rec.action,
          revenue: this.estimateRevenue(rec),
          deadline: this.estimateDeadline(rec),
          complexity: this.estimateComplexity(rec),
          tags: rec.tags || [],
          blockers: rec.blockers || [],
          estimatedTime: rec.estimatedTime || 2,
        });
      }
    }

    return tasks;
  }

  /**
   * Aggregate all recommendations
   *
   * @private
   */
  private aggregateRecommendations(results: AgentResults): any[] {
    const recs: any[] = [];

    const agents = ['finance', 'sales', 'operations', 'marketing', 'hr', 'customerSuccess'] as const;

    for (const agentName of agents) {
      const agent = results[agentName];
      if (agent?.recommendations) {
        recs.push(...agent.recommendations);
      }
    }

    return recs;
  }

  /**
   * Get founder status from Notion
   *
   * @private
   */
  private async getFounderStatus(): Promise<{
    energy: number;
    mood: any;
    blockers: string[];
    focusTimeAvailable: number;
  }> {
    if (!this.notion) {
      // Return defaults if Notion not configured
      return {
        energy: 7,
        mood: 'good',
        blockers: [],
        focusTimeAvailable: 6,
      };
    }

    try {
      const checkin = await this.notion.getLatestCheckin();
      return {
        energy: checkin.energy,
        mood: checkin.mood,
        blockers: checkin.blockers,
        focusTimeAvailable: 8 - (checkin.blockers.length * 0.5), // Reduce by 30min per blocker
      };
    } catch (error) {
      console.warn('Could not fetch founder status from Notion:', error);
      return {
        energy: 7,
        mood: 'good',
        blockers: [],
        focusTimeAvailable: 6,
      };
    }
  }

  /**
   * Pre-flight checks
   *
   * @private
   */
  private async preFlightChecks(): Promise<void> {
    // Check operating hours
    const now = new Date();
    const hour = now.getHours();

    if (hour < this.config.operatingHoursStart || hour > this.config.operatingHoursEnd) {
      console.warn(`⚠️  Outside operating hours (${this.config.operatingHoursStart}-${this.config.operatingHoursEnd})`);
    }

    // Check Notion connection if configured
    if (this.notion) {
      const notionHealthy = await this.notion.healthCheck();
      if (!notionHealthy) {
        console.warn('⚠️  Notion connection unhealthy');
      }
    }
  }

  /**
   * Utility: Run promise with timeout
   *
   * @private
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Estimate revenue impact from recommendation
   *
   * @private
   */
  private estimateRevenue(rec: any): number {
    // Simple heuristics based on tags and source
    if (rec.tags?.includes('revenue')) return 50000;
    if (rec.tags?.includes('retention') && rec.source === 'customerSuccess') return 15000;
    if (rec.source === 'sales') return 30000;
    return 0;
  }

  /**
   * Estimate deadline from recommendation
   *
   * @private
   */
  private estimateDeadline(rec: any): Date {
    const now = new Date();

    if (rec.priority >= 9) {
      now.setDate(now.getDate() + 1); // Tomorrow
    } else if (rec.priority >= 7) {
      now.setDate(now.getDate() + 3); // 3 days
    } else {
      now.setDate(now.getDate() + 7); // 1 week
    }

    return now;
  }

  /**
   * Estimate complexity from recommendation
   *
   * @private
   */
  private estimateComplexity(rec: any): any {
    if (rec.estimatedTime && rec.estimatedTime >= 4) return 'high';
    if (rec.estimatedTime && rec.estimatedTime >= 2) return 'medium';
    return 'low';
  }

  // Default metrics for when agents fail
  private getDefaultFinanceMetrics() {
    return { mrr: 0, arr: 0, burnRate: 0, runway: 0, cashBalance: 0 };
  }

  private getDefaultSalesMetrics() {
    return { pipelineValue: 0, activeDeals: 0, closedThisMonth: 0, conversionRate: 0, avgDealSize: 0 };
  }

  private getDefaultOperationsMetrics() {
    return { activeProjects: 0, onTrackProjects: 0, atRiskProjects: 0, teamUtilization: 0 };
  }

  private getDefaultMarketingMetrics() {
    return { websiteVisitors: 0, leads: 0, cac: 0, socialFollowers: 0, contentEngagement: 0 };
  }

  private getDefaultHRMetrics() {
    return { teamSize: 0, openRoles: 0, candidatesInPipeline: 0, avgTenure: 0, satisfactionScore: 0 };
  }

  private getDefaultCustomerSuccessMetrics() {
    return { activeCustomers: 0, nps: 0, churnRate: 0, atRiskCustomers: 0, avgResponseTime: 0 };
  }

  /**
   * Health check for entire system
   *
   * @returns System health status
   */
  async healthCheck(): Promise<SystemHealth> {
    const agents: AgentHealthCheck[] = [];

    for (const agentConfig of this.config.agents) {
      try {
        const result = await this.callAgent(agentConfig.name, 5000);
        agents.push({
          agent: agentConfig.name,
          status: result ? 'healthy' : 'unhealthy',
          responseTime: result?.executionTime,
          lastSuccess: result ? new Date() : undefined,
        });
      } catch (error) {
        agents.push({
          agent: agentConfig.name,
          status: 'offline',
          error: (error as Error).message,
        });
      }
    }

    const notionStatus = this.notion ? await this.notion.healthCheck() : false;

    const overallStatus: HealthStatus =
      agents.every(a => a.status === 'healthy') ? 'healthy' :
      agents.some(a => a.status === 'healthy') ? 'degraded' : 'unhealthy';

    return {
      status: overallStatus,
      agents,
      database: 'healthy', // TODO: Check actual database
      integrations: {
        notion: notionStatus ? 'healthy' : 'unhealthy',
        stripe: 'healthy', // TODO: Check actual Stripe
      },
      timestamp: new Date(),
    };
  }
}

/**
 * Create and run CEO Agent daily briefing
 *
 * Convenience function for running CEO Agent from scripts
 *
 * @example
 * ```typescript
 * // In a scheduled script
 * import { runDailyBriefing } from './agents/ceo/ceo-agent';
 *
 * runDailyBriefing().then(briefing => {
 *   console.log(briefing.markdown);
 * });
 * ```
 */
export async function runDailyBriefing(): Promise<Briefing> {
  const ceo = new CEOAgent();
  return await ceo.getDailyBriefing();
}

export default CEOAgent;
