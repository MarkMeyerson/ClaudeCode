/**
 * Priority Calculation Algorithm
 * Multi-factor weighted scoring system for task prioritization
 * @module PriorityCalculator
 */

import { Task, PriorityContext, StrategyGoal, CEOConfig } from '../types';

/**
 * Calculate revenue impact score (0-100)
 *
 * Evaluates the financial impact of a task, with special weighting for:
 * - Customer retention (20% boost)
 * - Revenue generation
 * - Cost savings
 *
 * @param task - Task to score
 * @returns Score from 0-100
 *
 * @example
 * ```typescript
 * const task = { revenue: 50000, source: 'sales', ... };
 * const score = scoreRevenueImpact(task); // Returns ~50-80
 * ```
 */
export function scoreRevenueImpact(task: Task): number {
  // Non-revenue tasks get baseline score
  if (task.revenue === 0 || task.revenue === undefined) {
    // Check if it's a critical operational task
    if (task.tags?.includes('critical') || task.tags?.includes('production')) {
      return 60; // Higher baseline for critical tasks
    }
    return 40; // Standard baseline
  }

  // Normalize to 0-100 scale
  // $100k is considered maximum impact (100 points)
  const maxRevenue = 100000;
  let score = Math.min((task.revenue / maxRevenue) * 100, 100);

  // Boost for customer retention vs new acquisition
  // Retaining customers is 5x cheaper than acquiring new ones
  if (task.source === 'customerSuccess' || task.tags?.includes('retention')) {
    score = Math.min(score * 1.2, 100);
  }

  // Boost for high-value strategic deals
  if (task.revenue > 50000) {
    score = Math.min(score * 1.1, 100);
  }

  return Math.round(score);
}

/**
 * Calculate urgency score based on deadline proximity (0-100)
 *
 * Uses exponential decay model where urgency increases dramatically
 * as deadline approaches.
 *
 * @param task - Task with deadline
 * @returns Score from 0-100
 *
 * @example
 * ```typescript
 * const task = { deadline: new Date('2024-11-11'), ... };
 * const score = scoreUrgency(task); // Returns urgency score
 * ```
 */
export function scoreUrgency(task: Task): number {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const msUntilDeadline = deadline.getTime() - now.getTime();
  const daysUntilDeadline = msUntilDeadline / (1000 * 60 * 60 * 24);

  // Past deadline - critical urgency
  if (daysUntilDeadline < 0) {
    return 100;
  }

  // Today - very high urgency
  if (daysUntilDeadline < 1) {
    return 95;
  }

  // This week - high urgency
  if (daysUntilDeadline < 3) {
    return 85;
  }

  // Within a week - moderate-high urgency
  if (daysUntilDeadline < 7) {
    return 70;
  }

  // Within two weeks - moderate urgency
  if (daysUntilDeadline < 14) {
    return 55;
  }

  // This month - low-moderate urgency
  if (daysUntilDeadline < 30) {
    return 40;
  }

  // Later - low urgency
  return 25;
}

/**
 * Calculate energy alignment score (0-100)
 *
 * Matches task complexity with founder's current energy level.
 * High-energy tasks should be done when energy is high.
 * Low-energy tasks are better when energy is low.
 *
 * @param task - Task with complexity level
 * @param founderEnergy - Current energy level (1-10)
 * @returns Score from 0-100
 *
 * @example
 * ```typescript
 * const task = { complexity: 'high', ... };
 * const score = scoreEnergyAlignment(task, 8); // Returns ~95 (good match)
 * ```
 */
export function scoreEnergyAlignment(task: Task, founderEnergy: number): number {
  const complexity = task.complexity || 'medium';

  /**
   * Energy-Complexity Alignment Matrix
   *
   * Optimal pairings:
   * - High energy + High complexity = 95-100 points
   * - Medium energy + Medium complexity = 100 points
   * - Low energy + Low complexity = 100 points
   *
   * Suboptimal pairings are penalized:
   * - Low energy + High complexity = 30 points (burnout risk)
   * - High energy + Low complexity = 85 points (wasted potential)
   */
  const alignmentMatrix: Record<string, Record<string, number>> = {
    high_energy: { low: 85, medium: 90, high: 95 },
    medium_energy: { low: 90, medium: 100, high: 70 },
    low_energy: { low: 100, medium: 60, high: 30 },
  };

  // Categorize energy level
  const energyLevel =
    founderEnergy >= 7 ? 'high_energy' :
    founderEnergy >= 4 ? 'medium_energy' : 'low_energy';

  return alignmentMatrix[energyLevel][complexity];
}

