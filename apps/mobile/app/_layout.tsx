import React from 'react';
import { View, Text } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF6B6B' }}>
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>Proximity</Text>
      <Text style={{ color: '#fff', fontSize: 16, marginTop: 8 }}>Hello World - Debug</Text>
    </View>
  );
}
