/**
 * Shared Configuration Loader
 * Loads environment variables and provides typed configuration
 */

import * as dotenv from 'dotenv';
import { Config } from '../types';

// Load environment variables
dotenv.config();

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  // Support both DB_* and DATABASE_* naming conventions
  const dbHost = process.env.DATABASE_HOST || process.env.DB_HOST;
  const dbPort = process.env.DATABASE_PORT || process.env.DB_PORT;
  const dbName = process.env.DATABASE_NAME || process.env.DB_NAME;
  const dbUser = process.env.DATABASE_USER || process.env.DB_USER;
  const dbPassword = process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD;

  const config: Config = {
    database: {
      host: dbHost || 'localhost',
      port: parseInt(dbPort || '5432', 10),
      database: dbName || 'ai_assessment',
      user: dbUser || 'postgres',
      password: dbPassword || '',
    },
    stripeApiKey: process.env.STRIPE_API_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
    environment: (process.env.NODE_ENV as any) || 'development',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  };

  // Validate required fields
  const missingVars: string[] = [];

  if (!config.stripeApiKey) {
    missingVars.push('STRIPE_API_KEY');
  }

  if (!config.database.host || config.database.host === 'localhost') {
    if (!dbHost) {
      missingVars.push('DATABASE_HOST or DB_HOST');
    }
  }

  if (!config.database.password) {
    missingVars.push('DATABASE_PASSWORD or DB_PASSWORD');
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please ensure your .env file exists in the agents-system directory and contains all required variables.\n' +
      'See .env.example for reference.'
    );
  }

  return config;
}

/**
 * Get a specific configuration value
 */
export function getConfigValue(key: string, defaultValue?: string): string {
  return process.env[key] || defaultValue || '';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Print configuration for debugging (masks sensitive data)
 */
export function printConfig(cfg: Config = config): void {
  console.log('\n=== Configuration Loaded ===');
  console.log('Environment:', cfg.environment);
  console.log('Log Level:', cfg.logLevel);
  console.log('\nDatabase:');
  console.log('  Host:', cfg.database.host);
  console.log('  Port:', cfg.database.port);
  console.log('  Database:', cfg.database.database);
  console.log('  User:', cfg.database.user);
  console.log('  Password:', cfg.database.password ? '***' + cfg.database.password.slice(-4) : '(not set)');
  console.log('\nAPI Keys:');
  console.log('  Stripe:', cfg.stripeApiKey ? cfg.stripeApiKey.slice(0, 12) + '...' : '(not set)');
  console.log('  Claude:', cfg.claudeApiKey ? cfg.claudeApiKey.slice(0, 12) + '...' : '(not set)');
  console.log('==============================\n');
}

// Export singleton config instance
export const config = loadConfig();