/**
 * Calculate strategic alignment score (0-100)
 *
 * Measures how well a task aligns with current strategic goals.
 * Tasks that match high-priority goals score higher.
 *
 * @param task - Task with tags
 * @param goals - Current strategic goals
 * @returns Score from 0-100
 *
 * @example
 * ```typescript
 * const task = { tags: ['revenue', 'growth'], ... };
 * const goals = [{ priority: 1, keywords: ['revenue'], ... }];
 * const score = scoreStrategicAlignment(task, goals); // Returns ~90-100
 * ```
 */
export function scoreStrategicAlignment(task: Task, goals: StrategyGoal[]): number {
  // No tags or goals - return baseline
  if (!task.tags || task.tags.length === 0) {
    return 50; // Neutral score
  }

  if (goals.length === 0) {
    return 50; // Neutral if no goals defined
  }

  // Find matching goals
  const matchingGoals = goals.filter(goal =>
    task.tags!.some(tag =>
      goal.keywords.some(keyword =>
        keyword.toLowerCase() === tag.toLowerCase()
      )
    )
  );

  // No matching goals
  if (matchingGoals.length === 0) {
    return 35; // Below neutral for non-strategic work
  }

  // Get the highest priority matching goal
  const topGoalPriority = Math.min(...matchingGoals.map(g => g.priority));

  // Convert priority to score
  // Priority 1 = 100 points
  // Priority 2 = 85 points
  // Priority 3 = 70 points
  // Priority 4+ = 55 points
  const baseScore = Math.max(100 - ((topGoalPriority - 1) * 15), 55);

  // Boost if matches multiple goals
  const multiGoalBoost = Math.min(matchingGoals.length * 5, 15);

  return Math.min(baseScore + multiGoalBoost, 100);
}

/**
 * Calculate composite priority score using weighted factors
 *
 * Combines all scoring factors with configurable weights to produce
 * a final priority score from 0-100.
 *
 * Default weights:
 * - Revenue Impact: 40%
 * - Urgency: 25%
 * - Energy Alignment: 15%
 * - Strategic Alignment: 20%
 *
 * @param task - Task to score
 * @param context - Priority context (energy, goals, metrics)
 * @param config - CEO configuration with weights
 * @returns Final priority score (0-100)
 *
 * @example
 * ```typescript
 * const task = {
 *   action: 'Close Acme deal',
 *   revenue: 50000,
 *   deadline: new Date('2024-11-15'),
 *   complexity: 'high',
 *   tags: ['revenue', 'sales']
 * };
 *
 * const context = {
 *   founderEnergy: 8,
 *   goals: [{ priority: 1, keywords: ['revenue'], ... }],
 *   metrics: { ... }
 * };
 *
 * const score = calculatePriorityScore(task, context, config);
 * // Returns: 86.5 (high priority)
 * ```
 */
export function calculatePriorityScore(
  task: Task,
  context: PriorityContext,
  config: CEOConfig
): number {
  // Calculate individual factor scores
  const revenueScore = scoreRevenueImpact(task);
  const urgencyScore = scoreUrgency(task);
  const energyScore = scoreEnergyAlignment(task, context.founderEnergy);
  const strategyScore = scoreStrategicAlignment(task, context.goals);

  // Apply weights from configuration
  const weights = config.priorityWeights;
  const compositeScore =
    (revenueScore * weights.revenueImpact) +
    (urgencyScore * weights.urgency) +
    (energyScore * weights.energyAlignment) +
    (strategyScore * weights.strategicAlignment);

  // Round to 1 decimal place for readability
  return Math.round(compositeScore * 10) / 10;
}

/**
 * Sort and rank all tasks by priority score
 *
 * @param tasks - Array of tasks to rank
 * @param context - Priority context
 * @param config - CEO configuration
 * @returns Tasks sorted by priority score (highest first)
 *
 * @example
 * ```typescript
 * const tasks = [...]; // Array of tasks
 * const ranked = rankTasks(tasks, context, config);
 * const topPriority = ranked[0]; // Highest priority task
 * ```
 */
export function rankTasks(
  tasks: Task[],
  context: PriorityContext,
  config: CEOConfig
): Task[] {
  // Calculate score for each task
  const scoredTasks = tasks.map(task => ({
    ...task,
    priorityScore: calculatePriorityScore(task, context, config),
  }));

  // Sort descending by priority score
  return scoredTasks.sort((a, b) => {
    const scoreDiff = b.priorityScore! - a.priorityScore!;

    // If scores are very close (within 2 points), use urgency as tiebreaker
    if (Math.abs(scoreDiff) < 2) {
      return scoreUrgency(b) - scoreUrgency(a);
    }

    return scoreDiff;
  });
}

