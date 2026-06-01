import { AppError } from '../../utils/app-error';
import { getStorageProvider } from './storage.factory';
import { UploadResult } from './storage.interface';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export class StorageService {
  async uploadImage(
    buffer: Buffer,
    mimetype: string,
    folder: string,
    filename?: string
  ): Promise<UploadResult> {
    if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
      throw new AppError(`Unsupported file type: ${mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`, 400);
    }

    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
      throw new AppError('File exceeds maximum size of 5 MB', 400);
    }

    const provider = getStorageProvider();
    return provider.upload(buffer, { folder, filename, mimetype });
  }

  async deleteFile(publicId: string): Promise<void> {
    const provider = getStorageProvider();
    return provider.delete(publicId);
  }

  /** @deprecated Use deleteFile */
  async deleteImage(publicId: string): Promise<void> {
    return this.deleteFile(publicId);
  }
}

export const storageService = new StorageService();
