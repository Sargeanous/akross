import React, { useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { Loading } from '../src/components/ui/Loading';
import { useProfileStore } from '../src/stores/profile';

/**
 * Root layout — auth gate.
 *
 * Determines which route group to show based on auth state:
 * - Not authenticated → (auth) group
 * - Authenticated but no profile → (onboarding) group
 * - Authenticated with profile → (main) group
 */
export default function RootLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !profile) {
      fetchProfile().catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && !profile?.isComplete && !inOnboardingGroup) {
      router.replace('/(onboarding)/name');
    } else if (isAuthenticated && profile?.isComplete && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(main)/(nearby)/');
    }
  }, [isAuthenticated, isLoading, profile, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF6B6B' }}>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>Proximity</Text>
        <Text style={{ color: '#fff', fontSize: 16, marginTop: 8 }}>Loading... (Platform: {Platform.OS})</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(main)" />
      <Stack.Screen name="report/[userId]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
