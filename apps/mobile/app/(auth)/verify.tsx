import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/auth';
import { AUTH } from '@proximity/shared';
import type { AuthMethod } from '@proximity/shared';

export default function VerifyScreen() {
  const { target, method } = useLocalSearchParams<{ target: string; method: string }>();
  const { verifyOtp, requestOtp, isLoading, error, clearError } = useAuthStore();
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (code.length !== AUTH.OTP_LENGTH) return;
    clearError();
    await verifyOtp(target!, code, method as AuthMethod);
    // Auth store will update isAuthenticated, root layout will redirect
  };

  const handleResend = async () => {
    clearError();
    await requestOtp(target!, method as AuthMethod);
    setResendTimer(30);
  };

  // Auto-submit when code reaches expected length
  useEffect(() => {
    if (code.length === AUTH.OTP_LENGTH && !isLoading) {
      handleVerify();
    }
  }, [code]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter verification code</Text>
        <Text style={styles.subtitle}>
          We sent a {AUTH.OTP_LENGTH}-digit code to {target}
        </Text>

        <Input
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, AUTH.OTP_LENGTH))}
          placeholder={'0'.repeat(AUTH.OTP_LENGTH)}
          keyboardType="number-pad"
          autoFocus
          maxLength={AUTH.OTP_LENGTH}
          error={error ?? undefined}
          style={styles.codeInput}
        />

        <Button
          title="Verify"
          onPress={handleVerify}
          loading={isLoading}
          disabled={code.length !== AUTH.OTP_LENGTH}
          size="lg"
        />

        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend code in {resendTimer}s</Text>
          ) : (
            <Button
              title="Resend Code"
              onPress={handleResend}
              variant="outline"
              size="sm"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 32 },
  codeInput: { fontSize: 32, textAlign: 'center', letterSpacing: 12 },
  resendRow: { alignItems: 'center', marginTop: 24 },
  resendTimer: { fontSize: 14, color: '#999' },
});
