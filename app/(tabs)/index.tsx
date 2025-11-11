import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Vibration,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import ttsService from '../../services/ttsService';
import voiceToTextService from '../../services/voiceToTextService';

const { width, height } = Dimensions.get('window');

type AppState = 'greeting' | 'listening' | 'processing' | 'error' | 'redirecting';

export default function HomeScreen() {
  const router = useRouter();
  
  const [state, setState] = useState<AppState>('greeting');
  const [statusMessage, setStatusMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Mémoization des fonctions d'animation
  const startListeningAnimation = useCallback(() => {
    // Animation de pulsation continue
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation d'ondes
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim, waveAnim]);

  const stopListeningAnimation = useCallback(() => {
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim, waveAnim]);

  useEffect(() => {
    // Démarrage de l'application
    initializeApp();
    
    return () => {
      // Nettoyage
      ttsService.stop();
      if (isListening) {
        voiceToTextService.stopListening();
      }
    };
  }, [isListening]);

  useEffect(() => {
    // Animations continues
    if (isListening) {
      startListeningAnimation();
    } else {
      stopListeningAnimation();
    }
  }, [isListening, startListeningAnimation, stopListeningAnimation]);

  const initializeApp = async () => {
    try {
      // Fade in de l'interface
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Petit délai pour laisser l'app se charger
      await new Promise(resolve => setTimeout(resolve, 500));

      // Message de bienvenue
      await speakAndStartListening();
      
    } catch (error) {
      console.error('Error initializing app:', error);
      handleError('Erreur lors de l&apos;initialisation');
    }
  };

  const speakAndStartListening = async () => {
    try {
      setState('greeting');
      setStatusMessage('Bienvenue sur EyeMate');
      
      // Vibration de bienvenue
      Vibration.vibrate(100);

      // Message de bienvenue avec TTS
      await ttsService.speak("Comment puis-je vous aider aujourd'hui?", {
        onDone: async () => {
          // Après le message, démarrer l'écoute automatiquement
          await startVoiceListening();
        },
      });
      
    } catch (error) {
      console.error('Error in greeting:', error);
      handleError('Erreur lors du message de bienvenue');
    }
  };

  const startVoiceListening = async () => {
    try {
      setState('listening');
      setStatusMessage('Je vous écoute...');
      setTranscript('');
      
      // Vibration pour indiquer le début de l'écoute
      Vibration.vibrate([0, 100, 100, 100]);

      const success = await voiceToTextService.startListening(
        (text: string) => {
          // Callback de succès
          handleVoiceResult(text);
        },
        (error: string) => {
          // Callback d'erreur
          console.error('Voice error:', error);
          handleError('Erreur de reconnaissance vocale');
        }
      );

      if (success) {
        setIsListening(true);
      } else {
        handleError('Impossible de démarrer l&apos;écoute');
      }
      
    } catch (error) {
      console.error('Error starting listening:', error);
      handleError('Erreur lors du démarrage de l&apos;écoute');
    }
  };

  const handleVoiceResult = async (text: string) => {
    try {
      const cleanText = text.trim().toLowerCase();
      setTranscript(cleanText);
      
      setState('processing');
      setStatusMessage('Analyse de votre demande...');
      
      console.log('🎤 Texte reconnu:', cleanText);

      // Analyse du texte pour déterminer la redirection
      if (isEnvironmentRecognition(cleanText)) {
        await redirectToCamera();
      } else if (isDocumentReading(cleanText)) {
        await redirectToReadDocument();
      } else {
        // Commande non reconnue
        await handleUnknownCommand(cleanText);
      }
      
    } catch (error) {
      console.error('Error handling voice result:', error);
      handleError('Erreur lors du traitement de votre demande');
    }
  };

  const isEnvironmentRecognition = (text: string): boolean => {
    const keywords = [
      'reconnaissance',
      'environnement',
      'camera',
      'caméra',
      'voir',
      'regarder',
      'analyser',
      'scanner',
      'décrire',
      'photo'
    ];
    
    return keywords.some(keyword => text.includes(keyword));
  };

  const isDocumentReading = (text: string): boolean => {
    const keywords = [
      'lire',
      'document',
      'texte',
      'lecture',
      'fichier',
      'pdf',
      'scanner document',
      'lire document'
    ];
    
    return keywords.some(keyword => text.includes(keyword));
  };

  const redirectToCamera = async () => {
    try {
      setState('redirecting');
      setStatusMessage('Ouverture de la caméra...');
      
      Vibration.vibrate(200);
      
      await ttsService.speak("Ouverture de la reconnaissance d&apos;environnement", {
        onDone: () => {
          router.push('/(tabs)/Camera');
        },
      });
      
    } catch (error) {
      console.error('Error redirecting to camera:', error);
      handleError('Erreur lors de l&apos;ouverture de la caméra');
    }
  };

  const redirectToReadDocument = async () => {
    try {
      setState('redirecting');
      setStatusMessage('Ouverture de la lecture de document...');
      
      Vibration.vibrate(200);
      
      await ttsService.speak("Ouverture de la lecture de document", {
        onDone: () => {
          router.push('/(tabs)/ReadDocument');
        },
      });
      
    } catch (error) {
      console.error('Error redirecting to read document:', error);
      handleError('Erreur lors de l&apos;ouverture de la lecture');
    }
  };

  const handleUnknownCommand = async (text: string) => {
    try {
      setState('error');
      setStatusMessage('Commande non reconnue');
      
      Vibration.vibrate([0, 100, 100, 100, 100, 100]);
      
      await ttsService.speak(
        "Je n&apos;ai pas compris votre demande. Vous pouvez dire : reconnaissance d&apos;environnement, ou lire document",
        {
          onDone: async () => {
            // Recommencer l'écoute après 2 secondes
            await new Promise(resolve => setTimeout(resolve, 2000));
            await startVoiceListening();
          },
        }
      );
      
    } catch (error) {
      console.error('Error handling unknown command:', error);
      handleError('Erreur lors du traitement');
    }
  };

  const handleError = async (errorMessage: string) => {
    try {
      setState('error');
      setStatusMessage(errorMessage);
      setIsListening(false);
      
      Vibration.vibrate([0, 100, 100, 100, 100, 100]);
      
      await ttsService.speak(errorMessage, {
        onDone: async () => {
          // Recommencer après 3 secondes
          await new Promise(resolve => setTimeout(resolve, 3000));
          await speakAndStartListening();
        },
      });
      
    } catch (error) {
      console.error('Error in error handler:', error);
    }
  };

  const restartListening = async () => {
    try {
      await ttsService.speak("Je n&apos;ai rien entendu. Je recommence l&apos;écoute", {
        onDone: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await startVoiceListening();
        },
      });
    } catch (error) {
      console.error('Error restarting listening:', error);
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'greeting':
        return '#2563eb';
      case 'listening':
        return '#10b981';
      case 'processing':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      case 'redirecting':
        return '#8b5cf6';
      default:
        return '#2563eb';
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'greeting':
        return '👋';
      case 'listening':
        return '🎤';
      case 'processing':
        return '⚙️';
      case 'error':
        return '⚠️';
      case 'redirecting':
        return '➡️';
      default:
        return '👋';
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getStateColor() }]}>
        <Text style={styles.appTitle}>EyeMate</Text>
        <Text style={styles.appSubtitle}>Assistant Vocal</Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Status Indicator with Animation */}
        <Animated.View
          style={[
            styles.statusCircle,
            {
              backgroundColor: getStateColor(),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.statusIcon}>{getStateIcon()}</Text>
        </Animated.View>

        {/* Listening Waves Animation */}
        {isListening && (
          <View style={styles.wavesContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.wave,
                  {
                    opacity: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 0],
                    }),
                    transform: [
                      {
                        scale: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Status Message */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusMessage}>{statusMessage}</Text>
          
          {state === 'processing' && (
            <ActivityIndicator size="large" color={getStateColor()} style={styles.loader} />
          )}
        </View>

        {/* Transcript Display (if any) */}
        {transcript && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptLabel}>Vous avez dit :</Text>
            <Text style={styles.transcriptText}>&quot;{transcript}&quot;</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Commandes disponibles :</Text>
          <Text style={styles.instructionText}>
            🎤 &quot;Reconnaissance d&apos;environnement&quot;
          </Text>
          <Text style={styles.instructionText}>
            📖 &quot;Lire document&quot;
          </Text>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isListening ? '🔴 En écoute...' : '🔵 Prêt'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  appTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#e0f2fe',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  statusCircle: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  statusIcon: {
    fontSize: 80,
  },
  wavesContainer: {
    position: 'absolute',
    top: height * 0.25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusMessage: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 15,
  },
  loader: {
    marginTop: 10,
  },
  transcriptContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transcriptLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 18,
    color: '#1f2937',
    fontStyle: 'italic',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 24,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});