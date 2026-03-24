import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import type { Gender } from '@proximity/shared';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Men' },
  { value: 'FEMALE', label: 'Women' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'OTHER', label: 'Everyone' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    displayName: string;
    birthDate: string;
    gender: string;
  }>();
  const [selected, setSelected] = useState<Gender[]>([]);

  const toggle = (gender: Gender) => {
    setSelected((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { width: '66%' }]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>I'm interested in...</Text>
        <Text style={styles.subtitle}>Select all that apply.</Text>

        <View style={styles.options}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.option, selected.includes(g.value) && styles.optionSelected]}
              onPress={() => toggle(g.value)}
            >
              <Text
                style={[styles.optionText, selected.includes(g.value) && styles.optionTextSelected]}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Next"
          onPress={() =>
            router.push({
              pathname: '/(onboarding)/photos',
              params: { ...params, genderPreferences: selected.join(',') },
            })
          }
          disabled={selected.length === 0}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  progress: { height: 4, backgroundColor: '#EEE' },
  progressBar: { height: 4, backgroundColor: '#FF6B6B' },
  content: { flex: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  options: { gap: 12, marginBottom: 32 },
  option: {
    borderWidth: 2,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionSelected: { borderColor: '#FF6B6B', backgroundColor: '#FFF5F5' },
  optionText: { fontSize: 18, color: '#333' },
  optionTextSelected: { color: '#FF6B6B', fontWeight: '600' },
});
