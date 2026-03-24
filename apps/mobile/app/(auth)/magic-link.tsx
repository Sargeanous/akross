import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/auth';

export default function MagicLinkScreen() {
  const router = useRouter();
  const { requestOtp, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    clearError();
    await requestOtp(email.trim(), 'EMAIL');
    setSent(true);
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a magic link to {email}. Tap the link in the email to sign in.
          </Text>
          <Text style={styles.hint}>
            Didn't receive it? Check your spam folder.
          </Text>

          <Button
            title="Enter Code Manually"
            onPress={() =>
              router.push({
                pathname: '/(auth)/verify',
                params: { target: email.trim(), method: 'EMAIL' },
              })
            }
            variant="outline"
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your email</Text>
        <Text style={styles.subtitle}>
          We'll send you a magic link to sign in.
        </Text>

        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
          error={error ?? undefined}
        />

        <Button
          title="Send Magic Link"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!email.trim()}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 32 },
  hint: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 24 },
});
