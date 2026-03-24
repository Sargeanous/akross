import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { EncounterBadge } from '../ui/Badge';
import type { EncounterQuality } from '@proximity/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

type SwipeCardProps = {
  displayName: string;
  age: number;
  bio: string | null;
  photoUrl: string | null;
  quality: EncounterQuality;
  eventName: string;
};

export function SwipeCard({ displayName, age, bio, photoUrl, quality, eventName }: SwipeCardProps) {
  return (
    <View style={styles.card}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>{displayName[0]}</Text>
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.badgeRow}>
          <EncounterBadge quality={quality} />
          <View style={styles.eventTag}>
            <Text style={styles.eventText}>{eventName}</Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>
            {displayName}, {age}
          </Text>
          {bio && <Text style={styles.bio} numberOfLines={2}>{bio}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: { fontSize: 80, color: '#fff', fontWeight: '700' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 60,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  eventTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  info: {},
  name: { fontSize: 28, fontWeight: '700', color: '#fff' },
  bio: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
});
