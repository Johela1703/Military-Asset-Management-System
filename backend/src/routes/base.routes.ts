import { Router } from 'express';
import { getBases, createBase, updateBase, deleteBase } from '../controllers/base.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getBases);
router.post('/', authorize('ADMIN'), createBase);
router.put('/:id', authorize('ADMIN'), updateBase);
router.delete('/:id', authorize('ADMIN'), deleteBase);

export default router;
