import { Router } from 'express';
import { authenticate, requirePermission } from '@naios/shared/middleware/auth.middleware';
import { asyncHandler } from '@naios/shared/middleware/error.middleware';

const router = Router();

// Placeholder - Action Plan CRUD operations
router.get('/', authenticate, requirePermission('read:assessments'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: [], message: 'List action plans - Implementation pending' });
}));

export default router;
