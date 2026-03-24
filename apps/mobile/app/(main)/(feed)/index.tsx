import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEncounterStore } from '../../../src/stores/encounter';
import { SwipeCard } from '../../../src/components/cards/SwipeCard';
import { SwipeableCard } from '../../../src/components/cards/SwipeableCard';
import { Button } from '../../../src/components/ui/Button';
import { Modal } from '../../../src/components/ui/Modal';
import { Loading } from '../../../src/components/ui/Loading';
import { profileApi } from '../../../src/services/api';

type LoadedProfile = {
  displayName: string;
  age: number;
  bio: string | null;
  photos: Array<{ url: string }>;
};

export default function FeedScreen() {
  const {
    encounters,
    currentIndex,
    fetchEncounters,
    swipe,
    lastMatchId,
    clearMatchCelebration,
    isLoading,
  } = useEncounterStore();
  const [profiles, setProfiles] = useState<Record<string, LoadedProfile>>({});
  const [swiping, setSwiping] = useState(false);

  useEffect(() => {
    fetchEncounters();
  }, []);

  // Pre-load profiles for current and next cards
  useEffect(() => {
    const toLoad = encounters.slice(currentIndex, currentIndex + 3);
    for (const card of toLoad) {
      if (!profiles[card.otherUserId]) {
        profileApi
          .getById(card.otherUserId)
          .then((profile) =>
            setProfiles((prev) => ({ ...prev, [card.otherUserId]: profile })),
          )
          .catch(() => {});
      }
    }
  }, [currentIndex, encounters]);

  const handleSwipe = useCallback(
    async (direction: 'LIKE' | 'PASS') => {
      if (swiping) return;
      setSwiping(true);
      try {
        await swipe(direction);
      } catch (err: any) {
        console.error('Swipe failed:', err);
      } finally {
        setSwiping(false);
      }
    },
    [swipe, swiping],
  );

  if (isLoading && encounters.length === 0) {
    return <Loading message="Finding your encounters..." />;
  }

  const noMoreCards = currentIndex >= encounters.length;

  // Render up to 3 stacked cards (bottom card first for correct z-order)
  const visibleCards = encounters.slice(currentIndex, currentIndex + 3).reverse();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>People You've Been Near</Text>

      {noMoreCards ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No more encounters</Text>
          <Text style={styles.emptySubtitle}>
            Attend more events to discover new people nearby.
          </Text>
          <Button
            title="Refresh"
            onPress={fetchEncounters}
            variant="outline"
            size="md"
            style={{ marginTop: 24 }}
          />
        </View>
      ) : (
        <GestureHandlerRootView style={styles.gestureRoot}>
          <View style={styles.cardStack}>
            {visibleCards.map((card, reversedIndex) => {
              const stackIndex = visibleCards.length - 1 - reversedIndex;
              const isTop = stackIndex === 0;
              const profile = profiles[card.otherUserId];

              return (
                <SwipeableCard
                  key={card.id}
                  enabled={isTop && !swiping}
                  onSwipeRight={() => handleSwipe('LIKE')}
                  onSwipeLeft={() => handleSwipe('PASS')}
                >
                  <View style={[styles.stackedCard, { transform: [{ scale: 1 - stackIndex * 0.04 }, { translateY: stackIndex * -8 }] }]}>
                    {profile ? (
                      <SwipeCard
                        displayName={profile.displayName}
                        age={profile.age}
                        bio={profile.bio}
                        photoUrl={profile.photos[0]?.url ?? null}
                        quality={card.quality}
                        eventName={card.eventName}
                      />
                    ) : (
                      <SwipeCard
                        displayName="..."
                        age={0}
                        bio={null}
                        photoUrl={null}
                        quality={card.quality}
                        eventName={card.eventName}
                      />
                    )}
                  </View>
                </SwipeableCard>
              );
            })}
          </View>

          {/* Button fallback for accessibility */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.passButton}
              onPress={() => handleSwipe('PASS')}
              disabled={swiping}
            >
              <Text style={styles.buttonIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => handleSwipe('LIKE')}
              disabled={swiping}
            >
              <Text style={styles.buttonIcon}>♥</Text>
            </TouchableOpacity>
          </View>
        </GestureHandlerRootView>
      )}

      {/* Match celebration modal */}
      <Modal visible={!!lastMatchId} onClose={clearMatchCelebration} title="It's a Match!">
        <Text style={styles.matchText}>
          You both liked each other! Start a conversation now.
        </Text>
        <Button
          title="Send a Message"
          onPress={clearMatchCelebration}
          size="lg"
          style={{ marginTop: 16 }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { fontSize: 24, fontWeight: '700', color: '#333', padding: 24, paddingBottom: 8 },
  gestureRoot: { flex: 1 },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedCard: {},
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    paddingBottom: 32,
    paddingTop: 16,
  },
  passButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#FF5252',
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: { fontSize: 28, color: '#fff', fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: '#333' },
  emptySubtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 8 },
  matchText: { fontSize: 16, color: '#666', textAlign: 'center' },
});
