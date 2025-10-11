import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import ttsService from '../../services/ttsService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    speakGreeting();
    return () => {
      ttsService.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speakGreeting = async () => {
    try {
      setIsSpeaking(true);
      await ttsService.speak(t('homeGreeting'), {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Error speaking greeting:', error);
      setIsSpeaking(false);
    }
  };

  const handleStopSpeaking = async () => {
    await ttsService.stop();
    setIsSpeaking(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EyeMate</Text>
        <Text style={styles.subtitle}>{t('homeGreeting')}</Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.mainButton}
          accessibilityLabel="Parler à EyeMate"
        >
          <Text style={styles.mainButtonIcon}>🎤</Text>
          <Text style={styles.mainButtonText}>Appuyez pour parler</Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={speakGreeting}
            accessibilityLabel="Répéter"
          >
            <Text style={styles.secondaryButtonIcon}>🔊</Text>
            <Text style={styles.secondaryButtonText}>{t('repeat')}</Text>
          </TouchableOpacity>

          {isSpeaking && (
            <TouchableOpacity
              style={[styles.secondaryButton, styles.stopButton]}
              onPress={handleStopSpeaking}
              accessibilityLabel="Arrêter"
            >
              <Text style={styles.secondaryButtonIcon}>⏹️</Text>
              <Text style={styles.secondaryButtonText}>{t('stop')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.featuresContainer}>
        <TouchableOpacity
          style={styles.featureButton}
          accessibilityLabel={t('describe')}
        >
          <Text style={styles.featureIcon}>📷</Text>
          <Text style={styles.featureText}>{t('describe')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureButton}
          accessibilityLabel={t('read')}
        >
          <Text style={styles.featureIcon}>📖</Text>
          <Text style={styles.featureText}>{t('read')}</Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.featureButton}
          accessibilityLabel={t('settings')}
        >
          <Text style={styles.featureIcon}>⚙️</Text>
          <Text style={styles.featureText}>{t('settings')}</Text>
        </TouchableOpacity>
      </View>

      {isSpeaking && (
        <View style={styles.statusIndicator}>
          <Text style={styles.statusText}>🔊 {t('speaking')}</Text>
        </View>
      )}
    </View>
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
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0f2fe',
    textAlign: 'center',
  },
  actionContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  mainButton: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainButtonIcon: {
    fontSize: 70,
    marginBottom: 10,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  secondaryButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 40,
    gap: 15,
  },
  featureButton: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});