/**
 * Select top N priorities from task list
 *
 * Applies additional filtering to ensure diversity:
 * - No more than 2 tasks from same source
 * - Total estimated time fits within available focus time
 * - At least one high-urgency task if any exist
 *
 * @param tasks - Array of tasks to select from
 * @param context - Priority context
 * @param config - CEO configuration
 * @param count - Number of priorities to select (default: 3)
 * @returns Top N priority tasks
 *
 * @example
 * ```typescript
 * const topThree = selectTopPriorities(tasks, context, config, 3);
 * // Returns: [task1, task2, task3] with highest scores
 * ```
 */
export function selectTopPriorities(
  tasks: Task[],
  context: PriorityContext,
  config: CEOConfig,
  count: number = 3
): Task[] {
  // First, rank all tasks
  const ranked = rankTasks(tasks, context, config);

  // Track selected tasks and sources
  const selected: Task[] = [];
  const sourceCounts: Record<string, number> = {};

  // Available focus time (default 6 hours if not specified)
  const availableTime = context.availableFocusTime || 6;
  let allocatedTime = 0;

  for (const task of ranked) {
    // Stop if we have enough priorities
    if (selected.length >= count) break;

    // Check source diversity (max 2 from same source)
    const sourceCount = sourceCounts[task.source] || 0;
    if (sourceCount >= 2) continue;

    // Check time constraints
    const taskTime = task.estimatedTime || 2; // Default 2 hours if not specified
    if (allocatedTime + taskTime > availableTime * 1.5) {
      // Allow 50% overflow for flexibility
      continue;
    }

    // Add to selected
    selected.push(task);
    sourceCounts[task.source] = sourceCount + 1;
    allocatedTime += taskTime;
  }

  // Ensure at least one urgent task if any exist
  const hasUrgentTask = selected.some(t => scoreUrgency(t) >= 85);
  const urgentTasks = ranked.filter(t => scoreUrgency(t) >= 85);

  if (!hasUrgentTask && urgentTasks.length > 0 && selected.length > 0) {
    // Replace lowest priority with most urgent
    selected[selected.length - 1] = urgentTasks[0];
  }

  return selected;
}

/**
 * Explain priority score breakdown for a task
 *
 * Useful for debugging and transparency. Shows how the final
 * score was calculated from individual factors.
 *
 * @param task - Task to explain
 * @param context - Priority context
 * @param config - CEO configuration
 * @returns Detailed score breakdown
 *
 * @example
 * ```typescript
 * const explanation = explainPriorityScore(task, context, config);
 * console.log(explanation);
 * // {
 * //   finalScore: 86.5,
 * //   breakdown: {
 * //     revenue: { score: 95, weight: 0.40, contribution: 38.0 },
 * //     urgency: { score: 80, weight: 0.25, contribution: 20.0 },
 * //     energy: { score: 70, weight: 0.15, contribution: 10.5 },
 * //     strategy: { score: 90, weight: 0.20, contribution: 18.0 }
 * //   }
 * // }
 * ```
 */
export function explainPriorityScore(
  task: Task,
  context: PriorityContext,
  config: CEOConfig
): {
  finalScore: number;
  breakdown: {
    revenue: { score: number; weight: number; contribution: number };
    urgency: { score: number; weight: number; contribution: number };
    energy: { score: number; weight: number; contribution: number };
    strategy: { score: number; weight: number; contribution: number };
  };
} {
  const revenueScore = scoreRevenueImpact(task);
  const urgencyScore = scoreUrgency(task);
  const energyScore = scoreEnergyAlignment(task, context.founderEnergy);
  const strategyScore = scoreStrategicAlignment(task, context.goals);

  const weights = config.priorityWeights;

  return {
    finalScore: calculatePriorityScore(task, context, config),
    breakdown: {
      revenue: {
        score: revenueScore,
        weight: weights.revenueImpact,
        contribution: Math.round(revenueScore * weights.revenueImpact * 10) / 10,
      },
      urgency: {
        score: urgencyScore,
        weight: weights.urgency,
        contribution: Math.round(urgencyScore * weights.urgency * 10) / 10,
      },
      energy: {
        score: energyScore,
        weight: weights.energyAlignment,
        contribution: Math.round(energyScore * weights.energyAlignment * 10) / 10,
      },
      strategy: {
        score: strategyScore,
        weight: weights.strategicAlignment,
        contribution: Math.round(strategyScore * weights.strategicAlignment * 10) / 10,
      },
    },
  };
}

export default {
  scoreRevenueImpact,
  scoreUrgency,
  scoreEnergyAlignment,
  scoreStrategicAlignment,
  calculatePriorityScore,
  rankTasks,
  selectTopPriorities,
  explainPriorityScore,
};
