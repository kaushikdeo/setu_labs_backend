import { Router } from 'express';
import { ReportController } from './report.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '../user/user.model';
import {
  createReportSchema,
  submitReportSchema,
  approveReportSchema,
  rejectReportSchema,
  requestChangesSchema,
} from './report.schema';

const router = Router();
const reportController = new ReportController();

router.get('/', reportController.getAllReports);

router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.VALIDATION_HEAD),
  validate(createReportSchema),
  reportController.createReport,
);

router.get('/by-visit/:visitId', reportController.getReportByVisitId);

router.get('/:id', reportController.getReportById);

router.get('/:id/download-data', reportController.getAllResultsForDownload);

router.get('/:id/results/:resultId', reportController.getTestResultForReport);

router.post(
  '/:id/submit',
  requireRole(UserRole.SUPER_ADMIN, UserRole.VALIDATION_HEAD),
  validate(submitReportSchema),
  reportController.submitForApproval,
);

router.post(
  '/:id/approve',
  requireRole(UserRole.CUSTOMER),
  validate(approveReportSchema),
  reportController.approveReport,
);

router.post(
  '/:id/reject',
  requireRole(UserRole.CUSTOMER),
  validate(rejectReportSchema),
  reportController.rejectReport,
);

router.post(
  '/:id/request-changes',
  requireRole(UserRole.CUSTOMER),
  validate(requestChangesSchema),
  reportController.requestChanges,
);

export default router;
