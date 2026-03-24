import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { reportApi } from '../../src/services/api';
import type { ReportReason } from '@proximity/shared';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'FAKE_PROFILE', label: 'Fake Profile' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
  { value: 'UNDERAGE', label: 'Underage User' },
  { value: 'OTHER', label: 'Other' },
];

export default function ReportScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await reportApi.create({
        reportedId: userId!,
        reason,
        description: description.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlock = async () => {
    await reportApi.block(userId!);
    router.back();
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Report Submitted</Text>
          <Text style={styles.subtitle}>
            Thank you for helping keep Proximity safe. We'll review your report.
          </Text>
          <Button title="Block This User" onPress={handleBlock} variant="danger" size="lg" style={{ marginTop: 24 }} />
          <Button title="Done" onPress={() => router.back()} variant="outline" size="lg" style={{ marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Report User</Text>
        <Text style={styles.subtitle}>Why are you reporting this person?</Text>

        <View style={styles.reasons}>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.reasonOption, reason === r.value && styles.reasonSelected]}
              onPress={() => setReason(r.value)}
            >
              <Text style={[styles.reasonText, reason === r.value && styles.reasonTextSelected]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Additional details (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what happened..."
          multiline
          numberOfLines={4}
          maxLength={1000}
          style={{ height: 100, textAlignVertical: 'top' }}
        />

        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!reason}
          size="lg"
        />

        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          size="md"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  reasons: { gap: 8, marginBottom: 24 },
  reasonOption: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  reasonSelected: { borderColor: '#E53E3E', backgroundColor: '#FFF5F5' },
  reasonText: { fontSize: 16, color: '#333' },
  reasonTextSelected: { color: '#E53E3E', fontWeight: '600' },
});
