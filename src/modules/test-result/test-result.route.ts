import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '../user/user.model';
import { createTestResultSchema, updateTestResultSchema } from './test-result.schema';
import {
  getResultsByTask,
  getResultById,
  createResult,
  recalculateResult,
  updateResult,
} from './test-result.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getResultsByTask);
router.get('/:resultId', getResultById);
router.post('/', validate(createTestResultSchema), createResult);
router.post('/:resultId/recalculate', recalculateResult);
router.patch(
  '/:resultId',
  requireRole(UserRole.SUPER_ADMIN, UserRole.VALIDATION_HEAD),
  validate(updateTestResultSchema),
  updateResult,
);

export default router;
