import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '../user/user.model';
import { updateOrganizationSchema } from './organization.schema';

const router = Router();
const organizationController = new OrganizationController();

router.get('/', authenticate, organizationController.getOrganization);

router.patch(
  '/',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validate(updateOrganizationSchema),
  organizationController.updateOrganization,
);

export default router;
