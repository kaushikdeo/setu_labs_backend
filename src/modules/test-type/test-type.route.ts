import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '../user/user.model';
import {
  getAllTestTypes,
  getTestTypeById,
  createTestType,
  updateTestType,
  deactivateTestType,
} from './test-type.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllTestTypes);
router.get('/:id', getTestTypeById);

router.post('/', requireRole(UserRole.SUPER_ADMIN, UserRole.VALIDATION_HEAD), createTestType);
router.patch('/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.VALIDATION_HEAD), updateTestType);
router.delete('/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.VALIDATION_HEAD), deactivateTestType);

export default router;
