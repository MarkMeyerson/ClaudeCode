/**
 * NAIOS Platform - Prometheus Metrics
 *
 * Comprehensive metrics collection for monitoring and observability
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// ============================================================================
// PROMETHEUS CLIENT SETUP
// ============================================================================

// Create a Registry to register the metrics
export const register = new client.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'naios_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ============================================================================
// HTTP METRICS
// ============================================================================

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'naios_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5],
  registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new client.Counter({
  name: 'naios_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register],
});

// HTTP request size histogram
export const httpRequestSize = new client.Histogram({
  name: 'naios_http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route', 'service'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

// HTTP response size histogram
export const httpResponseSize = new client.Histogram({
  name: 'naios_http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

// Active HTTP connections gauge
export const httpActiveConnections = new client.Gauge({
  name: 'naios_http_active_connections',
  help: 'Number of active HTTP connections',
  labelNames: ['service'],
  registers: [register],
});

// ============================================================================
// DATABASE METRICS
// ============================================================================

// Database query duration histogram
export const dbQueryDuration = new client.Histogram({
  name: 'naios_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Database query counter
export const dbQueryTotal = new client.Counter({
  name: 'naios_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status', 'service'],
  registers: [register],
});

// Database connection pool metrics
export const dbPoolSize = new client.Gauge({
  name: 'naios_db_pool_size',
  help: 'Current size of database connection pool',
  labelNames: ['service'],
  registers: [register],
});

export const dbPoolIdle = new client.Gauge({
  name: 'naios_db_pool_idle',
  help: 'Number of idle connections in pool',
  labelNames: ['service'],
  registers: [register],
});

export const dbPoolWaiting = new client.Gauge({
  name: 'naios_db_pool_waiting',
  help: 'Number of clients waiting for connection',
  labelNames: ['service'],
  registers: [register],
});

// ============================================================================
// CACHE METRICS
// ============================================================================

// Cache hit/miss counter
export const cacheHits = new client.Counter({
  name: 'naios_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key', 'service'],
  registers: [register],
});

export const cacheMisses = new client.Counter({
  name: 'naios_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key', 'service'],
  registers: [register],
});

// Cache operation duration
export const cacheOperationDuration = new client.Histogram({
  name: 'naios_cache_operation_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation', 'service'],
  buckets: [0.0001, 0.001, 0.005, 0.01, 0.05, 0.1],
  registers: [register],
});

// Cache size gauge
export const cacheSize = new client.Gauge({
  name: 'naios_cache_size_bytes',
  help: 'Current size of cache in bytes',
  labelNames: ['service'],
  registers: [register],
});

// Cache entry count
export const cacheEntryCount = new client.Gauge({
  name: 'naios_cache_entries',
  help: 'Number of entries in cache',
  labelNames: ['service'],
  registers: [register],
});

// ============================================================================
// BUSINESS METRICS
// ============================================================================

// Assessments
export const assessmentsCreated = new client.Counter({
  name: 'naios_assessments_created_total',
  help: 'Total number of assessments created',
  labelNames: ['assessment_type', 'org_type'],
  registers: [register],
});

export const assessmentsCompleted = new client.Counter({
  name: 'naios_assessments_completed_total',
  help: 'Total number of assessments completed',
  labelNames: ['assessment_type', 'maturity_level'],
  registers: [register],
});

export const assessmentScore = new client.Histogram({
  name: 'naios_assessment_score',
  help: 'Distribution of assessment scores',
  labelNames: ['assessment_type', 'dimension'],
  buckets: [1, 2, 3, 4, 5],
  registers: [register],
});

// Donations
export const donationsReceived = new client.Counter({
  name: 'naios_donations_received_total',
  help: 'Total number of donations received',
  labelNames: ['donation_type', 'campaign'],
  registers: [register],
});

export const donationAmount = new client.Histogram({
  name: 'naios_donation_amount_dollars',
  help: 'Distribution of donation amounts in dollars',
  labelNames: ['donation_type', 'donor_level'],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 50000],
  registers: [register],
});

export const totalDonationValue = new client.Gauge({
  name: 'naios_total_donation_value_dollars',
  help: 'Total value of all donations in dollars',
  labelNames: ['period'],
  registers: [register],
});

// Volunteers
export const volunteersRegistered = new client.Counter({
  name: 'naios_volunteers_registered_total',
  help: 'Total number of volunteers registered',
  labelNames: ['volunteer_level'],
  registers: [register],
});

export const volunteerHours = new client.Counter({
  name: 'naios_volunteer_hours_total',
  help: 'Total volunteer hours logged',
  labelNames: ['opportunity_type', 'program'],
  registers: [register],
});

export const activeVolunteers = new client.Gauge({
  name: 'naios_active_volunteers',
  help: 'Number of currently active volunteers',
  registers: [register],
});

// Grants
export const grantApplicationsSubmitted = new client.Counter({
  name: 'naios_grant_applications_submitted_total',
  help: 'Total number of grant applications submitted',
  labelNames: ['grant_type', 'funder_type'],
  registers: [register],
});

export const grantApplicationsAwarded = new client.Counter({
  name: 'naios_grant_applications_awarded_total',
  help: 'Total number of grant applications awarded',
  labelNames: ['grant_type', 'funder_type'],
  registers: [register],
});

export const grantAmountRequested = new client.Histogram({
  name: 'naios_grant_amount_requested_dollars',
  help: 'Distribution of grant amounts requested',
  labelNames: ['grant_type'],
  buckets: [10000, 50000, 100000, 250000, 500000, 1000000, 5000000],
  registers: [register],
});

// Programs and Impact
export const programsActive = new client.Gauge({
  name: 'naios_programs_active',
  help: 'Number of active programs',
  labelNames: ['program_type'],
  registers: [register],
});

export const beneficiariesServed = new client.Counter({
  name: 'naios_beneficiaries_served_total',
  help: 'Total number of beneficiaries served',
  labelNames: ['program_type', 'service_type'],
  registers: [register],
});

export const servicesDelivered = new client.Counter({
  name: 'naios_services_delivered_total',
  help: 'Total number of services delivered',
  labelNames: ['service_type', 'delivery_method'],
  registers: [register],
});

export const impactScore = new client.Histogram({
  name: 'naios_impact_score',
  help: 'Distribution of impact scores',
  labelNames: ['program_id', 'outcome_type'],
  buckets: [1, 2, 3, 4, 5],
  registers: [register],
});

export const sroiRatio = new client.Histogram({
  name: 'naios_sroi_ratio',
  help: 'Social Return on Investment ratio distribution',
  labelNames: ['program_id'],
  buckets: [1, 2, 3, 4, 5, 7, 10, 15, 20],
  registers: [register],
});

// ============================================================================
// SYSTEM METRICS
// ============================================================================

// Error counter
export const errorsTotal = new client.Counter({
  name: 'naios_errors_total',
  help: 'Total number of errors',
  labelNames: ['error_type', 'service', 'severity'],
  registers: [register],
});

// Authentication metrics
export const authAttempts = new client.Counter({
  name: 'naios_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['method', 'status', 'service'],
  registers: [register],
});

export const authTokensIssued = new client.Counter({
  name: 'naios_auth_tokens_issued_total',
  help: 'Total number of authentication tokens issued',
  labelNames: ['token_type', 'service'],
  registers: [register],
});

// API rate limiting
export const rateLimitHits = new client.Counter({
  name: 'naios_rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'user_type', 'service'],
  registers: [register],
});

// Background jobs
export const jobsProcessed = new client.Counter({
  name: 'naios_jobs_processed_total',
  help: 'Total number of background jobs processed',
  labelNames: ['job_type', 'status', 'service'],
  registers: [register],
});

export const jobDuration = new client.Histogram({
  name: 'naios_job_duration_seconds',
  help: 'Duration of background jobs in seconds',
  labelNames: ['job_type', 'service'],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register],
});

// WebSocket metrics
export const wsConnections = new client.Gauge({
  name: 'naios_websocket_connections',
  help: 'Number of active WebSocket connections',
  labelNames: ['service'],
  registers: [register],
});

export const wsMessagesReceived = new client.Counter({
  name: 'naios_websocket_messages_received_total',
  help: 'Total number of WebSocket messages received',
  labelNames: ['event_type', 'service'],
  registers: [register],
});

export const wsMessagesSent = new client.Counter({
  name: 'naios_websocket_messages_sent_total',
  help: 'Total number of WebSocket messages sent',
  labelNames: ['event_type', 'service'],
  registers: [register],
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Express middleware to collect HTTP metrics
 */
