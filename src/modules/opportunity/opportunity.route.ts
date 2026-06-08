import { Router } from 'express';
import { OpportunityController } from './opportunity.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { UserRole } from '../user/user.model';
import {
  changeStageSchema,
  convertProspectSchema,
  createStandaloneOpportunitySchema,
  listOpportunitiesQuerySchema,
  markLostSchema,
  markWonSchema,
  updateOpportunitySchema,
} from './opportunity.schema';
import { completeFollowUpSchema } from '../follow-up/follow-up.schema';
import { putOnHoldSchema, resumeSchema, snoozeSchema } from '../crm-health/hold.schema';

const router = Router();
const controller = new OpportunityController();

router.use(authenticate);

const writeRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES] as const;
const deleteRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER] as const;

router.get('/', validate({ query: listOpportunitiesQuerySchema }), controller.list);
router.get('/stats', controller.stats);
router.get('/kanban', validate({ query: listOpportunitiesQuerySchema }), controller.kanban);
router.get('/forecast', controller.forecast);
router.get('/stale', controller.stale);
router.get('/win-loss', controller.winLoss);
router.get('/by-prospect/:prospectId', controller.getByProspectId);

router.post(
  '/convert/:prospectId',
  requireRole(...writeRoles),
  validate(convertProspectSchema),
  controller.convertFromProspect
);
router.post(
  '/',
  requireRole(...writeRoles),
  validate(createStandaloneOpportunitySchema),
  controller.createStandalone
);

router.get('/:id', controller.getById);
router.patch(
  '/:id',
  requireRole(...writeRoles),
  validate(updateOpportunitySchema),
  controller.update
);
router.post(
  '/:id/stage',
  requireRole(...writeRoles),
  validate(changeStageSchema),
  controller.changeStage
);
router.post('/:id/won', requireRole(...writeRoles), validate(markWonSchema), controller.markWon);
router.post('/:id/lost', requireRole(...writeRoles), validate(markLostSchema), controller.markLost);
router.post('/:id/on-hold', requireRole(...writeRoles), validate(putOnHoldSchema), controller.putOnHold);
router.post('/:id/resume', requireRole(...writeRoles), validate(resumeSchema), controller.resume);
router.post('/:id/snooze', requireRole(...writeRoles), validate(snoozeSchema), controller.snooze);
router.post(
  '/:id/follow-up/complete',
  requireRole(...writeRoles),
  validate(completeFollowUpSchema),
  controller.completeFollowUp,
);
router.delete('/:id/follow-up', requireRole(...writeRoles), controller.clearFollowUp);
router.delete('/:id', requireRole(...deleteRoles), controller.remove);

export default router;
