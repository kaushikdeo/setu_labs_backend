# Storage Connector

## Overview

A provider-agnostic image storage layer. The active provider is selected at startup via a single env var — no code changes required to swap connectors.

## Architecture

```
src/modules/storage/
├── storage.interface.ts          IStorageProvider contract
├── storage.factory.ts            Reads STORAGE_PROVIDER, returns singleton
├── storage.service.ts            Business rules (type/size validation)
├── upload.controller.ts          HTTP handlers
├── upload.route.ts               POST /api/uploads  DELETE /api/uploads
└── providers/
    ├── cloudinary.provider.ts    Active default
    ├── s3.provider.ts            AWS S3
    └── azure-blob.provider.ts    Azure Blob Storage
```

## Provider Interface

```typescript
interface IStorageProvider {
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}

interface UploadOptions { folder?: string; filename?: string; mimetype?: string }
interface UploadResult  { url: string; publicId: string }
```

## Swapping Providers

Change one env var and restart:

```env
STORAGE_PROVIDER=cloudinary   # default
STORAGE_PROVIDER=s3
STORAGE_PROVIDER=azure
```

The factory (`storage.factory.ts`) instantiates the matching class and caches the singleton for the process lifetime.

## API

### Upload
`POST /api/uploads`
- Auth: Bearer JWT required
- Body: `multipart/form-data`, field `file`
- Query: `?folder=equipment` (optional, default `general`)
- Limits: 5 MB max, JPEG/PNG/WEBP/GIF only
- Response: `{ success: true, data: { url: string, publicId: string } }`

### Delete
`DELETE /api/uploads`
- Auth: Bearer JWT required
- Body: `{ "publicId": "..." }`
- Response: `{ success: true, message: "Image deleted" }`

## Environment Variables

| Variable | Required for |
|---|---|
| `STORAGE_PROVIDER` | all (default: `cloudinary`) |
| `CLOUDINARY_CLOUD_NAME` | cloudinary |
| `CLOUDINARY_API_KEY` | cloudinary |
| `CLOUDINARY_API_SECRET` | cloudinary |
| `AWS_REGION` | s3 |
| `AWS_ACCESS_KEY_ID` | s3 |
| `AWS_SECRET_ACCESS_KEY` | s3 |
| `AWS_S3_BUCKET` | s3 |
| `AZURE_STORAGE_CONNECTION_STRING` | azure |
| `AZURE_STORAGE_CONTAINER` | azure |

## Adding a New Provider

1. Create `src/modules/storage/providers/my-provider.ts` implementing `IStorageProvider`.
2. Add a case to the `switch` in `storage.factory.ts`.
3. Add the required env vars to `env.ts` and `.env.example`.

## Frontend Usage

```tsx
import { FileUpload } from '@/shared/components/FileUpload';

<FileUpload
  folder="equipment"
  onUploadComplete={(url, publicId) => setValue('imageUrl', url)}
/>
```

Hook (headless):

```tsx
import { useFileUpload } from '@/shared/hooks/useFileUpload';

const { upload, isPending, uploadedUrl } = useFileUpload({ folder: 'logos' });
```
