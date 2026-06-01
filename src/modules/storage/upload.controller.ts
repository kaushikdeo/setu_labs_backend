import { Request, Response, NextFunction } from 'express';
import { storageService } from './storage.service';

export class UploadController {
  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'No file provided' });
        return;
      }

      const folder = (req.query['folder'] as string) || 'general';
      const result = await storageService.uploadImage(
        file.buffer,
        file.mimetype,
        folder
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { publicId } = req.body as { publicId: string };
      if (!publicId) {
        res.status(400).json({ success: false, message: 'publicId is required' });
        return;
      }

      await storageService.deleteImage(publicId);
      res.status(200).json({ success: true, message: 'Image deleted' });
    } catch (error) {
      next(error);
    }
  };
}
