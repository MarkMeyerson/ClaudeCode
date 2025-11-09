// Core Agent Types
export interface AgentConfig {
  name: string;
  enabled: boolean;
  description: string;
}

export interface AgentContext {
  agentId: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data: any;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

// Integration Types
export interface NotionPage {
  id: string;
  properties: Record<string, any>;
  url: string;
  createdTime: string;
  lastEditedTime: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, any>;
}

export interface HubSpotContact {
  id: string;
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    company?: string;
    [key: string]: any;
  };
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    [key: string]: any;
  };
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer?: string;
  created: number;
}

// Database Types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

// Logging Types
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  agentId?: string;
  context?: Record<string, any>;
  error?: Error;
}

// Event Types
export interface AgentEvent {
  type: string;
  agentId: string;
  data: any;
  timestamp: Date;
}

export type EventHandler = (event: AgentEvent) => void | Promise<void>;
