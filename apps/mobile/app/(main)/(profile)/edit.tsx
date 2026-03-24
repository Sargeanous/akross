import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useProfileStore } from '../../../src/stores/profile';
import { PROFILE } from '@proximity/shared';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, isLoading } = useProfileStore();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');

  const handleSave = async () => {
    await updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim() || null,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Button title="Cancel" onPress={() => router.back()} variant="outline" size="sm" />
          <Text style={styles.title}>Edit Profile</Text>
          <Button title="Save" onPress={handleSave} loading={isLoading} size="sm" />
        </View>

        <Input
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={PROFILE.MAX_DISPLAY_NAME_LENGTH}
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          maxLength={PROFILE.MAX_BIO_LENGTH}
          multiline
          numberOfLines={4}
          style={{ height: 120, textAlignVertical: 'top' }}
        />
        <Text style={styles.charCount}>
          {bio.length}/{PROFILE.MAX_BIO_LENGTH}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#333' },
  charCount: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: -12, marginBottom: 16 },
});
