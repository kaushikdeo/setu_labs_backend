import { Router } from 'express';
import { QuoteController } from './quote.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { UserRole } from '../user/user.model';
import {
  acceptQuoteSchema,
  addLineItemSchema,
  createQuoteSchema,
  listQuotesQuerySchema,
  rejectQuoteSchema,
  reorderLineItemsSchema,
  reviewActionSchema,
  sendQuoteSchema,
  submitForReviewSchema,
  updateLineItemSchema,
  updateQuoteSchema,
} from './quote.schema';

const router = Router();
const controller = new QuoteController();

router.use(authenticate);

const writeRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES] as const;
const reviewRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES] as const;
const managerRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER] as const;
const deleteRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER] as const;

router.get('/', validate({ query: listQuotesQuerySchema }), controller.list);
router.get('/pending-approvals', controller.pendingApprovals);
router.get('/:id', controller.getById);

router.post('/', requireRole(...writeRoles), validate(createQuoteSchema), controller.create);
router.patch('/:id', requireRole(...writeRoles), validate(updateQuoteSchema), controller.update);

router.post(
  '/:id/line-items',
  requireRole(...writeRoles),
  validate(addLineItemSchema),
  controller.addLineItem
);
router.patch(
  '/:id/line-items/:lineId',
  requireRole(...writeRoles),
  validate(updateLineItemSchema),
  controller.updateLineItem
);
router.delete('/:id/line-items/:lineId', requireRole(...writeRoles), controller.removeLineItem);
router.post(
  '/:id/line-items/reorder',
  requireRole(...writeRoles),
  validate(reorderLineItemsSchema),
  controller.reorderLineItems
);

router.post(
  '/:id/submit-for-review',
  requireRole(...writeRoles),
  validate(submitForReviewSchema),
  controller.submitForReview
);
router.post(
  '/:id/technical-review',
  requireRole(...reviewRoles),
  validate(reviewActionSchema),
  controller.technicalAction
);
router.post(
  '/:id/manager-review',
  requireRole(...managerRoles),
  validate(reviewActionSchema),
  controller.managerAction
);

router.post('/:id/generate-pdf', requireRole(...writeRoles), controller.generatePdf);
router.post('/:id/send', requireRole(...writeRoles), validate(sendQuoteSchema), controller.send);
router.post('/:id/revise', requireRole(...writeRoles), controller.revise);
router.post(
  '/:id/accept',
  requireRole(...writeRoles),
  validate(acceptQuoteSchema),
  controller.accept
);
router.post(
  '/:id/reject',
  requireRole(...writeRoles),
  validate(rejectQuoteSchema),
  controller.reject
);
router.delete('/:id', requireRole(...deleteRoles), controller.remove);

export default router;
