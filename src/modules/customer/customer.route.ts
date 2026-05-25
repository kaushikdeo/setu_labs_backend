import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '../user/user.model';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createSiteSchema,
  updateSiteSchema,
} from './customer.schema';

const router = Router();
const customerController = new CustomerController();

// ─── Customer Routes ─────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validate(createCustomerSchema),
  customerController.createCustomer,
);

router.get('/', authenticate, customerController.getAllCustomers);

router.get('/:id', authenticate, customerController.getCustomerById);

router.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validate(updateCustomerSchema),
  customerController.updateCustomer,
);

// ─── Site Routes ─────────────────────────────────────────────────────────────

router.post(
  '/:id/sites',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validate(createSiteSchema),
  customerController.createSite,
);

router.get('/:id/sites', authenticate, customerController.getSitesByCustomer);

router.patch(
  '/:id/sites/:siteId',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validate(updateSiteSchema),
  customerController.updateSite,
);

router.delete(
  '/:id/sites/:siteId',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  customerController.deleteSite,
);

export default router;
