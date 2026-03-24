import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useChatStore } from '../../src/stores/chat';

export default function MainTabLayout() {
  const { connectWs, disconnectWs } = useChatStore();

  // Connect WebSocket when entering the main app
  useEffect(() => {
    connectWs();
    return () => disconnectWs();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { borderTopColor: '#EEE' },
      }}
    >
      <Tabs.Screen
        name="(nearby)"
        options={{
          title: 'Nearby',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{"📡"}</Text>,
        }}
      />
      <Tabs.Screen
        name="(feed)"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{"💫"}</Text>,
        }}
      />
      <Tabs.Screen
        name="(matches)"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{"💕"}</Text>,
        }}
      />
      <Tabs.Screen
        name="(chat)"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{"💬"}</Text>,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{"👤"}</Text>,
        }}
      />
    </Tabs>
  );
}
