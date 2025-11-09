/**
 * Shared Database Client
 * PostgreSQL connection pool for all agents
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
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

  // Log connection attempt for debugging
  logger.info('Initializing database connection pool', {
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
  });

  // Validate database configuration before creating pool
  if (!config.database.host || config.database.host === 'localhost') {
    throw new Error(
      'Database host is not configured or set to localhost. ' +
      'Please ensure DATABASE_HOST is set in your .env file to your Supabase host: ' +
      'db.woyiceldsaqpmsruzauh.supabase.co'
    );
  }

  if (!config.database.password) {
    throw new Error(
      'Database password is not configured. ' +
      'Please ensure DATABASE_PASSWORD is set in your .env file.'
    );
  }

  pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased for remote connections
    ssl: {
      rejectUnauthorized: false, // Required for Supabase
    },
  });

  pool.on('error', (err) => {
    logger.error('Unexpected database error', {
      error: err.message,
      host: config.database.host,
    });
  });

  logger.info('Database connection pool initialized successfully', {
    host: config.database.host,
    database: config.database.database,
    port: config.database.port,
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
export async function query<T extends QueryResultRow = any>(
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

/**
 * Test database connection with retry
 */
export async function testConnection(maxRetries: number = 3): Promise<boolean> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const dbPool = getPool();

      logger.info(`Testing database connection (attempt ${attempt}/${maxRetries})...`);

      const result = await dbPool.query('SELECT NOW() as now, current_database() as db, version() as version');

      logger.info('✓ Database connection test successful', {
        host: config.database.host,
        database: result.rows[0].db,
        serverTime: result.rows[0].now,
        postgresVersion: result.rows[0].version.split(' ')[1],
      });

      return true;
    } catch (error: any) {
      lastError = error;

      logger.warn(`Database connection test failed (attempt ${attempt}/${maxRetries})`, {
        error: error.message,
        code: error.code,
        host: config.database.host,
        database: config.database.database,
      });

      // Don't retry on authentication errors
      if (error.code === '28P01' || error.code === '3D000') {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        logger.info(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  logger.error('Database connection failed after all retries', {
    error: lastError?.message,
    code: (lastError as any)?.code,
    host: config.database.host,
    troubleshooting: {
      dnsIssue: lastError?.message.includes('ENOTFOUND') ? 'Check if the hostname is correct and accessible' : null,
      authIssue: (lastError as any)?.code === '28P01' ? 'Check DATABASE_USER and DATABASE_PASSWORD' : null,
      dbNotFound: (lastError as any)?.code === '3D000' ? 'Check DATABASE_NAME exists' : null,
      firewall: lastError?.message.includes('ETIMEDOUT') ? 'Check firewall rules and network connectivity' : null,
    },
  });

  return false;
}
