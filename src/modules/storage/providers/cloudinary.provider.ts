import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';
import { IStorageProvider, UploadOptions, UploadResult } from '../storage.interface';
import { env } from '../../../config/env';

export class CloudinaryProvider implements IStorageProvider {
  constructor() {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
    });
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const folder = options.folder ?? 'general';

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: options.filename ? `${folder}/${options.filename}` : undefined,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async delete(publicId: string): Promise<void> {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (result.result === 'not found') {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }
  }
}
