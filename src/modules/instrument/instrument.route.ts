import { Router } from 'express';
import { InstrumentController } from './instrument.controller';
import { createInstrumentSchema, updateInstrumentSchema } from './instrument.schema';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '../user/user.model';

const router = Router();
const controller = new InstrumentController();

router.use(authenticate);

router.get('/', controller.getAllInstruments);
router.get('/:id', controller.getInstrumentById);
router.get('/:id/validate', controller.validateInstrument);

router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN),
  validate(createInstrumentSchema),
  controller.createInstrument
);

router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN),
  validate(updateInstrumentSchema),
  controller.updateInstrument
);

export const instrumentRoutes = router;
