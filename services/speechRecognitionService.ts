import Voice from '@react-native-voice/voice';

export type SpeechRecognitionCallback = (text: string) => void;

class SpeechRecognitionService {
  private isListening: boolean = false;
  private onResultCallback: SpeechRecognitionCallback | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.setupVoiceHandlers();
  }

  private setupVoiceHandlers() {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
  }

  private onSpeechStart() {
    console.log('🎤 Reconnaissance vocale démarrée');
  }

  private onSpeechEnd() {
    console.log('🎤 Reconnaissance vocale terminée');
    this.isListening = false;
  }

  private onSpeechResults(e: any) {
    if (e.value && e.value.length > 0) {
      const spokenText = e.value[0].toLowerCase();
      console.log('🎤 Texte reconnu:', spokenText);
      
      if (this.onResultCallback) {
        this.onResultCallback(spokenText);
      }
    }
  }

  private onSpeechError(e: any) {
    console.error('🎤 Erreur reconnaissance vocale:', e);
    this.isListening = false;
    
    if (this.onErrorCallback) {
      this.onErrorCallback(e.error?.message || 'Erreur inconnue');
    }
  }

  async startListening(
    onResult: SpeechRecognitionCallback,
    onError?: (error: string) => void
  ): Promise<boolean> {
    try {
      if (this.isListening) {
        await this.stopListening();
      }

      this.onResultCallback = onResult;
      this.onErrorCallback = onError || null;

      // Utiliser la langue basée sur les paramètres de l'application
      const language = 'fr-FR'; // Vous pouvez le rendre dynamique plus tard
      
      await Voice.start(language);
      this.isListening = true;
      
      console.log('🎤 Démarrage de l écoute...');
      return true;
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      if (onError) {
        onError('Impossible de démarrer la reconnaissance vocale');
      }
      return false;
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      await Voice.destroy();
      this.isListening = false;
      this.onResultCallback = null;
      this.onErrorCallback = null;
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const available = await Voice.isAvailable();
      return Boolean(available);
    } catch (error) {
      console.error('Error checking voice availability:', error);
      return false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  destroy() {
    Voice.destroy().then(() => {
      Voice.removeAllListeners();
    });
  }
}

export default new SpeechRecognitionService();