import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../../../src/stores/session';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';

export default function NearbyScreen() {
  const router = useRouter();
  const { events, isScanning, fetchEvents, isLoading } = useSessionStore();

  useEffect(() => {
    fetchEvents();
  }, []);

  if (isLoading && events.length === 0) {
    return <Loading message="Finding events near you..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Nearby Events</Text>

      {isScanning && (
        <TouchableOpacity
          style={styles.activeSession}
          onPress={() => router.push('/(main)/(nearby)/session')}
        >
          <View style={styles.liveDot} />
          <Text style={styles.activeSessionText}>Session Active — Tap to view</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.eventCard}>
            <Text style={styles.eventName}>{item.name}</Text>
            <Text style={styles.eventVenue}>{item.venueName}</Text>
            <Text style={styles.eventTime}>
              {new Date(item.startsAt).toLocaleDateString()} -{' '}
              {new Date(item.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.eventParticipants}>
              {item._count.sessions} participant{item._count.sessions !== 1 ? 's' : ''}
            </Text>
            {item.description && (
              <Text style={styles.eventDesc} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Button
              title="Join & Start Scanning"
              onPress={() => {
                useSessionStore.getState().startSession(item.id).then(() => {
                  router.push('/(main)/(nearby)/session');
                });
              }}
              disabled={isScanning}
              size="md"
              style={{ marginTop: 12 }}
            />
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No events nearby</Text>
            <Text style={styles.emptySubtitle}>Check back later for upcoming events.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { fontSize: 28, fontWeight: '700', color: '#333', padding: 24, paddingBottom: 8 },
  activeSession: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  activeSessionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { padding: 16, gap: 12 },
  eventCard: { marginBottom: 4 },
  eventName: { fontSize: 20, fontWeight: '700', color: '#333' },
  eventVenue: { fontSize: 15, color: '#666', marginTop: 4 },
  eventTime: { fontSize: 13, color: '#888', marginTop: 4 },
  eventParticipants: { fontSize: 13, color: '#FF6B6B', fontWeight: '500', marginTop: 4 },
  eventDesc: { fontSize: 14, color: '#666', marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  emptySubtitle: { fontSize: 15, color: '#888', marginTop: 8 },
});
