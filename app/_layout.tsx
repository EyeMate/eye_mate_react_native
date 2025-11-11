// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { SettingsProvider } from '../contexts/SettingsContext';
import '../locales/i18n';

// Configuration du token cache avec SecureStore
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Empêcher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Cacher le splash screen après le chargement
    SplashScreen.hideAsync();
  }, []);

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error(
      'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <SettingsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="splash" />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </SettingsProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}