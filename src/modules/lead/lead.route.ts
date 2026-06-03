import { Router } from 'express';
import { LeadController } from './lead.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '../user/user.model';
import {
  createLeadSchema,
  updateLeadSchema,
  listLeadsQuerySchema,
  createSegmentSchema,
  updateSegmentSchema,
} from './lead.schema';

const router = Router();
const leadController = new LeadController();

router.use(authenticate);

const writeRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES] as const;
const deleteRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER] as const;

router.get('/', validate({ query: listLeadsQuerySchema }), leadController.list);
router.get('/stats', leadController.stats);

router.get('/segments', leadController.listSegments);
router.post('/segments', requireRole(...writeRoles), validate(createSegmentSchema), leadController.createSegment);
router.patch('/segments/:id', requireRole(...writeRoles), validate(updateSegmentSchema), leadController.updateSegment);
router.delete('/segments/:id', requireRole(...writeRoles), leadController.removeSegment);

router.post('/', requireRole(...writeRoles), validate(createLeadSchema), leadController.create);

router.get('/:id', leadController.getById);
router.patch('/:id', requireRole(...writeRoles), validate(updateLeadSchema), leadController.update);
router.delete('/:id', requireRole(...deleteRoles), leadController.remove);

export default router;
