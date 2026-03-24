import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMatchStore } from '../../../src/stores/match';
import { ProfileCard } from '../../../src/components/cards/ProfileCard';
import { Loading } from '../../../src/components/ui/Loading';
import { TouchableOpacity } from 'react-native';

export default function MatchesScreen() {
  const router = useRouter();
  const { matches, fetchMatches, isLoading } = useMatchStore();

  useEffect(() => {
    fetchMatches();
  }, []);

  if (isLoading && matches.length === 0) {
    return <Loading message="Loading matches..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Your Matches</Text>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              if (item.chatThreadId) {
                router.push(`/(main)/(chat)/${item.chatThreadId}`);
              }
            }}
          >
            <ProfileCard
              displayName={item.otherUserId.slice(0, 8)}
              photoUrl={null}
              eventName={item.eventName}
              quality={item.encounterQuality}
              subtitle={item.lastMessageAt ? 'Tap to chat' : 'New match! Say hello'}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptySubtitle}>
              Attend events and swipe on people you've been near!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { fontSize: 28, fontWeight: '700', color: '#333', padding: 24, paddingBottom: 12 },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  emptySubtitle: { fontSize: 15, color: '#888', marginTop: 8, textAlign: 'center' },
});
