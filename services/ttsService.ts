//app/services/ttsService.ts
import * as Speech from 'expo-speech';

export type VoiceGender = 'male' | 'female';
export type Language = 'fr' | 'en';

interface SpeakOptions {
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: any) => void;
}

class TTSService {
  private isSpeaking: boolean = false;
  private currentLanguage: string = 'fr-FR';
  private voiceGender: VoiceGender = 'male';

  setLanguage(language: Language) {
    const languageMap: Record<Language, string> = {
      'fr': 'fr-FR',
      'en': 'en-US'
    };
    this.currentLanguage = languageMap[language] || 'fr-FR';
  }

  setVoiceGender(gender: VoiceGender) {
    this.voiceGender = gender;
  }

  async speak(text: string, options: SpeakOptions = {}) {
    try {
      if (this.isSpeaking) {
        await this.stop();
      }

      this.isSpeaking = true;

      const speechOptions: Speech.SpeechOptions = {
        language: this.currentLanguage,
        pitch: this.voiceGender === 'female' ? 0.8 : 1.2,
        rate: 0.9,
        onDone: () => {
          this.isSpeaking = false;
          options.onDone?.();
        },
        onStopped: () => {
          this.isSpeaking = false;
          options.onStopped?.();
        },
        onError: (error) => {
          this.isSpeaking = false;
          console.error('TTS Error:', error);
          options.onError?.(error);
        },
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Error in speak:', error);
      this.isSpeaking = false;
      throw error;
    }
  }

  async stop() {
    try {
      await Speech.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  async pause() {
    try {
      await Speech.pause();
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  }

  async resume() {
    try {
      await Speech.resume();
    } catch (error) {
      console.error('Error resuming speech:', error);
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.length > 0;
    } catch (error) {
      console.error('Error checking TTS availability:', error);
      return false;
    }
  }

  async getAvailableVoices(language: string) {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.filter(voice => 
        voice.language.startsWith(language)
      );
    } catch (error) {
      console.error('Error getting voices:', error);
      return [];
    }
  }
}

export default new TTSService();