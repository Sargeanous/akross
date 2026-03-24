import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { reportApi } from '../../../src/services/api';
import type { Block } from '@proximity/shared';

export default function PrivacyScreen() {
  const router = useRouter();
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    setLoading(true);
    reportApi
      .listBlocks()
      .then(setBlocks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnblock = async (blockId: string) => {
    await reportApi.unblock(blockId);
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button title="Back" onPress={() => router.back()} variant="outline" size="sm" />
        <Text style={styles.title}>Privacy Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocked Users</Text>
        <Text style={styles.sectionSubtitle}>
          Blocked users cannot see your profile or send you messages.
        </Text>

        {blocks.length === 0 ? (
          <Text style={styles.emptyText}>No blocked users.</Text>
        ) : (
          <FlatList
            data={blocks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={styles.blockCard}>
                <Text style={styles.blockUser}>User: {item.blockedId.slice(0, 12)}...</Text>
                <Button
                  title="Unblock"
                  onPress={() => handleUnblock(item.id)}
                  variant="outline"
                  size="sm"
                />
              </Card>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: { fontSize: 18, fontWeight: '600', color: '#333' },
  section: { padding: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  emptyText: { fontSize: 15, color: '#999', fontStyle: 'italic' },
  blockCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockUser: { fontSize: 15, color: '#333' },
});
