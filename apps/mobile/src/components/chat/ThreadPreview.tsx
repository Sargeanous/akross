import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { CountBadge } from '../ui/Badge';

type ThreadPreviewProps = {
  displayName: string;
  photoUrl: string | null;
  lastMessage: string | null;
  unreadCount: number;
  time: string | null;
  onPress: () => void;
};

export function ThreadPreview({
  displayName,
  photoUrl,
  lastMessage,
  unreadCount,
  time,
  onPress,
}: ThreadPreviewProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Avatar uri={photoUrl} name={displayName} size={52} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          {time && <Text style={styles.time}>{time}</Text>}
        </View>
        <View style={styles.footer}>
          <Text style={styles.message} numberOfLines={1}>
            {lastMessage ?? 'Say hello!'}
          </Text>
          <CountBadge count={unreadCount} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1 },
  time: { fontSize: 12, color: '#999' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  message: { fontSize: 14, color: '#888', flex: 1, marginRight: 8 },
});
