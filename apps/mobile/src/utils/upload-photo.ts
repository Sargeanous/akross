import { profileApi } from '../services/api';

/**
 * Upload a photo to S3 via the presigned URL flow:
 * 1. Request a presigned upload URL from the API
 * 2. Read the local image file as a blob
 * 3. PUT the blob directly to S3
 *
 * The API creates the ProfilePhoto record pointing to the S3 key,
 * so after upload the photo is immediately visible in the profile.
 */
export async function uploadPhotoFromUri(uri: string): Promise<{ photoId: string }> {
  // Determine content type from URI extension
  const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
  };
  const contentType = mimeMap[extension] ?? 'image/jpeg';

  // 1. Get presigned URL from the API
  const { photo, uploadUrl } = await profileApi.uploadPhoto(contentType);

  // 2. Fetch the local file as a blob
  const response = await fetch(uri);
  const blob = await response.blob();

  // 3. PUT directly to S3
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Photo upload failed: ${uploadResponse.status}`);
  }

  return { photoId: photo.id };
}

/**
 * Upload multiple photos sequentially.
 * Returns the IDs of successfully uploaded photos.
 */
export async function uploadPhotosFromUris(uris: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const uri of uris) {
    try {
      const { photoId } = await uploadPhotoFromUri(uri);
      ids.push(photoId);
    } catch (err) {
      console.error(`Failed to upload photo: ${uri}`, err);
      // Continue uploading remaining photos
    }
  }
  return ids;
}
