import { IStorageProvider } from './storage.interface';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { S3Provider } from './providers/s3.provider';
import { AzureBlobProvider } from './providers/azure-blob.provider';
import { env } from '../../config/env';

let instance: IStorageProvider | null = null;

// Change STORAGE_PROVIDER env var to swap connector: cloudinary | s3 | azure
export function getStorageProvider(): IStorageProvider {
  if (instance) return instance;

  switch (env.storageProvider) {
    case 's3':
      instance = new S3Provider();
      break;
    case 'azure':
      instance = new AzureBlobProvider();
      break;
    default:
      instance = new CloudinaryProvider();
  }

  return instance;
}
