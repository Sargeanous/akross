import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type SessionStatusProps = {
  isActive: boolean;
  observationCount: number;
  elapsedSeconds: number;
  remainingTokens: number;
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SessionStatus({
  isActive,
  observationCount,
  elapsedSeconds,
  remainingTokens,
}: SessionStatusProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.dot, isActive ? styles.dotActive : styles.dotInactive]} />
        <Text style={styles.statusText}>
          {isActive ? 'Scanning for nearby people...' : 'Session inactive'}
        </Text>
      </View>

      {isActive && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{observationCount}</Text>
            <Text style={styles.statLabel}>Tokens Heard</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatElapsed(elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>Elapsed</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{remainingTokens}</Text>
            <Text style={styles.statLabel}>Tokens Left</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotActive: { backgroundColor: '#22C55E' },
  dotInactive: { backgroundColor: '#94A3B8' },
  statusText: { fontSize: 16, fontWeight: '500', color: '#333' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#FF6B6B' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
});
