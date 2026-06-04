import { Router } from 'express';
import { TcTemplateController } from './tc-template.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { UserRole } from '../user/user.model';
import { createTcTemplateSchema, updateTcTemplateSchema } from './tc-template.schema';

const router = Router();
const controller = new TcTemplateController();

router.use(authenticate);

const writeRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER] as const;

router.get('/', controller.list);
router.get('/default/:type', controller.getDefault);
router.get('/:id', controller.getById);
router.post('/', requireRole(...writeRoles), validate(createTcTemplateSchema), controller.create);
router.patch(
  '/:id',
  requireRole(...writeRoles),
  validate(updateTcTemplateSchema),
  controller.update
);
router.delete('/:id', requireRole(...writeRoles), controller.remove);

export default router;
