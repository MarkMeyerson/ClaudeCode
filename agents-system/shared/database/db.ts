/**
 * Shared Database Client
 * PostgreSQL connection pool for all agents
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { AgentExecution, BusinessMetric, AgentStatus, AgentType } from '../types';

let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
export function initDatabase(): Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected database error', { error: err.message });
  });

  logger.info('Database connection pool initialized', {
    host: config.database.host,
    database: config.database.database,
  });

  return pool;
}

/**
 * Get database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    return initDatabase();
  }
  return pool;
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}

/**
 * Execute a query with the pool
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const dbPool = getPool();
  const start = Date.now();

  try {
    const result = await dbPool.query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug('Executed query', {
      query: text,
      duration: `${duration}ms`,
      rows: result.rowCount,
    });

    return result;
  } catch (error: any) {
    logger.error('Query execution failed', {
      query: text,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Create a new agent execution record
 */
export async function createAgentExecution(
  agentType: AgentType,
  metadata?: Record<string, any>
): Promise<AgentExecution> {
  const result = await query<AgentExecution>(
    `INSERT INTO agent_executions (agent_type, status, started_at, metadata)
     VALUES ($1, $2, NOW(), $3)
     RETURNING *`,
    [agentType, AgentStatus.RUNNING, JSON.stringify(metadata || {})]
  );

  return result.rows[0];
}

/**
 * Update agent execution status
 */
export async function updateAgentExecution(
  id: string,
  status: AgentStatus,
  results?: Record<string, any>,
  errorMessage?: string
): Promise<void> {
  await query(
    `UPDATE agent_executions
     SET status = $1,
         completed_at = NOW(),
         results = $2,
         error_message = $3
     WHERE id = $4`,
    [status, JSON.stringify(results || {}), errorMessage, id]
  );
}

/**
 * Store a business metric
 */
export async function storeBusinessMetric(
  metricType: string,
  metricName: string,
  metricValue: number | string,
  periodStart: Date,
  periodEnd: Date,
  metricUnit?: string,
  metadata?: Record<string, any>
): Promise<BusinessMetric> {
  const result = await query<BusinessMetric>(
    `INSERT INTO business_metrics
     (metric_type, metric_name, metric_value, metric_unit, period_start, period_end, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [
      metricType,
      metricName,
      metricValue,
      metricUnit,
      periodStart,
      periodEnd,
      JSON.stringify(metadata || {}),
    ]
  );

  return result.rows[0];
}

/**
 * Get metrics by type and time period
 */
export async function getMetrics(
  metricType: string,
  startDate: Date,
  endDate: Date
): Promise<BusinessMetric[]> {
  const result = await query<BusinessMetric>(
    `SELECT * FROM business_metrics
     WHERE metric_type = $1
       AND period_start >= $2
       AND period_end <= $3
     ORDER BY period_start DESC`,
    [metricType, startDate, endDate]
  );

  return result.rows;
}

/**
 * Get recent agent executions
 */
export async function getRecentExecutions(
  agentType?: AgentType,
  limit: number = 10
): Promise<AgentExecution[]> {
  const queryText = agentType
    ? `SELECT * FROM agent_executions WHERE agent_type = $1 ORDER BY started_at DESC LIMIT $2`
    : `SELECT * FROM agent_executions ORDER BY started_at DESC LIMIT $1`;

  const params = agentType ? [agentType, limit] : [limit];
  const result = await query<AgentExecution>(queryText, params);

  return result.rows;
}