export function metricsMiddleware(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    // Increment active connections
    httpActiveConnections.inc({ service: serviceName });

    // Track request size
    const requestSize = parseInt(req.get('content-length') || '0', 10);
    if (requestSize > 0) {
      httpRequestSize.observe(
        { method: req.method, route: req.route?.path || req.path, service: serviceName },
        requestSize
      );
    }

    // Override res.end to capture response metrics
    const originalEnd = res.end;
    res.end = function (chunk?: any, encoding?: any, callback?: any): any {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      const statusCode = res.statusCode.toString();

      // Record metrics
      httpRequestDuration.observe(
        { method: req.method, route, status_code: statusCode, service: serviceName },
        duration
      );

      httpRequestTotal.inc(
        { method: req.method, route, status_code: statusCode, service: serviceName }
      );

      // Track response size
      const responseSize = parseInt(res.get('content-length') || '0', 10);
      if (responseSize > 0) {
        httpResponseSize.observe(
          { method: req.method, route, status_code: statusCode, service: serviceName },
          responseSize
        );
      }

      // Decrement active connections
      httpActiveConnections.dec({ service: serviceName });

      return originalEnd.call(this, chunk, encoding, callback);
    };

    next();
  };
}

/**
 * Express endpoint to expose metrics
 */
export async function metricsEndpoint(req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Track database query metrics
 */
export function trackDatabaseQuery(
  serviceName: string,
  operation: string,
  table: string,
  duration: number,
  success: boolean
): void {
  dbQueryDuration.observe(
    { operation, table, service: serviceName },
    duration
  );

  dbQueryTotal.inc({
    operation,
    table,
    status: success ? 'success' : 'error',
    service: serviceName,
  });
}

/**
 * Track cache operation
 */
export function trackCacheOperation(
  serviceName: string,
  operation: 'get' | 'set' | 'delete',
  cacheKey: string,
  duration: number,
  hit?: boolean
): void {
  cacheOperationDuration.observe(
    { operation, service: serviceName },
    duration
  );

  if (operation === 'get' && hit !== undefined) {
    if (hit) {
      cacheHits.inc({ cache_key: cacheKey, service: serviceName });
    } else {
      cacheMisses.inc({ cache_key: cacheKey, service: serviceName });
    }
  }
}

/**
 * Track authentication attempt
 */
export function trackAuthAttempt(
  serviceName: string,
  method: string,
  success: boolean
): void {
  authAttempts.inc({
    method,
    status: success ? 'success' : 'failed',
    service: serviceName,
  });
}

/**
 * Track error
 */
export function trackError(
  serviceName: string,
  errorType: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): void {
  errorsTotal.inc({
    error_type: errorType,
    service: serviceName,
    severity,
  });
}

/**
 * Update database pool metrics
 */
export function updateDatabasePoolMetrics(
  serviceName: string,
  poolSize: number,
  idleCount: number,
  waitingCount: number
): void {
  dbPoolSize.set({ service: serviceName }, poolSize);
  dbPoolIdle.set({ service: serviceName }, idleCount);
  dbPoolWaiting.set({ service: serviceName }, waitingCount);
}

/**
 * Update cache metrics
 */
export function updateCacheMetrics(
  serviceName: string,
  sizeBytes: number,
  entryCount: number
): void {
  cacheSize.set({ service: serviceName }, sizeBytes);
  cacheEntryCount.set({ service: serviceName }, entryCount);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  register,
  metricsMiddleware,
  metricsEndpoint,
  trackDatabaseQuery,
  trackCacheOperation,
  trackAuthAttempt,
  trackError,
  updateDatabasePoolMetrics,
  updateCacheMetrics,

  // HTTP metrics
  httpRequestDuration,
  httpRequestTotal,
  httpRequestSize,
  httpResponseSize,
  httpActiveConnections,

  // Database metrics
  dbQueryDuration,
  dbQueryTotal,
  dbPoolSize,
  dbPoolIdle,
  dbPoolWaiting,

  // Cache metrics
  cacheHits,
  cacheMisses,
  cacheOperationDuration,
  cacheSize,
  cacheEntryCount,

  // Business metrics
  assessmentsCreated,
  assessmentsCompleted,
  assessmentScore,
  donationsReceived,
  donationAmount,
  totalDonationValue,
  volunteersRegistered,
  volunteerHours,
  activeVolunteers,
  grantApplicationsSubmitted,
  grantApplicationsAwarded,
  grantAmountRequested,
  programsActive,
  beneficiariesServed,
  servicesDelivered,
  impactScore,
  sroiRatio,

  // System metrics
  errorsTotal,
  authAttempts,
  authTokensIssued,
  rateLimitHits,
  jobsProcessed,
  jobDuration,
  wsConnections,
  wsMessagesReceived,
  wsMessagesSent,
};
