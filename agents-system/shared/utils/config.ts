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
  const config: Config = {
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'ai_assessment',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    },
    stripeApiKey: process.env.STRIPE_API_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
    environment: (process.env.NODE_ENV as any) || 'development',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  };

  // Validate required fields
  if (!config.database.password && config.environment === 'production') {
    throw new Error('DB_PASSWORD is required in production environment');
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

// Export singleton config instance
export const config = loadConfig();
