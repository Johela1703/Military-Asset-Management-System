import { Router } from 'express';
import { getDashboardMetrics, getNetMovementDetails } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/metrics', getDashboardMetrics);
router.get('/net-movement-details', getNetMovementDetails);

export default router;
