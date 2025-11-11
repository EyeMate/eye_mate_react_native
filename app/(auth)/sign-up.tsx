// app/(auth)/sign-up.tsx
import * as React from 'react';
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
import { useSignUp, useSSO } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useCallback, useEffect } from 'react';
import { AntDesign, FontAwesome } from '@expo/vector-icons';

// Preloads the browser for Android devices
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

export default function SignUpScreen() {
  useWarmUpBrowser();

  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setLoading(true);

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
      Alert.alert(
        'Email envoyé',
        'Un code de vérification a été envoyé à votre adresse email'
      );
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert(
        'Erreur',
        err.errors?.[0]?.message || "Erreur lors de l'inscription"
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    setLoading(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
        Alert.alert('Erreur', 'Veuillez compléter les étapes suivantes');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert('Erreur', err.errors?.[0]?.message || 'Code incorrect');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignUp = useCallback(async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive: ssoSetActive } =
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
      Alert.alert('Erreur', 'Inscription Google échouée');
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow, router]);

  const onFacebookSignUp = useCallback(async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive: ssoSetActive } =
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
      Alert.alert('Erreur', 'Inscription Facebook échouée');
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow, router]);

  if (pendingVerification) {
    return (
      <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Vérification</Text>
          <Text style={styles.subtitle}>Entrez le code reçu par email</Text>

          <View style={styles.formContainer}>
            <TextInput
              value={code}
              placeholder="Code de vérification"
              placeholderTextColor="#999"
              onChangeText={setCode}
              style={styles.input}
              keyboardType="number-pad"
              editable={!loading}
            />

            <TouchableOpacity
              onPress={onVerifyPress}
              style={styles.button}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Vérifier</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>EyeMate</Text>
        <Text style={styles.subtitle}>Inscription</Text>

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
            onPress={onSignUpPress}
            style={styles.button}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>S inscrire</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            onPress={onGoogleSignUp}
            style={[styles.socialButton, styles.googleButton]}
            disabled={loading}
          >
            <AntDesign name="google" size={20} color="#DB4437" style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Continuer avec Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onFacebookSignUp}
            style={[styles.socialButton, styles.facebookButton]}
            disabled={loading}
          >
            <FontAwesome name="facebook" size={20} color="#2563eb" style={styles.socialIcon} />
            <Text style={[styles.socialButtonText, styles.socialButtonText]}>
              Continuer avec Facebook
            </Text>
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Déjà un compte ? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.link}>Se connecter</Text>
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

});