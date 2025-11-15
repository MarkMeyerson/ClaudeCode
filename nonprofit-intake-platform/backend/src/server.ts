/**
 * Express Server with API Documentation
 * Serves the Non-Profit Intake Platform API with Swagger UI
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import apiRoutes from './api/routes/index';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
  next();
});

// ==================== API DOCUMENTATION ====================

// Load OpenAPI spec
const openapiSpec = YAML.load(path.join(__dirname, '../openapi.yaml'));

// Swagger UI options
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Non-Profit Intake Platform API',
  customfavIcon: '/favicon.ico',
};

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, swaggerOptions));

// Serve OpenAPI spec as JSON
app.get('/api/openapi.json', (req: Request, res: Response) => {
  res.json(openapiSpec);
});

// ==================== HEALTH CHECKS ====================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // In production, check database connection, redis, etc.
    // const dbHealthy = await checkDatabase();
    // const redisHealthy = await checkRedis();

    res.status(200).json({
      status: 'ready',
      checks: {
        database: 'ok',
        redis: 'ok',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// ==================== API ROUTES ====================

// API version prefix
app.use('/api/v2', apiRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Non-Profit Intake Platform API',
    version: '2.0.0',
    documentation: '/api-docs',
    health: '/health',
    openapi: '/api/openapi.json',
  });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    documentation: '/api-docs',
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);

  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  res.status(status).json({
    error: error.name || 'Error',
    message,
    requestId: req.headers['x-request-id'],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// ==================== SERVER STARTUP ====================

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Closing server gracefully...`);

  server.close(() => {
    console.log('Server closed. Exiting process.');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log('Non-Profit Intake Platform API');
  console.log('========================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`OpenAPI Spec: http://localhost:${PORT}/api/openapi.json`);
  console.log('========================================');
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, log to error tracking service (Sentry, etc.)
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, log to error tracking service and exit
  process.exit(1);
});

// ==================== UTILITY FUNCTIONS ====================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default app;
