import { Router } from 'express';
import { StatsController } from './stats.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '../user/user.model';

const router = Router();
const statsController = new StatsController();

router.get(
  '/dashboard',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN, UserRole.AUDITOR),
  statsController.getDashboardStats,
);

export default router;
