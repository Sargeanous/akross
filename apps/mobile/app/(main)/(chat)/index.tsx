import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useChatStore } from '../../../src/stores/chat';
import { ThreadPreview } from '../../../src/components/chat/ThreadPreview';
import { Loading } from '../../../src/components/ui/Loading';
import { timeAgo } from '@proximity/shared';

export default function ChatListScreen() {
  const router = useRouter();
  const { threads, fetchThreads, isLoading } = useChatStore();

  useEffect(() => {
    fetchThreads();
  }, []);

  if (isLoading && threads.length === 0) {
    return <Loading message="Loading conversations..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Messages</Text>

      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThreadPreview
            displayName={item.otherUserId.slice(0, 8)}
            photoUrl={null}
            lastMessage={item.lastMessage?.content ?? null}
            unreadCount={item.unreadCount}
            time={item.lastMessageAt ? timeAgo(new Date(item.lastMessageAt)) : null}
            onPress={() => router.push(`/(main)/(chat)/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Match with someone to start chatting!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: '700', color: '#333', padding: 24, paddingBottom: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  emptySubtitle: { fontSize: 15, color: '#888', marginTop: 8, textAlign: 'center' },
});
