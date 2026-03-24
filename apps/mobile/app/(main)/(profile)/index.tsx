import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../../src/stores/profile';
import { useAuthStore } from '../../../src/stores/auth';
import { Button } from '../../../src/components/ui/Button';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Card } from '../../../src/components/ui/Card';
import { calculateAge } from '@proximity/shared';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const { logout } = useAuthStore();

  if (!profile) return null;

  const age = calculateAge(new Date(profile.birthDate));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>My Profile</Text>

        <View style={styles.photoSection}>
          {profile.photos.length > 0 ? (
            <Image source={{ uri: profile.photos[0].url }} style={styles.mainPhoto} />
          ) : (
            <Avatar name={profile.displayName} size={120} />
          )}
        </View>

        <Text style={styles.name}>
          {profile.displayName}, {age}
        </Text>

        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{profile.gender}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Interested in</Text>
            <Text style={styles.infoValue}>{profile.genderPreferences.join(', ')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Photos</Text>
            <Text style={styles.infoValue}>{profile.photos.length}</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button title="Edit Profile" onPress={() => router.push('/(main)/(profile)/edit')} size="md" />
          <Button
            title="Privacy Settings"
            onPress={() => router.push('/(main)/(profile)/privacy')}
            variant="outline"
            size="md"
          />
          <Button title="Log Out" onPress={logout} variant="danger" size="md" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  scroll: { padding: 24 },
  header: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 24 },
  photoSection: { alignItems: 'center', marginBottom: 16 },
  mainPhoto: { width: 120, height: 120, borderRadius: 60 },
  name: { fontSize: 26, fontWeight: '700', color: '#333', textAlign: 'center' },
  bio: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 16 },
  infoCard: { marginTop: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: { fontSize: 15, color: '#888' },
  infoValue: { fontSize: 15, fontWeight: '500', color: '#333' },
  actions: { marginTop: 24, gap: 12 },
});
