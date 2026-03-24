import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF6B6B' }}>
      <Text style={{ color: '#fff', fontSize: 42, fontWeight: '800' }}>Proximity</Text>
      <Text style={{ color: '#fff', fontSize: 18, marginTop: 12 }}>Welcome! The app is rendering.</Text>
      <Text
        style={{ color: '#fff', fontSize: 16, marginTop: 24, textDecorationLine: 'underline' }}
        onPress={() => router.push('/(auth)/welcome')}
      >
        Go to Login
      </Text>
    </View>
  );
}
