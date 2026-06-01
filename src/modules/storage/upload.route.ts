import { Router } from 'express';
import multer from 'multer';
import { UploadController } from './upload.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new UploadController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.post('/', authenticate, upload.single('file'), controller.uploadImage);
router.delete('/', authenticate, controller.deleteImage);

export default router;
