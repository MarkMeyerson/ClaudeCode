import { Pool, PoolClient, QueryResult } from 'pg';
import { appConfig } from '../config';
import { Logger } from '../utils/logger';
import { DatabaseError } from '../utils/errors';

export class Database {
  private pool: Pool;
  private logger: Logger;

  constructor() {
    this.pool = new Pool({
      connectionString: appConfig.database.url,
      host: appConfig.database.host,
      port: appConfig.database.port,
      database: appConfig.database.database,
      user: appConfig.database.user,
      password: appConfig.database.password,
      ssl: appConfig.database.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.logger = new Logger('Database');

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected database error', err);
    });
  }

  /**
   * Execute a query
   */
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      this.logger.debug('Executing query', { text, params });
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      this.logger.debug('Query executed', { duration, rows: result.rowCount });
      return result;
    } catch (error) {
      this.logger.error('Query failed', error as Error, { text, params });
      throw new DatabaseError('Query execution failed', error as Error);
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      this.logger.debug('Client acquired from pool');
      return client;
    } catch (error) {
      this.logger.error('Failed to get client from pool', error as Error);
      throw new DatabaseError('Failed to get database client', error as Error);
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      this.logger.debug('Transaction started');

      const result = await callback(client);

      await client.query('COMMIT');
      this.logger.debug('Transaction committed');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction rolled back', error as Error);
      throw new DatabaseError('Transaction failed', error as Error);
    } finally {
      client.release();
      this.logger.debug('Client released');
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT NOW()');
      this.logger.info('Database connection successful');
      return true;
    } catch (error) {
      this.logger.error('Database connection failed', error as Error);
      return false;
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
      this.logger.info('Database pool closed');
    } catch (error) {
      this.logger.error('Failed to close database pool', error as Error);
      throw new DatabaseError('Failed to close database connection', error as Error);
    }
  }

  /**
   * Get pool status
   */
  getPoolStatus() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }
}

export const db = new Database();
export default Database;
