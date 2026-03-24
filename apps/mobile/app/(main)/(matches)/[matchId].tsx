import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../src/components/ui/Button';

export default function MatchDetailScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Match Detail</Text>
        <Text style={styles.subtitle}>Match ID: {matchId}</Text>

        <Button
          title="Go to Chat"
          onPress={() => router.push(`/(main)/(chat)/${matchId}`)}
          size="lg"
          style={{ marginTop: 24 }}
        />

        <Button
          title="Report User"
          onPress={() => router.push(`/report/${matchId}`)}
          variant="outline"
          size="sm"
          style={{ marginTop: 12 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  content: { padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#333' },
  subtitle: { fontSize: 15, color: '#888', marginTop: 8 },
});
