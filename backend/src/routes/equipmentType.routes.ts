import { Router } from 'express';
import { getEquipmentTypes, createEquipmentType, updateEquipmentType, deleteEquipmentType } from '../controllers/equipmentType.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getEquipmentTypes);
router.post('/', authorize('ADMIN'), createEquipmentType);
router.put('/:id', authorize('ADMIN'), updateEquipmentType);
router.delete('/:id', authorize('ADMIN'), deleteEquipmentType);

export default router;
