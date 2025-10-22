//(tabs)/settings.tsx
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../contexts/SettingsContext';
import ttsService from '../../services/ttsService';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { language, voiceGender, changeLanguage, changeVoiceGender } = useSettings();

  const handleVoiceGenderChange = async (newGender: 'male' | 'female') => {
    console.log('🎭 Changing voice gender from', voiceGender, 'to', newGender);
    
    if (voiceGender === newGender) {
      console.log('⚠️ Voice gender already set to', newGender);
      return;
    }
    
    await changeVoiceGender(newGender);
  };

  const handleLanguageChange = async (newLanguage: 'fr' | 'en') => {
    console.log('🌍 Changing language from', language, 'to', newLanguage);
    await changeLanguage(newLanguage);
  };

  

  

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
      </View>

      <View style={styles.content}>
        {/* Section Langue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('chooseLanguage')}</Text>
          <View style={styles.optionContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                language === 'fr' && styles.optionButtonActive
              ]}
              onPress={() => handleLanguageChange('fr')}
            >
              <Text style={styles.optionIcon}>🇫🇷</Text>
              <Text style={styles.optionText}>{t('french')}</Text>
              {language === 'fr' && <Text style={styles.activeIndicator}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                language === 'en' && styles.optionButtonActive
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={styles.optionIcon}>🇬🇧</Text>
              <Text style={styles.optionText}>{t('english')}</Text>
              {language === 'en' && <Text style={styles.activeIndicator}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Voix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('chooseVoice')}</Text>
          <Text style={styles.sectionSubtitle}>
            Actuel: {voiceGender === 'male' ? t('male') : t('female')}
          </Text>
          <View style={styles.optionContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                voiceGender === 'male' && styles.optionButtonActive
              ]}
              onPress={() => handleVoiceGenderChange('male')}
            >
              <Text style={styles.optionIcon}>👨</Text>
              <Text style={styles.optionText}>{t('male')}</Text>
              {voiceGender === 'male' && <Text style={styles.activeIndicator}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                voiceGender === 'female' && styles.optionButtonActive
              ]}
              onPress={() => handleVoiceGenderChange('female')}
            >
              <Text style={styles.optionIcon}>👩</Text>
              <Text style={styles.optionText}>{t('female')}</Text>
              {voiceGender === 'female' && <Text style={styles.activeIndicator}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>

        
        {/* Autres paramètres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuText}>Profil</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>Notifications</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Confidentialité</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Section À propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuText}>Conditions d utilisation</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>❤️</Text>
            <Text style={styles.menuText}>Contactez-nous</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton déconnexion */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  optionContainer: {
    flexDirection: 'row',
    gap: 10,
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
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  testButton: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuArrow: {
    fontSize: 24,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});