import { Router } from 'express';
import { ActivityController } from './activity.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { UserRole } from '../user/user.model';
import { createActivitySchema, listActivitiesQuerySchema } from './activity.schema';

const router = Router();
const controller = new ActivityController();

router.use(authenticate);

const writeRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES] as const;
const deleteRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER] as const;

router.get('/', validate({ query: listActivitiesQuerySchema }), controller.list);
router.post('/', requireRole(...writeRoles), validate(createActivitySchema), controller.create);
router.delete('/:id', requireRole(...deleteRoles), controller.remove);

export default router;
