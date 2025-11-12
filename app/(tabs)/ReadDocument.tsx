import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Speech from 'expo-speech';

export default function ReadDocument() {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setFileName(file.name);
      setLoading(true);
      setText(null);

      // 🔹 Envoi au service OCR.space
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      } as any);
      formData.append('language', 'eng'); // Vous pouvez changer en 'fra' pour le français
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Moteur OCR amélioré

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { 
          apikey: 'K84617576588957'
        },
        body: formData,
      });

      const data = await response.json();

      if (data.IsErroredOnProcessing) {
        Alert.alert('Erreur', data.ErrorMessage?.[0] || 'Erreur lors du traitement du document');
        setLoading(false);
        return;
      }

      const extractedText = data?.ParsedResults?.[0]?.ParsedText || 'Aucun texte détecté.';
      
      if (extractedText === 'Aucun texte détecté.' || extractedText.trim().length === 0) {
        Alert.alert('Attention', 'Aucun texte n\'a pu être extrait de ce document.');
      }

      setText(extractedText);
      setLoading(false);

    } catch (error) {
      console.error('Error reading document:', error);
      Alert.alert('Erreur', 'Impossible de lire le document. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const speakText = () => {
    if (!text) return;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text, { 
        language: 'fr-FR',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1f2937' }}>
        Lecteur de Documents
      </Text>

      <TouchableOpacity
        onPress={pickDocument}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#9ca3af' : '#10b981',
          padding: 16,
          borderRadius: 12,
          alignItems: 'center',
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
          📄 Importer un PDF / Livre
        </Text>
      </TouchableOpacity>

      {fileName && (
        <View style={{ 
          backgroundColor: '#f3f4f6', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 10 
        }}>
          <Text style={{ color: '#4b5563', fontSize: 14 }}>
            📎 Fichier : {fileName}
          </Text>
        </View>
      )}

      {loading && (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={{ color: '#6b7280', marginTop: 10 }}>
            Extraction du texte en cours...
          </Text>
        </View>
      )}

      {text && !loading && (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
            <TouchableOpacity
              onPress={speakText}
              style={{
                flex: 1,
                backgroundColor: isSpeaking ? '#ef4444' : '#3b82f6',
                padding: 14,
                borderRadius: 10,
                alignItems: 'center',
              }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {isSpeaking ? '⏸️ Pause' : '🔊 Lire à voix haute'}
              </Text>
            </TouchableOpacity>

            {isSpeaking && (
              <TouchableOpacity
                onPress={stopSpeaking}
                style={{
                  backgroundColor: '#dc2626',
                  padding: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  minWidth: 80,
                }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  ⏹️ Stop
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView 
            style={{ 
              flex: 1,
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              padding: 15,
            }}
            showsVerticalScrollIndicator={true}>
            <Text style={{ 
              color: '#111827', 
              fontSize: 16, 
              lineHeight: 26,
              textAlign: 'justify',
            }}>
              {text}
            </Text>
          </ScrollView>
        </>
      )}

      {!text && !loading && (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          opacity: 0.5,
        }}>
          <Text style={{ 
            fontSize: 48, 
            marginBottom: 10 
          }}>
            📚
          </Text>
          <Text style={{ 
            color: '#9ca3af', 
            fontSize: 16,
            textAlign: 'center',
          }}>
            Importez un PDF ou une image{'\n'}pour commencer la lecture
          </Text>
        </View>
      )}
    </View>
  );
}