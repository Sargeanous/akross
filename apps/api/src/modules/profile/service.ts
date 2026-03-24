import { calculateAge, PROFILE } from '@proximity/shared';
import { getPrisma } from '../../config/prisma.js';
import { createPresignedUploadUrl } from '../../config/s3.js';
import crypto from 'node:crypto';
import { getModerationProvider } from '../../providers/moderation.js';

const prisma = getPrisma();

export async function createProfile(userId: string, data: {
  displayName: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
  genderPreferences: Array<'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER'>;
  bio?: string;
}) {
  const birthDate = new Date(data.birthDate);
  const age = calculateAge(birthDate);

  if (age < PROFILE.MIN_AGE) {
    throw new ProfileError(`You must be at least ${PROFILE.MIN_AGE} years old.`);
  }

  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) {
    throw new ProfileError('Profile already exists.');
  }

  return prisma.profile.create({
    data: {
      userId,
      displayName: data.displayName,
      birthDate,
      gender: data.gender,
      genderPreferences: data.genderPreferences,
      bio: data.bio ?? null,
      isComplete: true,
    },
    include: { photos: true },
  });
}

export async function getMyProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { photos: { orderBy: { position: 'asc' } } },
  });
  if (!profile) throw new ProfileError('Profile not found.');
  return profile;
}

export async function updateProfile(userId: string, data: {
  displayName?: string;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
  genderPreferences?: Array<'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER'>;
  bio?: string | null;
}) {
  return prisma.profile.update({
    where: { userId },
    data,
    include: { photos: { orderBy: { position: 'asc' } } },
  });
}

/**
 * Presigned URL flow: we generate a unique S3 key, return the presigned PUT URL,
 * and create the ProfilePhoto record pointing to the final URL.
 * The client uploads directly to S3.
 */
export async function createPhotoUpload(userId: string, contentType: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { photos: true },
  });

  if (!profile) throw new ProfileError('Profile not found.');
  if (profile.photos.length >= PROFILE.MAX_PHOTOS) {
    throw new ProfileError(`Maximum ${PROFILE.MAX_PHOTOS} photos allowed.`);
  }

  const key = `photos/${userId}/${crypto.randomUUID()}.${extensionFromMime(contentType)}`;
  const uploadUrl = await createPresignedUploadUrl(key, contentType);

  const photo = await prisma.profilePhoto.create({
    data: {
      profileId: profile.id,
      url: key,
      position: profile.photos.length,
    },
  });

  // Schedule background moderation (non-blocking)
  getModerationProvider()
    .checkPhoto(key)
    .then((result) => {
      if (!result.approved) {
        console.warn(`Photo moderation flagged: ${key}`, result);
      }
    })
    .catch((err) => {
      console.error('Photo moderation check failed:', err);
    });

  return { photo, uploadUrl };
}

export async function deletePhoto(userId: string, photoId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw new ProfileError('Profile not found.');

  const photo = await prisma.profilePhoto.findFirst({
    where: { id: photoId, profileId: profile.id },
  });
  if (!photo) throw new ProfileError('Photo not found.');

  await prisma.profilePhoto.delete({ where: { id: photoId } });
  return { deleted: true };
}

/**
 * Get another user's profile — only if the requesting user has a verified encounter with them.
 * This enforces the "encounters first" principle.
 */
export async function getProfileById(requestingUserId: string, targetUserId: string) {
  // Check for a verified encounter between these users
  const encounter = await prisma.encounter.findFirst({
    where: {
      OR: [
        { userAId: requestingUserId, userBId: targetUserId },
        { userAId: targetUserId, userBId: requestingUserId },
      ],
    },
  });

  if (!encounter) {
    throw new ProfileError('You can only view profiles of people you have encountered.');
  }

  // Check if blocked
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: requestingUserId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: requestingUserId },
      ],
    },
  });

  if (blocked) {
    throw new ProfileError('Profile not available.');
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: targetUserId },
    include: { photos: { orderBy: { position: 'asc' } } },
  });

  if (!profile) throw new ProfileError('Profile not found.');

  // Never expose exact birth date to other users — only age
  const { birthDate, ...safeProfile } = profile;
  return { ...safeProfile, age: calculateAge(birthDate) };
}

function extensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
  };
  return map[mime] || 'jpg';
}

// ─── Device Token Management ────────────────────────────────────────────────

export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: 'IOS' | 'ANDROID',
) {
  // Upsert: if token already exists (maybe for a different user after logout/login), reassign it
  const deviceToken = await prisma.deviceToken.upsert({
    where: { token },
    create: { userId, token, platform },
    update: { userId, platform },
  });
  return { id: deviceToken.id, registered: true };
}

export async function removeDeviceToken(userId: string, token: string) {
  await prisma.deviceToken.deleteMany({
    where: { userId, token },
  });
}

export class ProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileError';
  }
}
