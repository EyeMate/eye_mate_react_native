import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import fileService from '../../services/fileService';
import imageAnalysisService from '../../services/imageAnalysisService';
import ttsService from '../../services/ttsService';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    if (permission?.granted) {
      // Démarrer automatiquement après un court délai
      const timer = setTimeout(() => {
        startAutoCapture();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [permission]);

  // Fonction pour démarrer automatiquement la capture
  const startAutoCapture = async () => {
    if (isRecording) return;
    
    try {
      setIsRecording(true);
      
      // Instructions vocales
      await ttsService.speak("Démarrage de la reconnaissance d'environnement. L'application va prendre une photo dans 3 secondes pour une analyse détaillée.");
      
      // Délai avant la photo
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Feedback sonore et vibration
      Vibration.vibrate(100);
      
      // Prise de photo
      await ttsService.speak("Capture en cours");
      const fileUri = await takeSinglePicture();
      
      if (fileUri) {
        console.log('📸 Photo capturée:', fileUri);
        setCapturedImage(fileUri);
        
        // Feedback de confirmation
        await ttsService.speak("Photo prise avec succès. Analyse en cours...");
        
        // Lancer l'analyse immédiatement
        await analyzeImage(fileUri);
      } else {
        console.log('❌ Échec de la capture');
        await ttsService.speak("Erreur lors de la capture");
        setIsRecording(false);
      }
      
    } catch (error) {
      console.error('Error in auto capture:', error);
      await ttsService.speak("Erreur lors de la capture automatique");
      setIsRecording(false);
    }
  };

  // Fonction pour prendre une seule photo
  const takeSinglePicture = async (): Promise<string | null> => {
    try {
      if (!cameraRef.current) return null;
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7, // Qualité réduite pour une analyse plus rapide
        base64: true,
        skipProcessing: true,
      });

      if (photo.base64) {
        const filename = fileService.generateFilename('environment_capture');
        const fileUri = await fileService.saveImage(photo.base64, filename);
        console.log('📸 Photo sauvegardée:', fileUri);
        return fileUri;
      }
      return null;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  };

  const analyzeImage = async (imageUri: string) => {
    console.log('🎯 Début de l\'analyse de l\'image');
    
    try {
      setIsAnalyzing(true);
      
      console.log('🎯 Analyse de l\'image en cours...');
      
      // Analyse d'une seule image avec prompt détaillé
      const description = await imageAnalysisService.analyzeImage(
        imageUri,
        (result) => {
          console.log('🖼️ Résultat de l\'analyse:', result);
        },
        (error) => {
          console.error('Erreur d\'analyse:', error);
          ttsService.speak("Erreur lors de l'analyse de l'image");
        }
      );
      
      setAnalysisResult(description);
      
      console.log('🖼️ Résultat final:', description);
      
      // Lire le résultat
      await ttsService.speak("Analyse terminée. Voici la description détaillée de votre environnement:");
      await ttsService.speak(description);
      
      // Naviguer vers l'écran des résultats
      setTimeout(() => {
        router.push({
          pathname: '/AnalysisResults',
          params: { result: description }
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error in analysis:', error);
      await ttsService.speak("Erreur lors de l'analyse. Retour à l'accueil.");
      setTimeout(() => {
        router.back();
      }, 2000);
    } finally {
      setIsAnalyzing(false);
      setIsRecording(false);
    }
  };

  const cancelCapture = async () => {
    await ttsService.speak("Capture annulée");
    setCapturedImage(null);
    setIsRecording(false);
    await fileService.clearAllImages();
    router.back();
  };

  // Fonction pour redémarrer la capture manuellement
  const restartCapture = async () => {
    if (!isRecording) {
      setCapturedImage(null);
      setAnalysisResult('');
      await startAutoCapture();
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement des permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          L application a besoin de l accès à la caméra pour fonctionner
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={cancelCapture}
              accessibilityLabel="Annuler la capture et retourner à l'accueil"
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Reconnaissance d environnement</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {isAnalyzing ? 'Analyse' : 'Capture'}
              </Text>
            </View>
          </View>

          {/* Guide de cadrage */}
          <View style={styles.focusFrame}>
            <View style={styles.focusFrameBorder} />
            <Text style={styles.focusText}>
              {isRecording 
                ? "Capture automatique en cours..."
                : isAnalyzing
                  ? "Analyse détaillée en cours..."
                  : "Prise de photo unique"
              }
            </Text>
          </View>

          {/* Indicateur de progression */}
          <View style={styles.progressContainer}>
            {isAnalyzing ? (
              <View style={styles.analysisProgress}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.analysisProgressText}>
                  Analyse détaillée en cours...
                </Text>
              </View>
            ) : (
              <View style={styles.singleStepIndicator}>
                <View style={[
                  styles.stepDot,
                  capturedImage ? styles.stepDotCompleted : styles.stepDotActive
                ]} />
                <Text style={styles.stepText}>
                  {capturedImage ? '✅ Photo prise' : '📸 Prise de photo'}
                </Text>
              </View>
            )}
          </View>

          {/* Contrôles */}
          <View style={styles.controls}>
            {/* Bouton de redémarrage */}
            {!isRecording && !isAnalyzing && (
              <TouchableOpacity
                style={styles.restartButton}
                onPress={restartCapture}
                accessibilityLabel="Redémarrer la capture"
              >
                <Text style={styles.restartButtonText}>🔄 Nouvelle capture</Text>
              </TouchableOpacity>
            )}

            {/* Indicateur de statut */}
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {isAnalyzing 
                  ? "🔴 Analyse en cours..."
                  : isRecording
                    ? "🟡 Capture..."
                    : capturedImage
                      ? "✅ Capture terminée"
                      : "🟢 Prêt"
                }
              </Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              {isAnalyzing 
                ? "Analyse détaillée de l'environnement..."
                : isRecording
                  ? "Photo dans quelques instants..."
                  : "Capture automatique en attente..."
              }
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(239,68,68,0.8)',
    borderRadius: 20,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  focusFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
  },
  focusFrameBorder: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  focusText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    fontWeight: '600',
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  singleStepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  stepDotActive: {
    backgroundColor: '#2563eb',
    transform: [{ scale: 1.2 }],
  },
  stepDotCompleted: {
    backgroundColor: '#10b981',
  },
  stepText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  analysisProgress: {
    alignItems: 'center',
    gap: 15,
  },
  analysisProgressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 20,
  },
  restartButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    alignItems: 'center',
    paddingBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 15,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(37,99,235,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});