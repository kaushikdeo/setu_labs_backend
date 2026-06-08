import { Router } from 'express';
import { FollowUpController } from './follow-up.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { UserRole } from '../user/user.model';
import {
  completeFollowUpSchema,
  completedFollowUpsQuerySchema,
  entityTypeParamSchema,
  followUpsQuerySchema,
} from './follow-up.schema';

const router = Router();
const controller = new FollowUpController();

router.use(authenticate);

const writeRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES] as const;

router.get('/', validate({ query: followUpsQuerySchema }), controller.list);
router.get(
  '/completed',
  validate({ query: completedFollowUpsQuerySchema }),
  controller.completed,
);
router.post(
  '/:entityType/:id/complete',
  requireRole(...writeRoles),
  validate({ params: entityTypeParamSchema, body: completeFollowUpSchema }),
  controller.complete,
);
router.delete(
  '/:entityType/:id',
  requireRole(...writeRoles),
  validate({ params: entityTypeParamSchema }),
  controller.clear,
);

export default router;
