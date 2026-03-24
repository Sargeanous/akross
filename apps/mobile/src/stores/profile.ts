import { create } from 'zustand';
import type { Profile, ProfilePhoto, Gender } from '@proximity/shared';
import { profileApi } from '../services/api';

type ProfileWithPhotos = Profile & { photos: ProfilePhoto[] };

type ProfileState = {
  profile: ProfileWithPhotos | null;
  isLoading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  createProfile: (data: {
    displayName: string;
    birthDate: string;
    gender: Gender;
    genderPreferences: Gender[];
    bio?: string;
  }) => Promise<void>;
  updateProfile: (data: Partial<{
    displayName: string;
    gender: Gender;
    genderPreferences: Gender[];
    bio: string | null;
  }>) => Promise<void>;
  uploadPhoto: (contentType: string) => Promise<{ uploadUrl: string }>;
  deletePhoto: (photoId: string) => Promise<void>;
  clearProfile: () => void;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await profileApi.getMe();
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  createProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await profileApi.create(data);
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await profileApi.update(data);
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  uploadPhoto: async (contentType) => {
    const result = await profileApi.uploadPhoto(contentType);
    // Refresh profile to get updated photos list
    const profile = await profileApi.getMe();
    set({ profile });
    return { uploadUrl: result.uploadUrl };
  },

  deletePhoto: async (photoId) => {
    await profileApi.deletePhoto(photoId);
    const profile = await profileApi.getMe();
    set({ profile });
  },

  clearProfile: () => set({ profile: null, error: null }),
}));
