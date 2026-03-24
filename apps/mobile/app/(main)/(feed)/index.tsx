import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useEncounterStore } from '../../../src/stores/encounter';
import { useProfileStore } from '../../../src/stores/profile';
import { SwipeCard } from '../../../src/components/cards/SwipeCard';
import { Button } from '../../../src/components/ui/Button';
import { Modal } from '../../../src/components/ui/Modal';
import { Loading } from '../../../src/components/ui/Loading';
import { profileApi } from '../../../src/services/api';

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
  const [cardProfile, setCardProfile] = useState<{
    displayName: string;
    age: number;
    bio: string | null;
    photos: Array<{ url: string }>;
  } | null>(null);

  useEffect(() => {
    fetchEncounters();
  }, []);

  // Load profile for current card
  const currentCard = encounters[currentIndex];
  useEffect(() => {
    if (!currentCard) {
      setCardProfile(null);
      return;
    }
    profileApi
      .getById(currentCard.otherUserId)
      .then(setCardProfile)
      .catch(() => setCardProfile(null));
  }, [currentCard?.otherUserId]);

  if (isLoading && encounters.length === 0) {
    return <Loading message="Finding your encounters..." />;
  }

  const handleSwipe = async (direction: 'LIKE' | 'PASS') => {
    try {
      await swipe(direction);
    } catch (err: any) {
      console.error('Swipe failed:', err);
    }
  };

  const noMoreCards = currentIndex >= encounters.length;

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
        <View style={styles.cardContainer}>
          {currentCard && cardProfile && (
            <SwipeCard
              displayName={cardProfile.displayName}
              age={cardProfile.age}
              bio={cardProfile.bio}
              photoUrl={cardProfile.photos[0]?.url ?? null}
              quality={currentCard.quality}
              eventName={currentCard.eventName}
            />
          )}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.passButton} onPress={() => handleSwipe('PASS')}>
              <Text style={styles.buttonEmoji}>{"👎"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.likeButton} onPress={() => handleSwipe('LIKE')}>
              <Text style={styles.buttonEmoji}>{"👍"}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  cardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 24,
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonEmoji: { fontSize: 28 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: '#333' },
  emptySubtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 8 },
  matchText: { fontSize: 16, color: '#666', textAlign: 'center' },
});
