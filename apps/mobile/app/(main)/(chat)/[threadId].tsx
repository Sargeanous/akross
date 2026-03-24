import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChatStore } from '../../../src/stores/chat';
import { useAuthStore } from '../../../src/stores/auth';
import { MessageBubble } from '../../../src/components/chat/MessageBubble';
import { ChatInput } from '../../../src/components/chat/ChatInput';
import { Loading } from '../../../src/components/ui/Loading';
import { Button } from '../../../src/components/ui/Button';

export default function ChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();
  const { messages, openThread, sendMessage, markRead, loadMoreMessages, hasMore, isLoading } =
    useChatStore();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (threadId) {
      openThread(threadId);
      markRead(threadId);
    }
  }, [threadId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button title="Back" onPress={() => router.back()} variant="outline" size="sm" />
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {isLoading && messages.length === 0 ? (
          <Loading message="Loading messages..." />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onStartReached={() => hasMore && loadMoreMessages()}
            onStartReachedThreshold={0.5}
            renderItem={({ item }) => (
              <MessageBubble
                content={item.content}
                isOwn={item.senderId === user?.id}
                time={formatTime(item.createdAt)}
                isRead={!!item.readAt}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Say hello!</Text>
              </View>
            }
          />
        )}

        <ChatInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  messageList: { padding: 8, paddingBottom: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, color: '#888' },
});
