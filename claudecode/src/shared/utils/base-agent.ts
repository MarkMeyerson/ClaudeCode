import { EventEmitter } from 'events';
import { Logger } from './logger';
import { db } from '../database';
import { AgentError } from './errors';
import type { AgentTask, AgentResult, AgentContext, AgentEvent } from '../types';

export abstract class BaseAgent extends EventEmitter {
  protected logger: Logger;
  protected agentId: string;
  protected enabled: boolean;

  constructor(agentId: string, enabled: boolean = true) {
    super();
    this.agentId = agentId;
    this.enabled = enabled;
    this.logger = new Logger(agentId);
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing agent');
    try {
      await this.loadState();
      await this.onInitialize();
      this.logger.info('Agent initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize agent', error as Error);
      throw new AgentError(this.agentId, 'Initialization failed', error as Error);
    }
  }

  /**
   * Hook for custom initialization logic
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Execute a task
   */
  async executeTask<T = any>(task: AgentTask): Promise<AgentResult<T>> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Agent is disabled',
      };
    }

    this.logger.info('Executing task', { taskId: task.id, type: task.type });

    try {
      // Update task status to in_progress
      await this.updateTaskStatus(task.id, 'in_progress');

      // Execute the task
      const result = await this.processTask<T>(task);

      // Update task status to completed
      await this.updateTaskStatus(task.id, 'completed', result.data);

      this.logger.info('Task completed successfully', { taskId: task.id });
      this.emitEvent('task_completed', { taskId: task.id, result });

      return result;
    } catch (error) {
      this.logger.error('Task execution failed', error as Error, { taskId: task.id });

      // Update task status to failed
      await this.updateTaskStatus(task.id, 'failed', undefined, (error as Error).message);

      this.emitEvent('task_failed', { taskId: task.id, error: (error as Error).message });

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Hook for processing specific task types
   */
  protected abstract processTask<T>(task: AgentTask): Promise<AgentResult<T>>;

  /**
   * Create a new task
   */
  async createTask(
    type: string,
    data: any,
    priority: AgentTask['priority'] = 'medium'
  ): Promise<AgentTask> {
    try {
      const result = await db.query<AgentTask>(
        `INSERT INTO agent_tasks (agent_id, type, priority, status, data)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [this.agentId, type, priority, 'pending', JSON.stringify(data)]
      );

      const task = result.rows[0];
      this.logger.info('Task created', { taskId: task.id, type });
      this.emitEvent('task_created', { task });

      return task;
    } catch (error) {
      this.logger.error('Failed to create task', error as Error, { type });
      throw new AgentError(this.agentId, 'Failed to create task', error as Error);
    }
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(
    taskId: string,
    status: AgentTask['status'],
    result?: any,
    errorMessage?: string
  ): Promise<void> {
    const updateFields: string[] = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [taskId, status];
    let paramCount = 2;

    if (status === 'completed') {
      updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
      if (result !== undefined) {
        paramCount++;
        updateFields.push(`result = $${paramCount}`);
        values.push(JSON.stringify(result));
      }
    }

    if (errorMessage) {
      paramCount++;
      updateFields.push(`error_message = $${paramCount}`);
      values.push(errorMessage);
    }

    await db.query(
      `UPDATE agent_tasks SET ${updateFields.join(', ')} WHERE id = $1`,
      values
    );
  }

  /**
   * Get pending tasks for this agent
   */
  async getPendingTasks(limit: number = 10): Promise<AgentTask[]> {
    try {
      const result = await db.query<AgentTask>(
        `SELECT * FROM agent_tasks
         WHERE agent_id = $1 AND status = 'pending'
         ORDER BY priority DESC, created_at ASC
         LIMIT $2`,
        [this.agentId, limit]
      );

      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get pending tasks', error as Error);
      throw new AgentError(this.agentId, 'Failed to get pending tasks', error as Error);
    }
  }

  /**
   * Save agent state to database
   */
  async saveState(state: Record<string, any>): Promise<void> {
    try {
      await db.query(
        `INSERT INTO agent_state (agent_id, state, last_active_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (agent_id)
         DO UPDATE SET state = $2, last_active_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
        [this.agentId, JSON.stringify(state)]
      );

      this.logger.debug('State saved', { state });
    } catch (error) {
      this.logger.error('Failed to save state', error as Error);
      throw new AgentError(this.agentId, 'Failed to save state', error as Error);
    }
  }

  /**
   * Load agent state from database
   */
  async loadState(): Promise<Record<string, any> | null> {
    try {
      const result = await db.query(
        `SELECT state FROM agent_state WHERE agent_id = $1`,
        [this.agentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const state = result.rows[0].state;
      this.logger.debug('State loaded', { state });
      return state;
    } catch (error) {
      this.logger.error('Failed to load state', error as Error);
      throw new AgentError(this.agentId, 'Failed to load state', error as Error);
    }
  }

  /**
   * Emit an agent event
   */
  protected emitEvent(eventType: string, data: any): void {
    const event: AgentEvent = {
      type: eventType,
      agentId: this.agentId,
      data,
      timestamp: new Date(),
    };

    this.emit(eventType, event);

    // Persist event to database
    db.query(
      `INSERT INTO agent_events (agent_id, event_type, data)
       VALUES ($1, $2, $3)`,
      [this.agentId, eventType, JSON.stringify(data)]
    ).catch((error) => {
      this.logger.error('Failed to persist event', error as Error, { event });
    });
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(toAgentId: string, messageType: string, payload: any): Promise<void> {
    try {
      await db.query(
        `INSERT INTO agent_messages (from_agent_id, to_agent_id, message_type, payload, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [this.agentId, toAgentId, messageType, JSON.stringify(payload)]
      );

      this.logger.info('Message sent', { toAgentId, messageType });
    } catch (error) {
      this.logger.error('Failed to send message', error as Error, { toAgentId, messageType });
      throw new AgentError(this.agentId, 'Failed to send message', error as Error);
    }
  }

  /**
   * Get pending messages for this agent
   */
  async getPendingMessages(limit: number = 50): Promise<any[]> {
    try {
      const result = await db.query(
        `SELECT * FROM agent_messages
         WHERE to_agent_id = $1 AND status = 'pending'
         ORDER BY created_at ASC
         LIMIT $2`,
        [this.agentId, limit]
      );

      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get pending messages', error as Error);
      throw new AgentError(this.agentId, 'Failed to get pending messages', error as Error);
    }
  }

  /**
   * Shutdown the agent gracefully
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down agent');
    try {
      await this.onShutdown();
      this.removeAllListeners();
      this.logger.info('Agent shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', error as Error);
    }
  }

  /**
   * Hook for custom shutdown logic
   */
  protected abstract onShutdown(): Promise<void>;

  /**
   * Get agent status
   */
  getStatus() {
    return {
      agentId: this.agentId,
      enabled: this.enabled,
      uptime: process.uptime(),
    };
  }
}
