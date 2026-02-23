import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', authorize('ADMIN'), getAuditLogs);

export default router;
