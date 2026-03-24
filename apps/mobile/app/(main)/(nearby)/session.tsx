import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../../../src/stores/session';
import { SessionStatus } from '../../../src/components/ble/SessionStatus';
import { ScanningAnimation } from '../../../src/components/ble/ScanningAnimation';
import { Button } from '../../../src/components/ui/Button';
import { Modal } from '../../../src/components/ui/Modal';
import { sessionOrchestrator } from '../../../src/services/ble/session-manager';

export default function SessionScreen() {
  const router = useRouter();
  const { isScanning, observationCount, stopSession, refreshCount, isLoading } = useSessionStore();
  const [elapsed, setElapsed] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<{ observationCount: number; uploaded: boolean } | null>(null);

  // Timer for elapsed time
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
      refreshCount();
    }, 1000);
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleStop = async () => {
    const result = await stopSession();
    setSummary(result);
    setShowSummary(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Proximity Session</Text>

      <View style={styles.animationContainer}>
        <ScanningAnimation isActive={isScanning} size={220} />
      </View>

      <SessionStatus
        isActive={isScanning}
        observationCount={observationCount}
        elapsedSeconds={elapsed}
        remainingTokens={sessionOrchestrator.remainingTokens}
      />

      <View style={styles.actions}>
        {isScanning ? (
          <Button title="Stop Session" onPress={handleStop} variant="danger" size="lg" loading={isLoading} />
        ) : (
          <Button title="Back to Events" onPress={() => router.back()} size="lg" />
        )}
      </View>

      <Modal
        visible={showSummary}
        onClose={() => {
          setShowSummary(false);
          router.back();
        }}
        title="Session Complete"
      >
        <Text style={styles.summaryText}>
          Observed {summary?.observationCount ?? 0} tokens from nearby people.
        </Text>
        <Text style={styles.summarySubtext}>
          {summary?.uploaded
            ? 'Observations uploaded! Check your feed for new encounters soon.'
            : 'Upload pending — we\'ll retry when you\'re back online.'}
        </Text>
        <Button
          title="View Encounters"
          onPress={() => {
            setShowSummary(false);
            router.replace('/(main)/(feed)/');
          }}
          size="lg"
          style={{ marginTop: 16 }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8', padding: 24 },
  header: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 16 },
  animationContainer: { alignItems: 'center', marginVertical: 32 },
  actions: { marginTop: 32 },
  summaryText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  summarySubtext: { fontSize: 15, color: '#666' },
});
