import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

type LoadingProps = {
  message?: string;
};

export function Loading({ message }: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B6B" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { marginTop: 16, fontSize: 16, color: '#666' },
});
