import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import voiceToTextService from '../../services/voiceToTextService';
import ttsService from '../../services/ttsService';

export default function VoiceTestScreen() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      setIsLoading(true);
      const available = await voiceToTextService.isAvailable();
      setIsAvailable(available);
      
      if (available) {
        await ttsService.speak("Service de reconnaissance vocale disponible");
      } else {
        await ttsService.speak("Service de reconnaissance vocale non disponible");
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setError('Erreur lors de la vérification du service');
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = async () => {
    try {
      setError('');
      setIsLoading(true);
      
      const success = await voiceToTextService.startListening(
        (text: string) => {
          console.log('🎤 Transcript received:', text);
          setTranscript(prev => prev + ' ' + text);
          Vibration.vibrate(100); // Haptic feedback
        },
        (error: string) => {
          console.error('🎤 Error:', error);
          setError(error);
          setIsListening(false);
        }
      );

      if (success) {
        setIsListening(true);
        await ttsService.speak("Écoute en cours... Parlez maintenant");
      } else {
        setError('Impossible de démarrer l\'écoute');
        await ttsService.speak("Erreur lors du démarrage de l'écoute");
      }
    } catch (error) {
      console.error('Error starting listening:', error);
      setError('Erreur lors du démarrage');
      await ttsService.speak("Erreur lors du démarrage");
    } finally {
      setIsLoading(false);
    }
  };

  const stopListening = async () => {
    try {
      await voiceToTextService.stopListening();
      setIsListening(false);
      await ttsService.speak("Écoute arrêtée");
    } catch (error) {
      console.error('Error stopping listening:', error);
      setError('Erreur lors de l\'arrêt');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError('');
    ttsService.speak("Texte effacé");
  };

  const speakTranscript = async () => {
    if (transcript.trim()) {
      await ttsService.speak(transcript);
    } else {
      await ttsService.speak("Aucun texte à lire");
    }
  };

  const goBack = () => {
    if (isListening) {
      stopListening();
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={goBack}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Test Reconnaissance Vocale</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Status Section */}
      <View style={styles.statusSection}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Statut du Service</Text>
          <View style={styles.statusRow}>
            <Ionicons 
              name={isAvailable ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={isAvailable ? "#10b981" : "#ef4444"} 
            />
            <Text style={[styles.statusText, { color: isAvailable ? "#10b981" : "#ef4444" }]}>
              {isAvailable ? "Disponible" : "Non disponible"}
            </Text>
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsSection}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            isListening ? styles.stopButton : styles.startButton,
            (!isAvailable || isLoading) && styles.disabledButton
          ]}
          onPress={isListening ? stopListening : startListening}
          disabled={!isAvailable || isLoading}
          accessibilityLabel={isListening ? "Arrêter l'écoute" : "Démarrer l'écoute"}
        >
          <Ionicons 
            name={isListening ? "stop" : "mic"} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.controlButtonText}>
            {isListening ? "Arrêter" : "Démarrer"} l'écoute
          </Text>
        </TouchableOpacity>

        {transcript && (
          <View style={styles.secondaryControls}>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.speakButton]}
              onPress={speakTranscript}
              accessibilityLabel="Lire le texte"
            >
              <Ionicons name="volume-high" size={20} color="#fff" />
              <Text style={styles.secondaryButtonText}>Lire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, styles.clearButton]}
              onPress={clearTranscript}
              accessibilityLabel="Effacer le texte"
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.secondaryButtonText}>Effacer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Transcript Section */}
      <View style={styles.transcriptSection}>
        <Text style={styles.transcriptTitle}>
          Transcription ({transcript.split(' ').filter(word => word.trim()).length} mots)
        </Text>
        <ScrollView 
          style={styles.transcriptContainer}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.transcriptText}>
            {transcript || "Aucune transcription disponible. Appuyez sur 'Démarrer l'écoute' pour commencer."}
          </Text>
        </ScrollView>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.instructionsTitle}>Instructions</Text>
        <Text style={styles.instructionsText}>
          • Appuyez sur "Démarrer l'écoute" pour commencer l'enregistrement{'\n'}
          • Parlez clairement dans le microphone{'\n'}
          • Appuyez sur "Arrêter l'écoute" pour terminer{'\n'}
          • Utilisez "Lire" pour écouter la transcription{'\n'}
          • Utilisez "Effacer" pour supprimer le texte
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2563eb',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  statusSection: {
    padding: 20,
    gap: 15,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  loadingText: {
    color: '#2563eb',
    fontSize: 14,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  controlsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  speakButton: {
    backgroundColor: '#2563eb',
  },
  clearButton: {
    backgroundColor: '#6b7280',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  transcriptSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  transcriptContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  instructionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
});
