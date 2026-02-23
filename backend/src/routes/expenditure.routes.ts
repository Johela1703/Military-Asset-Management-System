import { Router } from 'express';
import { getExpenditures, createExpenditure } from '../controllers/expenditure.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getExpenditures);
router.post('/', authorize('ADMIN', 'BASE_COMMANDER'), createExpenditure);

export default router;
