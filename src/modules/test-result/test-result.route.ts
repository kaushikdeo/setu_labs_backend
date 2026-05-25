import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createTestResultSchema } from './test-result.schema';
import { getResultsByTask, getResultById, createResult } from './test-result.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getResultsByTask);
router.get('/:resultId', getResultById);
router.post('/', validate(createTestResultSchema), createResult);

export default router;
