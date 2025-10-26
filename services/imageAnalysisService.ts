import * as FileSystem from 'expo-file-system';
import { BACKEND_CONFIG } from '../config/backendConfig';

export type ImageAnalysisCallback = (description: string) => void;
export type ImageAnalysisErrorCallback = (error: string) => void;

class ImageAnalysisService {
  private readonly BACKEND_URL = BACKEND_CONFIG.FULL_URL;
  private readonly ANALYSIS_PROMPT = BACKEND_CONFIG.PROMPT;

  async analyzeImage(
    imageUri: string,
    onResult: ImageAnalysisCallback,
    onError?: ImageAnalysisErrorCallback
  ): Promise<string> {
    try {
      console.log('🖼️ Analyzing image:', imageUri);

      // Read the image file as base64
      const imageData = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create FormData for the request
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
      formData.append('text', this.ANALYSIS_PROMPT);

      // Send request to backend
      console.log('🖼️ Sending request to:', this.BACKEND_URL);
      console.log('🖼️ FormData keys:', Object.keys(formData));
      console.log('🖼️ Image URI:', imageUri);
      console.log('🖼️ Prompt:', this.ANALYSIS_PROMPT);
      
      const response = await fetch(this.BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('🖼️ Response status:', response.status);
      console.log('🖼️ Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🖼️ Backend error response:', errorText);
        throw new Error(`Backend request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🖼️ Backend response:', result);
      
      // Handle nested result structure from Florence-2
      let description = '';
      if (result.result && typeof result.result === 'object') {
        // Extract the actual description from the nested structure
        const taskKey = Object.keys(result.result)[0];
        description = result.result[taskKey];
        console.log('🖼️ Extracted description from nested result:', description);
      } else if (result.description || result.text || result.result) {
        description = result.description || result.text || result.result;
        console.log('🖼️ Direct description:', description);
      } else {
        throw new Error('No description found in response');
      }
      
      console.log('🖼️ Final image analysis result:', description);
      
      if (onResult) {
        onResult(description);
      }
      
      return description;

    } catch (error: any) {
      console.error('Error analyzing image:', error);
      const errorMessage = error.message || 'Failed to analyze image';
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    }
  }

  async analyzeMultipleImages(
    imageUris: string[],
    onProgress?: (current: number, total: number) => void,
    onError?: ImageAnalysisErrorCallback
  ): Promise<string[]> {
    const descriptions: string[] = [];
    
    try {
      console.log(`🖼️ analyzeMultipleImages called with ${imageUris.length} images`);
      console.log(`🖼️ Image URIs:`, imageUris);
      console.log(`🖼️ Backend URL:`, this.BACKEND_URL);

      for (let i = 0; i < imageUris.length; i++) {
        const imageUri = imageUris[i];
        
        console.log(`🖼️ Processing image ${i + 1}/${imageUris.length}`);
        
        if (onProgress) {
          onProgress(i + 1, imageUris.length);
        }

        try {
          const description = await this.analyzeImage(
            imageUri,
            (result) => {
              console.log(`🖼️ Image ${i + 1} analyzed:`, result);
            },
            (error) => {
              console.error(`❌ Error analyzing image ${i + 1}:`, error);
            }
          );
          
          descriptions.push(description);
          
          // Wait between requests (except for the last one)
          if (i < imageUris.length - 1) {
            console.log(`⏳ Waiting ${BACKEND_CONFIG.REQUEST_DELAY/1000} seconds before next analysis...`);
            await new Promise(resolve => setTimeout(resolve, BACKEND_CONFIG.REQUEST_DELAY));
          }
          
        } catch (error: any) {
          console.error(`Error analyzing image ${i + 1}:`, error);
          const errorMessage = `Failed to analyze image ${i + 1}: ${error.message}`;
          
          if (onError) {
            onError(errorMessage);
          }
          
          // Add placeholder for failed analysis
          descriptions.push(`[Error analyzing image ${i + 1}]`);
        }
      }

      console.log('🖼️ All images analyzed:', descriptions);
      return descriptions;

    } catch (error: any) {
      console.error('Error in batch image analysis:', error);
      if (onError) {
        onError(error.message || 'Batch analysis failed');
      }
      throw error;
    }
  }

  concatenateDescriptions(descriptions: string[]): string {
    if (descriptions.length === 0) {
      return 'No image descriptions available.';
    }

    const concatenated = descriptions
      .map((desc, index) => `Image ${index + 1}: ${desc}`)
      .join('\n\n');

    return `Environment Analysis Summary:\n\n${concatenated}`;
  }

  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.BACKEND_URL, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.log('Backend not available:', error);
      return false;
    }
  }
}

export default new ImageAnalysisService();
