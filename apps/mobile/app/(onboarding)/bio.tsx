import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useProfileStore } from '../../src/stores/profile';
import { PROFILE } from '@proximity/shared';
import { uploadPhotosFromUris } from '../../src/utils/upload-photo';
import type { Gender } from '@proximity/shared';

export default function BioScreen() {
  const params = useLocalSearchParams<{
    displayName: string;
    birthDate: string;
    gender: string;
    genderPreferences: string;
    photoUris: string;
  }>();
  const { createProfile, isLoading, error } = useProfileStore();
  const [bio, setBio] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFinish = async () => {
    // 1. Create the profile first
    await createProfile({
      displayName: params.displayName!,
      birthDate: params.birthDate!,
      gender: params.gender as Gender,
      genderPreferences: (params.genderPreferences?.split(',') ?? []) as Gender[],
      bio: bio.trim() || undefined,
    });

    // 2. Upload photos via presigned URLs (profile must exist first)
    const photoUris: string[] = params.photoUris ? JSON.parse(params.photoUris) : [];
    if (photoUris.length > 0) {
      setUploadStatus(`Uploading ${photoUris.length} photo${photoUris.length > 1 ? 's' : ''}...`);
      await uploadPhotosFromUris(photoUris);
      setUploadStatus('');
    }
    // Root layout will detect isComplete and redirect to main
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { width: '100%' }]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>About you</Text>
        <Text style={styles.subtitle}>
          Write a short bio. You can always change this later.
        </Text>

        <Input
          value={bio}
          onChangeText={setBio}
          placeholder="I love hiking, coffee, and live music..."
          maxLength={PROFILE.MAX_BIO_LENGTH}
          multiline
          numberOfLines={4}
          style={styles.bioInput}
          error={error ?? undefined}
        />

        <Text style={styles.charCount}>
          {bio.length}/{PROFILE.MAX_BIO_LENGTH}
        </Text>

        <Button
          title="Complete Profile"
          onPress={handleFinish}
          loading={isLoading}
          size="lg"
        />

        <Button
          title="Skip for now"
          onPress={() => {
            setBio('');
            handleFinish();
          }}
          variant="outline"
          size="md"
          style={{ marginTop: 12 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  progress: { height: 4, backgroundColor: '#EEE' },
  progressBar: { height: 4, backgroundColor: '#FF6B6B' },
  content: { flex: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 32 },
  bioInput: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#999', textAlign: 'right', marginBottom: 24 },
});
