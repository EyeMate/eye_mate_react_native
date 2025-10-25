import axios from 'axios';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

export type VoiceToTextCallback = (text: string) => void;
export type VoiceToTextErrorCallback = (error: string) => void;

class VoiceToTextService {
  private isRecording: boolean = false;
  private onResultCallback: VoiceToTextCallback | null = null;
  private onErrorCallback: VoiceToTextErrorCallback | null = null;
  private recording: Audio.Recording | null = null;
  
  private readonly API_KEY = Constants.expoConfig?.extra?.ASSEMBLYAI_API_KEY || "c352cbddc97548f9a1b85d6baec12639";
  private readonly BASE_URL = "https://api.assemblyai.com";
  
  private readonly headers = {
    authorization: this.API_KEY,
  };

  constructor() {
    this.setupAudio();
  }

  private async setupAudio() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }

  async startListening(
    onResult: VoiceToTextCallback,
    onError?: VoiceToTextErrorCallback
  ): Promise<boolean> {
    try {
      if (this.isRecording) {
        await this.stopListening();
      }

      this.onResultCallback = onResult;
      this.onErrorCallback = onError || null;

      console.log("🎤 Starting audio recording...");
      
      // Start audio recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      await recording.startAsync();
      this.recording = recording;
      this.isRecording = true;
      
      console.log("🎤 Recording started successfully");
      return true;

    } catch (error) {
      console.error("Error starting voice recognition:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback('Failed to start voice recognition');
      }
      return false;
    }
  }

  async stopListening(): Promise<void> {
    try {
      if (this.recording && this.isRecording) {
        console.log("🎤 Stopping recording...");
        
        const uri = this.recording.getURI();
        await this.recording.stopAndUnloadAsync();
        
        console.log("🎤 Recording saved to:", uri);
        
        // Reset recording state
        this.recording = null;
        this.isRecording = false;
        
        if (uri) {
          // Transcribe the audio file using AssemblyAI
          await this.transcribeAudioFile(uri);
        }
      }
      
      this.onResultCallback = null;
      this.onErrorCallback = null;
    } catch (error) {
      console.error("Error stopping voice recognition:", error);
      // Reset state even on error
      this.recording = null;
      this.isRecording = false;
    }
  }

  private async transcribeAudioFile(audioUri: string) {
    try {
      console.log("🎤 Sending audio to AssemblyAI for transcription...");
      
      // Use expo-file-system to read the file as base64
      const audioData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array
      const binaryString = atob(audioData);
      const audioBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioBytes[i] = binaryString.charCodeAt(i);
      }

      // Upload audio to AssemblyAI (as per documentation)
      console.log("🎤 Uploading audio to AssemblyAI...");
      const uploadResponse = await axios.post(
        `${this.BASE_URL}/v2/upload`,
        audioBytes,
        {
          headers: {
            ...this.headers,
            'Content-Type': 'application/octet-stream',
          },
        }
      );

      const audioUrl = uploadResponse.data.upload_url;
      console.log("🎤 Audio uploaded successfully:", audioUrl);

      // Prepare transcription request data
      const data = {
        audio_url: audioUrl,
        speech_model: "universal", // Universal speech model as per documentation
        language_code: "fr", // French language
        punctuate: true,
        format_text: true,
      };

      // Submit transcription request
      console.log("🎤 Submitting transcription request...");
      const transcriptResponse = await axios.post(
        `${this.BASE_URL}/v2/transcript`,
        data,
        { headers: this.headers }
      );

      const transcriptId = transcriptResponse.data.id;
      console.log("🎤 Transcription ID:", transcriptId);

      // Poll for transcription result
      await this.pollTranscriptResult(transcriptId);

    } catch (error: any) {
      console.error("Error transcribing audio:", error);
      if (this.onErrorCallback) {
        const errorMessage = error.response?.data?.error || error.message || 'Transcription failed';
        this.onErrorCallback(errorMessage);
      }
    }
  }

  private async pollTranscriptResult(transcriptId: string) {
    const pollingEndpoint = `${this.BASE_URL}/v2/transcript/${transcriptId}`;
    const maxAttempts = 30;
    let attempts = 0;

    console.log("🎤 Polling for transcription result...");

    while (attempts < maxAttempts) {
      try {
        const pollingResponse = await axios.get(pollingEndpoint, {
          headers: this.headers,
        });

        const transcriptionResult = pollingResponse.data;

        if (transcriptionResult.status === "completed") {
          console.log("🎤 Transcription completed:", transcriptionResult.text);
          if (this.onResultCallback && transcriptionResult.text) {
            this.onResultCallback(transcriptionResult.text);
          }
          return;
        } else if (transcriptionResult.status === "error") {
          throw new Error(`Transcription failed: ${transcriptionResult.error}`);
        } else {
          // Wait 3 seconds before next poll (as per documentation)
          console.log(`🎤 Status: ${transcriptionResult.status}, waiting...`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        attempts++;

      } catch (error: any) {
        console.error("Error polling transcript:", error);
        throw error;
      }
    }

    throw new Error('Transcription timeout after 30 attempts');
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error("Error checking voice availability:", error);
      return false;
    }
  }

  destroy() {
    if (this.recording) {
      this.recording.stopAndUnloadAsync();
      this.recording = null;
    }
    this.isRecording = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
  }
}

export default new VoiceToTextService();