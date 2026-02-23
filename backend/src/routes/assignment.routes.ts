import { Router } from 'express';
import { getAssignments, createAssignment, returnAssignment } from '../controllers/assignment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAssignments);
router.post('/', authorize('ADMIN', 'BASE_COMMANDER'), createAssignment);
router.patch('/:id/return', authorize('ADMIN', 'BASE_COMMANDER'), returnAssignment);

export default router;
