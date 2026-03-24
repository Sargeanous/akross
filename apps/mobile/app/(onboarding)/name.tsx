import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { PROFILE } from '@proximity/shared';

export default function NameScreen() {
  const router = useRouter();
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { width: '16%' }]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>What's your first name?</Text>
        <Text style={styles.subtitle}>This is how you'll appear to others.</Text>

        <Input
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          maxLength={PROFILE.MAX_DISPLAY_NAME_LENGTH}
          autoFocus
        />

        <Button
          title="Next"
          onPress={() =>
            router.push({ pathname: '/(onboarding)/birthday', params: { displayName: name.trim() } })
          }
          disabled={!name.trim()}
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
  subtitle: { fontSize: 16, color: '#888', marginBottom: 32 },
});
