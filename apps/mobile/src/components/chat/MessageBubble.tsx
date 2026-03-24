import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type MessageBubbleProps = {
  content: string;
  isOwn: boolean;
  time: string;
  isRead?: boolean;
};

export function MessageBubble({ content, isOwn, time, isRead }: MessageBubbleProps) {
  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.text, isOwn && styles.textOwn]}>{content}</Text>
        <Text style={[styles.time, isOwn && styles.timeOwn]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 2, paddingHorizontal: 12 },
  rowOwn: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOwn: { backgroundColor: '#FF6B6B', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#F0F0F0', borderBottomLeftRadius: 4 },
  text: { fontSize: 16, color: '#333', lineHeight: 22 },
  textOwn: { color: '#fff' },
  time: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right' },
  timeOwn: { color: 'rgba(255,255,255,0.7)' },
});
