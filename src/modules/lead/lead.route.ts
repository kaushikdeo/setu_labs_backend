import { Router } from 'express';
import multer from 'multer';
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
  importCommitSchema,
  putOnHoldSchema,
  resumeSchema,
  snoozeSchema,
} from './lead.schema';
import { completeFollowUpSchema } from '../follow-up/follow-up.schema';

const router = Router();
const leadController = new LeadController();

router.use(authenticate);

const writeRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES] as const;
const deleteRoles = [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER] as const;

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only Excel (.xlsx) or CSV files are allowed'));
  },
});

router.get('/', validate({ query: listLeadsQuerySchema }), leadController.list);
router.get('/stats', leadController.stats);

router.get('/import/template', requireRole(...writeRoles), leadController.importTemplate);
router.post(
  '/import/validate',
  requireRole(...writeRoles),
  importUpload.single('file'),
  leadController.validateImport,
);
router.post(
  '/import',
  requireRole(...writeRoles),
  validate(importCommitSchema),
  leadController.commitImport,
);

router.get('/segments', leadController.listSegments);
router.post('/segments', requireRole(...writeRoles), validate(createSegmentSchema), leadController.createSegment);
router.patch('/segments/:id', requireRole(...writeRoles), validate(updateSegmentSchema), leadController.updateSegment);
router.delete('/segments/:id', requireRole(...writeRoles), leadController.removeSegment);

router.post('/', requireRole(...writeRoles), validate(createLeadSchema), leadController.create);

router.get('/:id', leadController.getById);
router.patch('/:id', requireRole(...writeRoles), validate(updateLeadSchema), leadController.update);
router.post(
  '/:id/follow-up/complete',
  requireRole(...writeRoles),
  validate(completeFollowUpSchema),
  leadController.completeFollowUp,
);
router.post('/:id/on-hold', requireRole(...writeRoles), validate(putOnHoldSchema), leadController.putOnHold);
router.post('/:id/resume', requireRole(...writeRoles), validate(resumeSchema), leadController.resume);
router.post('/:id/snooze', requireRole(...writeRoles), validate(snoozeSchema), leadController.snooze);
router.delete('/:id/follow-up', requireRole(...writeRoles), leadController.clearFollowUp);
router.delete('/:id', requireRole(...deleteRoles), leadController.remove);

export default router;
