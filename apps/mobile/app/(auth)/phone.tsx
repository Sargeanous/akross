import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/auth';

export default function PhoneScreen() {
  const router = useRouter();
  const { requestOtp, isLoading, error, clearError } = useAuthStore();
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!phone.trim()) return;
    clearError();
    await requestOtp(phone.trim(), 'PHONE');
    router.push({
      pathname: '/(auth)/verify',
      params: { target: phone.trim(), method: 'PHONE' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your phone number</Text>
        <Text style={styles.subtitle}>
          We'll send you a verification code via SMS.
        </Text>

        <Input
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 000-0000"
          keyboardType="phone-pad"
          autoFocus
          error={error ?? undefined}
        />

        <Button
          title="Send Code"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!phone.trim()}
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
});
