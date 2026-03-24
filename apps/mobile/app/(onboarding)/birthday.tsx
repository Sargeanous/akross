import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { calculateAge, PROFILE } from '@proximity/shared';

export default function BirthdayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ displayName: string }>();
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) {
      setError('Please enter a valid date (YYYY-MM-DD).');
      return;
    }
    const age = calculateAge(date);
    if (age < PROFILE.MIN_AGE) {
      setError(`You must be at least ${PROFILE.MIN_AGE} years old to use Proximity.`);
      return;
    }
    router.push({
      pathname: '/(onboarding)/gender',
      params: { ...params, birthDate },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { width: '33%' }]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>When's your birthday?</Text>
        <Text style={styles.subtitle}>You must be 18+ to use Proximity.</Text>

        <Input
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          autoFocus
          error={error ?? undefined}
        />

        <Button title="Next" onPress={handleNext} disabled={!birthDate.trim()} size="lg" />
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
  subtitle: { fontSize: 16, color: '#888', marginBottom: 32 },
});
