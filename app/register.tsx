import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, voiceGender, changeLanguage, changeVoiceGender } = useSettings();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Configuration Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'VOTRE_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'VOTRE_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'VOTRE_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication);
    }
  }, [response]);

  const handleGoogleLogin = async (authentication: any) => {
    try {
      console.log('Google authentication:', authentication);
      // Appeler votre API backend ici
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la connexion avec Google');
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      // Appeler votre API backend ici
      console.log('Registering user:', formData);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la création du compte');
    }
  };

  // Fonction pour rediriger vers la page home
  const goToHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('welcome')}</Text>
        <Text style={styles.subtitle}>{t('register')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('name')}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          accessibilityLabel={t('name')}
        />

        <TextInput
          style={styles.input}
          placeholder={t('email')}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel={t('email')}
        />

        <TextInput
          style={styles.input}
          placeholder={t('password')}
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
          accessibilityLabel={t('password')}
        />

        <TextInput
          style={styles.input}
          placeholder={t('confirmPassword')}
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
          secureTextEntry
          accessibilityLabel={t('confirmPassword')}
        />

        <Text style={styles.label}>{t('chooseLanguage')}</Text>
        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[styles.optionButton, language === 'fr' && styles.optionButtonActive]}
            onPress={() => changeLanguage('fr')}
            accessibilityLabel={t('french')}
          >
            <Text style={styles.optionText}>🇫🇷 {t('french')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, language === 'en' && styles.optionButtonActive]}
            onPress={() => changeLanguage('en')}
            accessibilityLabel={t('english')}
          >
            <Text style={styles.optionText}>🇬🇧 {t('english')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t('chooseVoice')}</Text>
        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[styles.optionButton, voiceGender === 'male' && styles.optionButtonActive]}
            onPress={() => changeVoiceGender('male')}
            accessibilityLabel={t('male')}
          >
            <Text style={styles.optionText}>👨 {t('male')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, voiceGender === 'female' && styles.optionButtonActive]}
            onPress={() => changeVoiceGender('female')}
            accessibilityLabel={t('female')}
          >
            <Text style={styles.optionText}>👩 {t('female')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
          disabled={!request}
          accessibilityLabel={t('continueWithGoogle')}
        >
          <Text style={styles.googleButtonText}>🔐 {t('continueWithGoogle')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleRegister}
          accessibilityLabel={t('createAccount')}
        >
          <Text style={styles.createButtonText}>{t('createAccount')}</Text>
        </TouchableOpacity>

        {/* Bouton pour aller directement à la page home */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={goToHome}
          accessibilityLabel="Aller à l'accueil"
        >
          <Text style={styles.homeButtonText}>🏠 Continuer sans créer de compte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  optionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  optionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  optionButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#e0f2fe',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 40,
  },
  homeButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
});