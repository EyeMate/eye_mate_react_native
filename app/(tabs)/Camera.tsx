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
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoCapture, setIsAutoCapture] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    if (permission?.granted) {
      // Démarrer automatiquement les captures après un court délai
      const timer = setTimeout(() => {
        startAutoCapture();
      }, 2000); // Délai de 2 secondes pour laisser le temps à la caméra de s'initialiser
      
      return () => clearTimeout(timer);
    }
  }, [permission]);

  // Fonction pour démarrer automatiquement les captures
  const startAutoCapture = async () => {
    if (isRecording || isAutoCapture) return;
    
    try {
      setIsRecording(true);
      setIsAutoCapture(true);
      
      // Instructions vocales
      await ttsService.speak("Démarrage automatique de la reconnaissance d'environnement. L'application va prendre 3 photos successives avec un délai de 3 secondes entre chaque photo.");
      
      // Petit délai avant la première photo
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const capturedImagesLocal: string[] = [];
      
      for (let i = 1; i <= 3; i++) {
        // Feedback vocal avant chaque photo
        if (i === 1) {
          await ttsService.speak("Première photo dans 3 secondes");
        } else if (i === 2) {
          await ttsService.speak("Deuxième photo dans 3 secondes");
        } else {
          await ttsService.speak("Dernière photo dans 3 secondes");
        }
        
        // Délai de 3 secondes pour permettre à l'utilisateur de se préparer
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Feedback sonore et vibration
        Vibration.vibrate(100);
        
        // Prise de photo
        await ttsService.speak("Capture");
        const fileUri = await takeSinglePicture(i);
        
        if (fileUri) {
          console.log(`📸 Photo ${i} captured:`, fileUri);
          capturedImagesLocal.push(fileUri);
          setCapturedImages(prev => {
            const newImages = [...prev, fileUri];
            console.log('📸 Updated capturedImages:', newImages);
            return newImages;
          });
          setCurrentStep(i);
          
          // Feedback de confirmation
          await ttsService.speak(`Photo ${i} prise avec succès`);
        } else {
          console.log(`❌ Failed to capture photo ${i}`);
          await ttsService.speak(`Erreur lors de la photo ${i}`);
        }
      }
      
      // Toutes les photos sont prises
      console.log('📸 All photos captured locally:', capturedImagesLocal);
      await finishCapture(capturedImagesLocal);
      
    } catch (error) {
      console.error('Error in auto capture:', error);
      await ttsService.speak("Erreur lors de la capture automatique");
      setIsRecording(false);
      setIsAutoCapture(false);
    }
  };

  // Fonction pour prendre une seule photo
  const takeSinglePicture = async (stepNumber: number): Promise<string | null> => {
    try {
      if (!cameraRef.current) return null;
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: true,
      });

      if (photo.base64) {
        const filename = fileService.generateFilename(`capture_${stepNumber}`);
        const fileUri = await fileService.saveImage(photo.base64, filename);
        console.log(`📸 Photo ${stepNumber} sauvegardée:`, fileUri);
        return fileUri;
      }
      return null;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  };

  const finishCapture = async (imagesToAnalyze: string[]) => {
    console.log('🎯 finishCapture called');
    console.log('🎯 imagesToAnalyze:', imagesToAnalyze);
    console.log('🎯 imagesToAnalyze.length:', imagesToAnalyze.length);
    
    await ttsService.speak("Capture terminée. Analyse de l'environnement en cours...");
    
    try {
      setIsAnalyzing(true);
      setAnalysisProgress({ current: 0, total: imagesToAnalyze.length });
      
      console.log('🎯 Starting image analysis...');
      
      // Analyze all captured images
      const descriptions = await imageAnalysisService.analyzeMultipleImages(
        imagesToAnalyze,
        (current, total) => {
          setAnalysisProgress({ current, total });
          console.log(`🖼️ Analysis progress: ${current}/${total}`);
        },
        (error) => {
          console.error('Analysis error:', error);
          ttsService.speak("Erreur lors de l'analyse des images");
        }
      );
      
      // Concatenate all descriptions
      const finalResult = imageAnalysisService.concatenateDescriptions(descriptions);
      setAnalysisResult(finalResult);
      
      console.log('🖼️ Final analysis result:', finalResult);
      
      // Speak the result
      await ttsService.speak("Analyse terminée. Voici la description de votre environnement:");
      
      // Speak each image description
      for (let i = 0; i < descriptions.length; i++) {
        await ttsService.speak(`Image ${i + 1}: ${descriptions[i]}`);
      }
      
      // Navigate to results screen
      setTimeout(() => {
        router.push({
          pathname: '/AnalysisResults',
          params: { result: finalResult }
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error in analysis:', error);
      await ttsService.speak("Erreur lors de l'analyse. Retour à l'accueil.");
      setTimeout(() => {
        router.back();
      }, 2000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cancelCapture = async () => {
    if (isAutoCapture) {
      await ttsService.speak("Capture annulée");
    }
    setCapturedImages([]);
    setCurrentStep(0);
    setIsAutoCapture(false);
    setIsRecording(false);
    await fileService.clearAllImages();
    router.back();
  };

  // Fonction pour arrêter la capture en cours
  const stopCapture = async () => {
    if (isAutoCapture) {
      setIsAutoCapture(false);
      setIsRecording(false);
      await ttsService.speak("Capture arrêtée manuellement");
    }
  };

  // Fonction pour redémarrer les captures manuellement
  const restartCapture = async () => {
    if (!isAutoCapture && !isRecording) {
      setCapturedImages([]);
      setCurrentStep(0);
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
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsText}>
                {currentStep}/3 photos
              </Text>
            </View>
          </View>

          {/* Guide de cadrage vocal uniquement */}
          <View style={styles.focusFrame}>
            <View style={styles.focusFrameBorder} />
            <Text style={styles.focusText}>
              {isAutoCapture 
                ? `Capture automatique en cours... Photo ${currentStep + 1} sur 3`
                : "Capture automatique démarrera bientôt"
              }
            </Text>
          </View>

          {/* Indicateurs de progression */}
          <View style={styles.progressContainer}>
            {isAnalyzing ? (
              <View style={styles.analysisProgress}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.analysisProgressText}>
                  Analyse: {analysisProgress.current}/{analysisProgress.total}
                </Text>
              </View>
            ) : (
              [1, 2, 3].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.progressDot,
                    step <= currentStep && styles.progressDotActive,
                    step === currentStep + 1 && isAutoCapture && styles.progressDotNext,
                  ]}
                />
              ))
            )}
          </View>

          {/* Contrôles */}
          <View style={styles.controls}>
            {/* Bouton d'arrêt pendant la capture */}
            {(isRecording || isAutoCapture) && (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopCapture}
                accessibilityLabel="Arrêter la capture en cours"
              >
                <Text style={styles.stopButtonText}>⏹️ Arrêter</Text>
              </TouchableOpacity>
            )}

            {/* Bouton de redémarrage quand la capture est terminée ou arrêtée */}
            {(!isAutoCapture && !isRecording && currentStep < 3) && (
              <TouchableOpacity
                style={styles.restartButton}
                onPress={restartCapture}
                accessibilityLabel="Redémarrer la capture"
              >
                <Text style={styles.restartButtonText}>🔄 Redémarrer</Text>
              </TouchableOpacity>
            )}

            {/* Indicateur de statut */}
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {isAutoCapture 
                  ? `🔴 Capture en cours... (${currentStep}/3)`
                  : currentStep >= 3 
                    ? "✅ Capture terminée"
                    : "🟢 Prêt au démarrage"
                }
              </Text>
            </View>
          </View>

            {/* Instructions vocales */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsText}>
                {isAnalyzing 
                  ? `Analyse en cours... ${analysisProgress.current}/${analysisProgress.total} images`
                  : isAutoCapture 
                    ? `Photo ${currentStep + 1} sur 3 dans quelques secondes...`
                    : currentStep >= 3
                      ? "Analyse en cours..."
                      : "Démarrage automatique de la capture..."
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
  stepsContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  stepsText: {
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: '#2563eb',
    transform: [{ scale: 1.2 }],
  },
  progressDotNext: {
    backgroundColor: '#10b981',
    transform: [{ scale: 1.1 }],
  },
  analysisProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analysisProgressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 20,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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