// app/splash.tsx
import { useEffect } from 'react';
import { Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@clerk/clerk-expo';

export default function SplashScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      // Rediriger vers la page appropriée selon l'état de connexion
      if (isSignedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/sign-in');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn]);

  return (
    <LinearGradient
      colors={['#2563eb', '#1d4ed8']}
      style={styles.container}
    >
      <Image
        source={require('../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>EyeMate</Text>
      <Text style={styles.subtitle}>Votre assistant visuel intelligent</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0f2fe',
    textAlign: 'center',
  },
});