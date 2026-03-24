import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { EncounterQuality } from '@proximity/shared';

const qualityColors: Record<EncounterQuality, string> = {
  HIGH: '#22C55E',
  MEDIUM: '#F59E0B',
  LOW: '#94A3B8',
};

const qualityLabels: Record<EncounterQuality, string> = {
  HIGH: 'Strong',
  MEDIUM: 'Medium',
  LOW: 'Weak',
};

type BadgeProps = {
  quality: EncounterQuality;
};

export function EncounterBadge({ quality }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: qualityColors[quality] }]}>
      <Text style={styles.text}>{qualityLabels[quality]}</Text>
    </View>
  );
}

type CountBadgeProps = { count: number };

export function CountBadge({ count }: CountBadgeProps) {
  if (count <= 0) return null;
  return (
    <View style={styles.countBadge}>
      <Text style={styles.countText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' },
  countBadge: {
    backgroundColor: '#FF6B6B',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
