/**
 * NAIOS Platform - Database Utilities
 *
 * This module provides database connection management, query utilities,
 * and transaction handling for PostgreSQL using the pg library.
 *
 * @module shared/utils/database
 * @version 1.0.0
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from './logger';

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | object;
}

/**
 * Get database configuration from environment variables
 */
function getDatabaseConfig(databaseUrl?: string): DatabaseConfig {
  if (databaseUrl) {
    // Parse connection URL
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      max: parseInt(process.env.DB_POOL_SIZE || '20'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'naios_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_POOL_SIZE || '20'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}

// ============================================================================
// DATABASE POOL MANAGEMENT
// ============================================================================

/**
 * Database pool instance
 */
let pool: Pool | null = null;

/**
 * Initialize database connection pool
 *
 * @param databaseUrl - Optional database connection URL
 * @returns Database pool instance
 *
 * @example
 * ```typescript
 * const pool = initializePool(process.env.DATABASE_URL);
 * ```
 */
export function initializePool(databaseUrl?: string): Pool {
  if (pool) {
    return pool;
  }

  const config = getDatabaseConfig(databaseUrl);

  pool = new Pool(config);

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error('Unexpected database pool error', { error: err });
  });

  // Handle pool connection
  pool.on('connect', () => {
    logger.info('New database connection established');
  });

  // Handle pool acquisition
  pool.on('acquire', () => {
    logger.debug('Database connection acquired from pool');
  });

  // Handle pool release
  pool.on('release', () => {
    logger.debug('Database connection released back to pool');
  });

  logger.info('Database pool initialized', {
    host: config.host,
    port: config.port,
    database: config.database,
    maxConnections: config.max
  });

  return pool;
}

/**
 * Get the database pool instance
 *
 * @returns Database pool instance
 * @throws Error if pool is not initialized
 *
 * @example
 * ```typescript
 * const pool = getPool();
 * const result = await pool.query('SELECT NOW()');
 * ```
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool() first.');
  }
  return pool;
}

/**
 * Close the database pool
 *
 * @example
 * ```typescript
 * await closePool();
 * ```
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

// ============================================================================
// QUERY UTILITIES
// ============================================================================

/**
 * Execute a SQL query
 *
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result
 *
 * @example
 * ```typescript
 * const result = await query(
 *   'SELECT * FROM users WHERE email = $1',
 *   ['user@example.com']
 * );
 * ```
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const pool = getPool();

  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug('Executed query', {
      text,
      duration,
      rows: result.rowCount
    });

    return result;
  } catch (error) {
    logger.error('Query execution failed', {
      text,
      params,
      error
    });
    throw error;
  }
}

/**
 * Execute a query and return the first row
 *
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns First row or null
 *
 * @example
 * ```typescript
 * const user = await queryOne(
 *   'SELECT * FROM users WHERE user_id = $1',
 *   [userId]
 * );
 * ```
 */
export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 *
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Array of rows
 *
 * @example
 * ```typescript
 * const users = await queryMany(
 *   'SELECT * FROM users WHERE is_active = $1',
 *   [true]
 * );
 * ```
 */
export async function queryMany<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

// ============================================================================
// TRANSACTION UTILITIES
// ============================================================================

/**
 * Transaction callback type
 */
export type TransactionCallback<T> = (client: PoolClient) => Promise<T>;

/**
 * Execute a function within a database transaction
 *
 * @param callback - Function to execute within transaction
 * @returns Result from callback
 *
 * @example
 * ```typescript
 * const result = await withTransaction(async (client) => {
 *   await client.query('INSERT INTO users ...', [data]);
 *   await client.query('INSERT INTO audit_log ...', [logData]);
 *   return { success: true };
 * });
 * ```
 */
export async function withTransaction<T>(
  callback: TransactionCallback<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');

    const result = await callback(client);

    await client.query('COMMIT');
    logger.debug('Transaction committed');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.warn('Transaction rolled back', { error });
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// PAGINATION UTILITIES
// ============================================================================

export interface PaginationOptions {
  page?: number;
  per_page?: number;
  offset?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

/**
 * Execute a paginated query
 *
 * @param baseQuery - Base SQL query without LIMIT/OFFSET
 * @param params - Query parameters
 * @param options - Pagination options
 * @returns Paginated result
 *
 * @example
 * ```typescript
 * const result = await queryPaginated(
 *   'SELECT * FROM donors WHERE is_active = $1',
 *   [true],
 *   { page: 1, per_page: 20 }
 * );
 * ```
 */
export async function queryPaginated<T extends QueryResultRow = any>(
  baseQuery: string,
  params: any[] = [],
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const page = options.page || 1;
  const per_page = options.per_page || options.limit || 20;
  const offset = options.offset || (page - 1) * per_page;

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) AS count_query`;
  const countResult = await queryOne<{ count: string }>(countQuery, params);
  const total_count = parseInt(countResult?.count || '0');

  // Get paginated data
  const dataQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataResult = await query<T>(dataQuery, [...params, per_page, offset]);

  const total_pages = Math.ceil(total_count / per_page);

  return {
    data: dataResult.rows,
    pagination: {
      page,
      per_page,
      total_count,
      total_pages,
      has_next_page: page < total_pages,
      has_previous_page: page > 1
    }
  };
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Insert multiple rows efficiently
 *
 * @param table - Table name
 * @param rows - Array of row objects
 * @returns Number of inserted rows
 *
 * @example
 * ```typescript
 * await bulkInsert('donors', [
 *   { first_name: 'John', last_name: 'Doe' },
 *   { first_name: 'Jane', last_name: 'Smith' }
 * ]);
 * ```
 */
export async function bulkInsert(
  table: string,
  rows: Record<string, any>[]
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const columns = Object.keys(rows[0]);
  const values = rows.map((row, rowIndex) => {
    return `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`;
  }).join(', ');

  const params = rows.flatMap(row => columns.map(col => row[col]));

  const insertQuery = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${values}
  `;

  const result = await query(insertQuery, params);
  return result.rowCount || 0;
}

/**
 * Update multiple rows efficiently
 *
 * @param table - Table name
 * @param updates - Array of update objects with id
 * @param idColumn - Name of ID column (default: 'id')
 * @returns Number of updated rows
 */
export async function bulkUpdate(
  table: string,
  updates: Record<string, any>[],
  idColumn: string = 'id'
): Promise<number> {
  if (updates.length === 0) {
    return 0;
  }

  let totalUpdated = 0;

  await withTransaction(async (client) => {
    for (const update of updates) {
      const { [idColumn]: id, ...fields } = update;
      const columns = Object.keys(fields);
      const setClause = columns.map((col, idx) => `${col} = $${idx + 1}`).join(', ');
      const params = [...columns.map(col => fields[col]), id];

      const updateQuery = `
        UPDATE ${table}
        SET ${setClause}
        WHERE ${idColumn} = $${columns.length + 1}
      `;

      const result = await client.query(updateQuery, params);
      totalUpdated += result.rowCount || 0;
    }
  });

  return totalUpdated;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check database connection health
 *
 * @returns True if database is healthy
 *
 * @example
 * ```typescript
 * const isHealthy = await checkHealth();
 * ```
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 AS health');
    return result.rows[0].health === 1;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export default {
  initializePool,
  getPool,
  closePool,
  query,
  queryOne,
  queryMany,
  withTransaction,
  queryPaginated,
  bulkInsert,
  bulkUpdate,
  checkHealth
};
