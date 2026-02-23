import { Router } from 'express';
import { getTransfers, createTransfer, getTransferById } from '../controllers/transfer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getTransfers);
router.get('/:id', getTransferById);
router.post('/', authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), createTransfer);

export default router;
