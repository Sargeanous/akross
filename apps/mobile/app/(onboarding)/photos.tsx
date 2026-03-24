import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../src/components/ui/Button';
import { PROFILE } from '@proximity/shared';
import { profileApi } from '../../src/services/api';

export default function PhotosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    if (photos.length >= PROFILE.MAX_PHOTOS) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    // Pass photo URIs to the bio screen — they'll be uploaded after profile creation
    router.push({
      pathname: '/(onboarding)/bio',
      params: { ...params, photoUris: JSON.stringify(photos) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { width: '83%' }]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>
          Add at least 1 photo (up to {PROFILE.MAX_PHOTOS}).
        </Text>

        <View style={styles.grid}>
          {photos.map((uri, i) => (
            <TouchableOpacity key={i} style={styles.photoSlot} onPress={() => removePhoto(i)}>
              <Image source={{ uri }} style={styles.photo} />
              <View style={styles.removeButton}>
                <Text style={styles.removeText}>-</Text>
              </View>
            </TouchableOpacity>
          ))}
          {photos.length < PROFILE.MAX_PHOTOS && (
            <TouchableOpacity style={styles.addSlot} onPress={pickImage}>
              <Text style={styles.addIcon}>+</Text>
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          title="Next"
          onPress={handleNext}
          disabled={photos.length === 0}
          loading={uploading}
          size="lg"
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
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  photoSlot: { width: '30%', aspectRatio: 3 / 4, borderRadius: 12, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  addSlot: {
    width: '30%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { fontSize: 32, color: '#999' },
  addText: { fontSize: 12, color: '#999', marginTop: 4 },
});
