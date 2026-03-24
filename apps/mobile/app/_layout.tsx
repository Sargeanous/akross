import React from 'react';
import { Slot } from 'expo-router';

/**
 * Root layout — minimal version for debugging.
 * TODO: restore auth gate once web rendering is confirmed working.
 */
export default function RootLayout() {
  return <Slot />;
}
