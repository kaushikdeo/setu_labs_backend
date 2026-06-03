import { Router } from 'express';
import { ProspectController } from './prospect.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { UserRole } from '../user/user.model';
import {
  changeStageSchema,
  completeFollowUpSchema,
  completedFollowUpsQuerySchema,
  convertLeadSchema,
  listProspectsQuerySchema,
  markLostSchema,
  markWonSchema,
  updateProspectSchema,
} from './prospect.schema';

const router = Router();
const controller = new ProspectController();

router.use(authenticate);

const writeRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES] as const;
const deleteRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER] as const;

router.get('/', validate({ query: listProspectsQuerySchema }), controller.list);
router.get('/stats', controller.stats);
router.get('/kanban', validate({ query: listProspectsQuerySchema }), controller.kanban);
router.get('/forecast', controller.forecast);
router.get('/follow-ups', controller.followUps);
router.get(
  '/follow-ups/completed',
  validate({ query: completedFollowUpsQuerySchema }),
  controller.completedFollowUps,
);
router.get('/by-lead/:leadId', controller.getByLeadId);

router.post('/convert/:leadId', requireRole(...writeRoles), validate(convertLeadSchema), controller.convert);

router.get('/:id', controller.getById);
router.patch('/:id', requireRole(...writeRoles), validate(updateProspectSchema), controller.update);
router.post('/:id/stage', requireRole(...writeRoles), validate(changeStageSchema), controller.changeStage);
router.post('/:id/won', requireRole(...writeRoles), validate(markWonSchema), controller.markWon);
router.post('/:id/lost', requireRole(...writeRoles), validate(markLostSchema), controller.markLost);
router.post(
  '/:id/follow-up/complete',
  requireRole(...writeRoles),
  validate(completeFollowUpSchema),
  controller.completeFollowUp,
);
router.delete('/:id/follow-up', requireRole(...writeRoles), controller.clearFollowUp);
router.delete('/:id', requireRole(...deleteRoles), controller.remove);

export default router;
