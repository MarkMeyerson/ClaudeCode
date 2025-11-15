import { DataSource } from 'typeorm';
import * as path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'sherpa_6a_platform',

  // Entities
  entities: [path.join(__dirname, 'entities/**/*.ts')],

  // Migrations
  migrations: [path.join(__dirname, 'migrations/**/*.ts')],

  // Subscribers
  subscribers: [path.join(__dirname, 'subscribers/**/*.ts')],

  // Connection pool
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Logging
  logging: process.env.NODE_ENV === 'development',
  logger: 'advanced-console',

  // Synchronization (disable in production)
  synchronize: false,

  // Drop schema on connection (NEVER use in production)
  dropSchema: false,

  // Migration settings
  migrationsRun: false,
  migrationsTableName: 'migrations',

  // SSL for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,

  // Cache
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    duration: 60000, // 1 minute default cache
  }
});

export default AppDataSource;
