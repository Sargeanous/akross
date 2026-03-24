import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnv } from './env.js';

let _s3: S3Client | null = null;

export function getS3(): S3Client {
  if (!_s3) {
    const env = getEnv();
    _s3 = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      forcePathStyle: true, // Required for MinIO and most S3-compatible stores
    });
  }
  return _s3;
}

/**
 * Generate a presigned URL for uploading a profile photo.
 * The client uploads directly to S3; we never handle the file bytes.
 */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const env = getEnv();
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3(), command, { expiresIn: 300 });
}
