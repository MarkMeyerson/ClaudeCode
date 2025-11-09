/**
 * Shared Type Definitions for SherpaTech Multi-Agent System
 * Used across all agents for consistency and type safety
 */

// Agent execution status
export enum AgentStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Agent types in the system
export enum AgentType {
  FINANCE_TRACKER = 'finance-tracker',
  CONTENT_CREATOR = 'content-creator',
  LEAD_QUALIFIER = 'lead-qualifier',
  SALES_ANALYST = 'sales-analyst',
  CUSTOMER_SUCCESS = 'customer-success',
  OPERATIONS_MANAGER = 'operations-manager',
}

// Base agent execution record
export interface AgentExecution {
  id: string;
  agent_type: AgentType;
  status: AgentStatus;
  started_at: Date;
  completed_at?: Date;
  error_message?: string;
  metadata?: Record<string, any>;
  results?: Record<string, any>;
}

// Business metrics record
export interface BusinessMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number | string;
  metric_unit?: string;
  period_start: Date;
  period_end: Date;
  metadata?: Record<string, any>;
  created_at: Date;
}

// Database configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Stripe customer data
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  created: number;
  metadata?: Record<string, any>;
}

// Stripe charge data
export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  customer?: string;
  status: string;
  created: number;
  description?: string;
  metadata?: Record<string, any>;
}

// Stripe subscription data
export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring?: {
          interval: string;
        };
      };
    }>;
  };
}

// Logger interface
export interface Logger {
  info: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  debug: (message: string, meta?: Record<string, any>) => void;
}

// Configuration interface
export interface Config {
  database: DatabaseConfig;
  stripeApiKey?: string;
  claudeApiKey?: string;
  environment: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
