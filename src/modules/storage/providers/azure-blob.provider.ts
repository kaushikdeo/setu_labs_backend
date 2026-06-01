import { BlobServiceClient } from '@azure/storage-blob';
import { randomUUID } from 'node:crypto';
import { IStorageProvider, UploadOptions, UploadResult } from '../storage.interface';
import { env } from '../../../config/env';

export class AzureBlobProvider implements IStorageProvider {
  private client: BlobServiceClient;

  constructor() {
    this.client = BlobServiceClient.fromConnectionString(env.azureStorageConnectionString);
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const folder = options.folder ?? 'general';
    const ext = options.mimetype ? `.${options.mimetype.split('/')[1]}` : '';
    const blobName = `${folder}/${options.filename ?? randomUUID()}${ext}`;

    const container = this.client.getContainerClient(env.azureStorageContainer);
    await container.createIfNotExists({ access: 'blob' });

    const blockBlob = container.getBlockBlobClient(blobName);
    await blockBlob.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: options.mimetype },
    });

    return { url: blockBlob.url, publicId: blobName };
  }

  async delete(publicId: string): Promise<void> {
    const container = this.client.getContainerClient(env.azureStorageContainer);
    await container.deleteBlob(publicId);
  }
}
