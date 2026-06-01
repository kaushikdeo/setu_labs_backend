export interface UploadOptions {
  folder?: string;
  filename?: string;
  mimetype?: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface IStorageProvider {
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}
