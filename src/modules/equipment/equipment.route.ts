import { Router } from 'express';
import { EquipmentController } from './equipment.controller';
import { createEquipmentSchema, updateEquipmentSchema } from './equipment.schema';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '../user/user.model';

const router = Router();
const controller = new EquipmentController();

router.use(authenticate);

router.get('/', controller.getAllEquipment);
router.get('/:id', controller.getEquipmentById);

router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN),
  validate(createEquipmentSchema),
  controller.createEquipment
);

router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN),
  validate(updateEquipmentSchema),
  controller.updateEquipment
);

router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN),
  controller.deleteEquipment
);

export const equipmentRoutes = router;
