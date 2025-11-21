/**
 * Health check routes for Assessment Engine service
 */

import { Router, Request, Response } from 'express';
import { checkHealth } from '@naios/shared/utils/database';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkHealth();

    const health = {
      status: dbHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'assessment-engine',
      version: '1.0.0',
      checks: {
        database: dbHealth ? 'up' : 'down'
      }
    };

    const statusCode = dbHealth ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'assessment-engine',
      error: 'Health check failed'
    });
  }
});

export default router;
