import { Router } from 'express';
import { UserController } from './user.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from './user.model';
import { createUserSchema, getUserSchema, updateUserRoleSchema, updateUserStatusSchema } from './user.schema';

const router = Router();
const userController = new UserController();

router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN),
  validate(createUserSchema),
  userController.createUser,
);

router.get('/:id', validate({ params: getUserSchema }), userController.getUserById);
router.get('/', userController.getAllUsers);

router.patch(
  '/:id/role',
  requireRole(UserRole.SUPER_ADMIN),
  validate({ params: getUserSchema, body: updateUserRoleSchema }),
  userController.updateRole,
);

router.patch(
  '/:id/status',
  requireRole(UserRole.SUPER_ADMIN),
  validate({ params: getUserSchema, body: updateUserStatusSchema }),
  userController.updateStatus,
);

export default router;
