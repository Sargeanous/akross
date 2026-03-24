import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Proximity</Text>
        <Text style={styles.tagline}>
          Meet people you've actually been near.{'\n'}No more endless scrolling.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Continue with Phone"
          onPress={() => router.push('/(auth)/phone')}
          size="lg"
        />
        <Button
          title="Continue with Email"
          onPress={() => router.push('/(auth)/magic-link')}
          variant="outline"
          size="lg"
        />
      </View>

      <Text style={styles.terms}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 60 },
  logo: { fontSize: 42, fontWeight: '800', color: '#FF6B6B', marginBottom: 16 },
  tagline: { fontSize: 18, color: '#666', textAlign: 'center', lineHeight: 26 },
  actions: { gap: 12 },
  terms: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 24 },
});
