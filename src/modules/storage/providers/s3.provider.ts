import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { IStorageProvider, UploadOptions, UploadResult } from '../storage.interface';
import { env } from '../../../config/env';

export class S3Provider implements IStorageProvider {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.awsRegion,
      credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
      },
    });
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const folder = options.folder ?? 'general';
    const ext = options.mimetype ? `.${options.mimetype.split('/')[1]}` : '';
    const key = `${folder}/${options.filename ?? randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: env.awsS3Bucket,
        Key: key,
        Body: buffer,
        ContentType: options.mimetype,
      })
    );

    const url = `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
    return { url, publicId: key };
  }

  async delete(publicId: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: env.awsS3Bucket, Key: publicId })
    );
  }
}
