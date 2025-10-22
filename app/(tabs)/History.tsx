import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import fileService from '../../services/fileService';

export default function GalleryScreen() {
  const [images, setImages] = useState<string[]>([]);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const router = useRouter();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const imageUris = await fileService.getImageUris();
    setImages(imageUris);
    console.log('🖼️ Images chargées:', imageUris);
  };

  // Sauvegarder dans la galerie du téléphone
  const saveToGallery = async (uri: string) => {
    try {
      if (!permissionResponse?.granted) {
        await requestPermission();
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('EyeMate', asset, false);
      
      Alert.alert('Succès', 'Image sauvegardée dans la galerie !');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder dans la galerie');
    }
  };

  // Partager l'image
  const shareImage = async (uri: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Partage non disponible', 'La fonction de partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  // Copier vers un emplacement accessible
  const copyToCache = async (uri: string): Promise<string> => {
    try {
      const filename = uri.split('/').pop();
      const cacheUri = `${FileSystem.cacheDirectory}${filename}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: cacheUri
      });
      
      console.log('📁 Copié vers:', cacheUri);
      return cacheUri;
    } catch (error) {
      console.error('Error copying image:', error);
      return uri;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Galerie des captures</Text>
        <Text style={styles.subtitle}>
          {images.length} image(s) trouvée(s)
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imageCard}>
            <Text style={styles.imageTitle}>📷 Capture {index + 1}</Text>
            
            {/* Aperçu de l'image */}
            <Image 
              source={{ uri }} 
              style={styles.imagePreview}
              resizeMode="cover"
            />
            
            <Text style={styles.imageInfo}>
              📁 {uri.split('/').pop()}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => saveToGallery(uri)}
              >
                <Text style={styles.actionText}>💾 Sauvegarder</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => shareImage(uri)}
              >
                <Text style={styles.actionText}>📤 Partager</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {images.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune image capturée</Text>
            <Text style={styles.emptySubtext}>
              Utilisez la caméra pour prendre des photos
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.refreshButton} onPress={loadImages}>
          <Text style={styles.buttonText}>🔄 Actualiser</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 20,
    backgroundColor: '#2563eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    textAlign: 'center',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageInfo: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
  },
  refreshButton: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});