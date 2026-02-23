import { Router } from 'express';
import { getPurchases, createPurchase, getPurchaseById } from '../controllers/purchase.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), createPurchase);

export default router;
