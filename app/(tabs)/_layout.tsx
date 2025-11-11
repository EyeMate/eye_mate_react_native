import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
export default function TabLayout() {
   const { isSignedIn, isLoaded } = useAuth();

  // Attendre que Clerk soit chargé
  if (!isLoaded) {
    return null;
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Caméra',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="VoiceTest"
        options={{
          title: 'Test Vocal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
     <Tabs.Screen
        name="ReadDocument"
        options={{
          title: 'Lire Document',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}