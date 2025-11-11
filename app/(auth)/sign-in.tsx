// app/(auth)/sign-in.tsx
import { useSignIn, useSSO } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import React, { useCallback, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { AntDesign, FontAwesome } from '@expo/vector-icons';

// Preloads the browser for Android devices to reduce authentication load time
export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignInPage() {
  useWarmUpBrowser();
  
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;

    setLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        Alert.alert('Erreur', 'Veuillez compléter les étapes suivantes');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert(
        'Erreur de connexion',
        err.errors?.[0]?.message || 'Email ou mot de passe incorrect'
      );
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignIn = useCallback(async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive: ssoSetActive, signIn, signUp } =
        await startSSOFlow({
          strategy: 'oauth_google',
          redirectUrl: AuthSession.makeRedirectUri(),
        });

      if (createdSessionId) {
        await ssoSetActive!({
          session: createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log('Session task:', session.currentTask);
              return;
            }
            // Rediriger vers onboarding pour les nouveaux utilisateurs OAuth
            router.replace('/(tabs)');
          },
        });
      } else {
        // Gérer les exigences manquantes (MFA, etc.)
        Alert.alert(
          'Action requise',
          'Veuillez compléter les étapes supplémentaires'
        );
      }
    } catch (err: any) {
      console.error('OAuth error:', JSON.stringify(err, null, 2));
      Alert.alert('Erreur', 'Connexion Google échouée');
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow, router]);

  const onFacebookSignIn = useCallback(async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive: ssoSetActive, signIn, signUp } =
        await startSSOFlow({
          strategy: 'oauth_facebook',
          redirectUrl: AuthSession.makeRedirectUri(),
        });

      if (createdSessionId) {
        await ssoSetActive!({
          session: createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log('Session task:', session.currentTask);
              return;
            }
            router.replace('/(tabs)');
          },
        });
      } else {
        Alert.alert(
          'Action requise',
          'Veuillez compléter les étapes supplémentaires'
        );
      }
    } catch (err: any) {
      console.error('OAuth error:', JSON.stringify(err, null, 2));
      Alert.alert('Erreur', 'Connexion Facebook échouée');
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow, router]);

  return (
    <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>EyeMate</Text>
        <Text style={styles.subtitle}>Connexion</Text>

        <View style={styles.formContainer}>
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email"
            placeholderTextColor="#999"
            onChangeText={setEmailAddress}
            style={styles.input}
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            value={password}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            secureTextEntry={true}
            onChangeText={setPassword}
            style={styles.input}
            editable={!loading}
          />

          <TouchableOpacity
            onPress={onSignInPress}
            style={styles.button}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            onPress={onGoogleSignIn}
            style={[styles.socialButton, styles.googleButton]}
            disabled={loading}
          >
            <AntDesign name="google" size={20} color="#DB4437" style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Continuer avec Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onFacebookSignIn}
            style={[styles.socialButton, styles.facebookButton]}
            disabled={loading}
          >
            <FontAwesome name="facebook" size={20} color="#2563eb" style={styles.socialIcon} />
            <Text style={[styles.socialButtonText, styles.socialButtonText]}>
              Continuer avec Facebook
            </Text>
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Pas encore de compte ? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.link}>S\inscrire</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    color: '#e0f2fe',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  facebookButton: {
   backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  socialIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  facebookText: {
    color: '#fff',
  },
});