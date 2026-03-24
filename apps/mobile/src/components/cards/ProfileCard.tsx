import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { EncounterBadge } from '../ui/Badge';
import type { EncounterQuality } from '@proximity/shared';

type ProfileCardProps = {
  displayName: string;
  photoUrl: string | null;
  eventName: string;
  quality?: EncounterQuality;
  subtitle?: string;
};

export function ProfileCard({ displayName, photoUrl, eventName, quality, subtitle }: ProfileCardProps) {
  return (
    <View style={styles.card}>
      <Avatar uri={photoUrl} name={displayName} size={56} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.event} numberOfLines={1}>{subtitle ?? `Met at ${eventName}`}</Text>
      </View>
      {quality && <EncounterBadge quality={quality} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  event: { fontSize: 13, color: '#888', marginTop: 2 },
});
