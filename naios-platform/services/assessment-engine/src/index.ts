/**
 * NAIOS Platform - Assessment Engine Service
 *
 * Main entry point for the Assessment Engine microservice
 *
 * @version 1.0.0
 */

import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from '@naios/shared/utils/logger';
import { initializePool } from '@naios/shared/utils/database';
import { errorHandler, notFoundHandler } from '@naios/shared/middleware/error.middleware';

// Load environment variables
dotenv.config();

// Import routes
import organizationsRouter from './routes/organizations.routes';
import assessmentsRouter from './routes/assessments.routes';
import dimensionsRouter from './routes/dimensions.routes';
import recommendationsRouter from './routes/recommendations.routes';
import actionPlansRouter from './routes/action-plans.routes';
import healthRouter from './routes/health.routes';

// ============================================================================
// APP CONFIGURATION
// ============================================================================

const app: Application = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      user_agent: req.get('user-agent')
    });
  });

  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check (no rate limiting)
app.use('/health', healthRouter);

// API routes
app.use('/api/organizations', organizationsRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/dimensions', dimensionsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/action-plans', actionPlansRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    // Initialize database
    logger.info('Initializing database connection...');
    initializePool(process.env.DATABASE_URL);

    // Start server
    app.listen(PORT, () => {
      logger.info(`Assessment Engine service started`, {
        port: PORT,
        environment: NODE_ENV,
        nodeVersion: process.version
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
