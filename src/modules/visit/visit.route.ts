import { Router } from 'express';
import { VisitController } from './visit.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '../user/user.model';
import {
  createVisitSchema,
  updateVisitSchema,
  createTaskSchema,
  updateTaskSchema,
  startTaskSchema,
  startVisitSchema,
  completeTaskSchema,
} from './visit.schema';
import testResultRoutes from '../test-result/test-result.route';

const router = Router();
const visitController = new VisitController();

router.get('/', authenticate, visitController.getAllVisits);

router.post(
  '/',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN, UserRole.VALIDATION_HEAD),
  validate(createVisitSchema),
  visitController.createVisit,
);

router.get('/:id', authenticate, visitController.getVisitById);

router.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN, UserRole.VALIDATION_HEAD),
  validate(updateVisitSchema),
  visitController.updateVisit,
);

router.post(
  '/:id/start',
  authenticate,
  validate(startVisitSchema),
  visitController.startVisit,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  visitController.deleteVisit,
);

router.get('/:id/tasks', authenticate, visitController.getTasksByVisit);

router.post(
  '/:id/tasks',
  authenticate,
  validate(createTaskSchema),
  visitController.addTask,
);

router.patch(
  '/:id/tasks/:taskId',
  authenticate,
  validate(updateTaskSchema),
  visitController.updateTask,
);

router.post(
  '/:id/tasks/:taskId/start',
  authenticate,
  validate(startTaskSchema),
  visitController.startTask,
);

router.post(
  '/:id/tasks/:taskId/complete',
  authenticate,
  validate(completeTaskSchema),
  visitController.completeTask,
);

router.use('/:id/tasks/:taskId/test-results', testResultRoutes);

export default router;
